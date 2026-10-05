# FDY-36 — Canon-compliant UI and filters on live fields

**Run:** 2026-10-05, branch `claude/academy-player-binding`.

## What changed in this step

Most of the structural work landed earlier out of necessity — the retired components could not
compile against the new model, so they were deleted in FDY-34 (noted there). This step is the
canon work proper.

- **`__tests__/canon.test.ts` (new).** Renders the real filter rail, toolbar and a full grid of
  all 99 snapshot courses with `renderToStaticMarkup`, then asserts over two distinct surfaces:
  - the **full HTML** for `\bD[0-9]{1,2}(\.[0-9]+)?\b`, `\bT-?[0-9]{3}\b`, `\bFA-[A-Z0-9-]+\b`,
    `\$\s?[0-9]`, `faraday-intelligence.ai`, and the legacy strings;
  - the **chrome** — the same HTML with every course title, slug, subject and author name
    removed — for certification UI, banned phrases, LearnWorlds, retired filter labels, and
    `\b\d+\s+(domains?|towers?|schools?|courses?)\b`.
- **Card.** "Narrated" became a bordered badge rather than an inline metadata item, so it reads
  as a property of the course instead of a third value in the mono run.
- **Heading order.** Filter section headings `h3` → `h2`, plus an `sr-only` `<h2>Courses</h2>`
  above the grid. On a phone the rail is `display:none`, so without it the document jumped
  h1 → h3 and axe flagged `heading-order`.

## Why the canon test splits HTML from "chrome"

The live catalog publishes **International Markets & Site Certification**. A bare `/certif/i`
match over the rendered page fails on a *correct* lobby — the string is a real course title, not
certification UI. The test strips the editorial surface first, in both raw and HTML-escaped form
(React escapes the `&` in that title, so a raw-only strip misses it), then asserts the chrome
carries no certification UI. Codes and prices are still asserted over the full HTML, because no
course title may legitimately contain one.

## Verification

`npm run lint` (clean) · `npx tsc --noEmit` · `npm test` (110 passed, 2 skipped) ·
`npm run build` · `npm run check:links` (99/99, no redirect) — all pass.

### Rendered page, measured with Playwright against `next start` on the production build

The branch preview is behind Vercel Authentication, so viewport, axe and colour checks ran
against the identical production build served locally; the regex checks also ran against the
real preview HTML via `vercel curl`.

| Viewport | Scheme | Cards | Player links | Body background | axe violations | Console errors |
| --- | --- | --- | --- | --- | --- | --- |
| 390 | light | 99 | 99 | `rgb(248,245,240)` | 0 | 0 |
| 390 | dark | 99 | 99 | `rgb(248,245,240)` | 0 | 0 |
| 1280 | light | 99 | 99 | `rgb(248,245,240)` | 0 | 0 |
| 1280 | dark | 99 | 99 | `rgb(248,245,240)` | 0 | 0 |

`?level=101` after hydration renders 22 cards and the only level badge present is `101`.

Brand: the ground is `#F8F5F0` at every breakpoint and scheme — never `#FFFFFF`. Gold appears
only as the CTA arrow glyph and the focus ring, never as small text on a light ground. Level and
the metadata run are IBM Plex Mono, titles IBM Plex Serif, UI Bricolage Grotesque.

**There is no dark theme.** `globals.css` locks the warm-white ground, so `prefers-color-scheme:
dark` renders identically — which is why the dark rows above match the light ones exactly. That
is the brand rule, not a gap, but it is stated here so "checked dark" is not read as "has a dark
mode".

## Filters and URL

Level · Subject (grouped by cluster) · Author · Narrated, all derived from the catalog in hand —
a level or subject with nothing published does not appear. Search covers title and subject. Sorts:
Recommended (level then title), Title A–Z, Shortest, Longest. The persona switcher renders only
when a course actually carries personas and only reorders; today no row does, so it is absent.

URL params `level`, `subject`, `author`, `narrated=1`, `q`, `sort`. `level` and `subject` repeat
the key rather than comma-joining: a subject name contains a comma ("Tax, Incentives & Fiscal
Policy") and would not survive a split. Retired params (`price`, `duration`, `cert`, `schools`)
are dropped in silence, which `filters.test.ts` asserts.

No count appears in any user-visible string; the result line is an `sr-only`
`aria-live` "Results updated."

## Amendment after the preview check (same day)

Running the canon regexes over the *branch preview's* HTML surfaced two things worth stating
plainly rather than scoring as a pass:

1. **A `$1` "price" match is a false positive.** It is React Flight payload syntax
   (`["$","$1","c",{...}]`), not a rendered price. The canon test deliberately asserts over
   `renderToStaticMarkup` output — real rendered HTML — rather than over a page that still
   embeds a flight payload.
2. **"Free during beta" and "Results updated." were absent from the preview HTML**, because at
   this commit the grid was still client-side rendered (`BAILOUT_TO_CLIENT_SIDE_RENDERING`).
   The canon regex pass over the preview was therefore partly vacuous: there was very little
   rendered text to check. FDY-37 removes the bailout, and the full preview check is re-run
   there and again at FDY-40's gate.

Codes, legacy URLs, "Coming soon", LearnWorlds and banned phrases were all genuinely clean on
the preview, and the 99 player links were present.
