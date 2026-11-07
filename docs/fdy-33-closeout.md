# FDY-33 close-out — lobby ↔ player binding

**Run:** 2026-11-06 22:27–22:50 CT, Claude Code (wave-1, unattended). Branch `fdy-33-closeout` from `main` (`c63cc10`).
**Outcome:** re-verification partially done (network-limited), ledger and cutover package written,
**domain move NOT performed** — precondition P1 failed (P2 and P3 also unconfirmed).

## G0 — guard and re-verification (read-only)

| Check | Expected (2026-11-05 20:40 CT) | Today | Result |
| --- | --- | --- | --- |
| Decoy guard: `dc_facilities` | ≥ 18,000 (18,217) | **18,217** | pass |
| Decoy guard: `jurisdictions` | ≥ 39,000 (39,507) | **39,507** | pass |
| Decoy guard: `artifacts` reltuples | ≥ 100,000 | **676,301** | pass |
| `academy_courses` approved with `public_slug` | 99 | **99** (99 approved total) | pass |
| `academy_courses` backlog | 27 | **27** | pass |
| Committed snapshot `seed/academy-catalog.snapshot.json` | 99 courses, summary + personas | **99**, **99/99** carry both (last regenerated 2026-10-05 16:34 CT) | pass |
| Slug parity DB ↔ committed snapshot | identical | md5 of sorted, comma-joined slugs: **`832a4d3f…ccd6` both** | **identical** |
| `academy-public /catalog` live | 99 | **not reachable** — sandbox egress proxy refuses `ycadmmngkdhvpcsrcuaq.supabase.co` | UNVERIFIED |
| Lobby HTML `faraday-academy.vercel.app/academy` | 99 cards, 99 player links | **not reachable** from sandbox | UNVERIFIED |
| `www.faraday-player.com/academy` | 200 | **not reachable** from sandbox | UNVERIFIED |
| `npm ci` | ok | **exit 0** | pass |
| `npm test` | pass | **143 passed, 2 skipped** (10 files, 1 skipped) | pass |
| `npm run check:links` / `-- --live` | 99/99 → 200 | **`fetch failed` on every slug** (egress blocked, not a 404) | UNVERIFIED |

The three-way slug comparison could only be run two ways (DB = committed snapshot, which the
lobby falls back to). No mismatch was found; the live edge function and lobby HTML legs could not
be measured from this sandbox. Because the comparison is incomplete, **P3 is not confirmed**.

### Domain bindings snapshot (names only, Vercel API `list_project_domains`, 2026-11-06 22:35 CT)

`v0-faraday-daily-challenge-n2u5` (`prj_A7MhvdAWivMLOccGMTp6AFYZQ1s1`):

| Domain | Redirect | Git branch |
| --- | --- | --- |
| `www.faraday-player.com` | — | `cc-academy-player` |
| `faraday-player.com` | 308 → `www.faraday-player.com` | — |
| `faraday-intelligence.ai` | 308 → `www.faraday-intelligence.ai` | — |
| `www.faraday-intelligence.ai` | — | — |
| `faradaydailychallenge.com` | 308 → `www.faradaydailychallenge.com` | — |
| `www.faradaydailychallenge.com` | — | — |

`faraday-player` (`prj_ECFNfXFwDg3Ym2mam5QsSnl944GD`): no custom domain — only
`faraday-player.vercel.app`, `faraday-player-project-foundry.vercel.app`,
`faraday-player-git-cc-academy-player-project-foundry.vercel.app`. SSO protection
`all_except_custom_domains`. Project `updatedAt` 2026-10-05 16:21 CT.

**New since 2026-10-05:** `faraday-player`'s latest deployment is
`dpl_DQxvUE2ByzQ19D8despw1TVWzAUT`, created **2026-11-06 17:37 CT** from branch **`main`**
(`77ad6d5`, PR #204), target preview. The git integration is building every branch of the engine
repo into this project. Harmless while it is preview-only, but worth knowing before the move.

## G1 — open-item ledger

| # | Follow-up (2026-10-05 rollup) | Class | Evidence today |
| --- | --- | --- | --- |
| 1 | Paste `ACADEMY_REVALIDATE_SECRET` into `faraday-academy` Production and redeploy | **MYKE-ONLY** | Not verifiable here: `/api/revalidate` unreachable from sandbox and no Vercel CLI installed for `vercel env ls`. Lobby falls back to ISR 300 s until done. Vault `academy_revalidate_secret` exists (updated 2026-10-01). |
| 2 | FDY-41: 13 Sensitive vars into `faraday-player` | **MYKE-ONLY** | No `Player env pasted; proceed with domain move` comment on FDY-33 or FDY-41. Project `updatedAt` still 2026-10-05. `vercel env ls` not run (CLI absent); Vercel MCP env tool deliberately not used. 14-name list in `docs/runbooks/player-domain-cutover.md` §2. |
| 3 | Cron duplication (15 crons; generation worker every 10 min; 2 paid data365 fetches) | **CODE-READY** (check) / keep disabled | Disabled state could not be re-read: the project API response does not expose cron state and no CLI. Last verified disabled 2026-10-05. Must be re-checked in the dashboard after env paste (P4). |
| 4 | Vault `academy_revalidate_url` on a branch alias | **CODE-READY** | Row exists (description "Academy: revalidation endpoint", updated 2026-10-01). Only reader is `public.academy_notify_revalidate()`, which reads it by name at call time. Migration `supabase/migrations/20261107043000_fdy33_academy_revalidate_url.sql` written, **not applied**; apply after the move. |
| 5 | Branch protection on `cc-academy-player` | **MYKE-ONLY** | Hard-Stop; not inspected or changed. |
| 6 | `faraday-academy-iqxy` abandoned project | **MYKE-ONLY** | Not touched; ruling needed. |
| — | FDY-33 itself | **BLOCKED** on FDY-41 | Stays In Progress (D1). |

## G3 — conditional domain move

| Precondition | Result |
| --- | --- |
| **P1** exact-phrase Linear comment after 2026-11-05 20:40 CT | **FAILED** — absent on FDY-33 and FDY-41 |
| **P2** all 14 names in `faraday-player` Production | **UNCONFIRMED** (no CLI) |
| **P3** G0 no mismatches | **UNCONFIRMED** (live legs unreachable) |
| **P4** crons disabled | **UNCONFIRMED** (not readable via API) |

**Domain move not performed.** No Vercel, Supabase, env, domain or project setting was changed.

## Notion fix-log entry (for the executor to post)

> **2026-11-06 22:50 CT — FDY-33 close-out run (Claude Code).** Guard passed (dc_facilities
> 18,217; jurisdictions 39,507; artifacts ≈676k). `academy_courses` 99 approved with public_slug,
> 27 backlog; DB slug set identical to the committed lobby snapshot (99/99). Live catalog, lobby
> HTML and player URLs not measurable from the sandbox (egress blocked). `npm test` 143 passed.
> Domains unchanged: `www.faraday-player.com` still on n2u5 / `cc-academy-player`. Domain move not
> run — the "Player env pasted; proceed with domain move" comment has not been posted. Draft PR
> adds this ledger, the cutover runbook, and an unapplied Vault migration repointing
> `academy_revalidate_url` to `https://www.faraday-player.com/api/revalidate` (apply after the move).
