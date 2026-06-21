// Deterministic catalog generator.
// Reads the real IDF data and derives the Faraday Academy course catalog.
//   - Descriptions are REAL (from the registries).
//   - Product attributes (level / programType / personas / duration / price) are DERIVED by rule,
//     DRAFT pending the FAR-149 editorial gate.
//   - Ratings are intentionally null (no fabricated metrics — spec §13.2).
// Outputs:
//   seed/courses.json            -> Course[] per the data contract (app fallback + tests)
//   seed/schools.json            -> the 23 Schools (reference)
//   seed/themes.json             -> the 7 Themes (reference)
//   .out/airtable-*.json         -> {fields:{fldId:value}}[] batches for seeding the Airtable base
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMAINS, SUBDOMAINS, THEMES, CLUSTER_BY_DOMAIN } from "./idf-data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_EPOCH = Date.parse("2026-06-15T00:00:00Z");

// Persona sets per cluster (the persona is a discovery lens, never a gate — spec §13.5).
const PERSONAS_BY_CLUSTER = {
  "Physical Stack": ["Engineer", "Operator", "Executive"],
  "Commercial & Capital": ["Investor", "Executive", "Consultant"],
  "Market & Policy": ["Policy", "Operator", "Consultant"],
  "Operations & Resilience": ["Operator", "Engineer", "Executive"],
  "Cross-Stack": ["Engineer", "Investor", "Executive"],
};
const uniq = (a) => [...new Set(a)];
const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const clip = (s, n = 160) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…");
const maturityFromType = (t) => (t === "Core" || t === "Established" ? "Established" : "Developing");
// spread updatedAt deterministically so "Recently Updated" sort is meaningful
const dateFor = (i) => new Date(SEED_EPOCH - (i % 75) * 86400000).toISOString();

const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const courses = [];
let i = 0;
const push = (c) => {
  courses.push({
    ...c,
    slug: slugify(c.title) + (c.programType === "Certification" ? "-certification" : ""),
    isFree: c.priceUSD === 0,
    isCertification: c.programType === "Certification",
    themes: c.themes ?? [],
    rating: null,
    ratingCount: null,
    thumbnailUrl: null,
    status: "Published",
    updatedAt: dateFor(i++),
  });
};

for (const d of DOMAINS) {
  const cluster = CLUSTER_BY_DOMAIN[d.id];
  const base = PERSONAS_BY_CLUSTER[cluster];
  const school = { id: d.id, name: d.shortName, cluster };

  // 1) Free 101 Primer — the onramp (FAR-165). Live now; paid catalog follows.
  push({
    id: `FA-${d.id}-101`,
    title: `${d.shortName} in 45 Minutes`,
    description: clip(d.thesis),
    school, level: "101", programType: "Primer",
    personas: uniq(["Executive", ...base]),
    durationMinutes: 45, priceUSD: 0,
    maturity: maturityFromType(d.type),
    themes: [],
    url: `https://faraday-intelligence.ai/academy/c/${slugify(d.shortName + " in 45 minutes")}`,
  });

  // 2) Sub-domain Courses — the real course grain.
  const subs = SUBDOMAINS.filter((s) => s.id.split(".")[0] === d.id);
  subs.forEach((s, idx) => {
    const advanced = idx % 2 === 1;
    let programType = "Course";
    if (d.id === "D8" || d.id === "D22") programType = "Know the Players";
    else if (["D18.1", "D23.1", "D23.3"].includes(s.id)) programType = "Case Study";
    const level = advanced ? "301" : "201";
    const priceUSD = programType === "Know the Players" ? 4.99 : 9.99;
    push({
      id: `FA-${s.id.replace(".", "-")}`,
      title: s.name,
      description: clip(s.desc),
      school, level, programType,
      personas: base,
      durationMinutes: level === "301" ? 120 : 75,
      priceUSD,
      maturity: s.candidate ? "Candidate" : maturityFromType(d.type),
      themes: s.themes,
      url: null,
    });
  });

  // 3) $99 Certification — the live-brief credential (FAR-145/158).
  push({
    id: `FA-${d.id}-CERT`,
    title: `Faraday ${d.shortName} Practitioner`,
    description: clip(`A live-brief credential: prove you can read real ${d.shortName} signals under deadline — not recite fixed content.`),
    school, level: "401", programType: "Certification",
    personas: uniq([...base, "Investor", "Consultant"]),
    durationMinutes: 180, priceUSD: 99,
    maturity: "Developing",
    themes: [],
    url: null,
  });
}

// 4) Theme Learning Paths (Tracks) — curated cross-domain collections (FAR-162).
for (const t of THEMES) {
  const d = domainById[t.primaryDomain];
  const cluster = CLUSTER_BY_DOMAIN[d.id];
  push({
    id: `FA-${t.id}-TRK`,
    title: `${t.name} (Learning Path)`,
    description: clip(`${t.tagline} ${t.thesis}`),
    school: { id: d.id, name: d.shortName, cluster },
    level: "X", programType: "Track",
    personas: uniq(["Executive", "Investor", "Consultant", ...PERSONAS_BY_CLUSTER[cluster]]),
    durationMinutes: 240, priceUSD: 9.99,
    maturity: "Developing",
    themes: [t.id],
    url: null,
  });
}

// ---- write seed files ----
const write = (p, data) => {
  mkdirSync(dirname(join(ROOT, p)), { recursive: true });
  writeFileSync(join(ROOT, p), JSON.stringify(data, null, 2) + "\n");
};

write("seed/courses.json", courses);
write("seed/schools.json", DOMAINS.map((d) => ({
  id: d.id, name: d.shortName, fullName: d.fullName,
  cluster: CLUSTER_BY_DOMAIN[d.id], coreThesis: d.thesis, domainType: d.type,
})));
write("seed/themes.json", THEMES);

// ---- write Airtable payload batches (field-ID keyed) ----
const F = {
  code: "fld6POIVjxBcybJd6", title: "fldodh8QcJw23GNNC", slug: "fldG3rdpVIuqOkOFv",
  desc: "fldBmIlIfcpZn0wBs", schoolId: "flduHlwi6c7a56zvp", schoolName: "fldUVXjNUOgMplGeB",
  cluster: "fld6NSgn8XqaTDYyX", level: "fldoOsIKgTVVr1fGu", programType: "fldZyTnKx9msxW8Kc",
  personas: "fld00yxDCbmg6V3uH", duration: "fldbz4K3E23k2uGLw", price: "fldqvno7vZMoLTbEM",
  isFree: "fldLf4H9UtSM35cpu", isCert: "fldfOdXPaKI8ZK9Xg", maturity: "fld1CYUdP0kw3cvpx",
  themes: "fldQYPtYf6wpddrg6", url: "fldilV0A166cGnJH6", status: "fldRkiSzc44JRDa8k",
  updatedAt: "fldOvhTetXVbRScqp",
};
const courseRecords = courses.map((c) => {
  const f = {
    [F.code]: c.id, [F.title]: c.title, [F.slug]: c.slug, [F.desc]: c.description,
    [F.schoolId]: c.school.id, [F.schoolName]: c.school.name, [F.cluster]: c.school.cluster,
    [F.level]: c.level, [F.programType]: c.programType, [F.personas]: c.personas,
    [F.duration]: c.durationMinutes, [F.price]: c.priceUSD, [F.maturity]: c.maturity,
    [F.status]: "Published", [F.updatedAt]: c.updatedAt.slice(0, 10),
  };
  if (c.themes.length) f[F.themes] = c.themes;
  if (c.isFree) f[F.isFree] = true;
  if (c.isCertification) f[F.isCert] = true;
  if (c.url) f[F.url] = c.url;
  return { fields: f };
});
const batches = (arr, n) => arr.reduce((a, _, k) => (k % n ? a : [...a, arr.slice(k, k + n)]), []);
batches(courseRecords, 50).forEach((b, k) => write(`.out/airtable-courses-${k + 1}.json`, b));

const SF = { id: "fldMljkH4kM7rRgoa", name: "fldKEvakwYpm25SYF", cluster: "fldaP1XCXTj4UgZbR", thesis: "fldm732w1mYg0Iw9X", type: "fldqlE0FdwKywTknY" };
write(".out/airtable-schools.json", DOMAINS.map((d) => ({ fields: {
  [SF.id]: d.id, [SF.name]: d.fullName, [SF.cluster]: CLUSTER_BY_DOMAIN[d.id], [SF.thesis]: d.thesis, [SF.type]: d.type,
} })));
const TF = { id: "fldublt5U6nLo6P1w", name: "fldjazux2VTQYonxV", tagline: "fldbd7SXDJmPcxKXA", thesis: "fldiYqePI1hhmN1qg", lifecycle: "fldZpNAas4PM5eoTV" };
write(".out/airtable-themes.json", THEMES.map((t) => ({ fields: {
  [TF.id]: t.id, [TF.name]: t.name, [TF.tagline]: t.tagline, [TF.thesis]: t.thesis, [TF.lifecycle]: t.lifecycle,
} })));

const counts = courses.reduce((a, c) => ((a[c.programType] = (a[c.programType] || 0) + 1), a), {});
console.log(`Generated ${courses.length} courses:`, counts);
console.log(`Free: ${courses.filter((c) => c.isFree).length} | Paid: ${courses.filter((c) => !c.isFree).length} | Certs: ${courses.filter((c) => c.isCertification).length}`);
