# Content Pipeline Pilot — Co-Authoring One Course End-to-End

**Goal.** Prove the Faraday Academy content pipeline by co-authoring **one** pilot course script end-to-end with the vendored `doc-coauthoring` skill, under the **zero-fabricated-stats** rule, with an explicit citation trail for every factual claim. Draft-only — **nothing is published to LearnWorlds.**

**Deliverables in this folder**
| File | What it is |
|---|---|
| [`FA-101-11-course-script.md`](./FA-101-11-course-script.md) | The rewritten pilot course script (the doc deliverable) |
| [`FA-101-11-citation-trail.md`](./FA-101-11-citation-trail.md) | Every factual claim → source, with flags for corrected/discrepant/softened claims |
| `README.md` | This file: selection rationale, how the workflow was applied, reader-test results, Myke actions |

The vendored skill lives at [`/skills/doc-coauthoring/SKILL.md`](../../skills/doc-coauthoring/SKILL.md).

---

## 1. Why FA-101-11 was selected as the pilot

**Criterion (from the brief): the lowest-complexity Domain Tower, one existing Draft course.**

All 64 courses in the [Faraday Course Catalog](https://app.notion.com/p/33589a0c168081f3af5edebc6a695d2f) are currently `🟡 Draft — Awaiting Review`, so every course qualified on the "existing Draft" test. The tie-breaker was **complexity**, scored by how quantitative/technical the domain is and therefore how fabrication-prone its 101 course would be:

- **Highest complexity** (heavy quantitative/engineering claims): Chips & Density (D1), Power Architecture (D2), Cooling (D7), Grid (D3), Orchestration (D9). *E.g. the existing FA-101-01 draft asserts specific rack-kW figures, FLOPS comparisons, and GPU roadmap dates — dozens of hard numbers per module.*
- **Lowest complexity** (qualitative, political/social, few hard numbers): **Community Relations (D11)** and People & Signals (D8).

Within the low-complexity band, **Community Relations (D11)** beat People & Signals (D8) because it is the more **sourceable**: the Tower 11 page already names real markets (Frederick MD, King George VA, Boardman OR) and real public data sources (Good Jobs First, MR Online), whereas D8's 101 leans on un-sourceable curation ("the 11 executives worth following"). Community Relations gives a clean pilot: mostly conceptual claims that source cleanly to authoritative references, plus a few specific real-world claims that exercise the verify-or-flag discipline.

**Selected:** **FA-101-11 — *The New Risk: Why Community Opposition Blocks Data Centers*** (Domain 11, Level 101, Free tier, ~45 min). Its "existing draft" is the catalog entry + the [Tower 11 page](https://app.notion.com/p/33989a0c168081c6b46df2429f09a931) (description, 4-module outline, key concepts, key players, resistance monitor, data sources) — ample scaffolding to co-author a full script.

---

## 2. How the `doc-coauthoring` workflow was applied (autonomously)

The skill is written for an interactive human co-author. The brief granted autonomy to draft (stopping before LMS publish), so each stage was executed autonomously and is logged here for auditability.

- **Stage 1 — Context Gathering.** Pulled the existing draft (Notion catalog + Tower 11). Because the zero-fabrication rule governs, context-gathering was extended into **source verification**: every factual anchor was checked against public reporting (Gallup, NBC/Data Center Watch, Frederick County records, Brookings, FAS, Good Jobs First, LancasterOnline, Columbia Law) before any drafting. Candidate case studies for King George VA and Boardman OR were also verified (Appendix B of the citation trail) though not all were used.
- **Stage 2 — Refinement & Structure.** Built the script section-by-section on the catalog's 4-module spec, writing only claims that had a source in hand and tagging each `[S#]` inline. **The pipeline caught a factual error:** the draft's Module 4 title, *"Frederick, Maryland — The First Major Moratorium Victory,"* is contradicted by the record (the referendum was blocked by the courts; no basis for "first"). It was rewritten to the verified story and the error flagged — see citation trail §3(a).
- **Stage 3 — Reader Testing.** Ran a **fresh, context-free sub-agent** as a naive "101" reader (the skill's sub-agent path). It confirmed the script answers the core reader questions and self-corrects transparently, and surfaced three real fixes, all applied:
  1. **Zoning jargon** (rezoning, special-use, setbacks, overlay zone, tax abatement, Certificate of Occupancy, NIMBY) now defined inline on first use.
  2. **Lancaster CBA loop closed** (its benefits were publicly *questioned* — the "so what" is now explicit) and the unquantified *"statistically correlates"* softened to directional with a caveat (citation trail §3(c)).
  3. **Single takeaway** section added; the Gallup resource-use percentages reworded so they read as overlapping subsets, not additive.

---

## 3. Zero-fabrication outcome

- **25 factual claims** in the script, **every one** mapped to a source in the citation trail.
- **3 flags** raised rather than softened: (a) a corrected inherited factual error, (b) an internal-record discrepancy (the "Resolved" status in the internal Community Resistance Monitor is not supported by the public record), (c) one internal-only claim softened to directional for lack of a published statistic.
- **Excluded rather than asserted:** the "first U.S. city to permanently ban by ballot" superlative for Monterey Park CA (could not be independently confirmed).

---

## 4. Scope / boundaries honored

- **No LearnWorlds publish.** Draft-only. The Notion source pages were **read, not modified** — no approval status was flipped.
- **Repo choice.** All artifacts landed in **`faraday-academy`** (the active academy repo). **`Faraday-intelligence` was intentionally left untouched** — its `CLAUDE.md` marks it RETIRED/dormant ("Do not build new surfaces here").

---

## 5. Myke actions

1. **Approve (or adjust) this as the template pattern** for the remaining 35 D1–D9/passion-domain courses: *verify-first → draft with inline `[S#]` → reader-test → citation trail with explicit flags.*
2. **Fix the internal Community Resistance Monitor** (Tower 11, Notion): Frederick MD / King George VA / Boardman OR are logged "✅ Resolved (Q1 2026)" but the public record shows active litigation/restrictions into mid-2026. See citation trail §3(b).
3. **Decide on `sop-builder`.** The brief said to commit the SKILL.md "alongside `sop-builder`," but **no `sop-builder` skill exists** in either in-scope repo, in `/root/.claude/skills`, in the skills manifest, or in `/mnt/skills`. The `doc-coauthoring` SKILL.md was vendored to `faraday-academy/skills/doc-coauthoring/` as the vendored-skills location; if `sop-builder` lives in the out-of-scope engine repo (`v0-faraday-daily-challenge`), confirm whether these skills should be co-located there instead.
4. **When approved for build:** run the higher-complexity domains (Chips/Power/Grid) through the *same* verify-first discipline — they carry far more fabrication-prone quantitative claims than this pilot, so the citation trail matters more, not less.
5. **Optional pre-publish hardening:** confirm the Data Center Watch Q1-2026 figures against the primary report page (blocked automated retrieval; currently cited via NBC + corroborated by Fortune/Tom's Hardware — citation trail Appendix A).

Once approved, the script is shaped for the existing **Gutenberg** Notion→LearnWorlds pipeline (sections → units) — run `gutenberg.ts` in dry-run first.
