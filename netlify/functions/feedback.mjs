import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("OK", { headers: cors });

  const store = getStore("feedback");

  // GET: List feedback (for autonomous processing)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "open";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    
    try {
      const { blobs } = await store.list({ prefix: "fb_" });
      const items = [];
      
      for (const blob of blobs.slice(0, limit)) {
        const data = await store.get(blob.key, { type: "json" });
        if (data && (status === "all" || data.status === status)) {
          items.push({ key: blob.key, ...data });
        }
      }
      
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Summary stats
      const stats = {
        total: items.length,
        byCategory: {},
        bySeverity: {},
        byModule: {},
        byStatus: {},
      };
      items.forEach(i => {
        stats.byCategory[i.category] = (stats.byCategory[i.category] || 0) + 1;
        stats.bySeverity[i.severity] = (stats.bySeverity[i.severity] || 0) + 1;
        stats.byModule[i.module] = (stats.byModule[i.module] || 0) + 1;
        stats.byStatus[i.status] = (stats.byStatus[i.status] || 0) + 1;
      });
      
      return new Response(JSON.stringify({ stats, items }), { headers: cors });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // POST: Submit new feedback
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { category, severity, description, module, tier, email, url, viewport, userAgent, sessionId } = body;

      if (!description || !category) {
        return new Response(JSON.stringify({ error: "category and description required" }), { status: 400, headers: cors });
      }

      const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      const feedback = {
        id,
        category: category || "general",
        severity: severity || "medium",
        description: (description || "").slice(0, 2000),
        module: module || "unknown",
        tier: tier || "free",
        email: email || "",
        url: url || "",
        viewport: viewport || "",
        userAgent: (userAgent || "").slice(0, 120),
        sessionId: sessionId || "",
        status: "open",          // open → triaged → in_progress → resolved → closed
        resolution: null,        // what was done to address it
        resolvedAt: null,
        timestamp: new Date().toISOString(),
      };

      await store.setJSON(id, feedback);

      return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: cors });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // PATCH: Update feedback status (for autonomous resolution tracking)
  if (req.method === "PATCH") {
    try {
      const body = await req.json();
      const { id, status, resolution } = body;
      
      if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: cors });
      
      const existing = await store.get(id, { type: "json" });
      if (!existing) return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: cors });
      
      const updated = {
        ...existing,
        status: status || existing.status,
        resolution: resolution || existing.resolution,
        resolvedAt: status === "resolved" ? new Date().toISOString() : existing.resolvedAt,
      };
      
      await store.setJSON(id, updated);
      
      return new Response(JSON.stringify({ ok: true, updated }), { headers: cors });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });
};

export const config = { path: "/api/feedback" };
