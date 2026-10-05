# FDY-38 — Freshness: revalidate route + trigger fan-out

**Run:** 2026-10-05, branch `claude/academy-player-binding`.
**Outcome: partially blocked.** The route handler is built, tested and deployed on the branch.
The database migration is written and reviewed but **not applied** — see below.

## 1. Reading the existing trigger — blocked, worked around

`select pg_get_functiondef(...) from pg_proc where proname ilike '%revalidat%'` needs Supabase
access. The MCP server requires re-authorisation and the local CLI token returns
`401 Unauthorized` on every call (`supabase projects list`, `supabase functions list`). The
trigger is also **not in either repo** — it was created directly against the database in an
earlier session, so there is no migration file to read it from.

What *is* knowable from source: the player's own `src/app/api/revalidate/route.ts` reads

```ts
request.headers.get("x-academy-revalidate-secret") ?? request.headers.get("x-revalidate-secret")
```

so the trigger sends one of those two. **The lobby route accepts both**, which is correct
whichever one the deployed trigger uses — rather than picking one and failing closed on a
header name that could not be verified.

## 2. `app/api/revalidate/route.ts`

POST only. Constant-time compare (`node:crypto` `timingSafeEqual`, with a length check first so
it cannot throw) against `ACADEMY_REVALIDATE_SECRET`. On success,
`revalidateTag("academy", "max")` — the two-argument form, confirmed against
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`; the
single-argument form is deprecated in Next 16. `"max"` marks the tag stale and serves
stale-while-revalidate, which matches the edge function's own cache headers.

`204` on success · `401` on any rejection · `405` with `Allow: POST` on every other method ·
`Cache-Control: no-store` on all of them.

### Against the local production build

| Request | Status |
| --- | --- |
| `POST` no secret | 401 |
| `POST` wrong secret | 401 |
| `POST` `x-academy-revalidate-secret` correct | 204 |
| `POST` `x-revalidate-secret` correct | 204 |
| `GET` | 405, `Allow: POST` |

11 unit tests, including: a wrong secret of exactly the same length is rejected; a
different-length secret is rejected without throwing; an unconfigured server rejects a
*correct* secret; every rejection returns an identical body; a `GET` never revalidates.

### One divergence from the player, deliberate and flagged

The player answers **404** for a bad secret ("same opaque response whether the secret is
missing, wrong or unconfigured"). This prompt specifies 204/401/405 for the lobby, and FDY-40's
smoke test checks for 401, so the lobby returns **401**. The two routes now disagree on the
rejection code. That is a decision for Myke, not something to silently harmonise — raised here
once.

## 3. Migration `academy_revalidate_fanout_lobby` — written, NOT applied

`docs/migrations/academy_revalidate_fanout_lobby.sql`, with `docs/migrations/README.md` recording
that nothing in that directory has been applied.

**It adds a trigger rather than editing the existing function.** The issue asked for the existing
function to be extended. That needs `create or replace function` with the full body — and the
deployed body could not be read (same blocker as §1). Replacing a function you have not seen is
how the player's own revalidation call gets silently deleted. A second trigger reaches the same
outcome, is safe to apply blind, and leaves the player path provably untouched.

The new function:

- reads Vault `academy_lobby_revalidate_url` and `academy_revalidate_secret`, and **returns
  without doing anything** if either is absent;
- posts with `x-academy-revalidate-secret`;
- has its own `exception when others` handler that warns and returns the row, so a revalidation
  ping can never fail an editorial status change;
- writes nothing — not `status`, not any column;
- is idempotent: `create or replace function`, then `drop trigger if exists` before `create
  trigger`.

No write to `academy_courses` was made to test any of this, per the issue.

## Still to do when Supabase access is restored

1. `select pg_get_functiondef(p.oid) from pg_proc p where p.proname ilike '%revalidat%'` — read
   the deployed trigger and confirm the header name.
2. Apply `academy_revalidate_fanout_lobby` via `apply_migration`.
3. Create Vault `academy_lobby_revalidate_url` = `https://faraday-academy.vercel.app/api/revalidate`
   (FDY-40 step 4, also blocked).
4. Set `ACADEMY_REVALIDATE_SECRET` on the `faraday-academy` Vercel project from Vault
   `academy_revalidate_secret` (FDY-40 step 3, also blocked).

Until 2–4 are done the lobby refreshes on its 300 s ISR window and `/api/revalidate` rejects
everything with 401, which is the safe failure: stale-by-at-most-300s, never an open endpoint.

## Test results

`npm run lint` (clean) · `npx tsc --noEmit` · `npm test` (135 passed, 2 skipped) ·
`npm run build` — all pass. `/api/revalidate` builds as `ƒ (Dynamic)`; `/academy` stays
`○ (Static)` with `revalidate 300`.
