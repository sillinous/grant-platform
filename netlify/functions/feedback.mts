import { getStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200 });

  const store = getStore("feedback");

  // GET: List feedback
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || "open";
      const limit = parseInt(url.searchParams.get("limit") || "50");

      const { blobs } = await store.list({ prefix: "fb_" });
      const items: any[] = [];

      for (const blob of blobs.slice(0, Math.min(limit, blobs.length))) {
        try {
          const raw = await store.get(blob.key);
          if (raw) {
            const data = JSON.parse(raw);
            if (status === "all" || data.status === status) {
              items.push({ key: blob.key, ...data });
            }
          }
        } catch { /* skip corrupted */ }
      }
      items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const stats: any = { total: items.length, byCategory: {}, bySeverity: {}, byModule: {} };
      items.forEach((i: any) => {
        stats.byCategory[i.category] = (stats.byCategory[i.category] || 0) + 1;
        stats.bySeverity[i.severity] = (stats.bySeverity[i.severity] || 0) + 1;
        stats.byModule[i.module] = (stats.byModule[i.module] || 0) + 1;
      });

      return Response.json({ stats, items });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // POST: Submit new feedback
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { category, severity, description, module, tier, email, url, viewport, userAgent, sessionId } = body;
      if (!description || !category) {
        return Response.json({ error: "category and description required" }, { status: 400 });
      }
      const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const feedback = {
        id, category: category || "general", severity: severity || "medium",
        description: (description || "").slice(0, 2000), module: module || "unknown",
        tier: tier || "free", email: email || "", url: url || "",
        viewport: viewport || "", userAgent: (userAgent || "").slice(0, 120),
        sessionId: sessionId || "", status: "open", resolution: null,
        resolvedAt: null, timestamp: new Date().toISOString(),
      };
      await store.set(id, JSON.stringify(feedback));
      return Response.json({ ok: true, id }, { status: 201 });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // PATCH: Update feedback status
  if (req.method === "PATCH") {
    try {
      const body = await req.json();
      const { id, status, resolution } = body;
      if (!id) return Response.json({ error: "id required" }, { status: 400 });
      let existing: any;
      try { const raw = await store.get(id); existing = raw ? JSON.parse(raw) : null; } catch { existing = null; }
      if (!existing) return Response.json({ error: "not found" }, { status: 404 });
      const updated = { ...existing, status: status || existing.status, resolution: resolution || existing.resolution, resolvedAt: status === "resolved" ? new Date().toISOString() : existing.resolvedAt };
      await store.set(id, JSON.stringify(updated));
      return Response.json({ ok: true, updated });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return Response.json({ error: "method not allowed" }, { status: 405 });
};

export const config: Config = { path: "/api/feedback" };
