# FDY-39 — Summary and personas on catalog rows

**Run:** 2026-10-05.
**Outcome: built, tested, merged — deploy blocked.** Steps 1–3 and 6 are complete. Steps 4
(deploy) and 5 (verify live) could not run: Supabase is unauthorised this session.

## 1. The edge function change

Branch `claude/academy-public-summary` → merged into `cc-academy-player` as
[PR #185](https://github.com/Mykemiller/v0-faraday-daily-challenge/pull/185)
(merge commit `29c9fab`, commit `a9a3696`).

Every `/catalog` row now carries:

- **`summary`** — one sentence from copy the course already has: the welcome message if
  there is one, else the opening paragraph of the first lesson. Clipped to 160 characters
  on a word boundary with an ellipsis, and with any dangling punctuation trimmed before it.
  **Nothing is generated.**
- **`personas`** — `academy_courses.audience_personas`, filtered to the six known names,
  de-duplicated, order preserved.

### Three decisions worth recording

1. **A summary that trips a guard is dropped, not cleaned.** `findCode` (existing) and
   `findBannedPhrase` (new, in `validate.ts`) both return `null` for the summary. The lobby
   then renders no description, which is better than a laundered one. The banned-phrase list
   is **deliberately not a servability criterion** — a course is not held back for containing
   one; only a summary derived from it is.
2. **"First lesson" means lowest `(module.position, lesson.position)`**, not whichever row
   PostgREST returned first. Without that the summary would wander between deployments. There
   is a test for exactly this (`summary reads the FIRST lesson, not whichever row came back
   first`).
3. **`audience_personas` joins the existing course select, and the select falls back.** A
   column that does not exist is a PostgREST error on the *whole* select, which would take
   the catalog down. `fetchCourses()` retries with the base column list and logs — degrading
   to a catalog without personas is the right failure. **The column's existence could not be
   verified this run** (no database access), which is precisely why the fallback is there.

No change to filters, status logic, caching, CORS or the servability validator.
`src/lib/academy/types.ts` gained both fields as optional.

## 2. Tests

| Suite | Result |
| --- | --- |
| `npm run test:academy-public` (Deno) | **27 passed, 0 failed** — 15 new |
| `npm run test:academy` | 35 passed |
| `npx tsc --noEmit` | 24 errors, **all pre-existing**, none in a changed file |
| PR #185 Vercel build check | pass |

New tests cover: first-sentence extraction including the `J. Smith.` initial case; word-boundary
clipping with no dangling punctuation; welcome-message preference; first-lesson fallback;
first-lesson ordering; the 160-char cap; drop-on-taxonomy-code (`D2.1`, `T-001`);
drop-on-banned-phrase including a curly apostrophe in "in today’s fast-paced world"; null when
there is no copy at all; persona filtering, de-duplication, padding and non-string entries;
and that `price_usd` is still absent during beta.

**`npm run test:no-codes` fails — and fails identically on `cc-academy-player` without this
change** (verified by stashing). All 10 hits are ISO-8601 timestamp fragments (`T12:00:00Z`,
`T00:00:00Z`) in `free-agency/page.tsx`, `league-playoffs/*` and `share/buildShare.js`. The
guard's `\bT-?\d{3}\b` pattern matches `T12:` and `T00:`. Pre-existing, unrelated to the
academy, reported rather than fixed.

**`supabase functions serve` was not run.** The CLI is installed, but the function reads the
database through the service-role key; without Supabase access a local serve answers 500 on
the first query, so it would have tested nothing.

## 3. Deploy — BLOCKED

```
$ supabase functions deploy academy-public --project-ref ycadmmngkdhvpcsrcuaq --no-verify-jwt
Uploading asset (academy-public): supabase/functions/academy-public/index.ts
Uploading asset (academy-public): supabase/functions/academy-public/shape.ts
Uploading asset (academy-public): supabase/functions/academy-public/validate.ts
unexpected deploy status 401: {"message":"Unauthorized"}
```

The Supabase MCP server needs re-authorisation and the local CLI access token is dead
(`401` on `projects list`, `functions list` and `functions deploy` alike). The previous
version number could not be recorded either, for the same reason — `list_edge_functions`
is the same 401.

**The live catalog is therefore unchanged.** Verified at 2026-10-05 15:5x CT: a row's keys
are exactly `author, code, group, level, narrated, reading_minutes, slug, title` — no
`summary`, no `personas`. The deployed function is still the pre-FDY-39 version, so there is
nothing to roll back and nothing to re-verify.

## 4. Lobby side — already done, and already correct without the deploy

The lobby's `summary → description` and `personas → personas` mapping landed in FDY-34 and is
tested there (`mapper.test.ts`: "carries summary and personas through when present" and
"omits description and personas when the catalog does not carry them"). Both fields are
optional in `RawCourse`, the card renders no description block when `description` is absent,
and `PersonaSwitcher` renders only when some course carries personas — which is why the lobby
is correct both before and after the deploy.

`npm run catalog:generate` re-run after the merge: 99 rows, 0 dropped, **no diff** — as
expected, since the deployed function has not changed.

## When Supabase access is restored

1. `list_edge_functions` → record the current version (it was v3 at the time this issue was
   written) for rollback.
2. `supabase functions deploy academy-public --project-ref ycadmmngkdhvpcsrcuaq --no-verify-jwt`.
3. Verify: `/catalog` 200; slug set unchanged (99); every row carries `summary` (string or
   null) and `personas` (array); `/course/data-center-power-foundations` still 200; the canon
   regexes over every `summary`.
4. `npm run catalog:generate` in the lobby, commit the snapshot, redeploy the lobby.
5. On failure: redeploy from `cc-academy-player`'s pre-merge commit `3a5a792`.
