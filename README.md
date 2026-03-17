# Transaction Review Dashboard — Interactive Demo

An interactive web dashboard for reviewing and categorizing financial transactions across multiple accounts for small business tax preparation. This is the **public-facing demo** with anonymized sample data and full interactivity.

**[Live Demo](https://transaction-review-demo.netlify.app)**

## Overview

Small business owners often have transactions spread across many accounts — business checking, savings, credit cards, Venmo, store credit accounts — and need to consolidate everything into a single view, categorize transactions for tax purposes, and verify that inter-account transfers aren't being double-counted as income.

This project automates that entire workflow with a three-stage Python pipeline and an interactive React dashboard for human review.

### What it does

1. **Multi-source data ingestion** — Processes CSV exports, HTML statements, and PDF statements from 11+ accounts into a unified format
2. **Automated categorization** — Rules engine with 3 layers (regex pattern matching, Venmo counterparty/note matching, account-level defaults) categorizes 100% of transactions
3. **Transfer detection & pairing** — Identifies inter-account transfers and pairs debits with credits across accounts to prevent double-counting
4. **Interactive review dashboard** — React web app for editing categories, adding notes, flagging transactions, exporting data, and leaving feedback

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
| Deployment | Netlify |

## Dashboard Views

- **Summary** — KPI cards, account balances, expense breakdown charts, full tax category table
- **Categories** — Drill into any tax category with full-text search and editable transaction fields
- **Excluded** — Review everything marked "Not Business" or "Transfer", with flagged filter
- **Transfer Pairs** — Matched debit ↔ credit pairs with expandable detail, plus unpaired transfers
- **Job Audit** — Per-project expense breakdowns from PO codes and payment notes, with category charts
- **Monthly** — Income vs. expenses by month with expandable per-category breakdowns
- **About** — Project write-up, tech stack, share buttons, and contact info

## Interactive Features

All edits are stored in `localStorage` and can be exported as JSON or CSV.

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
- Identity is persisted in `localStorage` — sign in once, then interact freely
- All submissions are tagged with the user's name and email
- Sign out anytime from the header

### Demo Enhancements
- **Interactive demo banner** — Dismissable banner guiding visitors to try the interactive features
- **Guided tour** — "Take a Tour" button walks through 6 key features step-by-step
- **Onboarding hints** — Subtle pulse animations on interactive elements for first-time visitors
- **Visitor counter** — View count displayed in the header
- **Share buttons** — Copy link, LinkedIn, and X/Twitter sharing on the About page
- **Email list popup** — After ~60 seconds, invites visitors to join the mailing list or visit bizzib.ai

### localStorage Keys

| Key | Contents |
|---|---|
| `demo_reviewer_identity` | `{ name, email, signedInAt }` |
| `demo_review_edits` | `{ [transaction_id]: { category?, note?, flagged? } }` |
| `demo_change_log` | `[ { timestamp, type, transaction_id?, user_name, user_email, ... } ]` |
| `demo_custom_categories` | `[ "snake_case_key", ... ]` |
| `demo_general_feedback` | `[ { timestamp, page, text, user_name, user_email } ]` |
| `demo_banner_dismissed` | `"true"` if banner dismissed |
| `demo_hints_seen` | `"true"` after onboarding hints expire |
| `demo_email_popup_dismissed` | `"true"` if popup dismissed or submitted |
| `demo_email_signups` | `[ { name, email, timestamp } ]` |
| `demo_visitor_id` | Unique visitor ID |
| `demo_visit_count` | Raw visit count |

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
┌──────────────────────┐
│   React Dashboard     │  ← Interactive review, editing,
│   (this app)          │    and export
└──────────────────────┘
```

## Differences from Production Dashboard

| Feature | Production (EHAS) | Demo |
|---|---|---|
| Data | Real financial data (1,310 txns) | Anonymized sample data (~1,165 txns) |
| Access control | Password-protected | Open viewing; identity prompt on interaction |
| Identity | Single user (Eric) | Name + email collected per visitor |
| Submissions | Edits attributed to session | Edits tagged with user name/email |
| Onboarding | None (Eric knows the tool) | Banner, guided tour, pulse hints |
| Marketing | None | Email list popup, share buttons, bizzib.ai links |

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Data

The demo uses **anonymized sample data** with realistic transaction patterns. The data generation script creates ~1,165 fake transactions across multiple accounts with proper category distributions and transfer pairs.

## License

MIT
