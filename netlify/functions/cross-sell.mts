import type { Context, Config } from "@netlify/functions";

const ECOSYSTEM: Record<string, any> = {
  oracle: { name: "ORACLE Intelligence", url: "https://oracle-intelligence.netlify.app", hook: "Your grants target specific markets — get deep market intelligence in 5 minutes.", cta: "Get Market Intelligence →", price: "Reports from $39" },
  atlas: { name: "ATLAS Financial Models", url: "https://unless-atlas-platform.netlify.app", hook: "Grant budgets need financial projections. Generate investor-ready models instantly.", cta: "Build Financial Model →", price: "Models from $49" },
  clear: { name: "CLEAR Intelligence", url: "https://clear-platform.netlify.app", hook: "Ongoing competitive analysis for the sectors you're seeking grants in.", cta: "Start Analyzing →", price: "Free to start" },
};
const TIER_RECS: Record<string, string[]> = { pro: ["oracle", "atlas"], team: ["oracle", "atlas", "clear"] };

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200 });
  if (req.method !== "POST") return Response.json({ error: "POST only" }, { status: 405 });

  try {
    const { email, tier } = await req.json();
    if (!email) return Response.json({ error: "email required" }, { status: 400 });

    const recs = (TIER_RECS[tier || "pro"] || TIER_RECS.pro).map(id => ({
      platform: ECOSYSTEM[id].name, url: `${ECOSYSTEM[id].url}?ref=grant-platform&tier=${tier || "pro"}`,
      reason: ECOSYSTEM[id].hook, price: ECOSYSTEM[id].price,
    }));

    // Send cross-sell email via Resend
    const RESEND_KEY = Netlify.env.get("RESEND_API_KEY");
    let emailSent = false;
    if (RESEND_KEY) {
      try {
        const tierName = tier === "team" ? "Team" : "Pro";
        const recCards = recs.map(r => `<div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid #F59E0B;"><h3 style="margin:0 0 6px;color:#1a1a2e;font-size:16px;">${r.platform}</h3><p style="margin:0 0 12px;color:#555;font-size:14px;">${r.reason}</p><a href="${r.url}" style="background:#F59E0B;color:#1a1a2e;padding:8px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">${ECOSYSTEM[recs.indexOf(r) < recs.length ? Object.keys(ECOSYSTEM)[recs.indexOf(r)] : "oracle"].cta}</a></div>`).join("");
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({ from: `UNLESS Grants <grants@updates.oracleintelligence.net>`, to: [email], subject: `Your Grant Platform ${tierName} is active`, html: `<div style="max-width:560px;margin:0 auto;font-family:-apple-system,sans-serif;padding:32px 24px;"><h1 style="font-size:22px;color:#1a1a2e;">Welcome to Grant Platform ${tierName} 🎉</h1><p style="color:#666;font-size:15px;">Your subscription is active. Tools that pair with your new capabilities:</p>${recCards}</div>` }),
        });
        emailSent = res.ok;
      } catch { emailSent = false; }
    }

    return Response.json({ recommendations: recs, emailSent, ecosystem: "UNLESS" });
  } catch (err: any) { return Response.json({ error: err.message }, { status: 500 }); }
};

export const config: Config = { path: "/api/cross-sell" };
