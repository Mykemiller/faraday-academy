#!/usr/bin/env node
// Flip Card validator (v0), local half. Deterministic, no LLM, no network.
// Same rules as build-validate-query.mjs except the one check that needs the
// served lesson text (source_excerpt substring), which build-validate-query.mjs
// --remote-only emits as SQL. It also enforces the schema's 1-2 sentence limit
// on rationales, which the SQL version does not. Prints one finding per line; exit 1 if any.
//
// Usage: node scripts/flipcards/validate-local.mjs <card-file.json>... | --batch <dir>
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const KEYS = ["A", "B", "C", "D"];
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const NOT_BUT = /\bnot\b[^.;:]{1,80},\s*but\b/i;
// Sentence ends: a terminator followed by a capitalised word or end of text,
// skipping initialisms such as "U.S." so they are not counted as two.
const SENTENCE_END = /(?<![A-Z])[.!?](?=\s+["'\u201c]?[A-Z0-9]|\s*$)/g;
export const sentenceCount = (s) => (String(s ?? "").trim().match(SENTENCE_END) || []).length || 1;

export function validateCards(cards, { batch = false } = {}) {
  const out = [];
  const add = (c, msg) => out.push(`${c?.lesson_slug ?? "-"}\t${c?.card_index ?? "-"}\t${msg}`);
  for (const c of cards) {
    const opts = c.options, rats = c.rationales;
    const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
    if (!isObj(opts) || Object.keys(opts).sort().join() !== KEYS.join()) add(c, "options must be exactly A,B,C,D");
    if (!KEYS.includes(c.correct_key)) add(c, "correct_key is not one of A-D");
    if (!isObj(rats) || Object.keys(rats).sort().join() !== KEYS.join()) add(c, "rationales must be exactly A,B,C,D");
    for (const [k, v] of Object.entries(isObj(opts) ? opts : {})) if (!norm(v)) add(c, `option ${k} is empty`);
    for (const [k, v] of Object.entries(isObj(rats) ? rats : {})) {
      if (!norm(v)) add(c, `rationale ${k} is empty`);
      else if (sentenceCount(v) > 2) add(c, `rationale ${k} is ${sentenceCount(v)} sentences (max 2)`);
    }
    if (!norm(c.question)) add(c, "question is empty");
    if (!norm(c.wrong_choice_note)) add(c, "wrong_choice_note is empty");
    if (!norm(c.source_excerpt)) add(c, "source_excerpt is empty");
    if (c.status !== "draft") add(c, "status must be draft");
    const q = String(c.question ?? "").toLowerCase();
    for (const [k, v] of Object.entries(isObj(opts) ? opts : {})) {
      if (norm(v) && q.includes(norm(v).toLowerCase())) add(c, `option ${k} is a substring of the question`);
    }
    const texts = [["question", c.question], ["wrong_choice_note", c.wrong_choice_note],
      ...Object.entries(isObj(opts) ? opts : {}).map(([k, v]) => [`option ${k}`, v]),
      ...Object.entries(isObj(rats) ? rats : {}).map(([k, v]) => [`rationale ${k}`, v])];
    for (const [f, t] of texts) {
      if (String(t ?? "").includes("—")) add(c, `tone: em dash in ${f}`);
      if (NOT_BUT.test(String(t ?? ""))) add(c, `tone: "not X, but Y" construction in ${f}`);
    }
  }
  const bySlug = Map.groupBy(cards, (c) => c.lesson_slug);
  for (const [slug, cs] of bySlug) {
    const idx = cs.map((c) => c.card_index).sort((a, b) => a - b);
    if (idx.some((v, i) => v !== i + 1)) add({ lesson_slug: slug }, `card_index must run 1..${cs.length} with no gaps`);
  }
  const seen = new Map();
  for (const c of cards) {
    const q = norm(c.question).toLowerCase();
    if (seen.has(q)) add(c, `duplicate question in batch (also ${seen.get(q)})`);
    else seen.set(q, `${c.lesson_slug}#${c.card_index}`);
  }
  if (batch && bySlug.size > 1) {
    const cap = Math.ceil(cards.length / 4);
    for (const k of KEYS) {
      const n = cards.filter((c) => c.correct_key === k).length;
      if (n > cap) add(null, `correct letter ${k} used ${n} times (cap ${cap})`);
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const batch = args[0] === "--batch";
  const files = batch
    ? readdirSync(args[1]).filter((f) => f.endsWith(".json")).sort().map((f) => join(args[1], f))
    : args;
  const cards = files.flatMap((p) => JSON.parse(readFileSync(p, "utf8")));
  const findings = validateCards(cards, { batch });
  for (const f of findings) console.log(f);
  console.error(`${cards.length} cards, ${findings.length} findings`);
  process.exit(findings.length ? 1 : 0);
}
