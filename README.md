# Research Opportunity Hub

A central discovery platform for UC Berkeley undergraduate research opportunities — URAP, SURF, SUPERB, Haas Scholars, Rose Hills, fellowships, faculty labs, and more.

**Live demo:** https://yihengtaodot.github.io/research-opportunity-hub/ (public — no login required)

## Why this exists

Berkeley's research opportunities are scattered across departments, programs, faculty websites, and external databases. Students frequently discover an opportunity only after the deadline — or never hear about it at all. This hub is a **discovery layer, not a replacement** for official databases: one place to see what's out there, compare listings at a glance, and jump straight to the official application page.

Design principle: a student should be able to tell whether an opportunity is relevant to them **within seconds, without opening multiple pages**.

## Features

### Discovery
- **Full-text search** across titles, labs/organizations, departments, research areas, related majors, opportunity types, descriptions, and keywords. Every word you type must match (e.g. `summer biology`), in any order
- **Filters** — opportunity type, major, research area, hosting department/school, and deadline window (due in 7 days · due in 30 days · next 3 months · later · rolling). Filter options come from `data/taxonomy.json`; options no listing uses are hidden
- **Sort** by deadline urgency or recently added

### Visual deadline system
Deadlines are the most prominent element on every card, color-coded by urgency:

🔴 Due soon (≤ 14 days) · 🟠 Due in 15–30 days · 🟢 Upcoming (> 30 days) · ⚪ Rolling / ongoing · ⬜ Closed

Tiers count days from today, the same way as the sidebar deadline windows, so "Due in 30 days" always equals 🔴 + 🟠.

Results sort by urgency first, so the nearest deadlines always surface at the top.

### Opportunity cards
Each card shows everything needed to decide in seconds — no click required: opportunity name, deadline, research area, related majors, host department, eligibility, opportunity type, application status, and an **Apply** link to the official source.

### Detail view
Clicking a card opens a standardized detail modal: description, research responsibilities, application requirements and process, funding/compensation, location/format, eligibility, the official source link, and the last-verified date.

### Add to Google Calendar
One click on any listing with a future deadline opens a **pre-filled Google Calendar all-day event** (title, description, official source link). No login or API key needed. Listings whose deadline is a representative (prior-cycle) date are labelled **"(est.)"** on the card, and their calendar events carry a *"verify on the official page first"* warning.

### Community upkeep
- **Suggest an Opportunity** — submit a listing that's missing
- **Report an Update** — flag outdated information
- Submissions open a pre-filled **GitHub issue** in this repo (a free GitHub account is needed to post), so they land where maintainers can review and act on them (no silent black hole). Forms deliberately collect no email address — issues in this public repo are visible to everyone
- Every listing shows its **last-verified date**

## Project structure

```
research-opportunity-hub/
├── index.html                       # The page: HTML + CSS + JS, no build step. Loads the data below at runtime
├── data/
│   ├── opportunities.json           # The dataset — the single source of truth
│   ├── taxonomy.json                # Allowed values: types, majors, research areas, departments, interests
│   └── schema/
│       └── opportunity.schema.json  # JSON Schema for one listing
├── scripts/
│   └── validate.mjs                 # Data validator (Node, no dependencies)
├── docs/
│   ├── ROADMAP.md
│   └── P0_TEST_CHECKLIST.md         # Manual test steps for the P0 fixes
├── README.md
└── .gitignore
```

## Run it locally

The page loads its data with `fetch`, which browsers block for `file://` pages, so serve the folder over HTTP:

```bash
cd research-opportunity-hub
python3 -m http.server 8000
# open http://localhost:8000/
```

Opening `index.html` directly shows a "Couldn't load opportunities" message with this hint. GitHub Pages serves over HTTPS, so the live demo needs nothing extra.

## Data

All listings live in [`data/opportunities.json`](data/opportunities.json) (`{ meta, opportunities }`). `index.html` has no copy of the data. Field names are snake_case and match the planned Postgres columns (P1); [`data/schema/opportunity.schema.json`](data/schema/opportunity.schema.json) documents every field.

Key fields:

| Field | Meaning |
|---|---|
| `id` | Stable slug, unique. Used in shareable links (`#listing-<id>`) |
| `type`, `majors`, `research_areas`, `dept` | Must use values from `data/taxonomy.json` |
| `status` | `open` or `closed` |
| `deadline` | ISO date (`YYYY-MM-DD`) or `null` |
| `deadline_type` | `fixed` (confirmed) · `estimated` (representative / prior-cycle date, shown as "(est.)") · `rolling` (no fixed deadline, `deadline` is `null`) · `closed` (must match `status: closed`) |
| `source` | Official page. Must be `https://` |
| `verified_at` | ISO date the listing was last checked against its source |
| `added_at` | ISO date added; drives "Recently added" sort |

"Open to All Majors" is a wildcard: those listings match every major and interest filter.

> **Data honesty notice.** The 7 listings added in October 2026 were checked against official program pages, and several of their deadlines are confirmed postings (e.g. DOE SULI — Jan 6, 2027; IGS Percy Grant — Nov 29, 2026). Listings with `deadline_type: "estimated"` carry representative dates rather than verified ones. The `added_at` dates of existing listings are synthetic (see `meta.added_at_note`). Always confirm details on the linked official page before applying.

### Add a listing

1. Copy an existing entry in `data/opportunities.json` and give it a new, unique `id` (lowercase, hyphens).
2. Fill every field. Use `""` for unknown text fields, never omit them.
3. Set `status` / `deadline` / `deadline_type` together (see the table above).
4. Set `verified_at` and `added_at` to today (`YYYY-MM-DD`).
5. If you need a new type, major, research area or department, add it to `data/taxonomy.json` first (an area also needs an emoji). To make a new value reachable from the "What are you interested in?" buttons, add it to an interest's `majors` or `research_areas`.
6. Update `meta.entries` and `meta.updated_at`.
7. Run the validator (below) and check the page locally.

### Validate the data

```bash
node scripts/validate.mjs
```

Requires Node 18+, no `npm install`. Exits with code 1 and lists every problem if any check fails: missing or unknown fields, values not in the taxonomy, bad dates, duplicate ids, non-https sources, `status` / `deadline_type` / `deadline` conflicts. It also prints a **Needs human review** list (estimated deadlines, past deadlines not marked closed, taxonomy values no listing uses) that does not fail the run. Use `--today=YYYY-MM-DD` to check against another date.

## Tech

Vanilla HTML + CSS + JavaScript. Zero runtime dependencies, zero build tooling — one page plus JSON data files, so anyone can open, audit, and extend it.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).
