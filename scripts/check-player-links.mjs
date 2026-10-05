// Verifies that every card in the lobby points at a page the player actually
// serves. A card that links to a 404 is worse than a card that is missing: the
// reader clicks it.
//
//   npm run check:links            # slugs from the committed snapshot
//   npm run check:links -- --live  # slugs from the live catalog
//
// Redirects are NOT followed: /<slug> is the canonical form, so a 308 here means
// the lobby is linking the wrong shape and costing every reader a round trip.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");
const CONCURRENCY = 6;
const TIMEOUT_MS = 10_000;

const PLAYER_BASE = (
  process.env.NEXT_PUBLIC_PLAYER_BASE_URL?.trim() || "https://www.faraday-player.com"
).replace(/\/+$/, "");
const ACADEMY_BASE = (
  process.env.ACADEMY_PUBLIC_BASE?.trim() ||
  "https://ycadmmngkdhvpcsrcuaq.supabase.co/functions/v1/academy-public"
).replace(/\/+$/, "");

async function slugs() {
  if (!LIVE) {
    const snapshot = JSON.parse(
      readFileSync(join(ROOT, "seed/academy-catalog.snapshot.json"), "utf8"),
    );
    return { source: "seed/academy-catalog.snapshot.json", list: snapshot.courses.map((c) => c.slug) };
  }
  const url = `${ACADEMY_BASE}/catalog`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
  const catalog = await res.json();
  return { source: url, list: catalog.courses.map((c) => c.slug) };
}

async function probe(url) {
  // HEAD first — it is cheap and the player answers it. Some hosts reject HEAD
  // outright, so 405/501 escalates to GET rather than counting as a failure.
  for (const method of ["HEAD", "GET"]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: "text/html" },
      });
      if (method === "HEAD" && (res.status === 405 || res.status === 501)) continue;
      return { status: res.status, location: res.headers.get("location"), method };
    } catch (err) {
      if (method === "GET") {
        return { status: 0, error: err.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : err.message };
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return { status: 0, error: "unreachable" };
}

const { source, list } = await slugs();
if (list.length === 0) {
  console.error(`No slugs found in ${source}.`);
  process.exit(1);
}

const queue = [...list];
const failures = [];
let checked = 0;

async function worker() {
  for (let slug = queue.shift(); slug !== undefined; slug = queue.shift()) {
    const url = `${PLAYER_BASE}/${encodeURIComponent(slug)}`;
    const result = await probe(url);
    checked += 1;
    if (result.status !== 200) {
      failures.push({ slug, url, ...result });
    }
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker));

console.log(`Checked ${checked} player links from ${source} against ${PLAYER_BASE}.`);
if (failures.length === 0) {
  console.log("All links returned 200 with no redirect.");
  process.exit(0);
}

// Every failure is named. A slug that 404s is reported, never hidden.
console.error(`\n${failures.length} link(s) did not return 200:`);
for (const f of failures.sort((a, b) => a.slug.localeCompare(b.slug))) {
  const detail = f.error
    ? f.error
    : `${f.status}${f.location ? ` → ${f.location}` : ""} (${f.method})`;
  console.error(`  ${f.slug}  ${detail}`);
  console.error(`    ${f.url}`);
}
process.exit(1);
