# Faraday Academy — Agent Staff Skills

Cowork skills for the named Academy Staff 2.0 roster. All skills operate against the Supabase
production tables (`academy_*`) in project `ycadmmngkdhvpcsrcuaq` — **not** Notion (the Notion
Course Production DB became historical/read-only after the 2026-07 production migration).

## All six agents active (Myke activation 2026-07-19)

| Skill | Agent | Function | Notes |
|---|---|---|---|
| `faraday-course-author` | Scheherazade (Scheh) | Authors courses from Curriculum 4.0 → `argus_review` | — |
| `faraday-editorial-review` | Argus | Dual-lens pre-Myke editorial gate | — |
| `faraday-catalog-steward` | Ariadne (Adriane) | Catalog & metadata steward | — |
| `faraday-enrollment-analytics` | Hermes | Enrollment & revenue analytics (Fri 5 PM) | Armed; no data until first publish |
| `faraday-course-scout` | Sibyl (Sybil) | Competitor/gap crawl (Mon 6 AM) | Running |
| `faraday-learnworlds-publisher` | Gutenberg (Gute) | LearnWorlds API publisher | **Active but blocked**: no REST push until the LearnWorlds plan is confirmed to include API access; publishing stays manual until then |

Hermes and Gutenberg are "armed" rather than producing output today: Hermes has no
enrollment data until a course is published, and Gutenberg must not push to LearnWorlds until
the plan's API access is confirmed. Both operational preconditions are recorded in the agents'
`academy_agent_staff` rows and skill bodies.

## Governance (enforced in the database, not just here)
- No agent may set a course to `approved` or `published`. A `BEFORE INSERT/UPDATE` trigger on
  `academy_courses` blocks those transitions unless the transaction runs
  `SET LOCAL academy.myke_signoff = 'true'` — i.e. an explicit Myke sign-off. Scheh/Argus
  automations never set that flag. (Exercised 2026-07-19: FA-D19-101/FA-D21-101/FA-D23-101
  approved under sign-off; an unauthorized approve was rejected.)
- Pricing is CHECK-locked to $4.99 / $9.99; certification $99 / 5,000 tokens; no tiers, no
  free layer (`academy_commercial_rules`, single-row CHECK-constrained).

## Proposed course-media enhancements
See `docs/proposals/2026-07-19-course-media-enhancements.md` for the audio-narration and
animated-graphics production process (adapts the proven Walt ElevenLabs→R2→Supabase pipeline;
adds `academy_course_media` + lesson media columns; governance-gated on `approved`).
