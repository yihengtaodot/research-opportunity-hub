#!/usr/bin/env node
// Validate data/opportunities.json against data/schema/opportunity.schema.json
// and data/taxonomy.json. Zero dependencies.
//
//   node scripts/validate.mjs                    # exit 1 if any error
//   node scripts/validate.mjs --today=2026-11-18 # fix "today" for the review list
//
// Errors fail the run. The "Needs human review" section never fails the run.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = rel => {
  try { return JSON.parse(readFileSync(join(root, rel), "utf8")); }
  catch (e) { console.error(`✗ Cannot read ${rel}: ${e.message}`); process.exit(1); }
};

const data = readJson("data/opportunities.json");
const taxonomy = readJson("data/taxonomy.json");
const schema = readJson("data/schema/opportunity.schema.json");

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const todayArg = process.argv.find(a => a.startsWith("--today="));
const today = todayArg ? todayArg.slice(8) : localIsoDate(new Date());

function localIsoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isIsoDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s; // rejects 2026-02-30
}
function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v === "number" && Number.isInteger(v) ? "integer" : typeof v;
}

// ---- Minimal JSON Schema interpreter (only the keywords our schema uses) ----
function check(value, s, where) {
  if (s.type) {
    const types = [].concat(s.type);
    const t = typeOf(value);
    if (!types.includes(t) && !(t === "integer" && types.includes("number"))) {
      return err(where, `expected ${types.join(" | ")}, got ${t}`);
    }
  }
  if (s.enum && !s.enum.includes(value)) err(where, `"${value}" not in [${s.enum.join(", ")}]`);
  if (typeof value === "string") {
    if (s.minLength && value.length < s.minLength) err(where, "must not be empty");
    if (s.pattern && !new RegExp(s.pattern).test(value)) err(where, `"${value}" does not match ${s.pattern}`);
    if (s.format === "date" && !isIsoDate(value)) err(where, `"${value}" is not a valid ISO date (YYYY-MM-DD)`);
  }
  if (Array.isArray(value)) {
    if (s.minItems && value.length < s.minItems) err(where, `needs at least ${s.minItems} item(s)`);
    if (s.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) err(where, "has duplicate items");
    if (s.items) value.forEach((v, i) => check(v, s.items, `${where}[${i}]`));
  }
  if (typeOf(value) === "object") {
    for (const k of s.required || []) if (!(k in value)) err(where, `missing required field "${k}"`);
    for (const [k, v] of Object.entries(value)) {
      if (s.properties && s.properties[k]) check(v, s.properties[k], `${where}.${k}`);
      else if (s.additionalProperties === false) err(where, `unknown field "${k}"`);
    }
  }
}

// ---- Taxonomy self-check ----
const vocab = {
  type: taxonomy.opportunity_types,
  majors: taxonomy.majors,
  research_areas: (taxonomy.research_areas || []).map(a => a.name),
  dept: taxonomy.departments,
};
for (const [k, list] of Object.entries(vocab)) {
  if (!Array.isArray(list) || !list.length) { err("taxonomy", `"${k}" list is missing or empty`); continue; }
  const dup = list.filter((v, i) => list.indexOf(v) !== i);
  if (dup.length) err("taxonomy", `duplicate ${k}: ${dup.join(", ")}`);
}
const interestIds = new Set();
for (const it of taxonomy.interests || []) {
  const w = `taxonomy.interests[${it.id ?? "?"}]`;
  if (!it.id || !it.label) err(w, "needs id and label");
  if (interestIds.has(it.id)) err(w, "duplicate id");
  interestIds.add(it.id);
  for (const m of it.majors || []) if (!vocab.majors.includes(m)) err(w, `major "${m}" not in taxonomy.majors`);
  for (const a of it.research_areas || []) if (!vocab.research_areas.includes(a)) err(w, `area "${a}" not in taxonomy.research_areas`);
  if (!(it.majors || []).length && !(it.research_areas || []).length) err(w, "maps to no majors or areas");
}

// ---- Meta ----
const meta = data.meta || {};
if (!data.meta) err("meta", "missing");
if (!meta.schema_version) err("meta", "missing schema_version");
if (!isIsoDate(meta.updated_at)) err("meta", "updated_at must be an ISO date");
if (!Array.isArray(data.opportunities)) {
  console.error("✗ opportunities must be an array");
  process.exit(1);
}
if (meta.entries !== undefined && meta.entries !== data.opportunities.length) {
  err("meta", `entries is ${meta.entries} but there are ${data.opportunities.length} opportunities`);
}

// ---- Each opportunity ----
const seen = new Set();
data.opportunities.forEach((o, i) => {
  const w = `opportunities[${i}]${o && o.id ? " (" + o.id + ")" : ""}`;
  check(o, schema, w);
  if (typeOf(o) !== "object") return;

  if (seen.has(o.id)) err(w, `duplicate id "${o.id}"`);
  seen.add(o.id);

  if (o.type !== undefined && !vocab.type.includes(o.type)) err(w, `type "${o.type}" not in taxonomy.opportunity_types`);
  if (o.dept !== undefined && !vocab.dept.includes(o.dept)) err(w, `dept "${o.dept}" not in taxonomy.departments`);
  for (const m of Array.isArray(o.majors) ? o.majors : []) if (!vocab.majors.includes(m)) err(w, `major "${m}" not in taxonomy.majors`);
  for (const a of Array.isArray(o.research_areas) ? o.research_areas : []) if (!vocab.research_areas.includes(a)) err(w, `research area "${a}" not in taxonomy.research_areas`);

  // status <-> deadline_type <-> deadline
  const dt = o.deadline_type;
  if ((dt === "closed") !== (o.status === "closed")) err(w, `status "${o.status}" conflicts with deadline_type "${dt}"`);
  if ((dt === "fixed" || dt === "estimated") && o.deadline === null) err(w, `deadline_type "${dt}" needs a deadline date`);
  if (dt === "rolling" && o.deadline !== null) err(w, `deadline_type "rolling" must have deadline null`);
});

// ---- Needs human review (does not fail the run) ----
const ops = data.opportunities.filter(o => o && typeof o === "object");
const estimated = ops.filter(o => o.deadline_type === "estimated");
const pastOpen = ops.filter(o => o.status !== "closed" && isIsoDate(o.deadline) && o.deadline < today);
const used = {
  type: new Set(ops.map(o => o.type)),
  majors: new Set(ops.flatMap(o => o.majors || [])),
  research_areas: new Set(ops.flatMap(o => o.research_areas || [])),
  dept: new Set(ops.map(o => o.dept)),
};

report();

function report() {
  const n = data.opportunities.length;
  if (errors.length) {
    console.error(`✗ ${errors.length} error(s) in ${n} opportunities:`);
    errors.forEach(e => console.error("  - " + e));
  } else {
    console.log(`✓ ${n} opportunities valid (schema ${meta.schema_version}, taxonomy ${taxonomy.taxonomy_version})`);
  }
  console.log(`\nNeeds human review (today = ${today}):`);
  console.log(`  Estimated deadlines (${estimated.length}):`);
  estimated.forEach(o => console.log(`    - ${o.id}  ${o.deadline}  ${o.source}`));
  console.log(`  Deadline passed but not closed (${pastOpen.length}):`);
  pastOpen.forEach(o => console.log(`    - ${o.id}  ${o.deadline}  ${o.source}`));
  const unused = Object.entries(vocab)
    .map(([k, list]) => [k, (list || []).filter(v => !used[k].has(v))])
    .filter(([, l]) => l.length);
  if (unused.length) {
    console.log("  Taxonomy values no listing uses (hidden on the page):");
    unused.forEach(([k, l]) => console.log(`    - ${k}: ${l.join(", ")}`));
  }
  process.exit(errors.length ? 1 : 0);
}
