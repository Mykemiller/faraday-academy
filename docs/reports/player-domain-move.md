# FDY-41 — Move the player to its own Vercel project

**Run:** 2026-10-05.
**Outcome: STOPPED AT THE GATE. The domains were NOT moved.**
`www.faraday-player.com` and `faraday-player.com` remain on
`v0-faraday-daily-challenge-n2u5`, exactly as they were. Live traffic was never touched.

## Why it stopped

**12 of the 14 environment variables the player needs are Vercel *Sensitive* variables, and a
Sensitive variable's value cannot be read back by anyone — not the CLI, not the REST API, not
the dashboard.** They are write-only by design. Step 3 of this issue ("copy every variable the
player needs … piping values") is therefore not possible from a session that does not already
hold the values.

Two attempts, both conclusive:

1. `vercel env pull --environment=preview --git-branch=cc-academy-player`, and again for plain
   `preview` and `production`. The CLI wrote `[SENSITIVE]` as a placeholder for every Sensitive
   variable and warned it could not pull them.
2. `GET /v9/projects/{id}/env?decrypt=true` against the source project. Status 200, and every
   Sensitive row came back with an empty value.

```
NEXT_PUBLIC_SUPABASE_ANON_KEY    type=encrypted  targets=preview             branch=cc-academy-player  readable=YES
ACADEMY_REVALIDATE_SECRET        type=sensitive  targets=preview             branch=cc-academy-player  readable=no
DC_PUZZLE_SOURCE                 type=sensitive  targets=production+preview  branch=-                  readable=no
NEXT_PUBLIC_LEAGUE_OFFICE_OPEN   type=sensitive  targets=production+preview  branch=-                  readable=no
SIGNAL_ROOM_URL                  type=sensitive  targets=preview+production  branch=-                  readable=no
SUPABASE_URL                     type=sensitive  targets=production+preview  branch=-                  readable=no
RESEND_API_SECRET                type=sensitive  targets=preview+production  branch=-                  readable=no
SUPABASE_SERVICE_ROLE_KEY        type=sensitive  targets=preview+production  branch=-                  readable=no
HINT_GATE_ENFORCED               type=sensitive  targets=preview+production  branch=-                  readable=no
AIR_TABLE_API_KEY                type=sensitive  targets=preview+production  branch=-                  readable=no
AIRTABLE_API_KEY                 type=sensitive  targets=preview+production  branch=-                  readable=no
BEEHIIV_PUB_ID                   type=sensitive  targets=preview+production  branch=-                  readable=no
BEEHIIV_API_KEY                  type=sensitive  targets=preview+production  branch=-                  readable=no
ANTHROPIC_API_KEY                type=sensitive  targets=production+preview  branch=-                  readable=no
```

No value was ever printed, logged or written to a file that survived the step. The temp pull
directory was deleted.

Moving the domains onto a project missing `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` and
`ACADEMY_REVALIDATE_SECRET` would have taken signed-in progress sync, the Go-deeper panel and
the status-change revalidation hook off the live player. The run rule is explicit — a failed
gate means the approved action does not happen — so it did not.

## What WAS done, and is ready for Myke

Vercel project **`faraday-player`** — `prj_ECFNfXFwDg3Ym2mam5QsSnl944GD`, team
`team_JS3rgFwySt8w8yds7fAh1KeM`.

| Setting | Value | Matches source? |
| --- | --- | --- |
| Git repository | `Mykemiller/v0-faraday-daily-challenge` | yes |
| **Production branch** | **`cc-academy-player`** | intentionally different |
| Framework preset | Next.js | yes |
| Root directory | (repo root) | yes |
| Build / install / output command | Vercel defaults | yes |
| Node.js version | 24.x | yes |
| Function region | `iad1` | yes |
| Deployment protection | `all_except_custom_domains` | source is `null` (fully public); a custom domain is public under this setting either way |
| **Cron jobs** | **DISABLED** | see below |
| Custom domains | **none** | — |
| Environment variables | `NEXT_PUBLIC_SUPABASE_ANON_KEY` only | 13 still to add |

A production deployment was made from `cc-academy-player` HEAD as an isolated build probe —
the project has no custom domain and its crons are disabled, so nothing it does can reach a
user. **The build succeeded.**

### Gate results on `https://faraday-player.vercel.app`

| Check | Result |
| --- | --- |
| `/academy` | **200**, 99 course links, no offline state |
| `/academy/data-center-power-foundations` (101) | **200** |
| `/academy/the-threat-surface` (X) | **200** |
| `/academy/from-megawatts-to-money-the-capstone` (Capstone) | **200** |
| `/academy/data-center-power-foundations/glossary` | **200** |
| `/academy/data-center-power-foundations/quiz` | **200** |
| `/api/academy/deeper` (one request only) | **200** — `{"remaining":5,"limit":5,…}`, the meter untouched |
| `/api/score` | 405 |
| `/api/teams` | **500** |
| `/api/lo/seasons` | **500** |

The academy surface renders. The two 500s are the missing credentials, measured rather than
assumed — that is the gate failing, in the open.

Engine routes are reachable on the `*.vercel.app` host only because `src/proxy.ts` keys its
block on the player **host**; on `www.faraday-player.com` they would be rewritten into the
academy tree as they are today. That is not a new exposure, but it is why this URL should not
be shared.

## ⚠️ The cron trap — found, neutralised, and it must stay neutralised

`vercel.json` on `cc-academy-player` declares **15 cron jobs**, and Vercel runs crons from a
project's *production* deployments. Making `cc-academy-player` a production branch of a second
project therefore schedules every one of them **a second time**:

```
0 5,6 * * *   /api/cron/rotate                     (puzzle rotation)
10 5,6 * * *  /api/cron/sync-day-content
40 6 * * *    /api/cron/recompute-solve-bands
5 * * * *     /api/cron/season-config-apply
*/10 * * * *  /api/cron/generation-worker          (every ten minutes)
0 6 * * 6     /api/pipelines/agenda-watch/crawl
0 12 * * 6    /api/pipelines/puc/crawl
0 18 * * 6    /api/pipelines/data365/fetch         (paid API)
0 1 * * 0     /api/pipelines/agenda-watch/extract
0 8 * * *     /api/pipelines/data365/aggregate
0 6 * * 1     /api/pipelines/eia/refresh
0 5 * * 0     /api/pipelines/idf/ingest
0 6 * * 0     /api/pipelines/health
```

These write to the production database, call paid APIs and send mail. The issue did not
anticipate this; it is a direct consequence of pointing a second Vercel project at a repo whose
`vercel.json` carries the engine's schedule.

**Crons are disabled on `faraday-player`** — verified after the deployment re-registered the 15
definitions (`disabledAt` is later than `enabledAt`). Two things follow:

1. **Do not enable them.** The crons belong to the engine, which deploys from `main` on
   `v0-faraday-daily-challenge-n2u5`. The player is a reader and needs none of them.
2. **Re-check the disabled flag immediately after adding the environment variables.** Today the
   missing credentials are a second safety net — every cron route 500s without
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, so even a stray firing cannot write. Adding
   the secrets removes that net.

A durable alternative, if this project is kept: strip the `crons` array from `vercel.json`
**on the `cc-academy-player` branch only**. It was not done here because that branch may
eventually merge into `main`, and the merge would delete the engine's schedule.

## To finish the move (Myke)

1. Add the 13 remaining variables to `faraday-player`, targets **Production** and **Preview**.
   `ACADEMY_REVALIDATE_SECRET` must equal Vault `academy_revalidate_secret`; the others are
   copies of what `v0-faraday-daily-challenge-n2u5` holds. (The dashboard can copy a Sensitive
   variable's value between projects where the API cannot.)
2. Confirm cron jobs are still **disabled** on `faraday-player`.
3. Redeploy production on `faraday-player` from `cc-academy-player`, and re-run the gate above.
   `/api/teams` and `/api/lo/seasons` should stop being 500s.
4. Move the domains: remove `www.faraday-player.com` and `faraday-player.com` from
   `v0-faraday-daily-challenge-n2u5`, then immediately add them to `faraday-player` — **www as
   primary, apex redirecting to www**. Touch no other domain on the old project
   (`faraday-intelligence.ai`, `www.faraday-intelligence.ai`, `faradaydailychallenge.com` and
   `www.faradaydailychallenge.com` all stay).
5. Verify: `https://www.faraday-player.com/` and three course pages 200 ·
   `faraday-player.com` 308s to www · `/academy/<slug>` 308s to `/<slug>` ·
   `npm run check:links -- --live` from the lobby repo passes.
6. **Rollback if any of that fails:** move both domains back to
   `v0-faraday-daily-challenge-n2u5` with the `cc-academy-player` git-branch binding, and
   re-verify the six URLs above.

## State as left — verified at the end of the run

| Thing | State |
| --- | --- |
| `faraday-player.com` / `www.faraday-player.com` | still on `v0-faraday-daily-challenge-n2u5` |
| `https://www.faraday-player.com/` | **200** |
| `https://faraday-player.com/` | **308 → www** |
| `https://www.faraday-player.com/data-center-power-foundations` | **200** |
| `https://www.faraday-player.com/academy/data-center-power-foundations` | **308 → /data-center-power-foundations** |
| `v0-faraday-daily-challenge-n2u5` | unchanged — no setting, domain, env var or cron altered |
| `faraday-player` (new) | configured, deployed, **no custom domain**, crons disabled |
| Vault `academy_revalidate_url` | **not read** — needs Supabase access, which this session did not have |

## Recommendations, not actions

- **Branch protection on `cc-academy-player`.** It is already the branch
  `www.faraday-player.com` serves and would become a production branch after the move. It has
  no protection today. Recommended: require a pull request, and require the Vercel build check,
  before merge. **Not applied** — repository settings were out of scope.
- **`faraday-academy-iqxy` (`prj_adXOXJmACLLwYQ9bgoKvvQ3fJup0`, created 2026-09-27)** is a
  second Vercel project connected to the **lobby** repo `Mykemiller/faraday-academy`. It built
  PR #10 alongside the real project. It holds no custom domain — `faraday-player.com` resolves
  to `v0-faraday-daily-challenge-n2u5`, confirmed by `vercel domains inspect`, despite what the
  "Latest Production URL" column in `vercel project ls` suggests. It looks like an abandoned
  attempt. **Not deleted** — deleting a Vercel project is a Hard-Stop.
- **Vercel Sensitive variables make project-to-project migration a dashboard job.** Worth
  knowing before the next move is planned around a CLI step that cannot work.
