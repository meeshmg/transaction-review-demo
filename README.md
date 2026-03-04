# Transaction Review Dashboard

An interactive web dashboard for reviewing and categorizing financial transactions across multiple accounts for small business tax preparation.

**[Live Demo](https://transaction-review-demo.netlify.app)** *(uses anonymized sample data)*

## Overview

Small business owners often have transactions spread across many accounts — business checking, savings, credit cards, Venmo, store credit accounts — and need to consolidate everything into a single view, categorize transactions for tax purposes, and verify that inter-account transfers aren't being double-counted as income.

This project automates that entire workflow, from raw data ingestion through to an interactive review dashboard.

### What it does

1. **Multi-source data ingestion** — Processes CSV exports, HTML statements, and PDF statements from 11+ accounts into a unified format
2. **Automated categorization** — Rules engine with 3 layers (regex pattern matching, Venmo counterparty/note matching, account-level defaults) categorizes transactions into tax categories
3. **Transfer detection & pairing** — Identifies inter-account transfers and pairs debits with credits across accounts to prevent double-counting
4. **Interactive review dashboard** — React web app for drilling into every category, searching transactions, and verifying transfer pairs

### Tech Stack

| Layer | Technology |
|---|---|
| Data pipeline | Python, pandas |
| PDF parsing | pdftotext (poppler) + regex |
| HTML parsing | Regex-based extraction |
| Dashboard | React 19, Vite, TailwindCSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Netlify |

## Dashboard Views

- **Summary** — KPI cards, account balances, expense breakdown charts, full tax category table
- **Category Review** — Filter by tax category, full-text search, expandable transaction list
- **Excluded Transactions** — Review everything marked "Not Business" or "Transfer"
- **Transfer Pairs** — Matched pairs shown chronologically with expandable detail, plus unpaired transfers

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
│   React Dashboard     │  ← Interactive review & verification
│   (this app)          │
└──────────────────────┘
```

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
