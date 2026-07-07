// Netlify Function (modern format) — shared key-value storage using Netlify Blobs.
// GET  /.netlify/functions/data?key=KEY         -> { value: "..." | null }
// POST /.netlify/functions/data  body:{key,value} -> { ok: true }
import { getStore } from "@netlify/blobs";

const corsHeaders = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  try {
    const store = getStore("moody-space-store");
    const url = new URL(req.url);

    if (req.method === "GET") {
      const key = url.searchParams.get("key");
      if (!key) {
        return new Response(JSON.stringify({ error: "missing key" }), { status: 400, headers: corsHeaders });
      }
      if (key === "__ping__") {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
      }
      const value = await store.get(key);
      return new Response(JSON.stringify({ value: value || null }), { status: 200, headers: corsHeaders });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.key) {
        return new Response(JSON.stringify({ error: "missing key" }), { status: 400, headers: corsHeaders });
      }
      await store.set(body.key, body.value);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err && err.message ? err.message : err) }),
      { status: 500, headers: corsHeaders }
    );
  }
};
