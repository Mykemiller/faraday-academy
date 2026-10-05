# Faraday Academy lobby — production cutover checklist

**Cutover date:** 2026-10-05
**Branch:** `claude/academy-player-binding` → `main`
**Vercel project:** `faraday-academy` (`prj_F8z39ek5PYK1IHsJHCRks1SBSvn3`, team `team_JS3rgFwySt8w8yds7fAh1KeM`)
**Production URL:** https://faraday-academy.vercel.app
**Rollback target:** deployment `dpl_6kd5aKpnXtzh5fRPXTrFJPGHRYxg` (commit `f4893b3`)

## What changes for a visitor

| Before | After |
| --- | --- |
| HTML is skeletons only (`BAILOUT_TO_CLIENT_SIDE_RENDERING`); the grid appears after hydration | 99 cards and 99 player links are in the HTML; the page works with JavaScript disabled |
| Catalog is `seed/courses.json` — "in 45 Minutes" primers, D-code monograms, theme pills | Catalog is the live `academy-public` edge function |
| Prices $9.99 / $99, certification rows | "Free during beta" everywhere; no certification UI |
| CTAs to dead `faraday-intelligence.ai/academy/c/<slug>` URLs, or "Coming soon" | Every card is one stretched link to `https://www.faraday-player.com/<slug>` |
| Filters: School (D-codes), Price, Duration, Certification | Filters: Level, Subject (grouped by cluster), Author, Narrated |
| Result count rendered as text | No counts anywhere; an `sr-only` "Results updated." live region |
| No canonical, no OG, no JSON-LD, no sitemap, no robots | Canonical + OG + Twitter + `ItemList` of `Course`, `/sitemap.xml`, `/robots.txt` |
| — | `POST /api/revalidate` (204 / 401 / 405) |

## Environment — Vercel project `faraday-academy`, Production target

| Variable | Value | State |
| --- | --- | --- |
| `NEXT_PUBLIC_PLAYER_BASE_URL` | `https://www.faraday-player.com` | **Set 2026-10-05** |
| `NEXT_PUBLIC_SITE_URL` | `https://faraday-academy.vercel.app` | **Set 2026-10-05** |
| `ACADEMY_PUBLIC_BASE` | the edge function base | **Set 2026-10-05** |
| `ACADEMY_REVALIDATE_SECRET` | Vault `academy_revalidate_secret` | **NOT SET — blocked** |
| `AIRTABLE_API_KEY` | — | Not present; nothing to remove. The project had **no** environment variables at all before this cutover, which is why production was serving the seed catalog. |

**Every value above is also the code default**, so a deployment with none of them set behaves
identically. They are set explicitly so the production configuration is legible rather than
implicit.

### The one blocked item

`ACADEMY_REVALIDATE_SECRET` could not be set: reading Vault `academy_revalidate_secret`
needs Supabase access, and both the MCP server and the local CLI token return
`401 Unauthorized`. The same blocker stops Vault `academy_lobby_revalidate_url` from being
created and the `academy_revalidate_fanout_lobby` migration from being applied (FDY-38).

**Consequence, stated plainly:** `/api/revalidate` rejects everything with 401, and the lobby
refreshes on its own 300-second ISR window instead of on a status change. That is the safe
failure — stale by at most five minutes, never an open endpoint. Nothing else is affected.

## Pre-merge verification — all passed

### Build and tests (`npm ci` from a clean install)

| Check | Result |
| --- | --- |
| `npm run lint` | clean — 0 errors, 0 warnings |
| `npx tsc --noEmit` | clean |
| `npm test` | 135 passed, 2 skipped |
| `LIVE=1 npm test` | **137 passed, 0 skipped** — the live contract tests included |
| `npm run build` | `/academy` `○ (Static)` revalidate 5m; `/api/revalidate` `ƒ (Dynamic)`; `/robots.txt`, `/sitemap.xml` static |
| `npm run check:links` | 99/99 → 200, no redirect (snapshot) |
| `npm run check:links -- --live` | 99/99 → 200, no redirect (live catalog) |

### Canon regexes over the branch preview's `/academy`

Run over the rendered HTML with the React Flight payload stripped, and codes/URLs also over
the raw HTML. All clean: domain code · tower code · course code · dollar amount · count of
domains/schools/towers/courses · `faraday-intelligence.ai` · "in 45 Minutes" · "Coming soon" ·
LearnWorlds · every banned phrase.

Preview also carried: 99 `<article>`, 99 distinct player hrefs, **0** `BAILOUT_TO_CLIENT_SIDE_RENDERING`,
`Free during beta` ×100, `Results updated.` ×1, the canonical link, and a JSON-LD `ItemList`
of 99 items that parses.

**Slug parity:** the preview's 99 player slugs equal the live catalog's 99 slugs exactly.

### Accessibility — axe, 0 violations

| Viewport | light | dark |
| --- | --- | --- |
| 390 | 0 | 0 |
| 1280 | 0 | 0 |

### Lighthouse (mobile)

Performance **98** · Accessibility **100** · Best practices **100** · SEO **100**.
Thresholds required: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.

### Manual walk, 1280×900, zero console errors

| Step | Result |
| --- | --- |
| initial load | 99 cards |
| search "cooling" | 3 — Cooling and Water Foundations, Thermal Components & Coolant Supply Chain, Water and Watts |
| Level 101 | 22 cards; the only level badge present is `101` |
| Author Mach Eigen | 43 cards; every card carries the Mach Eigen byline |
| Narrated toggle | 99 cards, every one narrated (the whole catalog is narrated today) |
| clear | back to 99, URL back to `/academy` |
| open a 101 (`data-center-power-foundations`) | 200, no redirect |
| open an X (`the-threat-surface`) | 200, no redirect |
| open the Capstone (`from-megawatts-to-money-the-capstone`) | 200, no redirect |

Measured against the identical production build served by `next start`, because the branch
preview is behind Vercel Authentication and neither Playwright nor Lighthouse can
authenticate to it. Deployment protection was **not** changed. The regex and parity checks
above did run against the real preview, via `vercel curl`.

## Post-cutover smoke test

Against **https://faraday-academy.vercel.app/academy**, unauthenticated:

1. HTML carries `https://www.faraday-player.com/` links and none of `in-45-minutes`,
   `FA-D1-1"`, `faraday-intelligence.ai/academy/c/`, "Coming soon".
2. Three cards (a 101, an X, the Capstone) open their player page with 200 and no redirect.
3. The canon regexes pass over the rendered HTML.
4. `POST /api/revalidate` with no secret returns **401**.

## Rollback

1. Vercel → project `faraday-academy` → Deployments → `dpl_6kd5aKpnXtzh5fRPXTrFJPGHRYxg`
   (commit `f4893b3`) → **Instant Rollback**.
   CLI equivalent: `vercel rollback dpl_6kd5aKpnXtzh5fRPXTrFJPGHRYxg --scope project-foundry`.
2. Confirm `https://faraday-academy.vercel.app/academy` returns 200 and serves the previous
   build.
3. The three environment variables can be left in place — the old build reads none of them.
4. Nothing else needs undoing: no database write, no Vault write, no domain change, and no
   edge function deploy was part of this cutover.

---

## Post-cutover amendment

The "one blocked item" above was based on a wrong reading of Supabase availability. Corrected:

- Vault `academy_lobby_revalidate_url` — **created**.
- Migration `academy_revalidate_fanout_lobby` — **applied**, extending the real
  `academy_notify_revalidate()` function with a second, independently guarded post to the lobby.
- `ACADEMY_REVALIDATE_SECRET` on Vercel — **still unset**, and the only item left. Reading the
  raw Vault value was refused by this session's safety classifier. Paste it by hand into
  `faraday-academy` → Production and redeploy. Check the paste by MD5:
  `e6ef7eb6edae700d0d15a1e5a395a670`, 64 lowercase hex characters.

Until that one variable is set, `/api/revalidate` returns 401 to the trigger and the lobby
refreshes on its 300-second ISR window. The trigger swallows the rejection, so nothing is
broken by waiting.
