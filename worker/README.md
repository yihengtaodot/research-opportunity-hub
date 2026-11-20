# hub-form worker — in-page form submissions

The Hub's **Suggest an Opportunity** and **Report an Update** forms used to
redirect visitors to a pre-filled GitHub issue form. That meant every
reporter needed a GitHub account, signed-out visitors landed on a sign-in
page, and popup blockers could swallow the redirect entirely.

Now the forms submit **in-page**: `index.html` POSTs the fields to this
Cloudflare Worker, the Worker files the same `[Suggestion]` / `[Update]`
issue in this repo, and the visitor just sees a confirmation in the modal.
No redirect, no GitHub account needed. If the Worker is unreachable, the
form falls back to showing the classic pre-filled GitHub link, so a report
is never lost.

## Pieces

- `worker.js` — the Worker. Validates fields, drops honeypot submissions,
  composes the issue title/body, calls the GitHub API.
- `wrangler.toml` — Worker name/config for the Wrangler CLI (optional;
  dashboard deploy works too).
- The GitHub token is a **Worker secret** (`GH_TOKEN`). It is never in
  this repo or in the page.

## One-time setup (needs the repo owner's accounts)

1. **GitHub token** — GitHub → Settings → Developer settings →
   Personal access tokens → **Fine-grained tokens** → Generate new token:
   - Repository access: *Only select repositories* → `research-opportunity-hub`
   - Permissions: **Issues → Read and write** (nothing else)
   - Expiration: 1 year (put a renewal reminder on the calendar)
2. **Cloudflare Worker** — Cloudflare (free plan) → Workers & Pages →
   Create → Worker, name it `hub-form`, paste in `worker.js`, Deploy.
3. **Secret** — in the Worker: Settings → Variables and Secrets → Add →
   type *Secret*, name `GH_TOKEN`, value = the token from step 1.
4. **Connect the page** — copy the Worker's URL
   (`https://hub-form.<account>.workers.dev`) into `FORM_ENDPOINT` at the
   top of the forms section in `index.html`, then push `index.html`.
   Until that constant is set, the form keeps using the GitHub fallback,
   so the page can be pushed before the Worker exists.

## Notes

- Spam: a hidden honeypot field (`company`) catches naive bots; the
  Worker silently accepts and files nothing. If spam ever becomes real,
  add Cloudflare Turnstile to the form.
- Issue format is unchanged (`[Suggestion] …` / `[Update] …` titles, same
  body lines), so maintainer workflow and triage habits carry over.
- When this goes live, update the "Community upkeep" wording in the main
  `README.md`: submissions no longer "open a pre-filled GitHub issue" —
  they are sent in-page and posted as issues automatically; the
  no-personal-details warning still applies because issues are public.
