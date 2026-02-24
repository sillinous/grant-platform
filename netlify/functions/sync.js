const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  // Extract user from Netlify Identity JWT
  const user = event.headers.authorization
    ? JSON.parse(Buffer.from(event.headers.authorization.split(".")[1], "base64").toString()).sub
    : null;

  if (!user) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Not authenticated" }) };
  }

  const store = getStore("user-data");
  const key = `user_${user}`;

  // GET: Pull user data
  if (event.httpMethod === "GET") {
    try {
      const raw = await store.get(key);
      if (!raw) return { statusCode: 200, headers: cors, body: JSON.stringify(null) };
      return { statusCode: 200, headers: cors, body: raw };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  // POST: Push user data
  if (event.httpMethod === "POST") {
    try {
      const data = event.body;
      await store.set(key, data);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, synced: new Date().toISOString() }) };
    } catch (err) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };
};
