
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // 1. Auth Check: Netlify Identity automatically populates `context.clientContext.user`
  // if the request has the right JWT.
  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Initialize Blob Store (scoped to this site)
  // We use the user's ID as the key for their data blob.
  const store = getStore("userData");
  const blobKey = `user_${user.sub}`; 

  // 3. Handle GET (Read Data)
  if (req.method === "GET") {
    try {
      const data = await store.get(blobKey);
      return new Response(data || JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // 4. Handle POST (Write Data)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      // Basic validation: ensure it's an object/string
      await store.set(blobKey, JSON.stringify(body));
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
