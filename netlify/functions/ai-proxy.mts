import { getStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

const MODELS: Record<string, string> = {
  free: "meta-llama/llama-3.1-8b-instruct:free",
  standard: "anthropic/claude-3.5-haiku",
  premium: "anthropic/claude-sonnet-4-20250514",
};
const LIMITS: Record<string, number> = { free: 30, alpha: 200, pro: 200, team: 500 };

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200 });
  if (req.method !== "POST") return Response.json({ error: "POST only" }, { status: 405 });

  const OPENROUTER_KEY = Netlify.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_KEY) return Response.json({ error: "AI service not configured" }, { status: 500 });

  try {
    const body = await req.json();
    const { system, prompt, tier, identifier, maxTokens } = body;
    if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });

    const store = getStore("ai-rate-limits");
    const userTier = tier || "free";
    const userId = identifier || req.headers.get("x-forwarded-for") || "anonymous";
    const today = new Date().toISOString().slice(0, 10);
    const rateKey = `rate_${today}_${userId}`;
    let count = 0;
    try { const raw = await store.get(rateKey); count = raw ? parseInt(raw) : 0; } catch { count = 0; }
    const limit = LIMITS[userTier] || LIMITS.free;
    const remaining = Math.max(0, limit - count);

    if (remaining <= 0) {
      return Response.json({ error: "Rate limit exceeded", limit, used: count, upgrade: userTier === "free" ? "Upgrade to Pro for 200 calls/day" : null }, { status: 429 });
    }

    const model = userTier === "team" ? MODELS.premium : (userTier === "pro" || userTier === "alpha") ? MODELS.standard : MODELS.free;
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENROUTER_KEY}`, "HTTP-Referer": "https://grant-platform-unless.netlify.app" },
      body: JSON.stringify({ model, messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }], max_tokens: maxTokens || 1024 }),
    });
    const data = await aiRes.json();
    await store.set(rateKey, String(count + 1));
    const text = data.choices?.[0]?.message?.content || "";
    return Response.json({ text, model, remaining: remaining - 1, tier: userTier });
  } catch (err: any) { return Response.json({ error: err.message }, { status: 500 }); }
};

export const config: Config = { path: "/api/ai-proxy" };
