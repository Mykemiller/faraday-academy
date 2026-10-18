#!/usr/bin/env node
// Builds the INSERT that loads staged flip cards into lesson_checks as DRAFT rows.
//
// Targets public.lesson_checks as created by FDY-189 (migration
// 20261018020638). Cards join their lesson by lesson_id; a card that is already
// loaded is skipped, never overwritten. Status is forced to 'draft' here regardless of what the file says: moving a
// card to approved or published is a human publish gate, never this script.
//
// Usage: node scripts/flipcards/build-insert-query.mjs --batch content/flip-cards/<course-slug>
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const files = args[0] === "--batch"
  ? readdirSync(args[1]).filter((f) => f.endsWith(".json")).sort().map((f) => join(args[1], f))
  : args;
if (files.length === 0) {
  console.error("usage: build-insert-query.mjs <card-file.json>... | --batch <dir>");
  process.exit(2);
}
const cards = files.flatMap((p) => JSON.parse(readFileSync(p, "utf8")));
const json = JSON.stringify(cards);
if (json.includes("$cards$")) throw new Error("card text contains the SQL quote tag");

process.stdout.write(`insert into public.lesson_checks
  (lesson_id, lesson_slug, card_index, question, options, correct_key, rationales, wrong_choice_note, source_excerpt, status)
select (c->>'lesson_id')::uuid, c->>'lesson_slug', (c->>'card_index')::int, c->>'question', c->'options', c->>'correct_key',
       c->'rationales', c->>'wrong_choice_note', c->>'source_excerpt', 'draft'
from jsonb_array_elements($cards$${json}$cards$::jsonb) c
on conflict (lesson_id, card_index) do nothing;
`);
