const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  const store = getStore("feedback");

  // GET: List feedback
  if (event.httpMethod === "GET") {
    try {
      const params = event.queryStringParameters || {};
      const status = params.status || "open";
      const limit = parseInt(params.limit || "50");

      const { blobs } = await store.list({ prefix: "fb_" });
      const items = [];

      for (const blob of blobs.slice(0, Math.min(limit, blobs.length))) {
        try {
          const raw = await store.get(blob.key);
          if (raw) {
            const data = JSON.parse(raw);
            if (status === "all" || data.status === status) {
              items.push({ key: blob.key, ...data });
            }
          }
        } catch (e) { /* skip corrupted */ }
      }

      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const stats = { total: items.length, byCategory: {}, bySeverity: {}, byModule: {} };
      items.forEach(i => {
        stats.byCategory[i.category] = (stats.byCategory[i.category] || 0) + 1;
        stats.bySeverity[i.severity] = (stats.bySeverity[i.severity] || 0) + 1;
        stats.byModule[i.module] = (stats.byModule[i.module] || 0) + 1;
      });

      return { statusCode: 200, headers: cors, body: JSON.stringify({ stats, items }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST: Submit new feedback
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { category, severity, description, module, tier, email, url, viewport, userAgent, sessionId } = body;

      if (!description || !category) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "category and description required" }) };
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
      return { statusCode: 201, headers: cors, body: JSON.stringify({ ok: true, id }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  // PATCH: Update feedback status
  if (event.httpMethod === "PATCH") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { id, status, resolution } = body;
      if (!id) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

      let existing;
      try {
        const raw = await store.get(id);
        existing = raw ? JSON.parse(raw) : null;
      } catch { existing = null; }
      if (!existing) return { statusCode: 404, headers: cors, body: JSON.stringify({ error: "not found" }) };

      const updated = {
        ...existing, status: status || existing.status,
        resolution: resolution || existing.resolution,
        resolvedAt: status === "resolved" ? new Date().toISOString() : existing.resolvedAt,
      };

      await store.set(id, JSON.stringify(updated));
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, updated }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };
};
