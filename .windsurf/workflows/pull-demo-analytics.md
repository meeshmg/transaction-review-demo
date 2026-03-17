---
description: How to pull and review demo dashboard analytics, signups, and visitor edits
---

# Pull Demo Analytics Workflow

Run this workflow periodically (or after sharing the demo link) to review visitor activity, capture email signups, and see what features people are using.

## Step 1: Pull analytics from server

// turbo
```bash
cd /Users/mgriffith/Desktop/transaction-review-demo && python3 scripts/pull_demo_analytics.py
```

This downloads all data from the live Netlify Functions and saves raw JSON to `data/exports/`.

## Step 2: Review the output

The script prints a summary with:

- **Dashboard Stats** — unique visitors, sessions, interactions, signups, identified users, tour completions
- **Feature Usage** — which actions visitors performed (category_change, note, flag, feedback, etc.)
- **Tab Views** — which tabs visitors looked at
- **Email Signups** — names and emails of people who signed up (these are real leads!)
- **Identified Users** — people who entered name/email to interact
- **Visitor Edits** — per-visitor breakdown of edits, feedback, and log entries

## Step 3: Process email signups

If there are new email signups:

1. Add them to your CRM / email list / contact spreadsheet
2. Consider sending a personalized follow-up if they also left feedback
3. Note which features they interacted with — use this in your outreach

## Step 4: Review feedback

If visitors left feedback (shown under "Visitor Edits"):

1. Read what they wrote — this is direct product feedback from potential clients
2. Consider whether any feedback suggests dashboard improvements
3. If feedback mentions a specific pain point, that's a sales opportunity

## Step 5: Check feature engagement

Look at the Feature Usage and Tab Views sections:

- **High tab_view counts on specific tabs** → those features resonate, emphasize them in marketing
- **Low or zero tour_complete** → the tour might need improvement or better visibility
- **High identity_submit** → people are willing to engage, the demo is compelling
- **Category changes, notes, flags** → people are actually trying the interactive features

## Step 6: Archive (optional)

The raw JSON files are saved to `data/exports/` with today's date:
- `demo_analytics_YYYY-MM-DD.json` — all sessions, events, signups, identities
- `demo_visitor_edits_YYYY-MM-DD.json` — all per-visitor edit data

These are gitignored. Keep them locally for trend analysis over time.

## Step 7: Update documentation (if making changes)

If you make any changes to the demo dashboard based on analytics or feedback:

1. Update `docs/CHANGELOG.md` with a new dated section describing what changed and why
2. Update `README.md` if features, architecture, or tech stack changed
3. Add a new post to `docs/blog/` if the change warrants a narrative write-up
4. Commit docs with the code change — never commit code without updating docs

## Cron Job Management

A macOS cron job runs `pull_demo_analytics.py` daily at 9am. Data lands in `data/exports/`.

**View current cron:**
```bash
crontab -l
```

**Disable the cron job:**
```bash
crontab -r
```

**Re-enable at a different time (e.g., 8am):**
```bash
echo "0 8 * * * /Users/mgriffith/miniconda3/bin/python3 /Users/mgriffith/Desktop/transaction-review-demo/scripts/pull_demo_analytics.py >> /Users/mgriffith/Desktop/transaction-review-demo/data/exports/cron.log 2>&1" | crontab -
```

**Check cron output:**
```bash
cat /Users/mgriffith/Desktop/transaction-review-demo/data/exports/cron.log
```

> Note: The cron job only runs when your Mac is on and awake at the scheduled time.

## Notes

- The pull script hits the **live** Netlify site at `https://transaction-review-demo.netlify.app`
- Data in Netlify Blobs is capped (5K sessions, 10K events, 1K visitors) to prevent storage issues
- If you need to reset the analytics (e.g., after testing), you can clear the Netlify Blobs from the Netlify dashboard under Site > Blobs
- Export files in `data/exports/` are gitignored — they stay local only
