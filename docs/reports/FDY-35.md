# FDY-35 — Link every card to its player page

**Run:** 2026-10-05, branch `claude/academy-player-binding`.

## What changed

- **`lib/player.ts`** (landed in FDY-34) resolves `NEXT_PUBLIC_PLAYER_BASE_URL`, default
  `https://www.faraday-player.com`, and builds `base + "/" + encodeURIComponent(slug)`. No
  query string, no course code.
- **`components/CourseCard.tsx`.** The card is now a single link: the title anchor is
  stretched over the whole card with `after:absolute after:inset-0`, and the article is
  `relative` with `focus-within:border-sage` so keyboard focus is visible on the card itself.
  Same tab — no `target`, no `rel`. The "Start reading" CTA with the gold arrow became an
  `aria-hidden` span, so the card is one tab stop instead of two links to the same page.
  "Coming soon" was already removed in FDY-34 along with the nullable `url` field.
- **`scripts/check-player-links.mjs` + `npm run check:links` (`-- --live`).** HEAD first,
  escalating to GET on 405/501, concurrency 6, 10 s timeout, `redirect: "manual"`. Any
  non-200 fails the run and is printed with its slug, status and `Location`. Default source is
  the committed snapshot; `--live` reads the live catalog.

## Why redirects are a failure, not a pass

`/<slug>` is the canonical form on the player host; `/academy/<slug>` 308s to it. Following
redirects in the checker would let the lobby ship the prefixed form and silently cost every
reader a round trip, so the checker refuses to follow them.

## Test results

`npm run lint` (clean) · `npx tsc --noEmit` · `npm test` (93 passed, 2 skipped) ·
`npm run build` — all pass.

```
$ npm run check:links
Checked 99 player links from seed/academy-catalog.snapshot.json against https://www.faraday-player.com.
All links returned 200 with no redirect.
```

Zero failures, so no slug needed reporting as a 404.

New card tests: exactly one `a[href]` per card; href equals `<base>/<slug>` for every row in
the fixture; no `target`/`rel`; the CTA is not a second link; the title link is keyboard
focusable; axe clean for a single card and for a full grid; every href in a rendered grid is
distinct and matches its course.

### Spot checks against the live player (status, no redirect followed)

| Level | Slug | Result |
| --- | --- | --- |
| 101 | `data-center-power-foundations` | 200 |
| X | `the-threat-surface` | 200 |
| Capstone | `from-megawatts-to-money-the-capstone` | 200 |

The same three were re-checked on the branch preview's rendered HTML: each card's href is the
canonical `https://www.faraday-player.com/<slug>` form.

## Note on preview access

The `faraday-academy` project has Vercel Authentication on preview deployments, so preview
checks in this run were made with `vercel curl` under the authenticated CLI. Production
(`faraday-academy.vercel.app`) is **not** gated — it answered 200 unauthenticated — so
FDY-40's public smoke test is unaffected.
