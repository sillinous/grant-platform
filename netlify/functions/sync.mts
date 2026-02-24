import { getStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200 });

  const auth = req.headers.get("authorization") || "";
  let user: string | null = null;
  try {
    const payload = JSON.parse(atob(auth.split(".")[1]));
    user = payload.sub;
  } catch { user = null; }
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const store = getStore("user-data");
  const key = `user_${user}`;

  if (req.method === "GET") {
    try {
      const raw = await store.get(key);
      if (!raw) return Response.json(null);
      return new Response(raw, { headers: { "Content-Type": "application/json" } });
    } catch (err: any) { return Response.json({ error: err.message }, { status: 500 }); }
  }

  if (req.method === "POST") {
    try {
      const data = await req.text();
      await store.set(key, data);
      return Response.json({ ok: true, synced: new Date().toISOString() });
    } catch (err: any) { return Response.json({ error: err.message }, { status: 500 }); }
  }
  return Response.json({ error: "method not allowed" }, { status: 405 });
};

export const config: Config = { path: "/api/sync" };
