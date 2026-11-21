# FDY-450 · BRAND-1f — Faraday masthead on Faraday Academy

Workstream CC-BRAND-MASTHEAD-1.0 · package source: Faraday-Workbench PR #55
(`packages/faraday-masthead`, v1.0.0, branch `claude/fdy-444-faraday-masthead`).

## What changed
- **Vendored** `packages/faraday-masthead/` → `lib/faraday-masthead/` (all files, incl. `VERSION`,
  `MANIFEST.json`, `check-drift.mjs`, tests). `node lib/faraday-masthead/check-drift.mjs` →
  "faraday-masthead 1.0.0: vendored copy matches its manifest" (also with `--canonical` against the
  Workbench copy). No vendored file was edited.
- **Drift check in CI:** new workflow `.github/workflows/masthead-drift.yml` (the repo had no GitHub
  Actions before; Vercel builds were its only CI) **and** `npm test` now runs
  `npm run check:masthead` before vitest, so drift fails the test suite locally and in any runner.
- **`app/academy/layout.tsx` (new):** `<Masthead appName="Faraday Academy" homeHref="/academy">` +
  `<AppBar label="Faraday Academy" links={[Courses → /academy, current]}>` above every `/academy`
  view: the lobby and its error boundary (`error.tsx` renders inside the layout).
- **Skip link target:** the lobby's `<main>` and the error state's `<main>` get `id="main"`.
- **No double banner:** the lobby's page hero (h1 "Faraday Academy", tagline, persona switcher) was a
  `<header>` element, i.e. a second `banner` landmark next to the masthead. It is now a `<div>` with
  the same classes and content. Nothing else in the lobby changed.

## Routes covered
| Route | Masthead | Notes |
|---|---|---|
| `/academy` (lobby) | yes | screenshots below |
| `/academy` error state | yes (layout wraps `error.tsx`) | covered by layout; not screenshotted |
| `/` | n/a | redirects to `/academy` |
| course, school, lesson views | **not in this repo** | see "Not done" |

## Decisions
- **Course/lesson views are out of reach of this repo.** The lobby never renders a course body; every
  card links to the player (`www.faraday-player.com/<slug>`), which is served by the Daily Challenge
  engine repo's `cc-academy-player` branch (`src/app/academy/{[slug],[slug]/[module]/[lesson]}`, its
  own `academy/layout.tsx` header). That branch deploys straight to the player domain on push
  (FDY-41 report), so it was not touched. It needs its own child issue.
- **Sign in:** the lobby has no sign-in ("every lesson is open to read") and neither the lobby nor the
  player has a sign-in route. The default "Sign in" control is kept (one masthead for everyone) and
  points at the player home (`playerBaseUrl()`), the only Academy surface with a signed-in state
  (progress sync). No email is passed.
- **AppBar:** the app had no top-level nav; the AppBar carries one item, "Courses" → `/academy`
  (current). Page-level controls (search, sort, filters, persona) stay in the page.
- **Fonts:** `loadFonts` is not passed. `next/font/google` in this Next version keeps the literal family
  names (`IBM Plex Serif`, `Bricolage Grotesque`, `IBM Plex Mono`) in the built CSS, so the masthead's
  font stacks resolve; computed `.fm-word` font is `"IBM Plex Serif"`.
- **tsconfig:** already had `allowImportingTsExtensions` + `noEmit`; the `.ts`-extension import builds
  with no config change.

## Verification
- `npm run build` ✓ (Next 16.2.9, `/academy` static + ISR 5m).
- `npx tsc --noEmit` ✓ · `npx eslint` ✓ (0 problems, vendored files included).
- `npm test` ✓ — drift check + vitest **146 passed, 2 skipped** (12 files; the skips are the
  pre-existing env-gated `contract.test.ts`). New `__tests__/masthead.test.tsx` (3 tests): one banner
  landmark carrying `data-fm="1.0.0"`, mark + wordmark → `/academy`, app name in the context slot,
  "Courses" `aria-current="page"` in the AppBar, skip link → the single `main#main`, axe-clean.
- Vendored package tests: `masthead.test.ts` 16/16 pass; `render.test.mjs` 2 skipped (needs esbuild,
  which this repo does not install).
- `npm run check:links` fails on `fetch failed` for every player URL — egress to
  `www.faraday-player.com` is blocked from this container; unrelated to this change.

## Screenshots (Playwright Chromium, `next start`, seed catalog, deviceScaleFactor 1)
| File | |
|---|---|
| `FDY-450-lobby-380-top.png` / `FDY-450-lobby-380.png` | 380 px: 56 px bar, wordmark centred (offset 0 px), avatar button, no horizontal overflow (scrollWidth 380) |
| `FDY-450-lobby-380-menu.png` | 380 px with the context menu open (app name + Sign in) |
| `FDY-450-lobby-1440-top.png` / `FDY-450-lobby-1440.png` | 1440 px: 64 px bar, wordmark centred (offset 0 px), AppBar unclipped |

## Not done
- Masthead on the player's course/school/lesson views (Daily Challenge repo, `cc-academy-player`).
