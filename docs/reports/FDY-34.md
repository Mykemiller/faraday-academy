# FDY-34 — Bind the lobby catalog to `academy-public`

**Run:** 2026-10-05, branch `claude/academy-player-binding` (from `main` @ `f4893b3`).

## What changed

- **`lib/academy-public.ts` (new, server-only).** Fetches `${ACADEMY_PUBLIC_BASE}/catalog`
  with `next: { revalidate: 300, tags: ["academy"] }`. Validation is hand-written
  (`validateCourse` / `validateCatalog`) — no new dependency. Malformed rows are dropped and
  logged by slug; a malformed *envelope* is a hard failure, because a catalog without
  `beta.free` cannot be rendered safely (a price could leak). The module throws if it is ever
  imported into a browser bundle.
- **`lib/types.ts`.** Replaced `Course` with `LobbyCourse`:
  `slug, title, level, author{voice,name}, subject, cluster, readingMinutes, narrated,
  playerUrl, priceUSD, description?, personas?`. `subject` is `string | null` because the
  catalog's `group` is nullable. Retired: `school.id`, `programType`, `themes`,
  `isCertification`, `maturity`, `rating`, `ratingCount`, `url`, `durationMinutes`,
  `thumbnailUrl`, `status`, `updatedAt`. The catalog's opaque `code` is read and discarded.
- **`lib/constants.ts`.** `SCHOOLS` (code-keyed, D-codes) replaced with `SUBJECT_CLUSTER`,
  keyed by the live subject names. `clusterForSubject()` files an unknown subject under
  Cross-Stack and logs it once.
- **`lib/catalog.ts`.** `getCatalog()` returns `{ courses, beta, generatedAt, source }`.
  Source order: live → snapshot (warns) → empty, which the grid renders as the offline state.
  The Airtable path is gone.
- **`lib/player.ts` (new).** `NEXT_PUBLIC_PLAYER_BASE_URL` (default
  `https://www.faraday-player.com`), `playerUrlForSlug()`.
- **`lib/facets.ts` (new).** Filter options derived from the catalog in hand, never from a
  hard-coded list, so nothing implies a total.
- **`scripts/generate-catalog.mjs`.** Rewritten: `npm run catalog:generate` now rewrites
  `seed/academy-catalog.snapshot.json` from the live catalog, sorted by slug with a fixed key
  order so a regeneration is reviewable. Deleted `seed/courses.json`, `seed/schools.json`,
  `seed/themes.json`, `scripts/idf-data.mjs` (the legacy D-code taxonomy).

## Deviations from the issue as written

1. **The retired filter components were deleted here, not in FDY-36.** `PriceFilter`,
   `DurationFilter`, `CertToggle` and `SchoolFilter` all read fields that no longer exist, so
   "minimal UI changes to compile" could not keep them. `SchoolFilter` → `SubjectFilter`
   landed with them. FDY-36 still owns the canon polish, the URL params and `canon.test.ts`.
2. **`subject` is `string | null`**, not `string`. `group` is nullable on the wire; a null
   subject renders the cluster label on the card and simply does not appear in the Subject
   filter.

## Test results

`npm ci` · `npm run lint` (0 errors, 0 warnings) · `npx tsc --noEmit` · `npm test`
(85 passed, 2 skipped — the skips are the `LIVE=1` contract tests) · `npm run build` — all pass.

New tests: `__tests__/guard.test.ts`, `__tests__/mapper.test.ts` (Capstone row, unknown
subject, null subject, beta price withholding), `__tests__/fallback.test.ts` (all four
fallback paths plus the offline state), `__tests__/contract.test.ts` (live-only, `LIVE=1`).
Fixtures in `__tests__/fixtures/catalog.json` are three real rows copied from a live response.

### Built `/academy` payload (`.next/server/app/academy.html`)

| Check | Result |
| --- | --- |
| live slug `data-center-power-foundations` present | yes |
| `faraday-player.com/` links in payload | 99 |
| `in-45-minutes` | 0 |
| `FA-D1-1"` | 0 |
| `faraday-intelligence.ai/academy/c/` | 0 |
| "Coming soon" | 0 |
| `\bD[0-9]{1,2}(\.[0-9]+)?\b` | 0 matches |
| `\bT-?[0-9]{3}\b` | 0 matches |
| `BAILOUT_TO_CLIENT_SIDE_RENDERING` | **present** — FDY-37's job |

`npm run catalog:generate` wrote 99 rows, dropped 0, from `generated_at
2026-10-05T20:17:29.088Z`. The live catalog publishes 24 distinct subjects and
`SUBJECT_CLUSTER` covers all 24 — no row fell through to the Cross-Stack default.

## Findings worth carrying forward

- **A substring test for `certif` will false-positive.** The live catalog publishes
  *International Markets & Site Certification*. FDY-36's canon test must assert the absence of
  certification *UI* (a badge, a filter), not of the substring.
- **Slug parity could not be checked against the database.** `select public_slug from
  academy_courses where status in ('approved','published')` needs Supabase access, and both
  the MCP server and the local CLI token are unauthorized (`401 Unauthorized`). The
  `academy-public` function serves exactly that query's output, so parity is asserted against
  the live endpoint instead — `contract.test.ts` compares the snapshot's slug set to the live
  catalog's. Flagged, not worked around silently.
- **Linear and Notion MCP are unavailable** in this session (both need re-authorization), so
  this file is the fallback record the issue calls for.
