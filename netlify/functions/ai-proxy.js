const { getStore } = require("@netlify/blobs");

// Server-Side AI Proxy
// Free tier: 30 calls/day via free models
// Alpha/Pro: 200 calls/day via better models

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const MODELS = {
  free:  "meta-llama/llama-3.1-8b-instruct:free",
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
  return { count, limit, remaining: Math.max(0, limit - count), key };
}

async function incrementRate(store, key, count) {
  await store.set(key, String(count + 1));
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "POST only" }) };

  if (!OPENROUTER_KEY) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "AI service not configured" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { system, prompt, tier, identifier, maxTokens } = body;

    if (!prompt) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "prompt required" }) };
    }

    const store = getStore("ai-rate-limits");
    const userTier = tier || "free";
    const userId = identifier || event.headers["x-forwarded-for"] || "anonymous";
    const rate = await getRateLimit(store, userId, userTier);

    if (rate.remaining <= 0) {
      return {
        statusCode: 429, headers: cors,
        body: JSON.stringify({
          error: "Rate limit exceeded",
          limit: rate.limit, used: rate.count,
          upgrade: userTier === "free" ? "Upgrade to Pro for 200 calls/day" : null,
        }),
      };
    }

    const model = userTier === "team" ? MODELS.premium : userTier === "pro" || userTier === "alpha" ? MODELS.standard : MODELS.free;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://grant-platform-unless.netlify.app",
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens || 1024,
      }),
    });

    const data = await aiRes.json();
    await incrementRate(store, rate.key, rate.count);

    const text = data.choices?.[0]?.message?.content || "";

    return {
      statusCode: 200, headers: cors,
      body: JSON.stringify({
        text, model, remaining: rate.remaining - 1,
        tier: userTier,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
