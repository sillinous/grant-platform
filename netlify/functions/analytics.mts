import { getStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200 });
  const store = getStore("analytics");

  if (req.method === "POST") {
    try {
      const { events } = await req.json();
      if (!Array.isArray(events) || events.length === 0) return Response.json({ ok: true, stored: 0 });
      const today = new Date().toISOString().slice(0, 10);
      const key = `day_${today}`;
      let dayData: any;
      try { const raw = await store.get(key); dayData = raw ? JSON.parse(raw) : null; } catch { dayData = null; }
      if (!dayData) dayData = { date: today, events: [], pageViews: {}, features: {}, gateHits: {}, sessions: 0 };
      events.forEach((ev: any) => {
        dayData.events.push({ ...ev, serverTs: Date.now() });
        if (ev.type === "page_view") dayData.pageViews[ev.page] = (dayData.pageViews[ev.page] || 0) + 1;
        if (ev.type === "feature_use") dayData.features[ev.feature] = (dayData.features[ev.feature] || 0) + 1;
        if (ev.type === "gate_hit") dayData.gateHits[ev.feature] = (dayData.gateHits[ev.feature] || 0) + 1;
        if (ev.type === "session_start") dayData.sessions += 1;
      });
      if (dayData.events.length > 500) dayData.events = dayData.events.slice(-500);
      await store.set(key, JSON.stringify(dayData));
      return Response.json({ ok: true, stored: events.length });
    } catch (err: any) { return Response.json({ error: err.message }, { status: 500 }); }
  }

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const days = parseInt(url.searchParams.get("days") || "7");
      const result: any[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = `day_${d.toISOString().slice(0, 10)}`;
        try { const raw = await store.get(key); if (raw) result.push(JSON.parse(raw)); } catch { }
      }
      const summary: any = { totalSessions: 0, totalEvents: 0, topPages: {}, topFeatures: {}, topGateHits: {} };
      result.forEach(d => {
        summary.totalSessions += d.sessions || 0;
        summary.totalEvents += d.events?.length || 0;
        Object.entries(d.pageViews || {}).forEach(([k, v]: any) => { summary.topPages[k] = (summary.topPages[k] || 0) + v; });
        Object.entries(d.features || {}).forEach(([k, v]: any) => { summary.topFeatures[k] = (summary.topFeatures[k] || 0) + v; });
        Object.entries(d.gateHits || {}).forEach(([k, v]: any) => { summary.topGateHits[k] = (summary.topGateHits[k] || 0) + v; });
      });
      return Response.json({ summary, days: result });
    } catch (err: any) { return Response.json({ error: err.message }, { status: 500 }); }
  }
  return Response.json({ error: "method not allowed" }, { status: 405 });
};

export const config: Config = { path: "/api/analytics" };
