import { getStore } from "@netlify/blobs";

export const handler = async (event, context) => {
  // Requires Netlify Identity Authentication
  const { user } = context.clientContext || {};
  if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized. Please log in." }) };
    }

  // fallback to contextual store via getStore("user_data")
  const store = getStore("user_data");
  const method = event.httpMethod;

    try {
      if (method === "GET") {
        const data = await store.get(user.sub, { type: "json" });
        return { statusCode: 200, body: JSON.stringify(data || {}) };
      }

      if (method === "POST") {
        const body = JSON.parse(event.body);
        await store.setJSON(user.sub, body);
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }

      return { statusCode: 405, body: "Method not allowed" };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
