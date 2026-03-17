#!/usr/bin/env python3
"""
Pull demo dashboard analytics from Netlify.

Downloads visitor sessions, feature interactions, email signups,
identified users, and per-visitor edit data. Saves raw JSON and
prints a human-readable summary.

Usage:
    python pull_demo_analytics.py
"""

import json
import os
import sys
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError

SITE_URL = "https://transaction-review-demo.netlify.app"
EXPORT_DIR = os.path.join(os.path.dirname(__file__), "data", "exports")


def fetch_json(path):
    url = f"{SITE_URL}/api/{path}"
    req = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except URLError as e:
        print(f"  ✗ Failed to fetch {url}: {e}")
        return None


def main():
    os.makedirs(EXPORT_DIR, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")

    print("Pulling demo analytics...\n")

    # 1. Stats summary
    stats = fetch_json("stats")
    if stats:
        print("═══ Dashboard Stats ═══")
        print(f"  Unique visitors:    {stats.get('visitors', 0)}")
        print(f"  Total sessions:     {stats.get('totalSessions', 0)}")
        print(f"  Total interactions: {stats.get('totalEdits', 0)}")
        print(f"  Total events:       {stats.get('totalEvents', 0)}")
        print(f"  Email signups:      {stats.get('totalSignups', 0)}")
        print(f"  Identified users:   {stats.get('totalIdentities', 0)}")
        print(f"  Tour completions:   {stats.get('tourCompletions', 0)}")
        print(f"  Active editors:     {stats.get('activeVisitors', 0)}")

        fc = stats.get("featureCounts", {})
        if fc:
            print(f"\n  ── Feature Usage ──")
            for action, count in sorted(fc.items(), key=lambda x: -x[1]):
                print(f"    {action:<25s} {count:>5d}")

        tv = stats.get("tabViews", {})
        if tv:
            print(f"\n  ── Tab Views ──")
            for tab, count in sorted(tv.items(), key=lambda x: -x[1]):
                print(f"    {tab:<25s} {count:>5d}")
    else:
        print("  Could not fetch stats.\n")

    # 2. Full analytics data
    analytics = fetch_json("analytics")
    if analytics:
        sessions = analytics.get("sessions", [])
        events = analytics.get("events", [])
        signups = analytics.get("signups", [])
        identities = analytics.get("identities", [])

        if signups:
            print(f"\n═══ Email Signups ({len(signups)}) ═══")
            for s in signups:
                ts = s.get("timestamp", "")[:16].replace("T", " ")
                print(f"  [{ts}] {s.get('name', '(no name)'):<20s} {s.get('email', '')}")

        if identities:
            print(f"\n═══ Identified Users ({len(identities)}) ═══")
            # Deduplicate by email
            seen = set()
            unique = []
            for i in identities:
                email = i.get("email", "")
                if email not in seen:
                    seen.add(email)
                    unique.append(i)
            for i in unique:
                ts = i.get("timestamp", "")[:16].replace("T", " ")
                print(f"  [{ts}] {i.get('name', ''):<20s} {i.get('email', '')}")

        # Save raw analytics
        out_path = os.path.join(EXPORT_DIR, f"demo_analytics_{today}.json")
        with open(out_path, "w") as f:
            json.dump(analytics, f, indent=2)
        print(f"\n  ✓ Analytics saved to {out_path}")
    else:
        print("  Could not fetch analytics.\n")

    # 3. Per-visitor edits
    visitor_data = fetch_json("sync")
    if visitor_data:
        active_visitors = {
            vid: d for vid, d in visitor_data.items()
            if d.get("edits") or d.get("feedback") or d.get("changeLog")
        }

        if active_visitors:
            print(f"\n═══ Visitor Edits ({len(active_visitors)} active visitors) ═══")
            for vid, d in active_visitors.items():
                identity = d.get("identity")
                name = identity.get("name", "anonymous") if identity else "anonymous"
                edit_count = len(d.get("edits", {}))
                feedback_count = len(d.get("feedback", []))
                log_count = len(d.get("changeLog", []))
                print(f"  {name:<20s} (id: {vid[:12]}...) — {edit_count} edits, {feedback_count} feedback, {log_count} log entries")

                # Show feedback
                for fb in d.get("feedback", [])[:5]:
                    ts = fb.get("timestamp", "")[:16].replace("T", " ")
                    print(f"    [{ts}] ({fb.get('page', '?')}) {fb.get('text', '')[:80]}")

        # Save raw visitor data
        out_path = os.path.join(EXPORT_DIR, f"demo_visitor_edits_{today}.json")
        with open(out_path, "w") as f:
            json.dump(visitor_data, f, indent=2)
        print(f"\n  ✓ Visitor edits saved to {out_path}")
    else:
        print("  Could not fetch visitor edits.\n")

    print("\nDone.")


if __name__ == "__main__":
    main()
