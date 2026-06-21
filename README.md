# Faraday Academy — Lobby

The front door to Faraday Academy: a fast, branded, accessible catalog page at **`/academy`**
that filters courses by **Persona, School, Free/Paid, Duration, and Certification**, plus search
and sort. Read-only — no checkout, auth, or course content (that's elsewhere).

Built to [`faraday-academy-lobby-spec.md`](./faraday-academy-lobby-spec.md) v1.0, incorporating the
adversarial review (SSG+ISR, cluster SVG icons, theme pills, localStorage persona persistence,
edge-ready cached fetch, smart empty states).

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · `lucide-react` · Vitest + RTL + jest-axe.

## Run
```bash
npm install
npm run dev      # → http://localhost:3000/academy
npm test         # unit + component + axe (30 tests)
npm run build
```
No env vars required — the lobby runs on the committed seed (`seed/courses.json`).

## Data: real curriculum, live from Airtable
The catalog is generated from the **real IDF registries** (Faraday 2.0 base): 23 Domains → Schools,
59 Sub-Domains → Courses, 7 Themes → Learning Paths. Descriptions are real; product attributes
(level / price / persona / duration) are derived by deterministic rule and marked **DRAFT pending the
FAR-149 editorial gate**. Ratings are intentionally blank — no fabricated metrics (spec §13.2).

- **Source of truth:** the dedicated **Faraday Academy** Airtable base (`appzhpKGOI248bCDQ`),
  tables `Courses` (112 rows), `Schools` (23), `Themes` (7).
- **Loading:** `lib/catalog.ts` reads the live base server-side at build time, **SSG + ISR**
  (`revalidate: 3600`), memoized with `unstable_cache`. Falls back to seed if the token is absent
  or Airtable errors.
- **Regenerate seed + Airtable payloads:** `npm run catalog:generate` (re-derives from
  `scripts/idf-data.mjs`).

### Environment (see `.env.example`)
| Var | Purpose |
|---|---|
| `ACADEMY_CATALOG_SOURCE` | `airtable` \| `seed` (auto: airtable when a key is present) |
| `AIRTABLE_API_KEY` | read-only PAT (`data.records:read`) for the Academy base |
| `AIRTABLE_BASE_ID` | defaults to `appzhpKGOI248bCDQ` |
| `AIRTABLE_COURSES_TABLE` | defaults to `Courses` |

## Structure
```
app/academy/page.tsx     server: getCatalog() → <LobbyShell>; ISR
components/               LobbyShell, FilterRail/Drawer, Persona/School/Price/Duration/Cert,
                         Toolbar, ActiveChips, CourseGrid, CourseCard, EmptyState, Skeletons, ClusterIcon
lib/filters.ts           PURE applyFilters / applySort / activeChips (unit-tested)
lib/{types,constants,url,catalog}.ts
seed/courses.json        fallback catalog (generated)
scripts/                 idf-data.mjs + generate-catalog.mjs
__tests__/               filters / card / rail (incl. axe)
```

## Brand & a11y
Locked palette (forest / gold / warm-white / sage — never pure white; gold never small-on-white),
IBM Plex Serif titles / Bricolage Grotesque UI / IBM Plex Mono metadata. WCAG 2.1 AA: full keyboard
path, visible gold focus, `aria-live` count, fieldset/legend groups, drawer focus management,
`prefers-reduced-motion`, axe-clean.

## Out of scope (per spec §2)
Checkout/payments, auth, course detail/lessons, enrollment/certs workflow, Level/Type/Theme filter UI
(seams left), the real Airtable→Supabase sync. The "wire into faraday-intelligence.ai (replace the stub)"
step is a follow-on after this MVP is approved.
