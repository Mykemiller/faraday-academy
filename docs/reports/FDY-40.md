# FDY-40 — Verify end to end, then cut the lobby over

**Run:** 2026-10-05. **Outcome: cut over and verified in production.**

Merge commit `5a5ad03` ([PR #10](https://github.com/Mykemiller/faraday-academy/pull/10)) →
`main`. Production deployment `faraday-academy-5tumexbhu-project-foundry.vercel.app`, READY in
26 s.

## Gate — every check passed before the merge

Full detail, including the before/after table and the rollback steps, is in
`docs/reports/cutover-checklist.md`.

- `npm ci` · `lint` (clean) · `tsc --noEmit` · `npm test` 135 passed / 2 skipped ·
  `LIVE=1 npm test` **137 passed, 0 skipped** · `npm run build`.
- `npm run check:links` and `npm run check:links -- --live`: **99/99 → 200, no redirect**.
- Canon regexes over the branch preview: all clean. Slug parity with the live catalog: exact.
- axe: **0 violations** at 390 and 1280, light and dark.
- Lighthouse mobile: Performance **98** · Accessibility **100** · Best practices **100** ·
  SEO **100**.
- Manual walk, 0 console errors: cooling → 3 · Level 101 → 22 (only `101` badges) ·
  Mach Eigen → 43 (all Mach bylines) · Narrated → 99, all narrated · clear → 99 · a 101, an X
  and the Capstone each opened by clicking the real card link, all 200 with no redirect.

## Environment set on the `faraday-academy` project, Production target

The project had **no environment variables at all** before this cutover — which is the direct
explanation for production serving the legacy seed catalog. Set:
`NEXT_PUBLIC_PLAYER_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `ACADEMY_PUBLIC_BASE`.
`AIRTABLE_API_KEY` was not present, so there was nothing to remove.

**`ACADEMY_REVALIDATE_SECRET` was NOT set, and Vault `academy_lobby_revalidate_url` was NOT
created.** Both need Supabase access; the MCP server needs re-authorisation and the local CLI
token returns `401 Unauthorized`. `/api/revalidate` therefore rejects everything with 401 and
the lobby refreshes on its own 300-second ISR window — stale by at most five minutes, never an
open endpoint.

## Post-cutover smoke test — https://faraday-academy.vercel.app/academy, unauthenticated

**Production is not behind deployment protection**: it answered 200 with no Vercel login.
(Preview deployments on this project *are* protected, which is why the pre-merge Lighthouse,
axe and walk ran against the identical build on `next start`. Protection was not changed.)

| Check | Result |
| --- | --- |
| `GET /academy` | **200**, 425,012 bytes |
| `<article>` in the HTML | **99** |
| distinct `https://www.faraday-player.com/…` hrefs | **99** |
| `BAILOUT_TO_CLIENT_SIDE_RENDERING` | **0** |
| slug parity vs the live catalog | **exact, 99 = 99** |
| canon regexes over rendered HTML — codes, `$` amounts, counts, banned phrases | all clean |
| `faraday-intelligence.ai`, `in-45-minutes`, `FA-D1-1"`, "Coming soon", LearnWorlds — over the **full** HTML | all absent |
| "Free during beta" | 100 (99 cards + the header line) |
| canonical | `https://faraday-academy.vercel.app/academy` |
| JSON-LD | `ItemList`, 99 items |
| a 101 · an X · the Capstone, opened from the production HTML's own hrefs | **200, no redirect** for all three |
| `POST /api/revalidate` with no secret | **401** |
| `POST /api/revalidate` with a wrong secret | **401** |
| `GET /api/revalidate` | **405** |
| `/robots.txt` · `/sitemap.xml` | 200 · 200, listing `/academy` only |
| `/` | 307 → `/academy` |

No rollback was needed. The rollback target `dpl_6kd5aKpnXtzh5fRPXTrFJPGHRYxg` (commit
`f4893b3`) remains available via Instant Rollback.

## One thing found on the way through

The `Mykemiller/faraday-academy` repository is **connected to two Vercel projects**:
`faraday-academy` (the production one) and `faraday-academy-iqxy`, created 2026-09-27. Both
built this PR. `faraday-academy-iqxy` carries no custom domain today — `faraday-player.com`
resolves to `v0-faraday-daily-challenge-n2u5`, confirmed by `vercel domains inspect` — but it
is a second live build of the lobby that nobody is watching. Flagged for Myke; not touched,
since deleting a Vercel project is a Hard-Stop.
