import { getStore } from "@netlify/blobs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const analyticsStore = getStore({ name: "demo-analytics", consistency: "eventual" });
  const editsStore = getStore({ name: "demo-visitor-edits", consistency: "eventual" });

  const [sessions, events, signups, identities, visitorIndex] = await Promise.all([
    analyticsStore.get("sessions", { type: "json" }).catch(() => []),
    analyticsStore.get("events", { type: "json" }).catch(() => []),
    analyticsStore.get("signups", { type: "json" }).catch(() => []),
    analyticsStore.get("identities", { type: "json" }).catch(() => []),
    editsStore.get("visitor-index", { type: "json" }).catch(() => []),
  ]);

  const sessionList = sessions || [];
  const eventList = events || [];
  const signupList = signups || [];
  const identityList = identities || [];
  const indexList = visitorIndex || [];

  // Unique visitors by visitor_id
  const uniqueVisitors = new Set(sessionList.map(s => s.visitor_id)).size;

  // Total edits = category_change events
  const totalEdits = eventList.filter(e => e.action === "category_change" || e.action === "note" || e.action === "flag_toggle").length;

  // Feature usage breakdown
  const featureCounts = {};
  for (const e of eventList) {
    featureCounts[e.action] = (featureCounts[e.action] || 0) + 1;
  }

  // Tab views
  const tabViews = {};
  for (const e of eventList.filter(ev => ev.action === "tab_view")) {
    tabViews[e.tab] = (tabViews[e.tab] || 0) + 1;
  }

  // Visitors who completed the tour
  const tourCompletions = eventList.filter(e => e.action === "tour_complete").length;

  return new Response(JSON.stringify({
    visitors: uniqueVisitors,
    totalSessions: sessionList.length,
    totalEvents: eventList.length,
    totalEdits,
    totalSignups: signupList.length,
    totalIdentities: identityList.length,
    activeVisitors: indexList.length,
    tourCompletions,
    featureCounts,
    tabViews,
  }), {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
};
