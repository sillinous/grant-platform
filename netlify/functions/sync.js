import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // Auth check — Netlify Identity populates context.clientContext.user
  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore("userData");
  const blobKey = `user_${user.sub}`;

  // GET — Read user data
  if (req.method === "GET") {
    try {
      const raw = await store.get(blobKey);
      return new Response(raw || JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST — Write user data
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Validate the payload is an object and has expected keys
      if (typeof body !== "object" || body === null) {
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Whitelist what we persist (security + size control)
      const safe = {
        grants: Array.isArray(body.grants) ? body.grants : [],
        docs: Array.isArray(body.docs) ? body.docs : [],
        contacts: Array.isArray(body.contacts) ? body.contacts : [],
        events: Array.isArray(body.events) ? body.events : [],
        library: Array.isArray(body.library) ? body.library : [],
        scores: Array.isArray(body.scores) ? body.scores : [],
        funders: Array.isArray(body.funders) ? body.funders : [],
        snapshots: Array.isArray(body.snapshots) ? body.snapshots : [],
        tasks: Array.isArray(body.tasks) ? body.tasks : [],
        alliances: Array.isArray(body.alliances) ? body.alliances : [],
        budgets: typeof body.budgets === "object" ? body.budgets : {},
        onboarding: Boolean(body.onboarding),
        voicePersona: body.voicePersona || null,
        lastSync: body.lastSync || new Date().toISOString(),
      };

      await store.set(blobKey, JSON.stringify(safe));

      return new Response(JSON.stringify({ success: true, lastSync: safe.lastSync }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};
