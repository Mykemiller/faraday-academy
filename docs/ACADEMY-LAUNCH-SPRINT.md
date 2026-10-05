# Faraday Academy — Launch Sprint framing
**Drafted 2026-09-12 · status: PROPOSED · tracker: Linear (Jira shelved for Academy)**
**Decisions locked 2026-09-12 (Myke):** D1 = W0 runs as a fourth parallel stream ·
D2 = OCP curated crosswalk · D3 = pricing optimizes for **retention & completion**.
D4 (Mach voice) remains open.

All figures below were verified by query against Supabase `ycadmmngkdhvpcsrcuaq` and the live
lobby on 2026-09-12. No figure is carried from a Notion page without re-verification.

---

## 0 · Ground truth

| Fact | Value | Source |
|---|---|---|
| Courses in system of record | 126 (90 approved · 36 backlog) | `academy_courses` |
| Published | **0** | `academy_courses.status` |
| Lessons authored | 720 | `academy_course_lessons` |
| Narration jobs | 720 — **100% `queued`, 0 rendered** | `academy_narration_queue` |
| Pricing in SoR | 101 → $4.99 (22) · all else → $9.99 (104) · all `Purchased` | `academy_courses` |
| Registry spine | 23 Domains · 117 active Sub-Domains · 7 Themes | `faraday_*` |
| Last production activity | 2026-07-20 (one course touched 2026-08-30) | `academy_review_log` |

**The catalog is finished. Nothing can be bought, and nothing can be delivered.**

---

## 1 · The framing problem

The three workstreams named are all *pre-launch content and pricing work*. None of them is what
is actually blocking launch. Ninety Myke-approved courses have been sitting unpublished for
eight weeks behind four items: LearnWorlds API access, ElevenLabs credentials, the billing rail
decision (AC-011), and a public lobby that contradicts the locked commercial model.

Run W1–W3 alone and the sprint ends with a refreshed, enriched, re-priced curriculum that still
cannot be sold. **W0 is locked in as a fourth parallel stream** (D1). It is the only one with a
customer-visible defect in it today, and the credentials arriving this weekend unblock most of it.

### The pricing-order trap

D3 selects **retention & completion** as the stickiness objective. That reopens a question AC-003
closed: a free 101 onramp is precisely what a retention objective wants, and AC-003 killed the free
layer on a revenue-shaped rationale that D3 supersedes.

Consequence: **do not "fix" the $0 primers yet.** Raising 23 courses $0 → $4.99 to match the locked
model, then reversing after W3-1, is two public price changes in one sprint. Split the work — ship
the unambiguous defects now, hold the price itself until the model lands.

---

## W0 · Ship it (proposed — the actual critical path)

| ID | Issue | Notes |
|---|---|---|
| W0-1 | **HELD** — pending W3-1. Reconcile lobby price with whatever model lands | 23 courses live at **$0**; SoR says $4.99. Do not change twice — see the pricing-order trap |
| W0-2 | **HELD** — pending W3-1. Free facet stays or goes with the free-layer decision | Tied to W0-1; same reasoning |
| W0-3 | Stop emitting `status: "Published"` | All 112 live rows claim Published; 0 are. Unambiguous defect — ship now |
| W0-4 | Fix or suppress 23 course deep-links | All 404 (verified). They are the 23 most-clicked primers. Unambiguous defect — ship now |
| W0-5 | Repoint lobby source Airtable → Supabase | Kills this divergence class permanently. Faraday invariant: *never treat Airtable as authoritative* |
| W0-6 | Confirm LearnWorlds API access → unblock Gutenberg | Credentials this weekend |
| W0-7 | ElevenLabs credentials + Mach voice decision → render 720 jobs | Credentials this weekend; Mach voice still an open decision |
| W0-8 | Billing rail (AC-011): LearnWorlds native vs Stripe | Blocks checkout. Depends on W3 |
| W0-9 | First publish: the 23 Tower 101s | Definition of done for the sprint |

W0-1..W0-5 are a Change Control under **Public claims & surface**. W0-1 touches a customer-visible
figure — needs the lock before it ships.

---

## W1 · Refresh curriculum to current IDF (IDF 5.0, canonical 2026-08-26)

**This is much smaller than it sounds.** Verified: the Academy already reads the shared spine, sees
all 117 active Sub-Domains including D2.11, and has **zero orphan sub-domain tags**. The re-tag is
not a re-tag.

| ID | Issue | Evidence |
|---|---|---|
| W1-1 | Collapse `maturity` enum to Established / Developing | 5.0 §05 retires Candidate + Under Construction. Already only these two in use (99 / 11) — enum drop + backfill of **16 NULLs**, all on approved courses |
| W1-2 | Decide whether D2.11 *Power Price Formation & Cost Structure* needs a course | The 117th sub-domain; currently no Academy coverage |
| W1-3 | Extend the tag contract per 5.0 §06 | Every artifact now tags Theme / Domain / Sub-Domain / **Entity (typed)** / **Jurisdiction (with `method`)**. Academy carries the first three |
| W1-4 | **Retire "Key Player" from Release 2** | 5.0 §02.2 retires the term outright. Release 2 is literally *"Know the Players — Key Players + Emerging Players"*. Reframe to Companies (Entity axis) + People surfaced as **Voices** |
| W1-5 | Audit content against R1/R2 | People and Research are entity types, not Domains. **D8 and D22 explicitly unchanged** — low risk, but confirm no course teaches the retired model |
| W1-6 | Refresh the Academy Overview hub | The Sprint 1 task from Curriculum 4.0 that never ran. Still shows 9+2 domains, the retired tier ladder, Teachable, and a 27-course count |
| W1-7 | Supersede Curriculum 4.0 → 5.0 alignment record | 4.0 is retired; the Academy's canonical curriculum page still cites it |

Note: `faraday_subdomains` holds 118 rows, 117 active — matches 5.0 canon exactly. No drift.

---

## W2 · OCP Academy enrichment

⚠️ **The "1,000+ lessons" figure needs verifying before anything is scoped on it.** Evidence so far
points to a substantially smaller catalog: OCP Academy launched on **Docebo** with two inaugural
catalogs (Data Center Technologies, OCP Community Orientation) and series in the 6–9 course range.
The "1000+" that appears publicly is a **Class Central aggregate over all OCP content** (conference
talks, videos), not OCP Academy lessons. Sizing W2 off the wrong number is the main risk here.

| ID | Issue |
|---|---|
| W2-1 | **Verify the real catalog**: count, structure, and whether Docebo exposes a public catalog or API |
| W2-2 | Clear licensing: linking, deep-linking, attribution, and whether OCP wants a partnership conversation |
| W2-3 | ~~Decide integration depth~~ **LOCKED: curated crosswalk** (D2) |
| W2-4 | Build the crosswalk: OCP lesson → Sub-Domain `D#.#` |
| W2-5 | Schema: `academy_external_resources` + provenance, under the same Myke sign-off trigger |
| W2-6 | Surface in the lesson template and lobby |

Strategic note worth holding onto: OCP content is **free and vendor-neutral**. Pointing at it costs
Faraday nothing and makes the Academy the place that organizes the field — but it also anchors a
"why pay $9.99" question that W3 has to answer.

---

## W3 · Pricing & certification model

Current locked model (June 11): $4.99 per 101 · $9.99 all others · $99 flat per certification ·
passing grants 5,000 tokens · no free layer.

| ID | Issue |
|---|---|
| W3-1 | Options paper: 3 candidate models optimizing **retention & completion** (D3). Must explicitly answer the free-101-onramp question — it gates W0-1/W0-2 |
| W3-2 | Reconcile with the token economy (was FAR-44/46) and IDF 5.0 §05 **Tier Access — content-gating only, never pricing** |
| W3-3 | Confirm certification design: Domain-scoped, $99, live-brief (3 briefs / 90 days) |
| W3-4 | **Migration: `academy_commercial_rules` is CHECK-locked** to $4.99/$9.99/$99/5,000. The database will reject any new model until this changes |
| W3-5 | Implement in lobby + LearnWorlds + billing rail |

W3-4 is a hard dependency: **W3 must land before W0-8/W0-9**, or the first publish ships on the old
model and has to be re-priced in public.

---

## 2 · Linear setup

Not yet possible — no Linear MCP server is connected to this session. Once connected:

- **Project:** Faraday Academy — Launch
- **Milestones:** W0 Ship it · W1 IDF 5.0 · W2 OCP · W3 Commercial
- **Labels:** `surface:public` · `needs-myke-lock` · `blocked:credentials` · `cc-required`
- **Jira crosswalk issue:** FAR-30, FAR-44, FAR-46, FAR-370 and the FAR-149/FAR-56 editorial-gate
  reference are cited throughout Notion. Shelving Jira dangles them — one issue to map old → new
  and annotate the Notion pages, or the references rot.

---

## 3 · Decisions needed before work starts

- ~~**D1**~~ ✅ W0 runs as a fourth parallel stream
- ~~**D2**~~ ✅ OCP curated crosswalk
- ~~**D3**~~ ✅ Pricing optimizes for retention & completion
- **D4** — **OPEN.** Mach voice (open since July; blocks ~a third of the 720 narration jobs)
- **D5** — **NEW, raised by D3.** Does the free 101 onramp come back? Gates W0-1, W0-2, W3-4

Governance unchanged: nothing goes subscriber-facing without explicit Myke sign-off, enforced by
the database trigger. This document is Proposed and governs nothing until locked.
