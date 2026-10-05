# FDY-37 — Server-render the grid + SEO

**Run:** 2026-10-05, branch `claude/academy-player-binding`.

## Docs read first (AGENTS.md requirement)

`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`,
`.../revalidateTag.md`, `.../03-file-conventions/01-metadata/sitemap.md` and `.../robots.md`,
and `02-guides/single-page-applications.md` (native History API integration).

## The change that mattered

`useSearchParams` on a prerendered route forces the client tree **up to the nearest Suspense
boundary** to be client-side rendered. That is what produced the lobby's symptom: the HTML was
skeletons, and the 99 player links existed only after hydration — invisible to a crawler and to
a reader on a slow connection.

Wrapping the shell in Suspense does not fix that; it only moves the boundary. So `LobbyShell`
no longer calls `useSearchParams` at all:

- the server renders the **full, unfiltered grid** in Recommended order;
- the shell hydrates with the same default state, so the markup matches and no server link is
  dropped when no filter is set;
- the URL is read once on mount and again on `popstate`;
- writes go through `window.history.replaceState`, which Next integrates with its router
  without a navigation round trip.

**Deviation from the issue as written:** there is no Suspense boundary and no "fallback is the
real grid", because nothing suspends any more. The real grid is in the static HTML itself,
which is the outcome the issue was after. `/academy` stays `○ (Static)` with `revalidate 300`.

## SEO added

- `lib/site.ts` — `NEXT_PUBLIC_SITE_URL`, default `https://faraday-academy.vercel.app`.
- `generateMetadata()` on `/academy`: `metadataBase`, `alternates.canonical: "/academy"`,
  OpenGraph (type, siteName, title, description, url) and Twitter `summary_large_image`.
- `lib/jsonld.ts` — `ItemList` of `Course`, each with `name`, the **player** `url`, provider
  `Faraday Academy`, and `isAccessibleForFree: true` while beta is free. Emitted in the same
  Recommended order the page renders, so `position` means what it says. No `offers` node: a
  `$0` Offer would imply a price list that does not exist yet.
- `app/sitemap.ts` — `/academy` only. Course pages live on the player and are in the player's
  own sitemap; claiming them here would compete with it.
- `app/robots.ts` — allow `/`, disallow `/api/`, sitemap link.

## Verification

`npm run lint` (clean) · `npx tsc --noEmit` · `npm test` (124 passed, 2 skipped) ·
`npm run build` · `npm run check:links` (99/99) — all pass.

### Built `/academy` HTML

| Check | Before (FDY-36) | After |
| --- | --- | --- |
| `BAILOUT_TO_CLIENT_SIDE_RENDERING` | present | **0** |
| `<article>` elements in markup | 0 | **99** |
| `href="https://www.faraday-player.com/…"` in markup | 0 | **99** |
| "Free during beta" in markup | 0 | 100 (99 cards + the header line) |
| `<link rel="canonical">` | absent | `https://faraday-academy.vercel.app/academy` |
| JSON-LD `ItemList` items | absent | 99, parses in a test |

`/robots.txt` and `/sitemap.xml` both render as static routes.

### With JavaScript disabled

99 `<article>` elements and 99 player links. The grid is genuinely in the document, not
reconstructed on the client.

### Behaviour after hydration (Playwright, 1280×900)

| Action | Result |
| --- | --- |
| load `?level=101` | 22 cards, the only level badge present is `101` |
| click `101` to clear | 99 cards, URL drops to `/academy` |
| click author `Mach Eigen` | 43 cards, URL `?author=mach` |
| type `cooling` in search | 3 cards — Cooling and Water Foundations, Thermal Components & Coolant Supply Chain, Water and Watts |

axe: **0 violations**. Console: **0 errors**.

### Lighthouse

Run against the identical production build served by `next start` on localhost, because the
branch preview is behind Vercel Authentication and Lighthouse cannot authenticate to it. Both
runs use the real build output, not `next dev`.

| Profile | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| **Mobile** | **98** | **100** | 100 | **100** |
| Desktop | 100 | 100 | 100 | 100 |

Thresholds required: mobile Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 — all met.
Re-measured against the public production URL at FDY-40.
