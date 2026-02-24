import { getStore } from "@netlify/blobs";

// ── Server-Side AI Proxy ──────────────────────────────────────────
// Allows client AI features (AIDrafter, NarrativeScorer, etc.) to work
// without requiring users to provide their own API keys.
// Free tier: 30 calls/day via free models
// Alpha/Pro: 200 calls/day via better models

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const MODELS = {
  free:  "meta-llama/llama-3.3-70b-instruct:free",
  standard: "anthropic/claude-3.5-haiku",
  premium: "anthropic/claude-sonnet-4-20250514",
};

const LIMITS = {
  free: 30,
  alpha: 200,
  pro: 200,
  team: 500,
};

async function getRateLimit(store, identifier, tier) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `rate_${today}_${identifier}`;
  let count = 0;
  try {
    const raw = await store.get(key);
    count = raw ? parseInt(raw) : 0;
  } catch { count = 0; }
  
  const limit = LIMITS[tier] || LIMITS.free;
  return { count, limit, remaining: Math.max(0, limit - count), allowed: count < limit, key };
}

async function incrementRate(store, key) {
  let count = 0;
  try {
    const raw = await store.get(key);
    count = raw ? parseInt(raw) : 0;
  } catch { count = 0; }
  await store.set(key, String(count + 1));
}

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("OK", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: cors });
  if (!OPENROUTER_KEY) return new Response(JSON.stringify({ error: "Server AI not configured" }), { status: 503, headers: cors });

  try {
    const body = await req.json();
    const { messages, systemPrompt, tier, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: cors });
    }

    // Rate limiting
    const store = getStore("ai-proxy");
    const identifier = sessionId || req.headers.get("x-forwarded-for") || "anon";
    const effectiveTier = tier || "free";
    const rate = await getRateLimit(store, identifier, effectiveTier);

    if (!rate.allowed) {
      return new Response(JSON.stringify({ 
        error: `Daily AI limit reached (${rate.limit} calls). Upgrade or add your own API key in Settings.`,
        rateLimited: true,
        limit: rate.limit,
        used: rate.count,
      }), { status: 429, headers: cors });
    }

    // Select model based on tier
    const model = effectiveTier === "free" ? MODELS.free : MODELS.standard;

    // Build messages array
    const msgs = [];
    if (systemPrompt) {
      msgs.push({ role: "system", content: systemPrompt.slice(0, 4000) });
    }
    for (const m of messages.slice(0, 10)) {
      msgs.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: (m.content || "").slice(0, 8000),
      });
    }

    // Call OpenRouter
    const startTime = Date.now();
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://unless-fortuna-grants.netlify.app",
        "X-Title": "UNLESS Grant Platform",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: msgs,
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return new Response(JSON.stringify({ 
        error: `AI service error: ${res.status}`,
        detail: errText.slice(0, 200),
      }), { status: 502, headers: cors });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Track usage
    await incrementRate(store, rate.key);

    return new Response(JSON.stringify({
      text,
      provider: "server-proxy",
      model,
      durationMs,
      remaining: rate.remaining - 1,
    }), { headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
};
