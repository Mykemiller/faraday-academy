# Proposal — Course Media Enhancements: Audio Narration + Animated Graphics

**Prepared:** 2026-07-19 · **Status:** proposal for Myke go/no-go · **Scope:** a repeatable
production process to add (1) audio narration and (2) animated illustrations to every Faraday
Academy course, integrated with the existing `academy_*` pipeline and governance.

This is a *process* proposal, not a build. Nothing is generated until Myke approves the
approach and the two open cost/tooling decisions below.

---

## 0. Investigation — what we already have to build on

The environment already contains a **proven, end-to-end media pipeline** we should reuse rather
than reinvent: the **Walt** skill (Throughline cast producer). Walt does exactly the hard part
of enhancement #1 today, for a different content type:

> Script → **ElevenLabs** TTS (cached per-voice IDs) → optional **HeyGen** avatar →
> **Cloudflare R2** (bytes) → **Supabase** (metadata) → **Airtable** (catalog), with
> idempotency, a lifecycle (`produced → approved → published`), graceful failure handling, and
> a "never publish automatically" rule.

That pattern maps almost 1:1 onto course narration. For animated graphics, the relevant
available tooling is **Canva** (design + animation + video export), **Gamma** (animated
web/slide content), **Figma** (motion/`export_video`), plus the local `canvas-design`,
`algorithmic-art`, and `slack-gif-creator` skills for programmatic SVG/Lottie/GIF output.

**Design principle for both:** media is expensive to generate and re-generate. Gate all
production on `status='approved'` so we only ever spend on courses Myke has signed off — never
on drafts that may change. This mirrors Walt's lifecycle discipline and the Academy's existing
approval gate.

---

## 1. Shared foundation — one media table + lesson columns (one migration)

Both enhancements write to a single new table so media is queryable, versioned, and parity-
checkable by Ariadne alongside course metadata.

```
academy_course_media
  id                uuid pk
  course_id         uuid  -> academy_courses(id) on delete cascade
  lesson_id         uuid  -> academy_course_lessons(id) null   (null = course/module-level asset)
  module_id         uuid  -> academy_course_modules(id) null
  media_type        enum  ('audio_narration','animated_graphic')
  provider          text  ('elevenlabs','canva','figma','gamma','lottie', ...)
  voice             academy_voice null        (audio: which brand voice was used)
  r2_url            text                        (canonical bytes location)
  duration_seconds  numeric null
  source_hash       text                        (hash of the source lesson/point text -> staleness detection)
  status            enum  ('queued','produced','approved','published','stale','failed')
  cost_usd          numeric null                (per-asset spend, for Hermes reporting)
  generated_at      timestamptz
  notes             text
  -- service-role-only RLS, same pattern as every academy_* table
```

Plus convenience columns on `academy_course_lessons`: `narration_media_id uuid`,
`narration_status` (mirrors media.status). `source_hash` is the key to safe regeneration: when
a lesson body changes after narration, the hash mismatches → asset flips to `stale` and is
re-queued, so we never ship audio that no longer matches the prose.

**Governance:** a `BEFORE INSERT/UPDATE` trigger identical in spirit to the course approval gate
— media cannot reach `published` without the Myke-sign-off GUC. Media production itself is
allowed only when the parent course is `approved` (enforced in the producer skill + a CHECK-
style guard).

---

## 2. Enhancement #1 — Audio narration (adapt Walt)

**New skill: `faraday-course-narrator` ("Orpheus").** Directly patterned on Walt.

### Voices
Two cached brand voices, one per Academy voice persona:
- **Gil** voice ID (empiricist — warm, measured, mid-tempo)
- **Mach** voice ID (theorist — faster, crisper, declarative)

Cached exactly as Walt caches `ElevenLabs Voice ID` per character — resolved once, reused
forever. Model `eleven_multilingual_v2`, tuned `voice_settings` per voice (Gil slightly higher
stability; Mach slightly lower for pace). **Open item:** the two voice IDs must be chosen/
cloned and pinned (see §5).

### Per-course process (only when course is `approved`)
1. **Resolve** the course + its assigned voice (`academy_courses.voice` → Gil/Mach; `Both`
   courses default to Gil for narration unless flagged).
2. **Build the narration script per lesson** from `academy_course_lessons.body`, with a light
   "spoken-form" pass: expand or drop visual-only references ("as the table shows"), keep the
   "Faraday's Take" callouts as distinct narrated segments, and *never* read the metadata block
   (Domain Reference Rule already keeps codes out of prose, so the body is clean to narrate).
3. **TTS** each lesson via ElevenLabs → mp3 (Walt Step 6).
4. **Store**: upload to R2 under `academy/audio/{course_code}/{lesson}.mp3`; write an
   `academy_course_media` row (`media_type='audio_narration'`, voice, duration, cost, hash);
   set `narration_media_id` on the lesson.
5. **Idempotency/staleness**: skip lessons whose `source_hash` already matches a `produced`
   asset; re-queue where the hash changed.
6. **Report** per course: lessons narrated, total minutes, total cost, any failures.

### Governance & review
- Produced audio lands at `status='produced'`, **not** published. Argus gains a light audio
  lens (optional): spot-check that narration matches the approved script and carries no banned
  vocabulary artifacts. Myke sign-off promotes `produced → approved`.
- Hermes reads `cost_usd` for the media spend line in its weekly report.

### Effort/volume
A 101 course ≈ 8 lessons × ~700 words ≈ ~40–50 narrated minutes. ElevenLabs TTS is inexpensive
per minute; the ~114-SKU catalog is a bounded, one-time generation cost plus re-runs on edits.
Exact $ depends on the ElevenLabs plan/tier (see §5).

---

## 3. Enhancement #2 — Animated graphics for key points

Harder and more subjective than audio, so propose a **tiered approach** and start narrow.

### What "key point" means (scope the surface deliberately)
Do **not** animate everything. Target the highest-leverage moments:
- **One animated explainer per module's "Faraday's Take"** (3–5 per course), the sharpest
  conceptual beats — e.g. the four tax levers; the "stacked-cheese-slice" failure model; the
  RTO-vs-RPO trade-off. These are already written to be memorable; animation reinforces them.
- Optionally, one course-level title/cover animation.

That bounds the batch to ~4 assets/course rather than ~8+ per-lesson pieces.

### Production options (recommend a two-track choice)
| Track | Tooling | Output | Best for | Trade-off |
|---|---|---|---|---|
| **A. Template-driven** (recommended v1) | **Canva** MCP (brand-template → animated design → `export-design` to mp4/gif) | Short branded motion cards | Consistency, speed, on-brand, low per-asset cost | Less bespoke; constrained to template motion |
| **B. Programmatic** | `canvas-design`/`algorithmic-art` → SVG + Lottie/CSS animation, or Figma `export_video` | Data-driven diagrams (curves, flows) | Concept diagrams that are genuinely illustrative | More authoring effort per asset |
| **C. Slide-native** | **Gamma** animated cards | Quick explainer sequences | Fast drafts, internal review | Weaker brand control; not a per-point asset |

**Recommendation:** standardize on **Track A (Canva brand templates)** for v1 to get consistent,
on-brand motion cards at volume, and reserve **Track B** for the handful of concepts that need a
real data diagram. Build one Canva brand template per "point type" (definition, trade-off,
process-flow, myth-vs-reality) so Scheh/Ariadne can map a Faraday's Take to a template + fill
the copy, and the producer skill renders + exports.

### New skill: `faraday-course-illustrator` ("Daumier")
1. For each `approved` course, select the module Faraday's Takes as the animation targets.
2. Classify each into a template type; fill the template with the point's copy (plain-language,
   Domain-Reference-Rule clean).
3. Render + export via Canva; upload to R2 (`academy/graphics/{course_code}/{module}.mp4`);
   write `academy_course_media` (`media_type='animated_graphic'`, provider, cost, hash).
4. Land at `produced`; Myke sign-off promotes to `approved`.

### Governance / brand
- Argus voice-canon lens extends to the animated copy (same banned-vocabulary + count-agnostic
  + code-leakage checks apply to on-screen text).
- Brand consistency via the `brand-guidelines` / `theme-factory` skills feeding the Canva
  templates.

---

## 4. How it plugs into the existing pipeline

```
Scheh authors ─► Argus dual-lens ─► Myke Review ─► APPROVED  ◄── media gate opens here
                                                        │
                     ┌──────────────────────────────────┼───────────────────────────────┐
                     ▼                                                                     ▼
     Orpheus (narrator): ElevenLabs → R2                          Daumier (illustrator): Canva → R2
     writes academy_course_media (audio)                          writes academy_course_media (graphic)
                     │                                                                     │
                     └──────────────► status=produced ◄──── Myke sign-off ────► approved ──┘
                                                                                          │
                                              Gutenberg loads course + media to LearnWorlds
                                              (still gated on the LearnWorlds API-plan precondition)
                                                                                          │
                                              Ariadne verifies media parity · Hermes tracks media cost
```

Media production is **strictly downstream of course approval** and **upstream of publish** — it
slots cleanly between the existing `approved` state and the (deferred) LearnWorlds load, so it
adds no new governance surface, just two new producer agents and one media table.

---

## 5. Open decisions (need Myke before build)

1. **Budget / provider plans.** ElevenLabs tier (character quota → $/min) and Canva plan
   (video export limits). Both drive the per-course cost line. *Recommend:* confirm current
   plans; pilot on the 3 approved courses first to get a real per-course cost before batch.
2. **Brand voices.** Pick/clone the **Gil** and **Mach** ElevenLabs voices and pin their IDs
   (one-time, then cached like Walt). *Recommend:* audition 2–3 candidates each against a
   sample lesson; Myke picks.
3. **Animation depth.** Confirm Track A (Canva templates) for v1 and the "one per Faraday's
   Take" scope, or ask for per-lesson depth (larger cost).
4. **Hosting in LearnWorlds.** Whether media is served from R2 (our canonical store) via
   LearnWorlds embeds, or uploaded natively — ties into the LearnWorlds plan/API question that
   already gates Gutenberg.
5. **Review gate.** Confirm media follows the same Myke sign-off (`produced → approved`) before
   it can ship — recommended, consistent with everything else.

## 6. Recommended phasing

- **Phase 0 (now, no spend):** land the `academy_course_media` migration + lesson columns +
  media approval gate (schema only). Zero cost, unblocks everything.
- **Phase 1 (pilot):** narrate + illustrate the **3 already-approved courses**
  (FA-D19-101/FA-D21-101/FA-D23-101) end-to-end to produce real per-course cost + quality
  samples for Myke. Small, bounded, reversible.
- **Phase 2 (batch):** on Myke's OK of the pilot, run Orpheus + Daumier across the catalog as
  courses reach `approved` — naturally rate-limited by the approval queue.

**Ask:** approve the approach + the Phase-0 schema, and answer the two blocking items (budget/
plans + brand-voice selection) so Phase 1 can run on the three pilot courses.
