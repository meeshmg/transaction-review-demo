# Changelog

All notable changes to the Transaction Review Demo are documented here.

---

## 2026-03-17 — Blog & Repo Reorganization

### Blog Posts
- Replaced single `docs/BLOG.md` with dated `docs/blog/` directory
- **2026-03-04-building-the-pipeline.md** — Phase 1 story (restored original content + update note linking to Phase 2)
- **2026-03-17-from-prototype-to-platform.md** — Phase 2 story covering iteration, bug discovery, domain learning, communication layer, documentation-driven workflow, and forward vision

### Repo Structure
- Moved `BLOG.md`, `CHANGELOG.md` → `docs/`
- Moved `pull_demo_analytics.py` → `scripts/`
- Removed Vite scaffold cruft (`App.css`, `assets/react.svg`, `public/vite.svg`)
- Removed stray screenshot from repo root
- Added Repo Structure section to README
- Updated all path references (workflow, cron job, script, README)

---

## 2026-03-17 — Serverless Overhaul

Transformed the demo from a static localStorage-only frontend into a full-stack application with serverless backend, analytics, and admin tooling.

### Server Infrastructure
- Added 3 Netlify Functions (`analytics.mjs`, `sync.mjs`, `stats.mjs`) for server-side persistence
- All visitor sessions, feature interactions, email signups, and identities now tracked in Netlify Blobs
- Per-visitor edit sync — every edit, note, flag, and feedback entry auto-syncs to the server (debounced 3s)
- Public `/api/stats` endpoint returns real-time aggregated metrics (60s cache)

### Dashboard Upgrades
- Replaced fake localStorage visitor counter with real server-backed stats in the header
- Rewrote the About page: added server architecture section, "What I Can Build For You" capabilities list, live stats panel, and updated tech stack (12 items)
- Email signups now POST to server (previously localStorage-only)
- Identity submissions POST to server on sign-in
- All interactive actions (category change, note, flag, feedback, tour start/complete, tab views) tracked as analytics events

### Admin Tooling
- Created `pull_demo_analytics.py` — one command to download all analytics, signups, and visitor edits
- Daily cron job pulls analytics locally at 9am
- Added `/pull-demo-analytics` Windsurf workflow for manual pulls

### Security
- Input sanitization (HTML tag stripping) on all user-submitted text
- Max length caps on all string fields
- Session/event arrays capped (5K sessions, 10K events) to prevent storage bloat
- Visitor index capped at 1K entries

### Documentation
- Rewrote `README.md` with full server architecture tables, Netlify Blobs documentation, admin script usage, and production vs. demo comparison
- Rewrote `BLOG.md` with new "Server-Side Layer" section and updated demo description
- Added `.gitignore` entry for `data/exports/`

---

## 2026-03-14 — Initial Public Demo

Launched the public-facing demo dashboard with anonymized sample data.

### Core Features
- 7-tab interactive dashboard: Summary, Categories, Excluded, Transfer Pairs, Job Audit, Monthly, About
- Full transaction editing: category reassignment, inline notes, flag for review
- Change log with per-entry undo
- Export: JSON change log, edits snapshot, filtered CSV
- Responsive layout with TailwindCSS 4

### Demo-Specific Features
- Identity system: name + email prompt on first interaction, persisted in localStorage
- Interactive demo banner with dismissal
- Guided tour (6 steps) with tab navigation
- Onboarding pulse hints for first-time visitors
- Email list popup after 60 seconds
- Share buttons (copy link, LinkedIn, X/Twitter)
- Visitor counter in header
- About page with project write-up, tech stack, and contact links

### Tech Stack
- React 19, Vite, TailwindCSS 4, Recharts, Lucide React
- Deployed on Netlify via CI/CD from GitHub
