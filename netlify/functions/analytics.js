const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  const store = getStore("analytics");

  // POST: Receive event batch
  if (event.httpMethod === "POST") {
    try {
      const { events } = JSON.parse(event.body || '{"events":[]}');
      if (!Array.isArray(events) || events.length === 0) {
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, stored: 0 }) };
      }

      const today = new Date().toISOString().slice(0, 10);
      const key = `day_${today}`;

      let dayData;
      try { dayData = await store.get(key, { type: "json" }); } catch { dayData = null; }

      if (!dayData) {
        dayData = {
          date: today,
          sessions: [],
          pageViews: {},
          gateHits: {},
          aiCalls: { total: 0, success: 0, fail: 0, totalMs: 0 },
          apiCalls: { total: 0, success: 0, fail: 0 },
          errors: {},
          actions: {},
          feedbackOpens: 0,
        };
      }

      const sessionSet = new Set(dayData.sessions || []);

      for (const ev of events) {
        if (ev.session) sessionSet.add(ev.session);

        switch (ev.type) {
          case "page_view":
            dayData.pageViews[ev.module] = (dayData.pageViews[ev.module] || 0) + 1;
            break;
          case "gate_hit":
            dayData.gateHits[ev.feature] = (dayData.gateHits[ev.feature] || 0) + 1;
            break;
          case "ai_call":
            dayData.aiCalls.total++;
            if (ev.success) dayData.aiCalls.success++;
            else dayData.aiCalls.fail++;
            dayData.aiCalls.totalMs += (ev.durationMs || 0);
            break;
          case "api_call":
            dayData.apiCalls.total++;
            if (ev.success) dayData.apiCalls.success++;
            else dayData.apiCalls.fail++;
            break;
          case "error":
            const eKey = `${ev.component}:${(ev.message || "").slice(0, 50)}`;
            dayData.errors[eKey] = (dayData.errors[eKey] || 0) + 1;
            break;
          case "action":
            dayData.actions[ev.name] = (dayData.actions[ev.name] || 0) + 1;
            break;
          case "feedback_open":
            dayData.feedbackOpens = (dayData.feedbackOpens || 0) + 1;
            break;
        }
      }

      dayData.sessions = [...sessionSet];
      await store.setJSON(key, dayData);

      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, stored: events.length, date: today }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  // GET: Retrieve analytics (for autonomous monitoring)
  if (event.httpMethod === "GET") {
    try {
      const params = event.queryStringParameters || {};
      const days = parseInt(params.days || "7");

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

      return { statusCode: 200, headers: cors, body: JSON.stringify({ days: results.length, data: results }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };
};
