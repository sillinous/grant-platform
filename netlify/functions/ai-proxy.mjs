import { getStore } from "@netlify/blobs";

// ── Server-Side AI Proxy ──────────────────────────────────────────
// Allows client-side AI features to work without user API keys.
// Free tier: 20 calls/day via free models
// Alpha/Pro: 100 calls/day via premium models
// Rate limits tracked per session in Netlify Blobs

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const MODELS = {
  free: "arcee-ai/trinity-large-preview:free",
  standard: "anthropic/claude-3.5-haiku",
  premium: "anthropic/claude-3.5-sonnet",
};

const LIMITS = {
  free: { daily: 20, maxTokens: 1024 },
  alpha: { daily: 100, maxTokens: 2048 },
  pro: { daily: 100, maxTokens: 2048 },
  team: { daily: 200, maxTokens: 4096 },
};

async function checkRateLimit(store, sessionId, tier) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl_${today}_${sessionId}`;
  const limit = LIMITS[tier] || LIMITS.free;

  let usage;
  try {
    usage = await store.get(key, { type: "json" });
  } catch {
    usage = null;
  }

  if (!usage) usage = { count: 0, tier };

  if (usage.count >= limit.daily) {
    return { allowed: false, remaining: 0, limit: limit.daily };
  }

  usage.count++;
  await store.setJSON(key, usage);

  return { allowed: true, remaining: limit.daily - usage.count, limit: limit.daily };
}

async function callAI(messages, systemPrompt, tier, maxTokens) {
  const model = tier === "free" ? MODELS.free : MODELS.standard;
  const key = OPENROUTER_KEY;

  if (!key) throw new Error("No API key configured");

  const body = {
    model,
    max_tokens: maxTokens || LIMITS[tier]?.maxTokens || 1024,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://grant-platform-unless.netlify.app",
      "X-Title": "UNLESS Grant Platform",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI error: ${res.status} ${err.slice(0, 100)}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    model,
    usage: data.usage,
  };
}

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id, X-Tier",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("OK", { headers: cors });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: cors,
    });

  const store = getStore("rate-limits");

  try {
    const body = await req.json();
    const { messages, system, action } = body;

    // Extract session and tier from headers or body
    const sessionId =
      req.headers.get("X-Session-Id") || body.sessionId || "anonymous";
    const tier = req.headers.get("X-Tier") || body.tier || "free";

    // Rate limit check
    const rl = await checkRateLimit(store, sessionId, tier);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          remaining: 0,
          limit: rl.limit,
          resetAt: "midnight UTC",
        }),
        { status: 429, headers: cors }
      );
    }

    // Validate input
    if (!messages && !action) {
      return new Response(
        JSON.stringify({ error: "messages or action required" }),
        { status: 400, headers: cors }
      );
    }

    // If action-based (delegated to existing ai.js actions), convert to messages
    let aiMessages = messages;
    let systemPrompt = system || "";

    if (action && !messages) {
      // Convert action-based requests to chat format
      systemPrompt =
        body.systemPrompt ||
        "You are an expert grant writing assistant. Be specific, practical, and professional.";
      aiMessages = [{ role: "user", content: body.prompt || body.content || "" }];
    }

    const result = await callAI(
      aiMessages,
      systemPrompt,
      tier,
      body.maxTokens
    );

    return new Response(
      JSON.stringify({
        text: result.text,
        model: result.model,
        remaining: rl.remaining,
        limit: rl.limit,
      }),
      { headers: cors }
    );
  } catch (err) {
    console.error("AI proxy error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: cors,
    });
  }
};

export const config = { path: "/api/ai-proxy" };
