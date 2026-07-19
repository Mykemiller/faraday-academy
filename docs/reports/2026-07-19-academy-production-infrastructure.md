# Faraday Academy — Production Infrastructure + Agent Staff Activation

**Session report · 2026-07-19 · Claude Code**
**Jira anchor:** FAR-30 (In Progress) · **Supabase project:** `ycadmmngkdhvpcsrcuaq` (Faraday)
**Governance model:** governance before build — no publish, no approve, no agent auto-fire without explicit Myke go/no-go.

---

## 0. Decision needed (reuse-vs-parallel IDF tables)

**Resolved before build per the prompt: REUSE.** The Academy curriculum spine reuses the
existing Supabase `faraday_domains` / `faraday_subdomains` / `faraday_themes` tables (built for
Signal Room, previously empty) as the single shared IDF registry across Signal Room, Briefing
Room, and Academy. Academy code reads through three thin views — `academy_domains`,
`academy_subdomains`, `academy_themes` — so there is one registry, no duplicated 23×116×7
taxonomy, and no drift risk. If Myke wants a parallel (Academy-owned) taxonomy instead, that is
a one-migration change — flag it and it will be rebuilt.

> ⚠️ Pre-existing note surfaced (not fixed): `faraday_domains` already carried a permissive
> `authenticated`-role RLS policy from its Signal Room origin. The new `academy_*` tables do
> **not** — they are service-role-only. If the shared spine should also be service-role-only,
> that permissive policy is a separate Myke decision.

---

## 1. Supabase schema (Part 1) — built

Named migrations applied (in order):

1. `academy_enum_types` — locked-vocabulary enums (level, difficulty, maturity, access_layer,
   voice, format, the 6-stage `academy_status`, activation_status, actor, review_lens).
2. `academy_courses_table` — one row per course; `price_usd` CHECK-locked to 4.99/9.99;
   **approval-gate trigger** + updated_at trigger; service-role-only RLS.
3. `academy_course_content_tables` — modules, lessons (generated `word_count` column),
   quiz_bank, glossary.
4. `academy_staff_review_findings` — agent_staff, append-only `academy_review_log`
   (mutation-blocking trigger), `academy_editorial_findings`.
5. `academy_commercial_and_voice_config` — CHECK-locked singleton `academy_commercial_rules`
   ($4.99/$9.99/$99/5,000 tokens, tiers=false, free_layer=false) + `academy_voice_defaults`.
6. `idf_seed_themes_and_domains` — 7 themes + 23 domains from IDF 4.0 canon.
7. `idf_seed_subdomains_116` — all 116 sub-domains with theme tags.
8. `academy_idf_views_and_staff_seed` — academy_* views + voice defaults + agent staff seed.
9. `migrate_notion_course_production_52` — the 52-row migration (see §2).
10. `academy_advisor_hardening` — views→`security_invoker`, functions→pinned search_path,
    FK covering index.

**Governance enforced in the database, not just in prompts:**
- **Approval gate:** `academy_enforce_approval_gate()` blocks any INSERT/UPDATE that sets
  `status` to `approved` or `published` unless the transaction runs
  `SET LOCAL academy.myke_signoff = 'true'`. Scheh/Argus automations never set that flag, so
  no agent can approve or publish — even if it misbehaves. Only an explicit Myke sign-off can.
- **Pricing:** CHECK constraint `price_usd IN (4.99, 9.99)`; commercial-rules singleton
  CHECK-locks the four commercial facts and forbids tiers/free-layer.
- **Audit trail:** `academy_review_log` is append-only (UPDATE/DELETE raise).
- **RLS:** every `academy_*` table is RLS-enabled + FORCE, zero policies = default-deny
  (service-role-only), matching the established `jw_*`/`jds_*` pattern.

### Advisor results (§Quality)
After DDL, `get_advisors(security)` and `get_advisors(performance)` were run. Academy-specific
findings:
- **Cleared:** 3 `security_definer_view` ERRORs (views rebuilt `security_invoker=true`);
  3 `function_search_path_mutable` WARNs (search_path pinned); 1 unindexed-FK.
- **Intentional (INFO only):** 10 `rls_enabled_no_policy` — this *is* the service-role-only
  default-deny posture, by design.
- **Pre-existing, out of scope (flagged, not fixed):** `public.spatial_ref_sys` has RLS
  disabled (PostGIS system table). Needs Myke's own policy decision.

---

## 2. Migration verification (Notion → Supabase)

| | Notion source | Supabase `academy_courses` |
|---|---|---|
| Total rows | 52 | **52** ✓ |
| Sprint-2 Backlog | 16 | 16 ✓ |
| Re-tag legacy (Status=NULL) | 36 | 36 ✓ (mapped to `backlog`, each flagged "pre-dates Status field") |

- **Referential integrity:** 0 price violations, 0 orphan primary-domain / secondary-domain /
  sub-domain / theme references against the IDF spine.
- **Spot check (5 rows, field-by-field vs. Notion):** FA-D19-101, FA-D21-101… all matched,
  including sub-domain range expansion (`D23.1–D23.4` → 4 explicit codes) and secondary-domain
  parsing (`D4, D20` → array).
- `notion_source_row_url` preserved on every row (migration breadcrumb). Notion Course
  Production DB left intact; treated as historical/read-only in our tracking (not deleted).
- Every migrated row logged into `academy_review_log` (actor `system`, →`backlog`).

---

## 3. Reconciliation — Airtable 112 ↔ Supabase 52 ↔ Curriculum 4.0 (~114)

**Code conventions do NOT align 1:1** (verified, as the prompt warned). Three conventions:
- Airtable Lobby: `FA-D12-101` (Primer), `FA-D10-3` (Course), `FA-D8-1` (Know the Players),
  `FA-D#-CERT` (23 cert shells), `FA-T-00#-TRK` (7 theme tracks)
- Notion Sprint-2: `FA-D19-101` (domain-level) · Notion Re-tag: `FA-101-01` (level-sequence)

Reconciliation is therefore done by (domain, level) semantics, not string join.

**Airtable 112** = 82 content courses + 23 certification shells (one per domain) + 7 theme tracks.
**Supabase 52** authoring rows cover only 12 domains.

| Domain | Airtable content | Airtable cert | Supabase authoring | Curriculum 4.0 target | Gap to target |
|---|---|---|---|---|---|
| D1 Chips | 4 | 1 | 4 | 6 | 2 |
| D2 Power | 5 | 1 | 4 | 7 | 3 |
| D3 Grid | 4 | 1 | 4 | 6 | 2 |
| D4 M&A | 5 | 1 | 4 | 6 | 2 |
| D5 Hyperscaler | 3 | 1 | 4 | 5 | 1 |
| D6 New Entrants | 3 | 1 | 4 | 5 | 1 |
| D7 Cooling | 4 | 1 | 4 | 5 | 1 |
| D8 People | 3 | 1 | 4 | 6 | 2 |
| D9 Orchestration | 3 | 1 | 4 | 6 | 2 |
| D10 Construction | 4 | 1 | **0** | 6 | 6 |
| D11 Sustainability | 3 | 1 | **0** | 6 | 6 |
| D12 Networking | 1 | 1 | **0** | 4 | 4 |
| D13 Community Rel | 1 | 1 | **0** | 4 | 4 |
| D14 Real Estate | 2 | 1 | **0** | 6 | 6 |
| D15 Sovereign AI | 2 | 1 | **0** | 6 | 6 |
| D16 Security | 7 | 1 | **0** | 5 | 5 |
| D17 Workforce | 1 | 1 | **0** | 3 | 3 |
| D18 Opposition | 3 | 1 | **0** | 3 | 3 |
| D19 Tax | 6 | 1 | 6 | 6 | 0 ✓ |
| D20 Facility IT/OT | 3 | 1 | **0** | 3 | 3 |
| D21 Insurance | 5 | 1 | 5 | 5 | 0 ✓ |
| D22 Media | 5 | 1 | **0** | 2 | 2 |
| D23 Outage | 5 | 1 | 5 | 5 | 0 ✓ |
| **Total** | **82** | **23** | **52** | **116** | **64 net-new** |

**Gaps named explicitly:**
1. **11 domains have zero authoring rows** (D10–D18, D20, D22) — catalog shells exist in the
   Lobby but no authored content exists in either Notion or Supabase.
2. **Net-new authoring to reach the per-domain target ≈ 64 courses** (116 − 52). Matches the
   prompt's estimate.
3. **Count not settled:** per-domain Curriculum 4.0 targets sum to **116** domain courses,
   while the doc's headline is **~96 Domain + 18 X ≈ 114**. Curriculum 4.0 itself says "final
   count settles when the IDF batch approval lands." → **Myke decision to reconcile.**
4. **18 Mixed-Domain (X) synthesis courses** exist in neither the Airtable catalog (the 7
   Level-X rows are Theme Tracks, not the `FA-X-XX-###` synthesis courses) nor Supabase →
   whitespace.
5. **Airtable ahead of target in two domains:** D16 Security (7 catalog shells vs. target 5),
   D22 Media (5 vs. 2) — worth a scope check.
6. **$0 Primers anomaly:** 23 Airtable Primer rows are priced **$0**, which conflicts with the
   locked "no free layer / $4.99-for-101" rule (AC-003/AC-008). Airtable Courses is the live
   Lobby's separate consumer — per the boundary it was **left untouched**; surfaced here for
   Myke. (A free-preview *marketing* campaign, if desired later, is a separate decision.)

---

## 4. Pipeline throughput this run

Three Sprint-2 foundational (101) courses were authored end-to-end through the real 6-stage
pipeline and now sit at **`myke_review`**, staged for sign-off. Nothing was approved or
published.

| Course | Tower / Domain | Voice | Stage reached | Modules | Lessons (min–max words) | Quiz | Glossary |
|---|---|---|---|---|---|---|---|
| FA-D19-101 Tax & Fiscal Policy Foundations | Tax, Incentives & Fiscal Policy | Gil | **myke_review** | 4 | 8 (670–764) | 10 | 8 |
| FA-D21-101 Insurance Foundations | Insurance & Risk Markets | Mach | **myke_review** | 4 | 8 (650–774) | 10 | 8 |
| FA-D23-101 Outage Intelligence Foundations | Outage Intelligence & Emergency Response | Gil | **myke_review** | 4 | 8 (787–924) | 10 | 8 |

**Movement:** 3 courses `backlog → drafting_scheh → argus_review → myke_review` (Sprint 2, the
three foundational 101 anchors of the D19/D21/D23 batch). Every hop is recorded in
`academy_review_log`.

**Argus dual-lens:** all 3 passed both lenses. 6 findings rows written to
`academy_editorial_findings` (factual + voice_canon per course), each itemizing the checks
run (sourced/labeled claims; commercial facts; IDF tag accuracy; template structure; word
count; Domain Reference Rule / no code leakage; voice consistency; count-agnostic; banned
vocabulary; "What Faraday Never Says"). One course (FA-D19-101) carries the ~10% audit-sample
deep-check flag.

**Honest count:** 3 of the ~64 net-new courses authored this run. This is a deliberate,
spec-compliant proof of the end-to-end pipeline (schema → author → Argus → Myke queue), not
the full catalog — the remaining Sprint-2 backlog (13 of 16) and the 11 zero-authoring domains
stay at `backlog` for subsequent Scheh runs. Full-template authoring (600–1,200-word lessons)
is the volume work the infrastructure now exists to run.

**Governance proof:** an attempt to move a course to `approved` *without* the Myke sign-off
GUC was **rejected by the database trigger** (verified this run). No course can be approved or
published by any agent — only an explicit Myke sign-off transaction
(`SET LOCAL academy.myke_signoff = 'true'`) can.

### Sprint-2 batch status (by Tower)
| Tower | In batch | Authored → myke_review | Remaining at backlog |
|---|---|---|---|
| D19 Tax | 6 | 1 (FA-D19-101) | 5 |
| D21 Insurance | 5 | 1 (FA-D21-101) | 4 |
| D23 Outage | 5 | 1 (FA-D23-101) | 4 |

---

## 5. Agent activation state

| Agent | Call sign | `activation_status` | Wired to fire? | Trigger condition (staged) |
|---|---|---|---|---|
| Scheherazade | Scheh | `active` | Yes (skill installed) | — |
| Argus | Argus | `active` | Yes (skill installed) | — |
| Ariadne | Adriane | `active` | Yes (skill installed) | — |
| Hermes | Hermes | `staged` | **No** | "at first course publish" |
| Sibyl | Sybil | `staged` | **No** | "post-launch" |
| Gutenberg | Gute | `staged` | **No** | "when batch volume makes manual loading the bottleneck, and only after confirming current LearnWorlds plan includes API access" |

- Active skills installed at `skills/faraday-course-author`, `skills/faraday-editorial-review`,
  `skills/faraday-catalog-steward` — all pointed at the Supabase `academy_*` tables (not Notion).
- Staged specs at `skills/_staged/…`; their `academy_agent_staff` rows carry
  `activation_status='staged'` and the trigger text verbatim. **No cron/automation scheduled**
  for the three staged agents.
- Naming flag (from roster): formal names use mythological spellings (Ariadne, Sibyl); Myke's
  call signs (Adriane, Sybil) are the working short forms — confirm the variants were intended.

---

## 6. Myke actions required

1. **Reuse-vs-parallel IDF tables** — confirm REUSE (assumed per prompt) or request a parallel
   Academy taxonomy. Related: decide whether the shared spine should drop `faraday_domains`'
   legacy permissive `authenticated` RLS policy.
2. **Review queue (batched by Tower):** the courses at `myke_review` (see §4) are staged for
   your `myke_review → approved` sign-off. Nothing advances without it. To approve in the DB,
   the transition must run under `SET LOCAL academy.myke_signoff = 'true'`.
3. **Catalog-count reconciliation** — settle ~96-vs-116 domain-course target and the 18
   X-course whitespace.
4. **$0 Primers in Airtable** — decide whether to correct the live Lobby's $0 Primer pricing
   (conflicts with the no-free-layer rule) or formalize a marketing free-preview.
5. **FAR-30 AC gates blocked on open decisions** — AC-009 (candidate live-signal access),
   AC-011 (billing rail), FAR-44 (token-grant wiring), and LearnWorlds plan/API access all
   remain open; their ACs were **not** checked. See the FAR-30 comment posted this run.
6. **Activation** — flip Hermes/Sibyl/Gutenberg off `staged` with a one-line instruction when
   their triggers fire (each is a single-row update, not a rebuild).
