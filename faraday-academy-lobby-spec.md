# Faraday Academy — Lobby Page (MVP)
### Design & Build Spec for a Claude Code Session

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | For adversarial review → Claude Code build |
| **Owner** | Myke |
| **Target** | A single Claude Code session, building a standalone Next.js app |
| **Deliverable** | A deployable "front door" catalog page at `/academy` |

> This document is **self-contained**. A reviewer or a build session needs nothing outside it. Every enum, every filter rule, every brand token, and a complete seed dataset are included. Where a real-world decision is still open, a **default is chosen** so the build is never blocked; those are listed in §17.

---

## 0 · How to use this spec (Claude Code session brief)

**Objective.** Build the MVP **Faraday Academy Lobby** — a read-only catalog page that lets a visitor filter courses by **Persona, School, Free/Paid, Duration, and Certification**, and browse the matching course cards. This is the *front door only*: no checkout, no auth, no course content.

**Hard constraints (do not violate).**
1. Build **exactly** the scope in §2–§3. Do not add features beyond "Stretch (explicitly out)" without a flag.
2. Filtering, sorting, and state are **client-side over a fully-loaded published catalog**. No backend is required for MVP (see §6).
3. Honor every **brand & content guardrail** in §13 — these are non-negotiable (count-agnostic copy, no fabricated metrics, palette rules).
4. Meet the **accessibility** floor in §11 and the **Definition of Done** in §16 before declaring complete.
5. Use only the dependencies named in §14. No component kitchen-sink libraries.

**How to verify before finishing.** Run the test plan (§15). All unit tests for `lib/filters.ts` pass; the page renders the seed catalog; every filter and sort works; empty/loading/error states render; keyboard-only operation works; `npm run build` succeeds; an axe pass reports no serious violations.

**Run.** `npm install` → `npm run dev` → open `/academy`. Seed data drives everything; no env vars required.

---

## 1 · Context (everything the build needs to know)

**Faraday Academy** is the educational arm of Faraday Intelligence, an AI-data-center-infrastructure intelligence platform. The Academy sells short, sharp courses about the forces shaping the AI data center economy (power, cooling, capital markets, grid policy, sovereign AI, etc.).

The catalog is modeled on Udacity's structure, adapted:

- **Schools** = the IDF Domains (the subject areas). Each School is a domain like *Power Architecture* or *Sovereign AI & Geopolitics*. Full list in §5.3. Schools are grouped under **5 clusters** for navigation.
- **Program Type** = the *kind* of product within a School (Primer, Course, Track, Masterclass, Certification, etc.). Full list in §5.4.
- **Level** = 101 → 401 depth.
- **Persona** = the audience a course serves (Executive, Engineer, Investor, Operator, Policy, Consultant). A **discovery lens only — never a gate.** Anyone can browse and (later) buy anything.
- **Pricing** = per-course: `Free` onramp courses, `$4.99` (101s), `$9.99` (most others), `$99` (Certification). The lobby only needs Free vs Paid for filtering.

The Lobby is the **front door**: a visitor lands, optionally says "I'm an Engineer," narrows by School / price / duration / certification, and scans the matching cards. Clicking a card's CTA sends them onward (to the course's landing URL when present). Buying, enrolling, and reading happen elsewhere and are **out of scope**.

---

## 2 · Goal & non-goals

**Goal.** A fast, branded, accessible catalog page that filters a set of published courses by the five required dimensions and displays matching course cards.

**In scope (MVP).**
- The five required filters: **Persona, School, Free/Paid, Duration, Certification**.
- Keyword **search** (title + description + school name) — standard for any catalog front door.
- **Sort** control (options constrained to data that actually exists — see §7.4).
- Responsive **course-card grid**, result count, active-filter chips, clear-all.
- Loading / empty / no-results / error states.
- URL-encoded filter state (shareable, back-button correct).

**Non-goals (explicitly OUT — do not build).**
- Checkout, payments, cart, wallet, tokens.
- Authentication, accounts, persona persistence to a backend.
- Course **detail** pages, lessons, video, SCORM, quizzes.
- Enrollment, progress, certificates, the cert brief workflow.
- Real Airtable/Supabase sync pipeline (a seed fixture stands in — §6).
- Writing ratings/reviews; B2B/org-assigned roles; admin/CMS.
- Recommendations beyond the simple persona-weighted sort in §7.4.

**Stretch (explicitly out of MVP, leave seams only):** Level filter, Program-Type filter, Theme filter. Data model includes these fields so they can be added later without migration, but **do not** build their UI now.

---

## 3 · Required filters (exact behavior)

| Filter | Control | Values | Default | Match rule |
|---|---|---|---|---|
| **Persona** | Single-select "I'm a…" switcher (chips/segmented) | Executive · Engineer · Investor · Operator · Policy · Consultant · *(All)* | All | If set, keep courses where `persona ∈ course.personas`. |
| **School** | Multi-select checklist, grouped by cluster (collapsible) | 23 Schools (§5.3) | none = all | If any selected, keep where `course.school.id ∈ selected` (OR within group). |
| **Free / Paid** | Single-select segmented | All · Free · Paid | All | Free → `isFree === true`; Paid → `isFree === false`. |
| **Duration** | Single-select segmented | Any · Under 1 hour · 1–3 hours · 3+ hours | Any | `<60`, `60–180` (inclusive), `>180` minutes. Boundaries fixed: 60 → "1–3"; 180 → "1–3"; 181 → "3+". |
| **Certification** | Toggle | off / on | off | On → `isCertification === true`. |
| Search *(supporting)* | Text input | free text | "" | Case-insensitive substring on `title + description + school.name`. |
| Sort *(supporting)* | Select | see §7.4 | Recommended | see §7.4 |

**Combination semantics:** **AND across filter groups; OR within a multi-select group** (School). Persona, Price, Duration, Certification are each single-valued (AND). Search ANDs with everything.

---

## 4 · Information architecture & layout

```
┌───────────────────────────────────────────────────────────────┐
│  HEADER                                                        │
│  Faraday Academy · tagline · "I'm a [Persona ▾]" switcher      │
├───────────────┬───────────────────────────────────────────────┤
│  FILTER RAIL  │  TOOLBAR: [search] · N results · chips · Sort▾ │
│  (sticky,     │ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│   desktop)    │ │ Course  │ │ Course  │ │ Course  │   GRID    │
│  • School ▸   │ │  card   │ │  card   │ │  card   │           │
│    (clusters) │ └─────────┘ └─────────┘ └─────────┘           │
│  • Price      │ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  • Duration   │ │  ...    │ │  ...    │ │  ...    │           │
│  • Cert ⏻     │ └─────────┘ └─────────┘ └─────────┘           │
│  • Clear all  │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

- **Header.** Wordmark "Faraday Academy", one-line tagline, and the persona switcher (persists in URL, not a backend).
- **Filter rail.** Left, sticky on desktop (`lg+`). On mobile (`< lg`) it collapses into a **"Filters" button → slide-over drawer** with the same controls and an "Apply / Clear" footer. School filter shows clusters as collapsible groups (§5.3).
- **Toolbar.** Search field, **live result count** (aria-live), **active-filter chips** (each removable; "Clear all"), and the sort select.
- **Grid.** Responsive course cards: 1 col (mobile) → 2 (`md`) → 3 (`lg`) → 4 (`xl`). Render all matches (catalog is small; see §12). 
- **States.** Loading skeletons, empty/no-results invitation, error panel (§10).

**Card anatomy.**
```
┌──────────────────────────────┐
│ [thumbnail or monogram tile] │
│ SCHOOL · LEVEL        ⬡ Cert  │  ← cluster-tinted school badge; cert badge only if isCertification
│ Course Title (serif)         │
│ One-line description…        │
│ ⏱ 45 min   ·   Free / $9.99  │
│ [Executive] [Investor]       │  ← persona tags (max 3 shown, "+N")
│ View course →                │  ← CTA; if no url → "Coming soon" (disabled)
└──────────────────────────────┘
```

---

## 5 · Data model & canonical reference

### 5.1 `Course` type (the data contract)

```ts
export type Persona =
  | "Executive" | "Engineer" | "Investor" | "Operator" | "Policy" | "Consultant";

export type Level = "101" | "201" | "301" | "401" | "X" | "Capstone";

export type ProgramType =
  | "Primer" | "Course" | "Track" | "Masterclass"
  | "Certification" | "Know the Players" | "Case Study" | "Workshop";

export type Cluster =
  | "Physical Stack" | "Commercial & Capital"
  | "Market & Policy" | "Operations & Resilience" | "Cross-Stack";

export interface School {
  id: string;        // "D2"
  name: string;      // "Power Architecture"
  cluster: Cluster;
}

export interface Course {
  id: string;                 // stable course code, e.g. "FA-D2-201"
  title: string;
  slug: string;               // url-safe, unique
  description: string;        // ≤160 chars, card copy
  school: School;
  level: Level;
  programType: ProgramType;
  personas: Persona[];        // ≥1
  durationMinutes: number;    // > 0
  priceUSD: number;           // 0 = free; else 4.99 | 9.99 | 99
  isFree: boolean;            // priceUSD === 0  (denormalized for clarity)
  isCertification: boolean;   // programType === "Certification"
  maturity: "Established" | "Developing" | "Candidate" | "Under Construction";
  themes: string[];           // ["T-001"…]  (carried for future; no UI in MVP)
  rating: number | null;      // 0–5, ONLY if real; else null (see §13)
  ratingCount: number | null;
  thumbnailUrl: string | null;
  url: string | null;         // CTA target (LearnWorlds landing); null → "Coming soon"
  status: "Published";        // lobby loads Published only
  updatedAt: string;          // ISO-8601
}
```

**Invariants the build must assume and the data must honor:** `personas.length ≥ 1`; `isFree === (priceUSD === 0)`; `isCertification === (programType === "Certification")`; `status === "Published"` for every row the lobby receives; `durationMinutes > 0`.

### 5.2 Personas (v1.0 — fixed list)
`Executive`, `Engineer`, `Investor`, `Operator`, `Policy`, `Consultant`. Self-selected, no gating, expandable later. (B2B/org-assigned roles are v2.0 — out of scope.)

### 5.3 Schools (23) and clusters — canonical

> **Count-agnostic rule (§13):** never render a total count of Schools/courses in UI copy. The list renders; "23" never appears as a headline number.

| Cluster | Schools (`id` — name) |
|---|---|
| **Physical Stack** | D1 Chips & Density · D2 Power Architecture · D7 Cooling & Water · D10 Construction · D20 Facility IT & OT |
| **Commercial & Capital** | D4 M&A & Capital Markets · D6 New Entrants · D15 Sovereign AI & Geopolitics · D19 Tax, Incentives & Fiscal Policy · D21 Insurance & Risk Markets |
| **Market & Policy** | D3 Grid & Regulatory · D13 Community Relations · D14 Real Estate & Site Selection · D18 Community Opposition & Regulatory Risk · D22 Industry Media & Analyst Coverage |
| **Operations & Resilience** | D8 People & Signals · D9 Orchestration · D17 Workforce & Labor Markets · D23 Outage Intelligence & Emergency Response |
| **Cross-Stack** | D5 Hyperscaler Activity · D11 Sustainability · D12 Networking & Interconnect · D16 Cyber & Physical Security |

*(5 + 5 + 5 + 4 + 4 = 23 Schools. This mapping is the single source of truth for `lib/constants.ts`.)*

### 5.4 Program Types (reference)
`Primer` (fluency, short) · `Course` (core) · `Track` (multi-course program) · `Masterclass` (401) · `Certification` ($99, the live-brief credential) · `Know the Players` (living reference) · `Case Study` · `Workshop`. *MVP surfaces these only as a card label and via the Certification toggle — no Program-Type filter UI.*

### 5.5 Duration buckets
`Under 1 hour` = `< 60` · `1–3 hours` = `60 ≤ d ≤ 180` · `3+ hours` = `> 180`.

---

## 6 · Data source & seed

**MVP rule: the page loads the entire published catalog once, server-side, and filters on the client.** Catalog size is in the tens-to-low-hundreds; this is correct and simplest.

`lib/catalog.ts` exposes:
```ts
export async function getCatalog(): Promise<Course[]>;
```
Resolution order, controlled by `process.env.ACADEMY_CATALOG_SOURCE` (default `"seed"`):
- `"seed"` → import `seed/courses.json` (Appendix A). **This is the default and requires no configuration.**
- `"supabase"` → read from a `academy_catalog` view via `@supabase/supabase-js` using `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. **Build this adapter as a thin, clearly-marked stub** that selects the `Course` columns and returns the same shape. Do not invent a schema beyond the contract in §5.1. If env is missing, fall back to seed and log once.

The page **server component** calls `getCatalog()` and passes the array to the client shell. (An optional `GET /api/academy/catalog` route may wrap `getCatalog()` for reuse; not required for MVP.)

**The real Airtable→Supabase sync is explicitly out of scope** — it follows the existing Briefing Library pattern and is a separate ticket. The seam above is all the lobby needs.

---

## 7 · Filter, sort & URL-state logic

### 7.1 Pure functions (unit-tested — `lib/filters.ts`)
```ts
export interface FilterState {
  persona: Persona | null;
  schools: string[];          // school ids
  price: "all" | "free" | "paid";
  duration: "any" | "lt60" | "60to180" | "gt180";
  certOnly: boolean;
  q: string;
  sort: SortKey;
}

export function applyFilters(courses: Course[], f: FilterState): Course[];
export function applySort(courses: Course[], sort: SortKey, persona: Persona | null): Course[];
export function activeChips(f: FilterState): Chip[];   // for the toolbar
```

### 7.2 Filter predicate (AND across groups; OR within School)
```
keep(course) =
  (f.persona == null         || course.personas.includes(f.persona))
  && (f.schools.length === 0  || f.schools.includes(course.school.id))
  && (f.price === "all"       || (f.price === "free" ? course.isFree : !course.isFree))
  && (f.duration === "any"    || bucket(course.durationMinutes) === f.duration)
  && (!f.certOnly             || course.isCertification)
  && (f.q.trim() === ""       || matchText(course, f.q))

bucket(d) = d < 60 ? "lt60" : d <= 180 ? "60to180" : "gt180"
matchText(c,q) = (c.title + " " + c.description + " " + c.school.name)
                 .toLowerCase().includes(q.trim().toLowerCase())
```

### 7.3 URL state schema (source of truth)
Query params (omit when default): `persona`, `schools` (comma list of ids), `price`, `duration`, `cert=1`, `q`, `sort`. The client hydrates `FilterState` from the URL on load and writes back on every change (Next.js `useRouter`/`useSearchParams`, shallow). Result: shareable links, correct back/forward, refresh-safe.

### 7.4 Sort (constrained to real data — see Precision value, §13)
| Key | Label | Order |
|---|---|---|
| `recommended` *(default)* | Recommended | If a persona is selected, persona-matching courses first; then `updatedAt` desc. With no persona: identical to Recently Updated. |
| `recent` | Recently Updated | `updatedAt` desc |
| `shortest` | Shortest first | `durationMinutes` asc |
| `longest` | Longest first | `durationMinutes` desc |
| `title` | Title A–Z | `title` asc |

> **Do NOT** offer "Most Popular" or "Highest Rated" in MVP: popularity/real ratings data does not exist yet, and fabricating it violates §13. Add those sorts only when real metrics land.

---

## 8 · Component breakdown & file tree

```
app/
  academy/
    page.tsx              # server: getCatalog() → <LobbyShell catalog=…/>
  layout.tsx             # fonts, brand <body> bg, metadata
  globals.css            # tokens + base
components/
  LobbyShell.tsx         # client: owns FilterState via URL; composes rail+toolbar+grid
  FilterRail.tsx         # desktop sticky rail; hosts the filter controls
  FilterDrawer.tsx       # mobile slide-over wrapping the same controls
  PersonaSwitcher.tsx    # "I'm a…" segmented control (header + drawer)
  SchoolFilter.tsx       # cluster-grouped, collapsible checklist
  PriceFilter.tsx        # All / Free / Paid segmented
  DurationFilter.tsx     # Any / <1h / 1–3h / 3h+ segmented
  CertToggle.tsx         # Certifications-only switch
  Toolbar.tsx            # search + result count (aria-live) + chips + sort
  ActiveChips.tsx        # removable chips + Clear all
  CourseGrid.tsx         # responsive grid + states
  CourseCard.tsx         # the card in §4
  EmptyState.tsx         # no-results invitation
  Skeletons.tsx          # loading placeholders
lib/
  catalog.ts             # getCatalog() + adapters (seed default; supabase stub)
  filters.ts             # PURE applyFilters / applySort / activeChips / bucket
  constants.ts           # PERSONAS, SCHOOLS, CLUSTERS, DURATION_BUCKETS, SORTS
  url.ts                 # FilterState ⇄ URLSearchParams
  types.ts               # Course, Persona, … (§5.1)
seed/
  courses.json           # Appendix A
__tests__/
  filters.test.ts        # §15
  card.test.tsx
  rail.test.tsx
```

`lib/filters.ts` must be **pure and dependency-free** (it is the unit-tested core). UI components never re-implement filtering.

---

## 9 · Visual design & brand

**Subject grounding.** This is a working intelligence academy for the AI-data-center industry — its world is power, infrastructure, capital, and signal. The design should feel like an *institutional research desk*, not a consumer MOOC: calm, editorial, precise. The signature element is the **cluster-tinted School badge + serif title pairing** on a warm, low-glare surface — the catalog reads like a shelf of briefings.

### 9.1 Palette (locked — do not substitute)
| Token | Hex | Use |
|---|---|---|
| `forest` | `#1C3424` | primary text, header, dark surfaces |
| `gold` | `#C4922A` | accent, focus, CTA — **never small text on white** (§13) |
| `warm-white` | `#F8F5F0` | page background (**never pure `#FFFFFF`**) |
| `sage` | `#8CA68A` | secondary/muted, borders, quiet fills |

Derive tints (e.g. forest-90/70/40, sage-20 for fills) rather than introducing new hues. Cluster badges use restrained tints of forest/sage — not five loud colors.

### 9.2 Typography
| Role | Face | Use |
|---|---|---|
| Display / titles | **IBM Plex Serif** | course titles, header wordmark, section heads |
| Body / UI | **Bricolage Grotesque** | controls, descriptions, chips, labels |
| Data / mono | **IBM Plex Mono** | duration, price, level, course codes |

Set a deliberate scale (e.g. title 18–20px serif; body 14–15px; mono 12–13px caps-tracked for metadata). Type is part of the identity — metadata in mono is the editorial tell.

### 9.3 Tailwind tokens (drop into `tailwind.config.ts`)
```ts
theme: { extend: {
  colors: {
    forest: "#1C3424", gold: "#C4922A",
    "warm-white": "#F8F5F0", sage: "#8CA68A",
  },
  fontFamily: {
    serif: ['"IBM Plex Serif"', "serif"],
    sans:  ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
    mono:  ['"IBM Plex Mono"', "monospace"],
  },
}}
```
Load the three families via `next/font/google` in `layout.tsx`. Page `body` background = `warm-white`; default text = `forest`.

### 9.4 Detailing
- Cards: 1px `sage`-tint border, generous padding, subtle hover lift **behind `@media (hover:hover)`** (no hover-only affordance carries meaning). Border-radius small and consistent.
- Focus: visible `gold` ring on every interactive element (keyboard-detectable).
- Motion: restrained — a single quiet fade/translate on result change; respect `prefers-reduced-motion` (disable transitions).
- Empty/loading have the same chrome as the grid (no jarring layout shift).

---

## 10 · States

| State | Trigger | Render |
|---|---|---|
| **Loading** | initial fetch / filtering large set | Skeleton cards (same grid footprint) + skeleton rail. |
| **Empty (no data)** | catalog returns `[]` | Calm panel: "The catalog is being prepared." (Not an error.) |
| **No results** | filters exclude all | Invitation, not a dead end: "No courses match these filters." + a **Clear all** action. Active filters remain visible so the user can adjust one. |
| **Error** | `getCatalog()` throws | Panel in the interface's voice: "We couldn't load the catalog. Reload to try again." + reload button. No stack traces, no apology theatre. |
| **Partial data** | a course missing `thumbnailUrl` / `rating` | Card degrades gracefully: monogram tile instead of image; rating simply absent (never "0★" or a fake number). `url === null` → CTA shows disabled "Coming soon". |

Copy follows §9/§13: active voice, sentence case, errors state what happened and what to do.

---

## 11 · Accessibility (WCAG 2.1 AA — required floor)

- Full **keyboard** path: every filter, chip, card CTA, drawer reachable and operable; logical tab order; Escape closes the mobile drawer and returns focus to its trigger.
- **Visible focus** (gold ring) on all interactive elements.
- Result count is an **`aria-live="polite"`** region ("12 courses"); filter groups are `fieldset`/`legend` or labelled `role="group"`.
- **No color-only meaning**: cert/price/level always carry text or icon+text, not hue alone.
- **Contrast** ≥ 4.5:1 for body text. Gold is decorative/large only; never small gold text on warm-white.
- Images have alt text; decorative tiles are `aria-hidden`.
- `prefers-reduced-motion` disables non-essential transitions.
- Run an automated axe check; **zero serious/critical** violations is a DoD gate.

---

## 12 · Performance

- Server-render the page shell; ship the catalog as serialized props (one payload, no client fetch waterfall).
- Client filtering is O(n) over a small array — memoize derived lists (`useMemo` keyed on `FilterState`).
- Lazy-load card images (`loading="lazy"`), fixed aspect ratio to prevent CLS.
- Budget: **LCP < 2.5s**, **CLS < 0.1**, no main-thread jank on filter change.
- If the catalog ever exceeds ~300 rows, introduce simple windowing/pagination — **note it, don't build it now**.

---

## 13 · Brand & content guardrails (non-negotiable)

1. **Count-agnostic copy.** Never display a total count of Schools or of the catalog as a headline/marketing number (e.g. no "Explore all 23 Schools", no "114 courses"). The **per-result count** in the toolbar ("12 courses") is fine — it's a live filter result, not a catalog-size claim.
2. **Precision value — no fabricated metrics.** Do not invent ratings, enrollment counts, "popularity", or "students taught". `rating` renders only when real and non-null. Seed data leaves most ratings `null`; the UI must look correct with ratings absent. No "Most Popular"/"Highest Rated" sorts in MVP.
3. **Palette discipline.** Background is `warm-white` (`#F8F5F0`) — **never pure `#FFFFFF`**. **Gold is never small text on white**; use it for accents, focus rings, large marks, and CTA fills with sufficient contrast.
4. **Typography roles.** IBM Plex Serif (titles) / Bricolage Grotesque (UI) / IBM Plex Mono (data) — per §9.2, used consistently.
5. **Persona is a lens, not a gate.** Selecting a persona only re-ranks/filters the *view*; it never hides purchasable products as "not allowed". Copy must not imply a course is restricted to a role.
6. **Voice.** Active, plain, sentence case. CTAs name the action ("View course"). Errors/empties direct, don't apologize.

---

## 14 · Tech stack & setup

- **Framework:** Next.js 14+ (App Router), TypeScript, React 18.
- **Styling:** Tailwind CSS + the tokens in §9.3; `next/font/google` for the three families.
- **Icons:** `lucide-react` only.
- **Data:** `@supabase/supabase-js` for the optional stub adapter (not exercised in seed mode).
- **Tests:** Vitest + React Testing Library + `@axe-core/react` (or `jest-axe`).
- **No** state-management lib (URL + `useState`/`useMemo`), **no** UI component framework, **no** CSS-in-JS.

**Setup the session should perform**
```bash
npx create-next-app@latest faraday-academy --ts --tailwind --app --eslint
cd faraday-academy
npm i lucide-react @supabase/supabase-js
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @axe-core/react
# scaffold §8 file tree, drop in seed/courses.json (Appendix A)
npm run dev   # → /academy
```
**Deploy target:** Vercel (default). **Repo:** new `Faraday-Academy` repo (default — see §17).

---

## 15 · Test plan

**Unit — `lib/filters.ts` (must pass):**
- Persona: course with `["Engineer","Executive"]` is kept for persona `Engineer`, dropped for `Investor`.
- School OR: selecting `["D2","D7"]` returns only those Schools; empty selection returns all.
- Price: Free returns only `isFree`; Paid returns only `!isFree`.
- Duration **boundaries**: 59→`lt60`, 60→`60to180`, 180→`60to180`, 181→`gt180`.
- Cert toggle: on → only `isCertification`.
- Search: case-insensitive; matches title, description, and school name; trims.
- Combination: persona + school + price + duration + cert + q together (AND); confirm a row that passes all and one that fails exactly one.
- Empty result returns `[]` (drives No-results state).
- Sort: `recommended` puts persona matches first then recent; `shortest`/`longest`/`title` ordering correct; stable.

**Component (RTL):**
- Toggling a School checkbox updates the rendered count and grid.
- Selecting a persona re-ranks and updates chips + URL.
- `CourseCard` renders: free price, paid price, cert badge, missing thumbnail (monogram), missing rating (no star), `url===null` (disabled "Coming soon").
- Mobile drawer opens/closes; focus returns to trigger on Escape.

**A11y:** axe pass with no serious/critical issues; keyboard-only walkthrough of all filters and a card CTA.

**Responsive:** grid is 1/2/3/4 cols at the breakpoints; rail becomes drawer below `lg`.

---

## 16 · Acceptance criteria / Definition of Done

- [ ] `/academy` renders the seed catalog with the header, filter rail, toolbar, and card grid.
- [ ] All five required filters work, with the exact semantics in §3/§7, plus search and sort.
- [ ] Filters combine AND-across / OR-within-School; results and the aria-live count update live.
- [ ] Filter state is URL-encoded; refresh and back/forward preserve it; links are shareable.
- [ ] Persona switcher filters/re-ranks only (no gating); chips show active filters; Clear all resets.
- [ ] Loading, empty, no-results, error, and partial-data states all render per §10.
- [ ] Brand guardrails §13 all hold (count-agnostic; no fabricated ratings; warm-white not pure white; gold never small-on-white; correct fonts).
- [ ] WCAG 2.1 AA floor (§11) met; axe reports no serious/critical violations; full keyboard operation.
- [ ] `npm run build` passes; unit + component tests green.
- [ ] Only the dependencies in §14 are used; `lib/filters.ts` is pure and fully tested.
- [ ] No out-of-scope feature (§2) was built.

---

## 17 · Open decisions (defaulted — build proceeds on these)

| # | Decision | Default chosen for the build | Flag if reviewer disagrees |
|---|---|---|---|
| 1 | Repo target | New standalone `Faraday-Academy` Next.js app on Vercel | Could instead be a `/academy` route in the existing engine repo. |
| 2 | Data source | **Seed fixture** (Appendix A); Supabase adapter as a stub behind env | Real Airtable→Supabase sync is a separate ticket. |
| 3 | School count | **23** Schools per the cluster mapping in §5.3 | Earlier note said "22"; the cluster table sums to 23. Confirm; UI stays count-agnostic either way. |
| 4 | CTA behavior | Link to `course.url` when present (same tab); else disabled **"Coming soon"** | No course-detail page exists in MVP. |
| 5 | School filter match | **Primary School only** (`course.school.id`) | Secondary-domain matching deferred. |
| 6 | Persona model | **Single-select** switcher, self-selected, no persistence | Multi-persona filter + backend persistence deferred to v2.0. |
| 7 | Sorts offered | Recommended / Recent / Shortest / Longest / Title | Popular & Top-Rated withheld until real metrics exist (§13). |

---

## 18 · Anticipated adversarial critiques & resolutions

*(Pre-empting the review so the build session inherits resolved positions.)*

1. **"Where does the data come from — Airtable? Supabase? You can't build against nothing."** → §6: a defined `Course` contract + a complete committed **seed fixture** (Appendix A) make the page fully buildable and testable with zero infrastructure; a typed Supabase stub leaves the real seam. The Airtable→Supabase sync is explicitly out of scope.
2. **"Client-side filtering won't scale."** → §12: catalog is tens-to-low-hundreds; O(n) client filtering is correct for MVP. Windowing/pagination is named as the upgrade trigger (>~300 rows), not prematurely built.
3. **"Ratings/popularity on cards will be fake."** → §13.2 + §7.4: ratings render only when real; most seed ratings are `null`; Popular/Top-Rated sorts are withheld. Precision value held.
4. **"'23 Schools' violates count-agnostic copy."** → §13.1: no catalog-size number in copy; only the live per-result count appears. The 23 figure lives in the data/spec, never in UI chrome.
5. **"Persona could be read as access control."** → §13.5 + §3: persona is a single-select discovery lens; it filters/re-ranks the view and never marks a product restricted.
6. **"Duration bucket boundaries are ambiguous (is 60 min '<1h' or '1–3h'?)."** → §5.5/§7.2 fix them explicitly: `<60`, `60–180` inclusive, `>180`; tested at 59/60/180/181.
7. **"Filter combination semantics are unstated."** → §3/§7.2: AND across groups, OR within School; spelled out and unit-tested.
8. **"Mobile is an afterthought."** → §4/§11: rail→drawer pattern, focus management, touch targets, responsive grid are specified and in the DoD.
9. **"Brand could drift to a generic MOOC look."** → §9: locked palette/fonts, a named signature element, warm-white-not-white and gold rules, mono-metadata editorial tell.
10. **"Scope creep."** → §2 names non-goals and marks Level/Type/Theme filters as out; §16 DoD includes "no out-of-scope feature was built."
11. **"State lost on refresh / not shareable."** → §7.3: URL is the source of truth; refresh/back/forward safe; shareable links.
12. **"Accessibility hand-waving."** → §11 is a concrete AA checklist with an axe gate and keyboard walkthrough in the test plan.

---

## Appendix A · Seed dataset (`seed/courses.json`)

> Representative sample exercising every edge: free & paid, all price points, a Certification, a Track, multi-persona, missing thumbnail, mostly-null ratings, duration-boundary values (45/60/90/180/240), multiple clusters. Codes/titles are illustrative and DRAFT (subject to the FAR-56 editorial gate) — fine for build and review.

```json
[
  {
    "id": "FA-D2-101", "title": "Power Architecture in 45 Minutes", "slug": "power-architecture-primer",
    "description": "The fast read on how a gigawatt campus actually gets powered.",
    "school": { "id": "D2", "name": "Power Architecture", "cluster": "Physical Stack" },
    "level": "101", "programType": "Primer", "personas": ["Executive","Consultant","Investor"],
    "durationMinutes": 45, "priceUSD": 0, "isFree": true, "isCertification": false,
    "maturity": "Established", "themes": ["T-001"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/power-architecture-primer",
    "status": "Published", "updatedAt": "2026-06-10T00:00:00Z"
  },
  {
    "id": "FA-D2-201", "title": "Grid Interconnection & Large-Load Tariffs", "slug": "grid-interconnection-tariffs",
    "description": "BYOG, co-location precedent, and the queue that gates every build.",
    "school": { "id": "D2", "name": "Power Architecture", "cluster": "Physical Stack" },
    "level": "201", "programType": "Course", "personas": ["Engineer","Operator","Policy"],
    "durationMinutes": 90, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Established", "themes": ["T-001","T-007"], "rating": 4.7, "ratingCount": 38,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/grid-interconnection-tariffs",
    "status": "Published", "updatedAt": "2026-06-12T00:00:00Z"
  },
  {
    "id": "FA-D2-TRK", "title": "Powering the AI Data Center (Track)", "slug": "powering-the-ai-data-center",
    "description": "Primer to capstone: the full power stack as one program.",
    "school": { "id": "D2", "name": "Power Architecture", "cluster": "Physical Stack" },
    "level": "Capstone", "programType": "Track", "personas": ["Engineer","Operator"],
    "durationMinutes": 240, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-001"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": null,
    "status": "Published", "updatedAt": "2026-06-01T00:00:00Z"
  },
  {
    "id": "FA-D2-CERT", "title": "Faraday Power Architecture Practitioner", "slug": "power-architecture-certification",
    "description": "Prove you can read live power-market signals, not fixed content.",
    "school": { "id": "D2", "name": "Power Architecture", "cluster": "Physical Stack" },
    "level": "401", "programType": "Certification", "personas": ["Engineer","Investor","Consultant"],
    "durationMinutes": 180, "priceUSD": 99, "isFree": false, "isCertification": true,
    "maturity": "Developing", "themes": ["T-001"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/power-architecture-certification",
    "status": "Published", "updatedAt": "2026-06-15T00:00:00Z"
  },
  {
    "id": "FA-D7-101", "title": "Cooling & Water in 45 Minutes", "slug": "cooling-water-primer",
    "description": "Heat rejection, water risk, and the PFAS-free coolant transition.",
    "school": { "id": "D7", "name": "Cooling & Water", "cluster": "Physical Stack" },
    "level": "101", "programType": "Primer", "personas": ["Executive","Engineer"],
    "durationMinutes": 45, "priceUSD": 4.99, "isFree": false, "isCertification": false,
    "maturity": "Established", "themes": ["T-002"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/cooling-water-primer",
    "status": "Published", "updatedAt": "2026-06-09T00:00:00Z"
  },
  {
    "id": "FA-D7-301", "title": "Thermal Components & Coolant Supply Chain", "slug": "thermal-components-supply-chain",
    "description": "CDUs, cold plates, and where the supply chain actually binds.",
    "school": { "id": "D7", "name": "Cooling & Water", "cluster": "Physical Stack" },
    "level": "301", "programType": "Course", "personas": ["Engineer","Operator"],
    "durationMinutes": 120, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-002"], "rating": 4.5, "ratingCount": 11,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/thermal-components-supply-chain",
    "status": "Published", "updatedAt": "2026-05-28T00:00:00Z"
  },
  {
    "id": "FA-D4-201", "title": "Private Credit & Data-Center Debt", "slug": "private-credit-dc-debt",
    "description": "Project finance, DC ABS, and lease-backed structures explained.",
    "school": { "id": "D4", "name": "M&A & Capital Markets", "cluster": "Commercial & Capital" },
    "level": "201", "programType": "Course", "personas": ["Investor","Executive","Consultant"],
    "durationMinutes": 90, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Established", "themes": ["T-004"], "rating": 4.8, "ratingCount": 52,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/private-credit-dc-debt",
    "status": "Published", "updatedAt": "2026-06-14T00:00:00Z"
  },
  {
    "id": "FA-D4-KTP", "title": "M&A — Know the Players", "slug": "ma-know-the-players",
    "description": "The capital allocators and dealmakers behind the buildout.",
    "school": { "id": "D4", "name": "M&A & Capital Markets", "cluster": "Commercial & Capital" },
    "level": "201", "programType": "Know the Players", "personas": ["Investor"],
    "durationMinutes": 60, "priceUSD": 4.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-004"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/ma-know-the-players",
    "status": "Published", "updatedAt": "2026-06-03T00:00:00Z"
  },
  {
    "id": "FA-D15-101", "title": "Sovereign AI & Geopolitics in 45 Minutes", "slug": "sovereign-ai-primer",
    "description": "Export controls, national compute, and the new infrastructure map.",
    "school": { "id": "D15", "name": "Sovereign AI & Geopolitics", "cluster": "Commercial & Capital" },
    "level": "101", "programType": "Primer", "personas": ["Executive","Policy","Investor","Consultant"],
    "durationMinutes": 50, "priceUSD": 0, "isFree": true, "isCertification": false,
    "maturity": "Established", "themes": ["T-006"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/sovereign-ai-primer",
    "status": "Published", "updatedAt": "2026-06-11T00:00:00Z"
  },
  {
    "id": "FA-D3-301", "title": "Transmission Buildout & FERC Policy", "slug": "transmission-ferc-policy",
    "description": "Order 1920, NIETC corridors, and the bottleneck behind the queue.",
    "school": { "id": "D3", "name": "Grid & Regulatory", "cluster": "Market & Policy" },
    "level": "301", "programType": "Course", "personas": ["Policy","Operator","Investor"],
    "durationMinutes": 150, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Established", "themes": ["T-001","T-007"], "rating": 4.6, "ratingCount": 24,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/transmission-ferc-policy",
    "status": "Published", "updatedAt": "2026-06-08T00:00:00Z"
  },
  {
    "id": "FA-D18-201", "title": "The Opposition Register", "slug": "opposition-register",
    "description": "Blocked, delayed, advanced: reading permit-denial patterns.",
    "school": { "id": "D18", "name": "Community Opposition & Regulatory Risk", "cluster": "Market & Policy" },
    "level": "201", "programType": "Course", "personas": ["Operator","Policy","Consultant"],
    "durationMinutes": 90, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-003"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/opposition-register",
    "status": "Published", "updatedAt": "2026-05-30T00:00:00Z"
  },
  {
    "id": "FA-D9-301", "title": "Inference Serving & Model-Routing Infrastructure", "slug": "inference-serving-infra",
    "description": "vLLM, Triton, and scheduling against token economics.",
    "school": { "id": "D9", "name": "Orchestration", "cluster": "Operations & Resilience" },
    "level": "301", "programType": "Course", "personas": ["Engineer"],
    "durationMinutes": 120, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-005"], "rating": 4.9, "ratingCount": 17,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/inference-serving-infra",
    "status": "Published", "updatedAt": "2026-06-13T00:00:00Z"
  },
  {
    "id": "FA-D23-201", "title": "Reading the Outage", "slug": "reading-the-outage",
    "description": "Turning incident signals into emergency-response intelligence.",
    "school": { "id": "D23", "name": "Outage Intelligence & Emergency Response", "cluster": "Operations & Resilience" },
    "level": "201", "programType": "Case Study", "personas": ["Operator","Engineer"],
    "durationMinutes": 60, "priceUSD": 4.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-007"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/reading-the-outage",
    "status": "Published", "updatedAt": "2026-06-05T00:00:00Z"
  },
  {
    "id": "FA-D16-101", "title": "Security Foundations for AI Infrastructure", "slug": "security-foundations",
    "description": "The threat surface of a modern AI data center, end to end.",
    "school": { "id": "D16", "name": "Cyber & Physical Security", "cluster": "Cross-Stack" },
    "level": "101", "programType": "Course", "personas": ["Engineer","Operator","Executive"],
    "durationMinutes": 75, "priceUSD": 4.99, "isFree": false, "isCertification": false,
    "maturity": "Developing", "themes": ["T-005"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/security-foundations",
    "status": "Published", "updatedAt": "2026-06-07T00:00:00Z"
  },
  {
    "id": "FA-D5-401", "title": "Build-vs-Lease & Capacity Geography (Masterclass)", "slug": "build-vs-lease-masterclass",
    "description": "Owned vs wholesale mix and region expansion as a demand signal.",
    "school": { "id": "D5", "name": "Hyperscaler Activity", "cluster": "Cross-Stack" },
    "level": "401", "programType": "Masterclass", "personas": ["Investor","Executive","Consultant"],
    "durationMinutes": 180, "priceUSD": 9.99, "isFree": false, "isCertification": false,
    "maturity": "Established", "themes": ["T-004","T-006"], "rating": 4.8, "ratingCount": 9,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/build-vs-lease-masterclass",
    "status": "Published", "updatedAt": "2026-06-04T00:00:00Z"
  },
  {
    "id": "FA-D11-101", "title": "Sustainability in 45 Minutes", "slug": "sustainability-primer",
    "description": "Carbon, water, and the reporting frames that bind new builds.",
    "school": { "id": "D11", "name": "Sustainability", "cluster": "Cross-Stack" },
    "level": "101", "programType": "Primer", "personas": ["Executive","Policy","Consultant"],
    "durationMinutes": 45, "priceUSD": 0, "isFree": true, "isCertification": false,
    "maturity": "Established", "themes": ["T-007"], "rating": null, "ratingCount": null,
    "thumbnailUrl": null, "url": "https://academy.faraday.example/c/sustainability-primer",
    "status": "Published", "updatedAt": "2026-06-06T00:00:00Z"
  }
]
```

## Appendix B · `lib/constants.ts` source data

- **PERSONAS** = `["Executive","Engineer","Investor","Operator","Policy","Consultant"]`
- **CLUSTERS** (ordered) = `["Physical Stack","Commercial & Capital","Market & Policy","Operations & Resilience","Cross-Stack"]`
- **SCHOOLS** = the 23 `{id,name,cluster}` rows in §5.3 (single source of truth for the School filter).
- **DURATION_BUCKETS** = `[{key:"any",label:"Any"},{key:"lt60",label:"Under 1 hour"},{key:"60to180",label:"1–3 hours"},{key:"gt180",label:"3+ hours"}]`
- **SORTS** = `[{key:"recommended",label:"Recommended"},{key:"recent",label:"Recently Updated"},{key:"shortest",label:"Shortest first"},{key:"longest",label:"Longest first"},{key:"title",label:"Title A–Z"}]`

*End of spec.*
