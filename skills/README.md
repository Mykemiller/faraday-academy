# Faraday Academy — Agent Staff Skills

Cowork skills for the named Academy Staff 2.0 roster. All skills operate against the Supabase
production tables (`academy_*`) in project `ycadmmngkdhvpcsrcuaq` — **not** Notion (the Notion
Course Production DB became historical/read-only after the 2026-07 production migration).

## Active (installed, wired to fire)

| Skill | Agent | Function |
|---|---|---|
| `faraday-course-author` | Scheherazade (Scheh) | Authors courses from Curriculum 4.0 → `argus_review` |
| `faraday-editorial-review` | Argus | Dual-lens pre-Myke editorial gate |
| `faraday-catalog-steward` | Ariadne (Adriane) | Catalog & metadata steward |

## Staged (built, NOT wired to fire) — in `_staged/`

| Skill | Agent | Activation trigger |
|---|---|---|
| `faraday-enrollment-analytics` | Hermes | at first course publish |
| `faraday-course-scout` | Sibyl (Sybil) | post-launch |
| `faraday-learnworlds-publisher` | Gutenberg (Gute) | when batch volume makes manual loading the bottleneck, and only after confirming the LearnWorlds plan includes API access |

Staged agents also have `academy_agent_staff` rows with `activation_status='staged'` and the
trigger condition recorded verbatim. To activate one, Myke sets that row to `active` and the
skill is moved out of `_staged/`. No cron/automation is scheduled for staged agents.

## Governance (enforced in the database, not just here)
- No agent may set a course to `approved` or `published`. A `BEFORE INSERT/UPDATE` trigger on
  `academy_courses` blocks those transitions unless the transaction runs
  `SET LOCAL academy.myke_signoff = 'true'` — i.e. an explicit Myke sign-off. Scheh/Argus
  automations never set that flag.
- Pricing is CHECK-locked to $4.99 / $9.99; certification $99 / 5,000 tokens; no tiers, no
  free layer (`academy_commercial_rules`, single-row CHECK-constrained).
