import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("OK", { headers: cors });

  const store = getStore("analytics");

  // POST: Receive event batch
  if (req.method === "POST") {
    try {
      const { events } = await req.json();
      if (!Array.isArray(events) || events.length === 0) {
        return new Response(JSON.stringify({ ok: true, stored: 0 }), { headers: cors });
      }

      // Aggregate into daily buckets
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const key = `day_${today}`;
      
      let dayData;
      try {
        dayData = await store.get(key, { type: "json" });
      } catch { dayData = null; }
      
      if (!dayData) {
        dayData = {
          date: today,
          sessions: new Set(),
          pageViews: {},
          gateHits: {},
          aiCalls: { total: 0, success: 0, fail: 0, totalMs: 0 },
          apiCalls: { total: 0, success: 0, fail: 0 },
          errors: {},
          actions: {},
          feedbackOpens: 0,
        };
      } else {
        dayData.sessions = new Set(dayData.sessions || []);
      }

      for (const ev of events) {
        if (ev.session) dayData.sessions.add(ev.session);
        
        switch (ev.type) {
          case 'page_view':
            dayData.pageViews[ev.module] = (dayData.pageViews[ev.module] || 0) + 1;
            break;
          case 'gate_hit':
            dayData.gateHits[ev.feature] = (dayData.gateHits[ev.feature] || 0) + 1;
            break;
          case 'ai_call':
            dayData.aiCalls.total++;
            if (ev.success) dayData.aiCalls.success++;
            else dayData.aiCalls.fail++;
            dayData.aiCalls.totalMs += (ev.durationMs || 0);
            break;
          case 'api_call':
            dayData.apiCalls.total++;
            if (ev.success) dayData.apiCalls.success++;
            else dayData.apiCalls.fail++;
            break;
          case 'error':
            const eKey = `${ev.component}:${(ev.message || '').slice(0, 50)}`;
            dayData.errors[eKey] = (dayData.errors[eKey] || 0) + 1;
            break;
          case 'action':
            dayData.actions[ev.name] = (dayData.actions[ev.name] || 0) + 1;
            break;
          case 'feedback_open':
            dayData.feedbackOpens = (dayData.feedbackOpens || 0) + 1;
            break;
        }
      }

      // Convert Set to array for storage
      const toStore = { ...dayData, sessions: [...dayData.sessions] };
      await store.setJSON(key, toStore);

      return new Response(JSON.stringify({ ok: true, stored: events.length, date: today }), { headers: cors });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  // GET: Retrieve analytics (for autonomous monitoring)
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const days = parseInt(url.searchParams.get("days") || "7");
      
      const results = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `day_${d.toISOString().slice(0, 10)}`;
        try {
          const data = await store.get(key, { type: "json" });
          if (data) results.push(data);
        } catch { /* day not found */ }
      }
      
      return new Response(JSON.stringify({ days: results.length, data: results }), { headers: cors });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
    }
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });
};

export const config = { path: "/api/analytics" };
