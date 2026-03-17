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

  const store = getStore({ name: "demo-analytics", consistency: "eventual" });

  // GET — return all analytics (for pull script)
  if (req.method === "GET") {
    const [
      sessions,
      events,
      signups,
      identities,
    ] = await Promise.all([
      store.get("sessions", { type: "json" }).catch(() => null),
      store.get("events", { type: "json" }).catch(() => null),
      store.get("signups", { type: "json" }).catch(() => null),
      store.get("identities", { type: "json" }).catch(() => null),
    ]);

    return new Response(JSON.stringify({
      sessions: sessions || [],
      events: events || [],
      signups: signups || [],
      identities: identities || [],
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // POST — record an event
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

    const { type } = body;

    if (type === "session") {
      // Record a visitor session
      const entry = {
        visitor_id: sanitize(body.visitor_id, 64),
        timestamp: new Date().toISOString(),
        referrer: sanitize(body.referrer, 500),
        user_agent: sanitize(body.user_agent, 300),
      };
      const sessions = (await store.get("sessions", { type: "json" }).catch(() => null)) || [];
      sessions.push(entry);
      // Cap at 5000 entries to avoid blob size issues
      if (sessions.length > 5000) sessions.splice(0, sessions.length - 5000);
      await store.setJSON("sessions", sessions);
    }

    else if (type === "event") {
      // Record a feature interaction event
      const entry = {
        visitor_id: sanitize(body.visitor_id, 64),
        timestamp: new Date().toISOString(),
        action: sanitize(body.action, 100),
        detail: sanitize(body.detail, 500),
        tab: sanitize(body.tab, 50),
      };
      const events = (await store.get("events", { type: "json" }).catch(() => null)) || [];
      events.push(entry);
      if (events.length > 10000) events.splice(0, events.length - 10000);
      await store.setJSON("events", events);
    }

    else if (type === "signup") {
      // Email list signup
      const entry = {
        name: sanitize(body.name, 100),
        email: sanitize(body.email, 200),
        timestamp: new Date().toISOString(),
        visitor_id: sanitize(body.visitor_id, 64),
      };
      const signups = (await store.get("signups", { type: "json" }).catch(() => null)) || [];
      signups.push(entry);
      await store.setJSON("signups", signups);
    }

    else if (type === "identity") {
      // User identified themselves (name + email to interact)
      const entry = {
        name: sanitize(body.name, 100),
        email: sanitize(body.email, 200),
        timestamp: new Date().toISOString(),
        visitor_id: sanitize(body.visitor_id, 64),
      };
      const identities = (await store.get("identities", { type: "json" }).catch(() => null)) || [];
      identities.push(entry);
      await store.setJSON("identities", identities);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
};
