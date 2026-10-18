#!/usr/bin/env node
// Flip Card validator (v0), scripted and deterministic. No LLM in the loop.
//
// Builds one SQL statement that checks staged card files against the lesson
// text the Academy player actually serves (academy-public /course/<slug>).
// Run the printed SQL with any Postgres client that has the `http` extension
// (the Supabase project does). Every row returned is a finding; zero rows = pass.
//
// Usage:
//   node scripts/flipcards/build-validate-query.mjs <card-file.json> [...more]
//   node scripts/flipcards/build-validate-query.mjs --batch <dir>
//
// Per-card checks: exactly 4 options keyed A-D; correct_key in A-D; 4 non-empty
// rationales keyed A-D; non-empty question and wrong_choice_note; status=draft;
// source_excerpt is an exact substring of the lesson body after whitespace
// normalisation; no option is a substring of the question; tone lint (no em
// dash, no "not X, but Y").
// Batch checks (run whenever more than one lesson is passed): no duplicate
// questions; no correct letter on more than ceil(n/4) cards; card_index 1..n
// per lesson with no gaps.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const COURSE_BASE = "https://ycadmmngkdhvpcsrcuaq.supabase.co/functions/v1/academy-public/course/";

function load(paths) {
  return paths.flatMap((p) => JSON.parse(readFileSync(p, "utf8")));
}

let args = process.argv.slice(2);
// --remote-only: emit only the checks that need the served lesson text, with a
// payload trimmed to the fields they read. Pair it with validate-local.mjs,
// which runs every other check without a network.
const remoteOnly = args[0] === "--remote-only";
if (remoteOnly) args = args.slice(1);
let files = args;
if (args[0] === "--batch") {
  files = readdirSync(args[1]).filter((f) => f.endsWith(".json")).sort().map((f) => join(args[1], f));
}
if (files.length === 0) {
  console.error("usage: build-validate-query.mjs <card-file.json>... | --batch <dir>");
  process.exit(2);
}
const cards = load(files);
const courses = [...new Set(cards.map((c) => c.course_slug))];
if (courses.length !== 1) throw new Error(`expected one course, got ${courses.join(", ")}`);
const json = JSON.stringify(remoteOnly
  ? cards.map(({ lesson_slug, card_index, lesson_id, source_excerpt }) =>
      ({ lesson_slug, card_index, lesson_id, source_excerpt }))
  : cards);
if (json.includes("$cards$")) throw new Error("card text contains the SQL quote tag");

const REMOTE_CHECKS = `
  select c.slug, c.idx, 'lesson_id not found in served course' finding from cards c
   where not exists (select 1 from bodies b where b.lesson_id = c.card->>'lesson_id')
  union all
  select c.slug, c.idx, 'source_excerpt is not an exact substring of the lesson body' from cards c
   join bodies b on b.lesson_id = c.card->>'lesson_id'
   where btrim(regexp_replace(coalesce(c.card->>'source_excerpt',''), '\\s+', ' ', 'g')) = ''
      or strpos(b.body, btrim(regexp_replace(c.card->>'source_excerpt', '\\s+', ' ', 'g'))) = 0`;

const LOCAL_CHECKS = `
  select slug, idx, 'options must be exactly A,B,C,D' finding from cards
   where jsonb_typeof(card->'options') is distinct from 'object'
      or (select string_agg(k, ',' order by k) from jsonb_object_keys(card->'options') k) is distinct from 'A,B,C,D'
  union all
  select slug, idx, 'option '||k||' is empty' from cards, jsonb_each_text(card->'options') o(k,v)
   where jsonb_typeof(card->'options') = 'object' and btrim(v) = ''
  union all
  select slug, idx, 'correct_key is not one of A-D' from cards
   where coalesce(card->>'correct_key','') not in ('A','B','C','D')
  union all
  select slug, idx, 'rationales must be exactly A,B,C,D' from cards
   where jsonb_typeof(card->'rationales') is distinct from 'object'
      or (select string_agg(k, ',' order by k) from jsonb_object_keys(card->'rationales') k) is distinct from 'A,B,C,D'
  union all
  select slug, idx, 'rationale '||k||' is empty' from cards, jsonb_each_text(card->'rationales') o(k,v)
   where jsonb_typeof(card->'rationales') = 'object' and btrim(v) = ''
  union all
  select slug, idx, 'question is empty' from cards where btrim(coalesce(card->>'question','')) = ''
  union all
  select slug, idx, 'wrong_choice_note is empty' from cards where btrim(coalesce(card->>'wrong_choice_note','')) = ''
  union all
  select slug, idx, 'status must be draft' from cards where card->>'status' is distinct from 'draft'
  union all
  select slug, idx, 'option '||k||' is a substring of the question' from cards, jsonb_each_text(card->'options') o(k,v)
   where jsonb_typeof(card->'options') = 'object' and btrim(v) <> ''
     and strpos(lower(card->>'question'), lower(btrim(v))) > 0
  union all
  select slug, idx, 'tone: em dash in '||fld from cards,
   lateral (values ('question', card->>'question'), ('wrong_choice_note', card->>'wrong_choice_note')) t(fld, txt)
   where txt like '%—%'
  union all
  select slug, idx, 'tone: em dash in '||kind||' '||k from cards,
   lateral (select 'option' kind, k, v from jsonb_each_text(card->'options') o(k,v)
            union all select 'rationale', k, v from jsonb_each_text(card->'rationales') r(k,v)) t
   where v like '%—%'
  union all
  select slug, idx, 'tone: "not X, but Y" construction in '||fld from cards,
   lateral (select 'question' fld, card->>'question' txt
            union all select 'wrong_choice_note', card->>'wrong_choice_note'
            union all select 'option '||k, v from jsonb_each_text(card->'options') o(k,v)
            union all select 'rationale '||k, v from jsonb_each_text(card->'rationales') r(k,v)) t
   where txt ~* '\\mnot\\M[^.;:]{1,80},\\s*but\\M'
  union all
  select min(slug), null, 'duplicate question in batch: '||left(q, 80)
   from (select slug, lower(btrim(regexp_replace(card->>'question','\\s+',' ','g'))) q from cards) d
   group by q having count(*) > 1
  union all
  select null, null, 'correct letter '||k||' used '||n||' times (cap '||cap||')'
   from (select card->>'correct_key' k, count(*) n, ceil((select count(*) from cards)/4.0)::int cap
          from cards group by 1) x
   where (select count(distinct slug) from cards) > 1 and n > cap
  union all
  select slug, null, 'card_index must run 1..'||count(*)||' with no gaps'
   from cards group by slug
   having array_agg(idx::int order by idx::int) <> array(select generate_series(1, count(*)::int))`;

const sql = `
with cards as (
  select c as card, c->>'lesson_slug' slug, (c->>'card_index') idx
  from jsonb_array_elements($cards$${json}$cards$::jsonb) c
),
course as (
  select content::jsonb j from extensions.http_get('${COURSE_BASE}${courses[0]}')
),
bodies as (
  select l->>'id' lesson_id,
         btrim(regexp_replace(array_to_string(array(select jsonb_array_elements_text(l->'paragraphs')), ' '), '\\s+', ' ', 'g')) body
  from course, jsonb_array_elements(j->'modules') m, jsonb_array_elements(m->'lessons') l
),
f as (
${remoteOnly ? REMOTE_CHECKS : REMOTE_CHECKS + "\n  union all\n" + LOCAL_CHECKS}
)
select slug as lesson_slug, idx as card_index, finding from f order by 1 nulls first, 2, 3;
`;
process.stdout.write(sql.trim() + "\n");
