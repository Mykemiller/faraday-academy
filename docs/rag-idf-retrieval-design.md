# Design Note — IDF Crawler Retrieval Layer for Academy Course Generation

**Status:** Design-only proposal. No DB/infra changes. No production changes.
**Method:** `rag-architect` skill (reused from CC-7; this is the Academy-scoped design pass).
**Feeds:** Part 3 sourcing strategy. Maps to AUTO-164 / 176 / 177 / 165 / 166 → D3.1–D3.5.
**Autonomy boundary:** design note only. Stop before any infra stand-up. See §7.

---

## 0. TL;DR + Myke actions

Faraday's crawler already does 90% of the hard work of a retrieval layer: every
crawled artifact is chunked and **embedded** (`text-embedding-3-small`, 1536-dim,
pgvector) in the live `ycadmmngkdhvpcsrcuaq` Supabase project, enriched with a
factual summary + relevance score, and tagged to IDF Domains. What is missing is
**not embedding infrastructure** — it is a thin, governed *retrieval contract*
that a course-generation prompt can call to pull the freshest, most relevant
crawled evidence for a given Domain / Sub-Domain, with a **staleness cutoff** so
courses ground on current reality rather than static registry prose.

This note designs that contract. It does **not** build it.

**Myke actions (decision requested):**
1. **Approve this retrieval layer as the sourcing backbone for Part 3** — i.e.
   Academy course generation grounds on *fresh crawled artifacts* retrieved by
   Domain/Sub-Domain with a 90-day staleness window, not on the static
   `scripts/idf-data.mjs` registry text alone.
2. **Confirm the 90-day default staleness cutoff** (§5.4), consistent with the
   rolling-window freshness pattern used to fix AUTO-136 (and the existing
   trailing-30-day *countable* rule in the poller). Per-Domain overrides allowed.
3. **Pick the Sub-Domain scoping resolution** (§4) — the one real design fork:
   semantic-anchor scoping (ship-now, zero migration) vs. adding a sub-domain
   classification field at enrich time (higher precision, needs an infra sprint).
   Recommendation: **ship semantic-anchor now, backfill classification later.**

Everything below is the reasoning behind those three asks.

---

## 1. What exists today (the substrate is already built)

### 1.1 Crawler → enrichment pipeline (Faraday-intelligence)

The `source-poller` (AUTO-199, `source-poller_v1.3`) polls the unified
`source_registry` and writes crawled items to **`artifacts`**. The
`enrich-artifacts` pipeline (AUTO-030, `AUTO-030_v2.1`, Anthropic Batches API)
then chunks + embeds + summarizes each artifact. Relevant tables:

| Table | What it holds | Fields we retrieve on |
|---|---|---|
| `artifacts` | one row per crawled item | `artifact_id`, `source_type`, `source_url`, **`published_at`**, `raw_content`, `enrich_status`, **`signal_envelope`** (jsonb: `idf_domains[]`, `source_key`, `source_name`, `license`, `license_status`, `confidence_cap`), `crawl_metadata` (jsonb: `fetched_at`) |
| `artifact_chunks` | chunked text + vector | `chunk_index`, `chunk_text`, **`embedding` (vector, 1536-dim)**, `embedding_model` |
| `artifact_enrichments` | LLM enrichment | `summary`, `category_tags`, **`relevance_score` (0–1)**, `priority_flag`, `prediction_signals` |
| `artifact_entities` | entity mention links | `entity_id`, `mention_count` |
| `source_registry` | source provenance | `idf_domains[]`, `cadence`, `license_status`, `scope`, `countable` |
| `faraday_subdomains` | IDF taxonomy (116) | `subdomain_code` (e.g. `D3.4`), `display_name` |

Key facts that shape the design:

- **Embeddings already exist.** `enrich-artifacts` writes `artifact_chunks.embedding`
  with `text-embedding-3-small`. A retrieval layer does **not** need a new
  embedding job — it needs the query side (embed the query, run a vector search,
  join enrichment + provenance, filter, rank).
- **Provenance + license are on every artifact** (`signal_envelope`). Retrieval
  can and must respect `license_status` — only `cleared` / `attribution_required`
  content should ground a course; gated content is excluded, same as the poller's
  countable rule.
- **`published_at` is the staleness anchor**, nullable for index-poll items that
  carry no publish date. Fallback: `crawl_metadata.fetched_at` (discovery time
  anchors the timeline — the poller's own convention).
- **A relevance gate already runs upstream.** Query-lane noise is stored with
  `enrich_status='skipped'` and never embedded, so the chunk store is already
  pre-filtered to infrastructure-relevant content.

### 1.2 Academy course generation today (faraday-academy)

`scripts/generate-catalog.mjs` derives the course catalog deterministically from
**static** `scripts/idf-data.mjs` — real registry descriptions, but frozen prose.
The course grain is the Sub-Domain (D-codes); 23 Domains = Schools, Sub-Domains =
Courses, 7 Themes = Learning Paths. Product attributes are DRAFT pending the
FAR-149 editorial gate.

**This is the gap Part 3 closes:** course drafting currently sees only the static
registry text. It cannot say "as of this quarter, FERC Order 1920 transmission
planning is the live bottleneck on D3.4" because it has no line of sight to the
crawler's fresh artifacts. The retrieval layer is that line of sight.

---

## 2. What the retrieval layer is (and isn't)

**Is:** a scoped, staleness-bounded, license-safe query contract over the existing
`artifact_chunks` vector store that returns ranked, cited evidence for a given IDF
Domain / Sub-Domain — the *grounding context* a course-generation prompt reads
before it drafts.

**Isn't:** a new embedding store, a new crawler, a reranking model, a chat
assistant, or a write path. It reads the substrate that already exists.

---

## 3. The retrieval contract

A single logical function, callable from a course-generation step:

```
retrieve_idf_evidence(
  scope:        { domain: "D3", subdomain?: "D3.4" },   // Sub-Domain optional
  query:        string,        // the drafting intent, e.g. the Sub-Domain thesis
  freshness:    { max_age_days: 90 },  // §5.4 — default 90, per-Domain override
  k:            12,            // chunks returned
  min_relevance: 0.5,          // artifact_enrichments.relevance_score floor
  license:      ["cleared", "attribution_required"]  // gated excluded
) -> EvidenceChunk[]

EvidenceChunk = {
  chunk_text, summary, source_name, source_url,
  published_at, relevance_score, similarity, license, idf_domains
}
```

Retrieval reference implementation (design sketch — **not applied**), a
read-only SQL/pgvector query behind an RPC or an Edge function:

```sql
-- $embedding = text-embedding-3-small(query); $domain, $sub, $cutoff, $k
select ac.chunk_text, ae.summary,
       a.signal_envelope->>'source_name' as source_name,
       a.source_url,
       coalesce(a.published_at, (a.crawl_metadata->>'fetched_at')::timestamptz) as dated_at,
       ae.relevance_score,
       1 - (ac.embedding <=> $embedding) as similarity,
       a.signal_envelope->>'license_status' as license_status
from artifact_chunks ac
join artifacts a            on a.artifact_id = ac.artifact_id
join artifact_enrichments ae on ae.artifact_id = a.artifact_id
where a.enrich_status = 'complete'
  and a.signal_envelope->>'license_status' in ('cleared','attribution_required')
  and (a.signal_envelope->'idf_domains') ? $domain            -- Domain prefilter
  and coalesce(a.published_at, (a.crawl_metadata->>'fetched_at')::timestamptz)
        >= now() - ($cutoff || ' days')::interval             -- §5.4 staleness
  and ae.relevance_score >= $min_relevance
order by ac.embedding <=> $embedding                          -- vector ANN
limit $k * 4;                                                 -- overfetch, then rank in §5.3
```

The Domain prefilter (`idf_domains ? $domain`) is exact and cheap. Sub-Domain
narrowing happens in §4.

---

## 4. The one real design fork: Sub-Domain scoping

**Problem:** artifacts are tagged at **Domain** grain (`signal_envelope.idf_domains`
carries `D3`), inherited from the source. They are **not** tagged at Sub-Domain
grain (`D3.4`). But courses are authored at the Sub-Domain grain. So "scope to
D3.4" cannot be a simple equality filter today.

Two ways to bridge the grain, not mutually exclusive:

**Option A — Semantic-anchor scoping (recommended, ship now, zero migration).**
Use the Sub-Domain's own registry description as the semantic anchor for the
query. Each Sub-Domain in the IDF Sub-Domain Registry (Airtable `tbla7rtRY9AaeoWhu`,
mirrored to Supabase `faraday_subdomains`) has a rich descriptor — e.g. D3.4:
*"long-distance transmission expansion … FERC Order 1920 … NIETC … Grain Belt
Express, SunZia, MISO LRTP."* Embed that descriptor (optionally concatenated with
the drafting intent) as `$embedding`, prefilter on the parent Domain (`D3`), and
let vector similarity do the Sub-Domain narrowing. Ranking (§5.3) surfaces the
chunks that are semantically about *transmission*, not the rest of D3.
- **Pro:** works today against the existing store, no schema change, respects the
  autonomy boundary (design-only). Sub-Domain precision comes "for free" from the
  descriptor quality, which is already high.
- **Con:** soft boundary — a D3.1 (interconnection queue) artifact can leak into a
  D3.4 (transmission) pull if it's semantically close. Acceptable for grounding;
  the course author reviews citations anyway.

**Option B — Sub-Domain classification at enrich time (higher precision, later).**
Extend `enrich-artifacts` to emit a `subdomain_codes[]` tag per artifact (the
enrichment LLM already reads the content; adding a taxonomy-constrained label is
incremental) and store it for an exact filter. This is an **infra sprint** — a
new field, a backfill over the existing corpus, and an enrichment prompt change —
and is therefore **out of scope for this note** (§7). Recommend as the Part 3
follow-on once Option A proves the retrieval loop.

**Recommendation:** ship Option A as the sourcing backbone now; queue Option B as
the precision upgrade. This is the decision in Myke action #3.

---

## 5. Ranking, freshness, and the staleness cutoff

### 5.1 Why not pure vector similarity

Pure cosine similarity over-rewards prose that echoes the query and ignores two
things a course needs: **is this current** and **is this a strong signal**. The
crawler already gives us both — `published_at` and `relevance_score` — so ranking
blends them.

### 5.2 The signals

- **`similarity`** = `1 - (embedding <=> query)` — topical fit.
- **`relevance_score`** (0–1) — the enrichment LLM's judgment of infrastructure
  signal strength; a hard floor (`min_relevance`) plus a ranking weight.
- **`recency`** — a decay over `dated_at` within the staleness window, so a
  6-week-old artifact outranks an 89-day-old one of equal similarity.
- **`priority_flag`** — small boost for enrichment-flagged high-priority items.

### 5.3 Blended rank (design default; tunable)

```
score = 0.55 * similarity
      + 0.25 * relevance_score
      + 0.20 * recency_decay(dated_at, half_life = 30d)
      + priority_flag ? 0.05 : 0
```

Overfetch `k*4` by ANN (§3), then re-rank by `score`, then dedupe to one best
chunk per `source_url` (avoid a single article dominating), then return top `k`.
De-dup-by-source matters: the crawler stores near-duplicates across feeds.

### 5.4 Staleness cutoff — **90-day default**

Course generation must ground on *current* reality. A hard `max_age_days` filter
(§3) drops anything older than the window before ranking even runs.

- **Default: 90 days.** Proposed as the Academy default, consistent with the
  **rolling-window freshness pattern used to fix AUTO-136** — a bounded trailing
  window is the durable fix for staleness, rather than an unbounded "all history"
  pull that lets stale artifacts masquerade as current. The poller already lives
  by the same principle: its *countable* flag requires an artifact in the trailing
  **30 days** (`SOURCE-POLLER-RUNBOOK`). 90 days is the Academy analogue — wide
  enough that a Domain with a slower news cadence (e.g. D19 Tax/Incentives) still
  clears the floor within a quarter, narrow enough that "fresh" means fresh.
- **Why not 30?** 30 days is right for *is this source alive* (poller health).
  Course grounding wants a **quarter** of context so a Sub-Domain with a monthly
  or quarterly signal cadence isn't starved. A 30-day window would return an empty
  set for slow Domains and silently fall back to stale registry prose.
- **Per-Domain override.** Fast Domains (D5 Hyperscaler capex, D4 M&A) can tighten
  to 30–45 days; slow/structural Domains (D19, D11 Sustainability policy) can widen
  to 120–180. The 90-day default is the floor decision; overrides are config, not
  code.
- **Empty-window guard.** If a scoped query returns `< min_results` (e.g. 3)
  within the window, the retriever **widens the window in one step** (90 → 180)
  and **flags the result as `stale_widened: true`** so the generation prompt can
  disclose reduced freshness rather than silently drafting on thin evidence. It
  never silently drops to unbounded history.

---

## 6. How a course-generation prompt uses it

The drafting step becomes retrieve-then-draft:

1. **Resolve scope.** Course = Sub-Domain `D3.4` under School/Domain `D3`.
2. **Build the query anchor.** `query = subdomain.display_name + " — " +
   subdomain.descriptor` (from `faraday_subdomains` / the IDF Sub-Domain Registry).
   Optionally append the drafting intent ("draft the 201 module outline").
3. **Call the contract.** `retrieve_idf_evidence({domain:"D3", subdomain:"D3.4"},
   query, {max_age_days:90}, k:12)`.
4. **Ground the draft.** Inject the returned `EvidenceChunk[]` into the generation
   prompt as a cited evidence block, and instruct the model to prefer it over
   prior knowledge and to cite `source_name` + `published_at`.

Prompt skeleton (illustrative):

```
You are drafting the Faraday Academy course for Sub-Domain {code} — {name},
under the {domain_name} school.

Ground your draft in the FRESH EVIDENCE below (crawled in the last {window} days,
newest first). Prefer it over prior knowledge. Where the evidence and the static
registry thesis conflict, trust the evidence and note the shift. Cite each factual
claim as [source_name, published_at].

STATIC THESIS (registry): {subdomain.thesis}

FRESH EVIDENCE ({n} artifacts, {window}-day window{stale_widened ? ", widened" : ""}):
{for each chunk}
- [{source_name}, {published_at}] (relevance {relevance_score})
  {summary}
  “{chunk_text excerpt}”
{/for}

Draft: learning objectives, module outline, and the "what changed this quarter"
callout that only fresh evidence can supply.
```

This is the concrete answer to the DONE-WHEN item: *how a course-generation prompt
queries the retrieval layer scoped to a Domain/Sub-Domain before drafting, with a
staleness cutoff.*

---

## 7. Boundary — what this note deliberately does NOT do

Per the autonomy contract (design-only; stop before infra stand-up):

- **No** RPC / Edge function created, **no** migration, **no** index built.
- **No** enrichment change (Option B sub-domain classification is queued, not built).
- **No** change to `generate-catalog.mjs` or the Academy runtime.
- **No** production writes to either repo beyond this design doc.

Standing the layer up (the next, separately-approved sprint) would be: (a) a
read-only `retrieve_idf_evidence` RPC/Edge function over the existing store; (b) a
pgvector ANN index tuned for the Domain-prefiltered query if one isn't already
present; (c) the query-embedding call (`text-embedding-3-small`, to match the
corpus); (d) wiring the retrieve-then-draft step into the course generator. None of
that is done here.

---

## 8. Open decisions for Myke

| # | Decision | Recommendation |
|---|---|---|
| 1 | Adopt fresh-crawled retrieval as the Part 3 sourcing backbone (vs. static registry prose) | **Yes** — that's the point of Part 3 |
| 2 | 90-day default staleness cutoff (AUTO-136 rolling-window pattern), per-Domain override | **Yes**, with per-Domain overrides as config |
| 3 | Sub-Domain scoping: Option A (semantic anchor, ship now) vs. Option B (classify at enrich, later) | **A now, B as follow-on** |
| 4 | License posture: exclude `gated`, allow `cleared` + `attribution_required` | **Yes** — mirror the poller's countable rule; carry attribution into citations |
| 5 | Empty-window behavior: widen-once + disclose vs. hard-empty | **Widen once (90→180), flag `stale_widened`** |

---

## 9. Provenance of this note

- Crawler substrate verified against Faraday-intelligence
  `supabase/functions/{source-poller,enrich-artifacts}` and
  `supabase/migrations/` on branch `claude/rag-architect-idf-retrieval-mkrain`.
- Academy generation verified against `scripts/{idf-data,generate-catalog}.mjs`
  and `lib/catalog.ts`.
- IDF Sub-Domain Registry: Airtable `tbla7rtRY9AaeoWhu` (snapshot in
  `Faraday-intelligence/docs/briefing-library-migration/`), mirrored to Supabase
  `faraday_subdomains` (116 codes).
- No live infra was queried or modified; all table/column references are read from
  committed source.
```