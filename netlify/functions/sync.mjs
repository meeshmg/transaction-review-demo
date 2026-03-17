import { getStore } from "@netlify/blobs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function sanitize(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").slice(0, maxLen).trim();
}

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS_HEADERS });
  }

  const store = getStore({ name: "demo-visitor-edits", consistency: "eventual" });

  // GET — return all visitor edits (for pull script)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const visitorId = url.searchParams.get("visitor_id");

    if (visitorId) {
      // Single visitor's data
      const data = await store.get(`visitor:${sanitize(visitorId, 64)}`, { type: "json" }).catch(() => null);
      return new Response(JSON.stringify(data || {}), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // All visitors — return the index
    const index = (await store.get("visitor-index", { type: "json" }).catch(() => null)) || [];
    const allData = {};
    for (const vid of index.slice(-200)) {
      const d = await store.get(`visitor:${vid}`, { type: "json" }).catch(() => null);
      if (d) allData[vid] = d;
    }
    return new Response(JSON.stringify(allData), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // POST — save a visitor's edits
  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const visitorId = sanitize(body.visitor_id, 64);
    if (!visitorId) {
      return new Response(JSON.stringify({ error: "visitor_id required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const payload = {
      edits: body.edits || {},
      changeLog: body.changeLog || [],
      customCategories: body.customCategories || [],
      feedback: body.feedback || [],
      identity: body.identity || null,
      lastSync: new Date().toISOString(),
    };

    await store.setJSON(`visitor:${visitorId}`, payload);

    // Update the visitor index
    const index = (await store.get("visitor-index", { type: "json" }).catch(() => null)) || [];
    if (!index.includes(visitorId)) {
      index.push(visitorId);
      if (index.length > 1000) index.splice(0, index.length - 1000);
      await store.setJSON("visitor-index", index);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
};
