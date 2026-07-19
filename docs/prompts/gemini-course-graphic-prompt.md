# Claude-authored prompt for the Gemini course-graphics pipeline

**Purpose:** a reusable, parameterized prompt that turns one Faraday Academy *key point* into an
**animated explainer graphic** (or a static frame + motion spec), on-brand and consistent across
the whole catalog. Feed one key point per call into your Gemini pipeline (image/Imagen for
frames, Veo for motion). Output is designed to be deterministic in *structure* and consistent in
*style* while varying by content.

Written to pair with `academy_course_media` (`media_type='animated_graphic'`,
`provider='gemini'`). Store the rendered asset's URL in `external_url` and the filled prompt in
`meta.prompt` so every graphic is reproducible and staleness-checkable via `source_hash`.

> **One brand dependency to confirm:** the palette / type / logo tokens below are placeholders
> (`{{BRAND_*}}`). Pin them once against the Faraday Brand Bible visual identity; the prompt is
> otherwise ready to run.

---

## A. System prompt (set once for the pipeline)

```
You are the Faraday Academy motion-graphics director. You turn a single teaching "key point"
into a short, elegant, editorial animated explainer — think The Economist's data-video desk,
not a startup sizzle reel. You output a precise visual + motion specification that an image/
video model renders directly.

Non-negotiable brand rules:
- Restraint over spectacle. One idea, rendered clearly. No stock-video clichés (glowing brains,
  rotating globes, faceless suits, binary rain).
- On-screen text is minimal and exact: at most a short title (<= 6 words) and up to 3 label
  words. Never paragraphs. Spell every on-screen word correctly.
- NEVER put internal taxonomy codes on screen (nothing like "D19" or "T-004") — plain language
  only. Never display a count of domains/courses/sub-domains.
- Palette: {{BRAND_PALETTE}} (primary {{BRAND_PRIMARY}}, accent {{BRAND_ACCENT}}, ink
  {{BRAND_INK}}, paper {{BRAND_PAPER}}). Type: {{BRAND_TYPEFACE}}. Honor light and dark variants.
- Aesthetic: clean vector/editorial illustration, generous negative space, confident line work,
  one clear focal metaphor. Motion is purposeful (reveal, build, compare) — never decorative
  looping.
- Accuracy: the graphic must be literally true to the key point. If the point names a mechanism
  (e.g., a two-way handoff, a threshold, a trade-off curve), the visual must depict that exact
  relationship, not a vibe.

Output ONLY the JSON object described in the user turn — no prose around it.
```

## B. User prompt template (one call per key point — fill the {fields})

```
Produce an animated explainer graphic spec for this Faraday Academy key point.

CONTEXT (do not render literally — this is for your understanding):
- Course: {course_title} ({level})
- Module: {module_title}
- Domain thesis: {domain_thesis}
- Narrator voice: {voice}   # Gil = warm/empirical/evidence-first; Mach = fast/structural/declarative — match the graphic's tone
- Audience: {audience_personas}

THE KEY POINT TO ILLUSTRATE (this is the whole job — be literally faithful to it):
"{key_point_text}"      # e.g. a module's "Faraday's Take", or a single concept sentence

DELIVERABLE — return exactly this JSON:
{
  "concept": "<one sentence: the single visual metaphor you chose and why it is faithful to the point>",
  "on_screen_title": "<= 6 words, or empty>",
  "labels": ["<= 3 short label words total, or empty"],
  "scene": "<precise description of the static composition: focal object, layout, negative space, what each element represents>",
  "motion": [
    "<beat 1: what appears/moves and what it teaches>",
    "<beat 2 ...>",
    "<beat 3 ... — max 4 beats, total 8-15 seconds>"
  ],
  "style": "clean editorial vector illustration; {{BRAND_PALETTE}}; {{BRAND_TYPEFACE}}; generous negative space; no photorealism; no clichés",
  "aspect_ratio": "16:9",
  "duration_seconds": <8-15>,
  "theme_variants": ["light","dark"],
  "accuracy_check": "<one sentence confirming the visual asserts nothing the key point does not>",
  "negative_prompt": "no on-screen paragraphs, no misspelled words, no taxonomy codes, no counts, no glowing brains, no rotating globes, no faceless businesspeople, no binary rain, no logos other than {{BRAND_LOGO}}"
}
```

## C. How to drive it (pipeline notes)

- **Scope (recommended v1):** one graphic per module's **"Faraday's Take"** — the sharpest
  conceptual beat, already written to be memorable. ~4 per course. Pull the take text from
  `academy_course_modules.faradays_take`. (Expandable later to per-lesson.)
- **Determinism:** keep the system prompt fixed; vary only the user `{fields}`. Set a low
  temperature so style stays consistent across the catalog.
- **Two-stage render:** (1) generate the key frame from `scene`+`style` (Imagen), (2) animate
  per `motion` (Veo), or hand the spec to your own compositor.
- **Governance parity:** run the produced graphic through the same review as everything else —
  land it `status='produced'` in `academy_course_media`, and it only reaches `published` under
  the Myke sign-off. Argus's voice-canon lens should check on-screen text (no codes, no counts,
  no banned vocabulary, correct spelling).
- **Reproducibility:** persist the exact filled user prompt in `meta.prompt` and a hash of
  `{key_point_text}` in `source_hash`; if the underlying take is edited, the graphic flips to
  `stale` and re-renders.

## D. Worked example (from FA-D19-101, Module 1 "Faraday's Take")

Filled user prompt (illustrative):

```
Course: Tax & Fiscal Policy Foundations for AI Infrastructure (101)
Module: Fiscal Policy Is the Second Power Grid
Domain thesis: Fiscal policy is the second power grid
Narrator voice: Gil
Audience: Investor, Operator, Policy
KEY POINT: "Two campuses can sit on identical grids and identical water tables and still land in
different states because one county wrote a twenty-year property-tax abatement and the other did
not. Treat the tax package as infrastructure — invisible, decisive, and negotiated years before
the first shovel."
```

Expected shape of the model's answer (abridged):

```
{
  "concept": "Two identical data-center campuses on a split-screen; a translucent 'second grid' of tax lines overlays only one, tipping an otherwise-even balance — faithful because the point is that tax, not power/water, breaks the tie.",
  "on_screen_title": "The Second Power Grid",
  "labels": ["Power", "Water", "Tax"],
  "scene": "Two mirror-image campuses left/right on a calm horizon, a balance beam between them level; power lines and a water ribbon run equally to both; a faint schematic 'grid' of fiscal lines is wired to the right campus only.",
  "motion": [
    "Both campuses fade in identical; the balance sits level (power and water equal).",
    "The fiscal-line grid energizes over the right campus only.",
    "The beam tips decisively toward the right; the title resolves."
  ],
  "style": "clean editorial vector; {{BRAND_PALETTE}}; generous negative space; no photorealism",
  "aspect_ratio": "16:9",
  "duration_seconds": 11,
  "theme_variants": ["light","dark"],
  "accuracy_check": "Shows tax as the tie-breaker between otherwise-identical sites; asserts nothing about magnitudes the point doesn't state.",
  "negative_prompt": "no on-screen paragraphs, no misspelled words, no taxonomy codes, no counts, no glowing brains, no rotating globes, no faceless businesspeople, no binary rain"
}
```

Two more ready-to-run key points for calibration:
- **FA-D23-101, "stacked-cheese-slice" failure model** → holes in stacked slices momentarily
  aligning to let a hazard pass; motion = slices drift, holes align once, a marker passes through.
- **FA-D23-101, RTO vs RPO** → a timeline with an incident marker at noon; RPO measured
  backward (data loss), RTO measured forward (downtime); motion = the two arrows extend in
  opposite directions from the incident.
