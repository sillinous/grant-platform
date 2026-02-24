const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  const store = getStore("analytics");

  // POST: Receive event batch
  if (event.httpMethod === "POST") {
    try {
      const { events } = JSON.parse(event.body || "{}");
      if (!Array.isArray(events) || events.length === 0) {
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, stored: 0 }) };
      }

      const today = new Date().toISOString().slice(0, 10);
      const key = `day_${today}`;

      let dayData;
      try {
        const raw = await store.get(key);
        dayData = raw ? JSON.parse(raw) : null;
      } catch { dayData = null; }

      if (!dayData) {
        dayData = { date: today, events: [], pageViews: {}, features: {}, gateHits: {}, sessions: 0 };
      }

      events.forEach(ev => {
        dayData.events.push({ ...ev, serverTs: Date.now() });
        if (ev.type === "page_view") {
          dayData.pageViews[ev.page] = (dayData.pageViews[ev.page] || 0) + 1;
        }
        if (ev.type === "feature_use") {
          dayData.features[ev.feature] = (dayData.features[ev.feature] || 0) + 1;
        }
        if (ev.type === "gate_hit") {
          dayData.gateHits[ev.feature] = (dayData.gateHits[ev.feature] || 0) + 1;
        }
        if (ev.type === "session_start") {
          dayData.sessions += 1;
        }
      });

      // Keep only last 500 events per day to control storage
      if (dayData.events.length > 500) {
        dayData.events = dayData.events.slice(-500);
      }

      await store.set(key, JSON.stringify(dayData));

      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, stored: events.length }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  // GET: Retrieve analytics
  if (event.httpMethod === "GET") {
    try {
      const params = event.queryStringParameters || {};
      const days = parseInt(params.days || "7");
      const result = [];

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `day_${d.toISOString().slice(0, 10)}`;
        try {
          const raw = await store.get(key);
          if (raw) result.push(JSON.parse(raw));
        } catch { /* skip */ }
      }

      const summary = {
        totalSessions: result.reduce((s, d) => s + (d.sessions || 0), 0),
        totalEvents: result.reduce((s, d) => s + (d.events?.length || 0), 0),
        topPages: {},
        topFeatures: {},
        topGateHits: {},
      };

      result.forEach(d => {
        Object.entries(d.pageViews || {}).forEach(([k, v]) => { summary.topPages[k] = (summary.topPages[k] || 0) + v; });
        Object.entries(d.features || {}).forEach(([k, v]) => { summary.topFeatures[k] = (summary.topFeatures[k] || 0) + v; });
        Object.entries(d.gateHits || {}).forEach(([k, v]) => { summary.topGateHits[k] = (summary.topGateHits[k] || 0) + v; });
      });

      return { statusCode: 200, headers: cors, body: JSON.stringify({ summary, days: result }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };
};
