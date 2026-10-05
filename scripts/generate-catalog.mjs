// Rewrites seed/academy-catalog.snapshot.json from the live academy-public
// catalog. The snapshot is the lobby's offline fallback, so it is committed and
// its rows are stored in the wire shape — the app re-validates it on load.
//
//   npm run catalog:generate
//
// Rows are sorted by slug and keys written in a fixed order so a regeneration
// produces a reviewable diff rather than a reshuffle.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "seed/academy-catalog.snapshot.json";

const BASE = (
  process.env.ACADEMY_PUBLIC_BASE?.trim() ||
  "https://ycadmmngkdhvpcsrcuaq.supabase.co/functions/v1/academy-public"
).replace(/\/+$/, "");

const LEVELS = new Set(["101", "201", "301", "401", "X", "Capstone"]);
const VOICES = new Set(["gil", "mach"]);
const PERSONAS = new Set([
  "Executive", "Engineer", "Investor", "Operator", "Policy", "Consultant",
]);

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v) => typeof v === "string" && v.trim().length > 0;

function normalise(raw) {
  if (!isObj(raw)) return { error: "row is not an object" };
  if (!str(raw.slug)) return { error: "slug missing" };
  if (!str(raw.title)) return { error: "title missing" };
  if (!LEVELS.has(raw.level)) return { error: `level ${JSON.stringify(raw.level)} unknown` };
  if (typeof raw.reading_minutes !== "number" || !(raw.reading_minutes > 0)) {
    return { error: "reading_minutes not a positive number" };
  }
  if (typeof raw.narrated !== "boolean") return { error: "narrated not a boolean" };

  let author = null;
  if (raw.author != null) {
    if (!isObj(raw.author) || !VOICES.has(raw.author.voice) || !str(raw.author.name)) {
      return { error: "author malformed" };
    }
    author = { voice: raw.author.voice, name: raw.author.name };
  }

  // Fixed key order — see the header note on reviewable diffs.
  const row = {
    slug: raw.slug,
    title: raw.title,
    level: raw.level,
    author,
    group: str(raw.group) ? raw.group : null,
    reading_minutes: raw.reading_minutes,
    narrated: raw.narrated,
  };
  if (raw.price_usd !== undefined) {
    row.price_usd = typeof raw.price_usd === "number" ? raw.price_usd : null;
  }
  if (raw.summary !== undefined) row.summary = str(raw.summary) ? raw.summary : null;
  if (Array.isArray(raw.personas)) {
    row.personas = raw.personas.filter((p) => PERSONAS.has(p));
  }
  return { row };
}

const url = `${BASE}/catalog`;
const res = await fetch(url, { headers: { Accept: "application/json" } });
if (!res.ok) {
  console.error(`GET ${url} returned ${res.status}. Snapshot left unchanged.`);
  process.exit(1);
}
const live = await res.json();
if (!isObj(live) || !isObj(live.beta) || typeof live.beta.free !== "boolean"
    || !Array.isArray(live.courses)) {
  console.error(`GET ${url} returned an unusable envelope. Snapshot left unchanged.`);
  process.exit(1);
}

const rows = [];
let dropped = 0;
for (const raw of live.courses) {
  const { row, error } = normalise(raw);
  if (error) {
    dropped += 1;
    console.warn(`dropped ${isObj(raw) && raw.slug ? raw.slug : "<unknown>"}: ${error}`);
    continue;
  }
  rows.push(row);
}
if (rows.length === 0) {
  console.error("live catalog yielded no valid rows. Snapshot left unchanged.");
  process.exit(1);
}
rows.sort((a, b) => a.slug.localeCompare(b.slug));

const snapshot = {
  generated_at: str(live.generated_at) ? live.generated_at : new Date(0).toISOString(),
  beta: { free: live.beta.free },
  courses: rows,
};

mkdirSync(dirname(join(ROOT, OUT)), { recursive: true });
writeFileSync(join(ROOT, OUT), JSON.stringify(snapshot, null, 2) + "\n");

// Deliberately no totals in any string the app will render; this is build output.
console.log(`Wrote ${OUT} from ${url} (generated_at ${snapshot.generated_at}).`);
console.log(`Rows written: ${rows.length}. Rows dropped: ${dropped}.`);
