# P0 manual test checklist

Branch `p0-data-schema`. Expected results below assume the current 18-listing dataset and a test date of **2026-11-18**; where results depend on the date, the check also says how to judge them on any day.

## Setup

```bash
node scripts/validate.mjs          # expect "✓ 18 opportunities valid", exit code 0
python3 -m http.server 8000        # then open http://localhost:8000/
```

Use a private window (or hard refresh) so no old cached copy of the page is used.

## C1 — Closing the detail modal clears the link

| # | Steps | Expected |
|---|---|---|
| 1 | Click **View Details** on any card | Modal opens; URL ends with `#listing-<id>` |
| 2 | Click **✕** | Modal closes; `#listing-…` is gone from the URL |
| 3 | Refresh the page | Modal does **not** reopen |
| 4 | Repeat 1–3, closing by clicking the dark background | Same as 2–3 |
| 5 | Repeat 1–3, closing with **Esc** | Same as 2–3 |
| 6 | Open `http://localhost:8000/#listing-surf-2027` | SURF detail opens directly (shareable links still work) |
| 7 | Open a detail, press the browser **Back** button | Modal closes |

## C2 — Research areas with no listings are hidden

| # | Steps | Expected |
|---|---|---|
| 1 | Open the **Research area** dropdown | 13 areas. Climate / Environment, Economics, Social Science, Humanities, Neuroscience, Genetics are **not** listed |
| 2 | Pick each area in turn | Every one shows at least 1 card |

## C3 — Psychology no longer returns only "Open to All Majors" listings

| # | Steps | Expected |
|---|---|---|
| 1 | Open the **Major** dropdown | Psychology is **not** listed (no listing names it) |
| 2 | Look at "What are you interested in?" | 6 buttons; **Psychology is not shown** |
| 3 | Click each interest button in turn (click again to turn off) | Each shows at least one listing that is **not** "Open to All Majors" |
| 4 | Pick Major **Engineering** | Engineering listings **plus** "Open to All Majors" listings (wildcard behaviour unchanged) |

## C4 — "Due in 30 days" and the color tiers use the same rule

Tiers: 🔴 Due Soon ≤ 14 days · 🟠 Due in 15–30 Days · 🟢 Upcoming > 30 days. Sidebar: Due in 7 days · Due in 30 days · Next 3 months · Later · Rolling.

| # | Steps | Expected |
|---|---|---|
| 1 | Read the legend and sidebar labels | Legend shows **🟠 Due in 15–30 Days**; sidebar shows **Due in 7 days** and **Due in 30 days** (no "this month" wording anywhere) |
| 2 | Sidebar: select **Due in 30 days** and note the count | On 2026-11-18: **1** (IGS Percy Grant, Nov 29) |
| 3 | Back to **All deadlines**; click legend 🔴, note count; click 🟠, note count | On 2026-11-18: 🔴 = 1 (Percy Grant), 🟠 = 0 |
| 4 | Compare | Count in step 2 = 🔴 + 🟠 from step 3, **on any day** |
| 5 | Check card badges | Red cards say ≤ 14 days left; orange cards say 15–30 days left |
| 6 | (Optional) Repeat between **Dec 7 and Dec 22, 2026** | DOE SULI (Jan 6) shows orange and is included in "Due in 30 days" |

## C5 — Search matches every word, in any order

| # | Steps | Expected |
|---|---|---|
| 1 | Search `summer biology` | **7** results (previously 0) |
| 2 | Search `biology summer` | The same 7 results |
| 3 | Search `summer`, note results; then `biology` | Step 1 results = listings in **both** |
| 4 | Search `summer zzzz` | 0 results and the "No opportunities match" message |
| 5 | Search `  data   science  ` (extra spaces) | Same results as `data science` |

## C6 — Empty "Other" type is hidden

| # | Steps | Expected |
|---|---|---|
| 1 | Look at **Opportunity type** in the sidebar | 6 checkboxes; **Other is not listed** |
| 2 | Tick each type in turn | Every one shows at least 1 card |
| 3 | Click hero quick filter **Fellowship** | Fellowship checkbox in the sidebar ticks too (sync still works) |

## Data loading

| # | Steps | Expected |
|---|---|---|
| 1 | DevTools → Network → throttle to "Slow 3G", reload | "Loading opportunities…" box shows until cards appear |
| 2 | DevTools → Network → right-click `opportunities.json` → **Block request URL**, reload | "Couldn't load opportunities" message, no cards, no broken filters |
| 3 | Open `index.html` by double-clicking it (`file://`) | Same message, with the `python3 -m http.server` hint |

## Regression (should match the pre-P0 page)

| # | Steps | Expected |
|---|---|---|
| 1 | Load the page, no filters | 18 opportunities, sorted by deadline urgency |
| 2 | Sort by **Recently added** | Biology Scholars Program first, URAP Fall 2026 last |
| 3 | Open any card's details | Same fields as before; "Last Verified" in `Oct 1, 2026` format |
| 4 | Estimated listings (e.g. SURF) | Badge shows **(est.)** |
| 5 | Closed / past-deadline listings (URAP Fall 2026, Power Lab, Cal-in-Sacramento) | ⚫ Closed badge, **Program page** button instead of Apply, no calendar button |
| 6 | **Add to Google Calendar** on a future listing | Opens Google Calendar with title, date, official link; estimated ones carry the "verify" warning |
| 7 | **Report an Update** in a detail view | Form opens with that listing preselected; Submit opens a GitHub issue draft |
| 8 | Narrow the window below 900 px | "Show filters ▾" toggle works |
| 9 | **Clear all filters** | Everything resets, including search and interest buttons |
