# Faraday Academy — Course Catalog Audit vs IDF 4.0

**Date:** 2026-07-18 · **Pass:** Read-only (no writes to Notion / Airtable / course records)
**Auditor skill:** `knowledge-ops` (vendored from `alirezarezvani/claude-skills` v2.8.0, MIT)
**Canonical taxonomy:** IDF 4.0 — Master Domain/Sub-Domain Registry
`37189a0c-1680-8199-bca1-cf304a45bbde` — **23 Domains · 116 Sub-Domains · 7 Themes**
(Approved by Myke, 2026-06-11).

> **Boundaries honored:** No taxonomy changes. No course edits. No archiving. This is a
> report only. Where a fix would touch a course record or the taxonomy, it is logged as a
> *proposed* Myke action, not executed.

---

## 0. TL;DR

The catalog is **not ready for Part-3 mass content production.** Three separate catalog
representations exist and **none is fully mapped onto IDF 4.0**:

| # | Representation | Where | Scale | Taxonomy basis | Verdict |
|---|---|---|---|---|---|
| A | **Course Catalog page** (prose) | Notion `33589a0c…f3af5edebc6a695d2f` | 64 courses, 16 "domains" | Pre-4.0, **conflicting domain IDs** | 🔴 Stale / mis-mapped |
| B | **Course Production DB** (backlog) | Notion `e86e1ef0…074e6e` | **52 rows, 12 of 23 domains** | Re-tagged to 4.0 IDs (2026-06-24) | 🟠 Incomplete / unsourced |
| C | **Academy Lobby seed** (shipped MVP) | `faraday-academy` repo `scripts/idf-data.mjs` + `seed/courses.json` | 112 courses, 59 sub-domains | **Faraday 2.0**, old Theme names | 🟠 Stale (marked DRAFT) |

**The single highest risk:** the mission is to *mass-produce content*, but **0 of 52 backlog
courses have a linked source artifact**, and **9 are tagged entirely to sub-domains that have
zero data sources** (Whitespace). Authoring those at scale = fabricating intelligence with
nothing to cite. Fix sourcing and mapping **before** the content pipeline runs.

Per the IDF 4.0 Coverage Matrix (FAR-199, `38889a0c…`): of 116 sub-domains,
**1 Dedicated-Active · 63 Dedicated-Designed (dormant) · 21 Broad-only · 31 Whitespace.**
"A Designed or Broad-only crawler is not coverage." → effectively **no** backlog course today
sits on an *active* dedicated source.

---

## 1. Method

Applied the `knowledge-ops` rubric: each course record is scored like a runbook against six
checks. "Stale" = source predating the 116/116 IDF 4.0 backfill. "Orphan" = no linked source
artifact. Findings cross-reference the canonical registry, the Course Production backlog
(pulled live via SQL), and the FAR-199 Coverage Matrix.

**Validity check (0–100, ≥80 safe / 60–79 caution / <60 unsafe):**
mapped-to-4.0 · abstract present · level correct · owner/status set · theme-tagged · **linked source artifact**.

---

## 2. Findings (prioritized by risk)

### 🔴 F1 — Zero courses carry a linked source artifact; 9 sit on pure whitespace *(Critical)*

The Course Production schema has **no "Source Artifact" field at all** (properties: Code, Title,
Primary/Secondary Domain, Sub-Domain IDs, Level, Themes, Maturity, Status, Sprint, Access,
Price, Voice, Notes — `Notes` is empty on all 52 rows). So **100% of the backlog fails the
"linked source artifact" check** structurally.

Cross-referenced against the FAR-199 Coverage Matrix, these **9 courses are tagged *entirely* to
Whitespace sub-domains** (no data source exists to author from):

| Tower | Courses (all sub-domain tags = Whitespace) |
|---|---|
| **D7 Cooling & Water** | `FA-101-07`, `FA-201-07`, `FA-301-07`, `FA-401-07` (entire tower) |
| **D9 Orchestration** | `FA-101-09`, `FA-201-09`, `FA-301-09`, `FA-401-09` (entire tower) |
| **D8 People & Signals** | `FA-301-08` |

A further **9 courses have at least one Whitespace sub-domain tag** (partial gap):
`FA-101-08, FA-201-05, FA-301-03, FA-301-04, FA-301-06, FA-401-03, FA-401-05, FA-401-06, FA-401-08`.

**Risk:** These are exactly the courses a content pipeline would "complete" first — and they have
nothing behind them. IDF 4.0 governance requires **≥8 Supabase artifacts** before a sub-domain is
Active; none of these clear it.

### 🔴 F2 — Legacy Course Catalog page uses domain IDs that CONFLICT with IDF 4.0 *(Critical)*

The prose **Course Catalog** page (A) is stamped *"Last updated: April 5, 2026" (v1.2)* — it
predates the 4.0 approval (June 11) and is built on the old **"9 core + Passion Domain 10+"**
scheme. Its domain numbering **does not match the canonical registry:**

| Catalog page label | Canonical IDF 4.0 | Conflict |
|---|---|---|
| Domain 10 — Networking & Interconnect | **D12** Networking (D10 = *Construction*) | ❌ ID collision |
| Domain 11 — Community Relations | **D13** Community Relations | ❌ off-by-two |
| Domain 12 — Real Estate & Site Selection | **D14** Real Estate | ❌ off-by-two |
| Domain 13 — Sustainability & ESG | **D11** Sustainability (ESG dropped) | ❌ ID + name |
| Domain 14 — Workforce & Labor Markets | **D17** Workforce | ❌ off-by-three |
| Domain 15 — Sovereign AI | D15 Sovereign AI | ✅ (coincidental) |
| Domain 16 — Security & Resilience | D16 Cyber & Physical Security | ⚠️ name differs |

A downstream consumer reading "Domain 12" gets **Real Estate** from the catalog but **Networking**
from the registry. The page also **entirely omits** canonical D10 (Construction), D18 (Community
Opposition), D19 (Tax), D20 (Facility IT/OT), D21 (Insurance), D22 (Media), D23 (Outage).

**Note:** the newer Course Production DB (B) *has* re-tagged D1–D9 onto correct 4.0 IDs — so the
prose catalog page (A) is the stale surface. If A is still linked as canonical anywhere, repoint it.

### 🟠 F3 — 11 of 23 canonical domains have zero backlog coverage *(High)*

The Course Production backlog covers only **12 domains: D1–D9, D19, D21, D23.**
**Zero rows** exist for:

> **D10** Construction · **D11** Sustainability · **D12** Networking · **D13** Community Relations ·
> **D14** Real Estate · **D15** Sovereign AI · **D16** Cyber & Physical Security · **D17** Workforce ·
> **D18** Community Opposition · **D20** Facility IT/OT · **D22** Industry Media

Seven of these (Networking, Community Relations, Real Estate, Sustainability, Workforce, Sovereign
AI, Security) **do exist as prose in the legacy catalog page (A)** under its old numbering — they
have never been migrated into the backlog. Mass production cannot start on these until records
exist and are mapped.

### 🟠 F4 — Whole catalog predates the 116/116 backfill; content ≠ metadata freshness *(High)*

- **(A) prose catalog** — last updated 2026-04-05, entirely pre-4.0.
- **(C) repo lobby seed** — built on **Faraday 2.0 / 59 sub-domains** and **old Theme names**:
  it calls **T-002 "The Rack Revolution"** and **T-001 primaryDomain D2**, but canonical 4.0 is
  **T-002 "The Thermal Reckoning"** with different domain spreads. `scripts/idf-data.mjs:46`.
  Also still carries the "D16 = Candidate" flags that 4.0 promoted to Established.
- **(B) backlog D1–D9** — the *rows* were re-tagged to 4.0 IDs on 2026-06-24 (the "Re-tag"
  sprint), but the **titles and module lists are the April prose verbatim**. The metadata is
  fresh; the underlying content is not. This is the classic "re-tag looks done, content is stale"
  trap — flag for a content refresh pass, not just an ID check.

### 🟡 F5 — Duplicate coverage across towers *(Medium–High)*

Genuine topic overlap spanning different Primary-Domain towers (a mass-production run would author
the same material twice):

| Topic | Tower A course | Tower B course | Registry boundary |
|---|---|---|---|
| Hyperscaler custom silicon | `FA-301-01` (D1 · tags **D1.7**) | `FA-301-05` (D5 · tags **D5.2**) | Registry: "architecture at D1.7 / strategy lens at D5.2" — thin line |
| Tax incentives / moratoria | `FA-201-03` (D3 · "Moratoriums, **Incentives**") | `FA-D19-201` (D19 · State & Local Tax Incentives) | D3 vs D19 both claim incentives |
| Cyber incident / insurance | `FA-D23-301` (D23 · **D23.3** cyber incidents) | `FA-D21-202` (D21 · **D21.2** cyber insurance) | + absent **D16** owns the threat itself |
| Powered-land / site selection | `FA-101-03` (D3, secondary-tags D14) | legacy Real-Estate tower (A, "Domain 12") | **D3 and D14 share the identical Core Thesis** in the registry |
| Water | `FA-101-07`/`FA-301-07` (D7 · **D7.3**) | legacy Sustainability tower (A) / canonical **D11.3** | registry splits cooling-tech vs stewardship |

The D3↔D14 "entitled powered land is the scarcest asset" thesis is **word-for-word identical in the
registry itself** — the duplication is upstream of the courses. Worth a boundary ruling before both
towers get authored.

### 🟡 F6 — Internal-consistency defects in the backlog *(Medium)*

- **36 of 52 rows have `Status` = NULL** — the entire D1–D9 "Re-tag" set has no workflow state
  (not even "Backlog"). Fails the "named owner / where in the process" check.
- **16 of 52 rows have `Maturity` = NULL** — all of D19/D21/D23.
- **Two incompatible code schemes** in one table: level-first `FA-101-01` (D1–D9) vs sub-domain
  `FA-D19-101` / `FA-D19-202` (D19/D21/D23). Sorting, dedup, and URL generation will break.
- **`Notes` empty on all 52 rows**; no per-course provenance anywhere.

### 🟡 F7 — No abstract field exists (blocks catalog task item #2) *(Medium)*

The task asks for "an abstract for each course." The Course Production schema has **no Abstract
field**, and backlog rows carry no long-form description. The prose catalog (A) has
`Description` + `Learning Outcomes` + `Modules`, but those never made it into the DB. Adding
abstracts is a **greenfield schema + authoring change** — logged here as a Myke action because it
touches records (out of scope for this read-only pass).

---

## 3. Validity scorecard (backlog, illustrative)

| Cohort | Rows | Mapped to 4.0 | Owner/Status | Theme-tagged | **Source artifact** | Est. validity |
|---|---|---|---|---|---|---|
| D1–D9 "Re-tag" | 36 | ✅ | ❌ (Status NULL) | ✅ | ❌ (none) | **~50 — unsafe** |
| D19/D21/D23 new | 16 | ✅ | ⚠️ (Backlog, Maturity NULL) | ✅ | ❌ (none) | **~55 — unsafe** |
| 9 pure-whitespace | (subset) | ✅ | ❌ | ✅ | ❌ **+ no source exists** | **<40 — unsafe** |

No cohort clears the 60 "caution" line — the missing source-artifact link is the common failure.

---

## 4. Myke actions — proposed remediation order for Part 3

Ordered so the content pipeline never authors ahead of its evidence. **Approve / re-order:**

1. **[GATE] Add a `Source Artifact` field** to Course Production and backfill it from the
   Supabase `source_registry` / Automation Registry. Make "≥1 linked artifact" a hard gate before
   any course leaves Backlog. *(Unblocks F1; enforces IDF governance.)*
2. **Freeze the 9 pure-whitespace courses** (D7 + D9 towers, `FA-301-08`) until their sub-domains
   move off Whitespace in FAR-199. Do **not** author them this wave. *(F1)*
3. **Repoint / retire the legacy prose Catalog page (A)** or relabel its Domain 10–16 headings to
   canonical IDs. Confirm nothing links to it as canonical. *(F2)*
4. **Decide the 11 zero-coverage domains:** migrate the 7 that exist in prose (A) into the backlog
   under correct 4.0 IDs; scope D10/D18/D20/D22 as net-new. *(F3)*
5. **Rule on the 5 cross-tower duplicates in F5** (esp. the D3↔D14 identical thesis) — one primary
   home each, per the registry's cross-link discipline — before authoring either side. *(F5)*
6. **Normalize the backlog:** one code scheme, set Status on the 36 Re-tag rows, set Maturity on the
   16 new rows. *(F6)*
7. **Schedule a content-refresh pass** on the D1–D9 Re-tag rows (metadata is 4.0, prose is April).
   *(F4)*
8. **Approve an `Abstract` field + authoring standard** (the `knowledge-ops` 5W2H scaffold is a
   ready template). *(F7)*
9. **Refresh repo lobby seed (C)** to 4.0 Theme names + 116 sub-domains on the next regen
   (`npm run catalog:generate` after updating `scripts/idf-data.mjs`). *(F4)*

---

## 5. Sources

- IDF 4.0 Master Registry — Notion `37189a0c-1680-8199-bca1-cf304a45bbde`
- IDF 4.0 Data-Source Coverage Matrix & Bridge (FAR-199) — Notion `38889a0c-1680-81d5-83e8-d02f1cc3b12a`
- Faraday Course Catalog (prose) — Notion `33589a0c-1680-81f3-af5e-debc6a695d2f`
- Course Production — Faraday Academy (backlog DB) — Notion `e86e1ef0-49d1-4950-957b-aa6138074e6e`
- Academy Lobby seed — `faraday-academy` repo: `scripts/idf-data.mjs`, `seed/courses.json`
- Auditor skill — `.claude/skills/knowledge-ops/SKILL.md` (vendored, MIT)

*Report only. No course records, taxonomy entries, or Notion pages were modified in this pass.*
