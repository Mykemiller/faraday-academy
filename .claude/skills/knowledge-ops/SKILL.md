---
name: knowledge-ops
description: Use when a Head of Ops, Knowledge Manager, or TPM-Internal needs to author, validate, or clean up company SOPs and internal runbooks (procurement intake, vendor offboarding, incident-comms cascade, employee onboarding) — including 5W2H completeness checks (Who-What-When-Where-Why-How-HowMuch), cross-link and orphan-page validation across a sprawling Notion/Confluence/Obsidian wiki, KB ingestion + hygiene reporting, and runbook step verification (named owner, expected duration, observable success signal, rollback path, escalation contact). Pairs Ishikawa's 5W2H method, Gawande's *The Checklist Manifesto*, ISO 9001, ITIL v4, and Google SRE Workbook runbook discipline with deterministic stdlib-only Python tools that score completeness, detect anti-patterns, and emit prioritized cleanup lists (e.g., "validate this runbook before it goes into rotation", "audit our Confluence wiki for stale and orphaned SOPs").
context: fork
version: 2.8.0
author: claude-code-skills
license: MIT
tags: [bizops, sop, runbook, knowledge-management, kb, 5w2h, wiki, ops-documentation]
compatible_tools: [claude-code, codex-cli, cursor, antigravity, opencode, gemini-cli]
---

<!--
  VENDORED SKILL — provenance
  Source:   alirezarezvani/claude-skills @ business-operations/skills/knowledge-ops
  Upstream: v2.8.0 · MIT License · author: claude-code-skills
  Vendored: 2026-07-18 into faraday-academy for the Faraday Academy Course
            Catalog audit (see docs/audits/2026-07-18-course-catalog-idf4-audit.md).
  Fidelity: frontmatter is preserved verbatim from upstream. The body below is a
            faithful reconstruction of the upstream skill's documented structure
            (Workflow / Scripts / Forcing-question library / Anti-patterns). The
            three stdlib Python tools it references are NOT bundled here — pull
            them from upstream if/when Faraday wants the executable path. This
            pass used the skill's *method* (5W2H completeness + runbook-validity
            scoring + KB hygiene) as the audit rubric only. No writes were made
            to Notion, Airtable, or any course record.
-->

# knowledge-ops

## Purpose

Keep a knowledge base **findable, current, and safe to act on**. This skill turns
"our docs are a mess" into a prioritized, scored worklist: it ingests an existing
wiki, scores every runbook for operational safety, scaffolds the SOPs that are
missing, and re-checks to confirm the sprawl actually shrank. It is a *hygiene and
authoring* discipline, not a content generator.

## When to use

- A Head of Ops / Knowledge Manager / TPM-Internal needs to **audit** a sprawling
  KB (Notion / Confluence / Obsidian / a repo of markdown) for staleness,
  orphans, missing owners, and glossary drift.
- A runbook is about to go **into rotation** and must be verified safe first.
- New SOPs must be authored to a **consistent 5W2H standard** with the right
  regulatory overlay.
- A backlog of content is about to be **mass-produced** and someone needs to
  confirm the existing inventory is internally consistent *before* scaling it.

## Workflow

1. **Ingest the KB.** Run `kb_ingester.py` over the wiki/catalog export. Output is
   a health report: orphan pages, stale pages (>12 months since review), glossary
   drift, missing-owner pages, a cross-link map, and a prioritized **top-20 cleanup
   list** ranked by `staleness × inbound-link-count`.
2. **Validate existing runbooks/records.** Run `runbook_validator.py` on each
   runbook. Every step is scored against six checks — **owner, expected duration,
   observable success signal, failure signal, rollback path, escalation contact** —
   yielding a **validity score 0–100** and a MUST-FIX list. Verdicts: **≥80 safe**,
   **60–79 caution**, **<60 unsafe**.
3. **Generate missing SOPs.** Run `sop_generator.py` with the record metadata and a
   profile flag. Output is a **5W2H-structured scaffold** (Who / What / When / Where
   / Why / How / How-Much) with regulatory overlays where the profile requires them.
4. **Close the loop.** Re-run `kb_ingester.py` post-cleanup to confirm the orphan
   count dropped and the glossary is consistent. Success is measured in **fewer
   unfindable docs** and **fewer unsafe runbooks (validity < 60)**, not in pages
   produced.

## Scripts

*(Upstream, stdlib-only. Not bundled in this vendored copy — see provenance note.)*

- **`kb_ingester.py`** — walks a markdown directory; extracts the cross-link map,
  glossary drift, orphans, stale pages (>12 months), and missing owners; emits a KB
  health report with a top-20 cleanup priority list ranked by staleness ×
  inbound-link-count.
- **`runbook_validator.py`** — validates runbook steps against the six attributes
  (owner, duration, success/failure signals, rollback, escalation); outputs a
  per-step traffic light, a validity score 0–100, and a MUST-FIX list. Verdicts:
  ≥80 safe · 60–79 caution · <60 unsafe.
- **`sop_generator.py`** — reads JSON metadata; emits a 5W2H-structured SOP in
  markdown/JSON; profiles include ops, support, finance, HR, IT, and regulated;
  regulatory overlays for SOC 2, HIPAA, ISO 13485, GDPR, SOX.

## Forcing-question library (grill discipline)

Ask of every record before it is trusted or scaled:

1. **Named owner** — one accountable human, by name, with a documented agreement?
   (Ownership is the single strongest predictor against 12-month doc-rot.)
2. **Last review & cadence** — reviewed within 12 months (90 days if regulated)?
   ISO 9001:2015 §7.5.3 requires review-cycle metadata.
3. **Observable success signal** — a concrete output (e.g. "HTTP 200 from
   `/healthz`"), not a vague "it should work"? (SRE Workbook: critical.)
4. **Rollback path** — every state-mutating step has a rollback or an explicit
   "escalate to X" clause?
5. **Location & inbound links** — lives in the canonical wiki with ≥2 inbound
   links? (Orphan rate >20% signals sprawl.)
6. **Regulatory overlay** — states its regime explicitly (SOC 2 / HIPAA / ISO
   13485 / GDPR / SOX / none)? CFR Part 211 requires version control on regulated
   docs.
7. **Failure modes** — top-2 failure paths documented, not happy-path-only?
   (Addresses a majority of incident-response delay.)

## Anti-patterns

- Mass-generating SOPs/records **without named owners** — they degrade fast.
- Treating the validator as a **checkbox**: it catches structural gaps, not content
  errors — a 100-score record can still be wrong.
- Assuming **every orphan is garbage** — many are legitimate reference pages reached
  by search.
- Conflating knowledge-ops with **process-mapper** (which documents flow and
  bottlenecks, not operator artifacts).
- Letting **glossary drift** accumulate unchecked.
- Skipping the **regulated profile** on compliance-sensitive processes.
- Hand-writing 5W2H sections **from memory** instead of using the generator
  scaffold.

## Assumptions

- The KB is exportable to markdown (or already lives as records with queryable
  metadata — e.g. a Notion database, an Airtable base).
- "Owner" means an individual human, not a team or a bot.
- Read-only by default: the skill **reports and scaffolds**; it does not edit or
  archive source records without explicit human approval.

## Distinct from

- `engineering/llm-wiki` — personal PKM / second brain.
- `engineering-team/runbook-generator` — production system-ops debugging runbooks.
- `project-management/*` — Jira/Confluence delivery + ticket tracking.
- knowledge-ops is process **documentation hygiene** for the whole org's KB.

## Faraday application (this vendoring)

Applied read-only to the **Faraday Academy Course Catalog** against the **IDF 4.0
Master Domain/Sub-Domain Registry** (23 Domains · 116 Sub-Domains · 7 Themes).
Each course record is treated as a "runbook": the six-check validity score maps to
(taxonomy-mapped · abstract present · level correct · owner/status set · theme-tagged ·
**linked source artifact**). "Stale" = source material predating the IDF 4.0 backfill.
"Orphan" = course with no linked source artifact. See the audit report at
`docs/audits/2026-07-18-course-catalog-idf4-audit.md`.
