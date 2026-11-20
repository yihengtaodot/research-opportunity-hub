// hub-form — submission backend for the Research Opportunity Hub.
//
// The Hub is a static GitHub Pages site. Its Suggest / Report forms POST
// here instead of redirecting visitors to GitHub. This Worker validates
// the submission and files it as an issue in the repo, using a fine-grained
// GitHub token stored as the GH_TOKEN secret (Issues: read and write, this
// repo only). The token never appears in the page or in this repository.
//
// Deploy: see worker/README.md.

const REPO = "yihengtaodot/research-opportunity-hub";
const ALLOWED_ORIGINS = [
  "https://yihengtaodot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function clean(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function compose(p) {
  let title, lines;
  if (p.kind === "suggest") {
    title = "[Suggestion] " + p.name;
    lines = [
      "**Opportunity name:** " + p.name,
      "**Host lab / program / department:** " + p.org,
      "**Official page:** " + p.link,
      "**Application deadline:** " + (p.deadline || "—"),
      "**Notes:** " + (p.notes || "—"),
    ];
  } else {
    title = "[Update] " + p.listing;
    lines = [
      "**Listing:** " + p.listing,
      "**What needs updating:** " + p.issue,
      "**Correct link:** " + (p.link || "—"),
    ];
  }
  return {
    title,
    body: lines.join("\n") + "\n\n---\nSubmitted via the Research Opportunity Hub form.",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return json({ error: "Request body must be JSON" }, 400, cors);
    }

    // Honeypot: the form carries a hidden "company" field that humans
    // never see or fill. If it has a value, it's a bot — accept silently
    // and file nothing.
    if (clean(raw.company, 200)) return json({ ok: true }, 200, cors);

    const kind = raw.kind === "suggest" ? "suggest" : "report";
    const p =
      kind === "suggest"
        ? {
            kind,
            name: clean(raw.name, 200),
            org: clean(raw.org, 200),
            link: clean(raw.link, 500),
            deadline: clean(raw.deadline, 100),
            notes: clean(raw.notes, 5000),
          }
        : {
            kind,
            listing: clean(raw.listing, 200),
            issue: clean(raw.issue, 5000),
            link: clean(raw.link, 500),
          };

    const missing =
      kind === "suggest"
        ? !p.name || !p.org || !p.link
        : !p.listing || !p.issue;
    if (missing) return json({ error: "Required fields are missing" }, 400, cors);
    const link = kind === "suggest" ? p.link : p.link;
    if (link && !/^https?:\/\//i.test(link))
      return json({ error: "Links must start with http:// or https://" }, 400, cors);

    const { title, body } = compose(p);
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "hub-form-worker",
      },
      body: JSON.stringify({ title, body }),
    });
    if (!res.ok)
      return json({ error: "GitHub could not accept the issue" }, 502, cors);

    const issue = await res.json();
    return json({ ok: true, number: issue.number, url: issue.html_url }, 200, cors);
  },
};
