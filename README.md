# Transaction Review Dashboard — Interactive Demo

An interactive web dashboard for reviewing and categorizing financial transactions across multiple accounts for small business tax preparation. Built with a **serverless backend** for real-time sync, analytics, and admin tooling.

**[Live Demo](https://transaction-review-demo.netlify.app)**

## Overview

Small business owners often have transactions spread across many accounts — business checking, savings, credit cards, Venmo, store credit accounts — and need to consolidate everything into a single view, categorize transactions for tax purposes, and verify that inter-account transfers aren't being double-counted as income.

This project automates that entire workflow with a three-stage Python pipeline, an interactive React dashboard for human review, and a serverless backend that persists data, tracks analytics, and enables admin tooling.

### What it does

1. **Multi-source data ingestion** — Processes CSV exports, HTML statements, and PDF statements from 11+ accounts into a unified format
2. **Automated categorization** — Rules engine with 3 layers (regex pattern matching, Venmo counterparty/note matching, account-level defaults) categorizes 100% of transactions
3. **Transfer detection & pairing** — Identifies inter-account transfers and pairs debits with credits across accounts to prevent double-counting
4. **Interactive review dashboard** — React web app for editing categories, adding notes, flagging transactions, exporting data, and leaving feedback
5. **Server-side persistence** — All edits sync to the server in real time via Netlify Functions + Netlify Blobs
6. **Analytics & lead capture** — Visitor sessions, feature usage, email signups, and identified users tracked server-side
7. **Admin pull script** — One command to download all analytics, signups, and visitor edits

### Tech Stack

| Layer | Technology |
|---|---|
| Data pipeline | Python, pandas |
| PDF parsing | pdftotext (poppler) + regex |
| HTML parsing | Regex-based extraction |
| Dashboard | React 19, Vite, TailwindCSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| State management | React Context + localStorage |
| Backend | Netlify Functions (serverless) |
| Storage | Netlify Blobs |
| Deployment | Netlify (CI/CD from GitHub) |
| Admin tooling | Python pull scripts |

## Repo Structure

```
transaction-review-demo/
├── docs/
│   ├── blog/
│   │   ├── 2026-03-04-building-the-pipeline.md    # Phase 1: pipeline + dashboard
│   │   └── 2026-03-17-from-prototype-to-platform.md # Phase 2: serverless, iteration, workflow
│   └── CHANGELOG.md             # Dated record of all changes
├── netlify/
│   └── functions/
│       ├── analytics.mjs        # Session/event/signup/identity tracking
│       ├── stats.mjs            # Aggregated public stats endpoint
│       └── sync.mjs             # Per-visitor edit persistence
├── scripts/
│   └── pull_demo_analytics.py   # Admin script to download all analytics
├── src/
│   ├── App.jsx                  # Full dashboard (single-file React app)
│   ├── data.json                # Anonymized sample transaction data
│   ├── index.css                # TailwindCSS entry point
│   └── main.jsx                 # React entry point
├── data/
│   └── exports/                 # Local analytics archives (gitignored)
├── .windsurf/
│   └── workflows/               # Windsurf IDE workflows
├── index.html                   # Vite entry
├── netlify.toml                 # Netlify build + functions + redirects
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## Dashboard Views

- **Summary** — KPI cards, account balances, expense breakdown charts, full tax category table
- **Categories** — Drill into any tax category with full-text search and editable transaction fields
- **Excluded** — Review everything marked "Not Business" or "Transfer", with flagged filter
- **Transfer Pairs** — Matched debit ↔ credit pairs with expandable detail, plus unpaired transfers
- **Job Audit** — Per-project expense breakdowns from PO codes and payment notes, with category charts
- **Monthly** — Income vs. expenses by month with expandable per-category breakdowns
- **About** — Project write-up, server architecture, live stats, tech stack, share buttons, and contact info

## Interactive Features

All edits are stored in `localStorage` **and** synced to the server (debounced 3s).

### Editing & Annotation
- **Category dropdown** — Change any transaction's tax category, or add a custom category
- **Inline notes** — Click any Notes cell to type free-text annotations
- **Flag for review** — Mark transactions for follow-up; filter to see only flagged items
- **General feedback** — Leave page-level comments at the bottom of every view

### Change Log & Export
- **Change Log panel** — Slide-out panel showing all changes with color-coded types and per-entry undo
- **Download Change Log** — Export full change log as JSON
- **Export Edits Snapshot** — Export edited transactions as JSON
- **CSV Export** — Per-tab export with category, date range, and amount filters
- **Reset All** — Clear everything with confirmation

### Identity System (Demo-Only)
- The dashboard is **freely viewable** without signing in
- Interactive actions (editing, notes, flags, feedback) prompt for **name and email**
- Identity is persisted in `localStorage` and synced to the server
- All submissions are tagged with the user's name and email
- Sign out anytime from the header

### Demo Enhancements
- **Interactive demo banner** — Dismissable banner guiding visitors to try the interactive features
- **Guided tour** — "Take a Tour" button walks through 6 key features step-by-step
- **Onboarding hints** — Subtle pulse animations on interactive elements for first-time visitors
- **Real visitor stats** — Server-backed visitor count and interaction count in the header
- **Live stats on About page** — Real-time visitors, interactions, signups, and tour completions
- **Share buttons** — Copy link, LinkedIn, and X/Twitter sharing on the About page
- **Email list popup** — After ~60 seconds, invites visitors to join the mailing list (signups go to server)

## Server-Side Architecture

### Netlify Functions (`netlify/functions/`)

| Function | Method | Purpose |
|---|---|---|
| `analytics.mjs` | GET | Returns all sessions, events, signups, identities |
| `analytics.mjs` | POST | Records a session, event, signup, or identity |
| `sync.mjs` | GET | Returns all visitor edits (or single visitor by ID) |
| `sync.mjs` | POST | Saves a visitor's edits, changelog, feedback |
| `stats.mjs` | GET | Returns aggregated stats (cached 60s) |

### Storage (Netlify Blobs)

| Store | Key(s) | Contents |
|---|---|---|
| `demo-analytics` | `sessions` | Visitor sessions (capped at 5,000) |
| `demo-analytics` | `events` | Feature interactions (capped at 10,000) |
| `demo-analytics` | `signups` | Email list signups |
| `demo-analytics` | `identities` | Identified users (name + email) |
| `demo-visitor-edits` | `visitor:{id}` | Per-visitor edits, changelog, feedback |
| `demo-visitor-edits` | `visitor-index` | List of all visitor IDs |

### Admin Pull Script

```bash
python scripts/pull_demo_analytics.py
```

Downloads all analytics and visitor edits, prints a summary, and saves raw JSON to `data/exports/`.

## Architecture

```
CSV/HTML/PDF Sources
        │
        ▼
┌──────────────────────┐
│ transaction_processor │  ← Loads 11 accounts, normalizes schema,
│        .py            │    detects & pairs transfers
└──────────┬───────────┘
           │  all_transactions.csv
           ▼
┌──────────────────────┐
│transaction_categorizer│  ← 3-layer rules engine:
│        .py            │    regex → Venmo rules → account defaults
└──────────┬───────────┘
           │  categorized.csv
           ▼
┌──────────────────────┐
│    tax_summary.py     │  ← Generates tax report matching
│                       │    accountant's expected format
└──────────┬───────────┘
           │  data.json
           ▼
┌──────────────────────┐        ┌─────────────────────────┐
│   React Dashboard     │ ──▶   │  Netlify Functions       │
│   (this app)          │ ◀──   │  + Netlify Blobs         │
└──────────────────────┘        └─────────────────────────┘
                                         │
                                         ▼
                                ┌─────────────────────────┐
                                │ scripts/                 │
                                │  pull_demo_analytics.py  │
                                └─────────────────────────┘
```

## Differences from Production Dashboard

| Feature | Production (EHAS) | Demo |
|---|---|---|
| Data | Real financial data (1,310 txns) | Anonymized sample data (~1,165 txns) |
| Access control | Password-protected | Open viewing; identity prompt on interaction |
| Identity | Single user (Eric) | Name + email collected per visitor |
| Server sync | Single-user edits to Netlify Blobs | Per-visitor edits to Netlify Blobs |
| Analytics | None (single known user) | Full visitor tracking, feature usage, signups |
| Communication | Messages tab, Open Questions tab | None (visitors are anonymous prospects) |
| Admin tooling | `pull_edits.py` | `pull_demo_analytics.py` |
| Onboarding | Welcome modal (personalized) | Banner, guided tour, pulse hints |
| Marketing | None | Email list popup, share buttons, bizzib.ai links |

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Note**: Server-side features (analytics, sync, stats) require Netlify Functions and won't work locally with `npm run dev` alone. Use `netlify dev` for full local testing with functions.

## Data

The demo uses **anonymized sample data** with realistic transaction patterns. The data generation script creates ~1,165 fake transactions across multiple accounts with proper category distributions and transfer pairs.

## License

MIT
