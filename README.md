# Research Opportunity Hub

A central discovery platform for UC Berkeley undergraduate research opportunities — URAP, SURF, SUPERB, Haas Scholars, Rose Hills, fellowships, faculty labs, and more.

**Live demo:** https://yihengtaodot.github.io/research-opportunity-hub/ (public — no login required)

## Why this exists

Berkeley's research opportunities are scattered across departments, programs, faculty websites, and external databases. Students frequently discover an opportunity only after the deadline — or never hear about it at all. This hub is a **discovery layer, not a replacement** for official databases: one place to see what's out there, compare listings at a glance, and jump straight to the official application page.

Design principle: a student should be able to tell whether an opportunity is relevant to them **within seconds, without opening multiple pages**.

## Features

### Discovery
- **Full-text search** across titles, labs/organizations, departments, research areas, related majors, opportunity types, descriptions, and keywords
- **Filters** — major, research area, hosting department/school, and deadline window (due this week · due this month · next 3 months · later · rolling)
- **Sort** by deadline urgency or recently added

### Visual deadline system
Deadlines are the most prominent element on every card, color-coded by urgency:

🔴 Due soon · 🟡 Due this month · 🟢 Upcoming · ⚪ Rolling / ongoing · ⬜ Closed

Results sort by urgency first, so the nearest deadlines always surface at the top.

### Opportunity cards
Each card shows everything needed to decide in seconds — no click required: opportunity name, deadline, research area, related majors, host department, eligibility, opportunity type, application status, and an **Apply** link to the official source.

### Detail view
Clicking a card opens a standardized detail modal: description, research responsibilities, application requirements and process, funding/compensation, location/format, eligibility, the official source link, and the last-verified date.

### Add to Google Calendar
One click on any listing with a future deadline opens a **pre-filled Google Calendar all-day event** (title, description, official source link). No login or API key needed. Events created from representative demo dates carry a *"verify on the official page first"* warning.

### Community upkeep
- **Suggest an Opportunity** — submit a listing that's missing
- **Report an Update** — flag outdated information
- Submissions open a pre-filled **GitHub issue** in this repo, so they land where maintainers can review and act on them (no silent black hole)
- Every listing shows its **last-verified date**

## Project structure

```
research-opportunity-hub/
├── index.html               # The interactive prototype — one self-contained file, no build step
├── README.md
├── data/
│   └── opportunities.json   # Demo dataset (v1), exported from the dataset embedded in index.html
├── docs/
│   └── ROADMAP.md           # Development phases
└── .gitignore
```

## Run it

Open `index.html` in any browser — no build step, no dependencies, works offline.
(Or enable GitHub Pages on this repo to host it.)

## Data

The page ships with a dataset of 18 Berkeley research opportunities. `data/opportunities.json` is the same dataset, exported for reference and for future backend work; `index.html` is the source of truth for the demo. Each entry carries: title, organization, type, deadline, eligibility, related majors, research area, department, description, responsibilities, requirements, application process, funding, location, source link, and verification date.

> **Data honesty notice.** The 7 listings added in October 2026 were checked against official program pages, and several of their deadlines are confirmed postings (e.g. DOE SULI — Jan 6, 2027; IGS Percy Grant — Nov 29, 2026). Several of the original prototype listings still carry representative dates rather than verified ones. Always confirm details on the linked official page before applying.

## Tech

Vanilla HTML + CSS + JavaScript. Zero dependencies, zero build tooling — the whole app is one self-contained file by design, so anyone can open, audit, and extend it.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).
