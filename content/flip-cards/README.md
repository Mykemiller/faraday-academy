# Flip cards (staged drafts)

Draft flip-card checks for Academy lessons, one JSON file per lesson, grouped by
course slug. Every card here is `status: "draft"`. Nothing in this folder is
published, and nothing here is read by the player.

## Why the cards live here for now

Cards belong in the Supabase table `lesson_checks` (FDY-189). That table did not
exist when the pilot ran, so the orchestrator (FDY-190) staged the validated
drafts here instead of writing to the database. Once FDY-189 is Done:

```sh
node scripts/flipcards/build-insert-query.mjs --batch content/flip-cards/data-center-power-foundations
```

prints one INSERT that loads every card as a draft row. Reconcile its column
list with FDY-189's final DDL first.

## Schema (v0)

| field | meaning |
| --- | --- |
| `lesson_slug` | slugified lesson title (lessons carry no slug of their own) |
| `lesson_id`, `course_slug`, `module_position`, `lesson_position` | where the lesson lives in `academy-public /course/<slug>` |
| `card_index` | 1-based, per lesson |
| `question` | the prompt |
| `options` | exactly `A`–`D` |
| `correct_key` | one of `A`–`D` |
| `rationales` | one per option, 1–2 sentences |
| `wrong_choice_note` | the teaching point behind the most tempting wrong option |
| `source_excerpt` | an exact substring of the lesson text that answers the question |
| `status` | always `draft` here |

## Validation

`scripts/flipcards/build-validate-query.mjs` prints a SQL statement that checks
cards against the lesson text the player actually serves. Run it in the Supabase
SQL editor (it uses the `http` extension). Each returned row is a finding; zero
rows means the cards pass. Use `--batch <dir>` to add the batch checks
(duplicate questions, correct-letter balance).
