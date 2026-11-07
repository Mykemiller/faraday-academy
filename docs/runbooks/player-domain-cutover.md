# Runbook — move `www.faraday-player.com` to Vercel project `faraday-player`

**Written:** 2026-11-06 22:40 CT (FDY-33 close-out). **Executes:** FDY-41.
**Approval:** Myke approved the move with rollback on 2026-10-05 (FDY-33 decision 3). It is still
gated on the preconditions below, which were **not** met when this was written.

| | |
| --- | --- |
| Team | `team_JS3rgFwySt8w8yds7fAh1KeM` (slug `project-foundry`) |
| From | `v0-faraday-daily-challenge-n2u5` (`prj_A7MhvdAWivMLOccGMTp6AFYZQ1s1`), www bound to git branch `cc-academy-player` |
| To | `faraday-player` (`prj_ECFNfXFwDg3Ym2mam5QsSnl944GD`), production branch `cc-academy-player` |
| Domains that move | `www.faraday-player.com` (primary), `faraday-player.com` (308 → www) |
| Domains that stay | `faraday-intelligence.ai`, `www.faraday-intelligence.ai`, `faradaydailychallenge.com`, `www.faradaydailychallenge.com` |

## 1. Preconditions — all must hold

- **P1** A Linear comment on FDY-41 or FDY-33, dated after 2026-11-05 20:40 CT, containing exactly
  `Player env pasted; proceed with domain move`, not posted by an automated run.
- **P2** `vercel env ls production --scope team_JS3rgFwySt8w8yds7fAh1KeM` in the `faraday-player`
  project lists all 14 names in §2. Names only; never `vercel env pull`.
- **P3** Read-only re-verification has no mismatches: DB approved slugs = `academy-public /catalog` =
  lobby HTML player links = 99, identical sets.
- **P4** Cron jobs are **disabled** on `faraday-player` (Project → Settings → Cron Jobs shows
  disabled; `disabledAt` later than `enabledAt`). Re-check it **after** adding the env vars.

## 2. Env-var NAME checklist (`faraday-player`, Production and Preview)

Source: `docs/reports/player-domain-move.md`. Values come from `v0-faraday-daily-challenge-n2u5`
(dashboard copy; Sensitive values cannot be read by CLI or API).

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (present since 2026-10-05)
- [ ] `ACADEMY_REVALIDATE_SECRET` (must equal Vault `academy_revalidate_secret`)
- [ ] `DC_PUZZLE_SOURCE`
- [ ] `NEXT_PUBLIC_LEAGUE_OFFICE_OPEN`
- [ ] `SIGNAL_ROOM_URL`
- [ ] `SUPABASE_URL`
- [ ] `RESEND_API_SECRET`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `HINT_GATE_ENFORCED`
- [ ] `AIR_TABLE_API_KEY`
- [ ] `AIRTABLE_API_KEY`
- [ ] `BEEHIIV_PUB_ID`
- [ ] `BEEHIIV_API_KEY`
- [ ] `ANTHROPIC_API_KEY`

## 3. Order of operations

```bash
SCOPE=team_JS3rgFwySt8w8yds7fAh1KeM

# 0. Snapshot current bindings (names only) into the run log
vercel domains inspect faraday-player.com --scope $SCOPE
vercel project inspect v0-faraday-daily-challenge-n2u5 --scope $SCOPE
vercel project inspect faraday-player --scope $SCOPE

# 1. Env present (P2) — names only
cd <checkout linked to faraday-player>   # vercel link --project faraday-player --scope $SCOPE
vercel env ls production --scope $SCOPE

# 2. Deploy faraday-player production from cc-academy-player HEAD
#    (Dashboard → faraday-player → Deployments → Redeploy the cc-academy-player production build)
#    Then re-confirm P4: crons still disabled.

# 3. Smoke test on the generated URL (behind SSO; use `vercel curl`)
vercel curl https://faraday-player.vercel.app/academy --scope $SCOPE
vercel curl https://faraday-player.vercel.app/api/teams --scope $SCOPE      # must no longer be 500
vercel curl https://faraday-player.vercel.app/api/lo/seasons --scope $SCOPE # must no longer be 500

# 4. Detach from the old project, then attach immediately (keep the gap short)
vercel domains rm www.faraday-player.com --scope $SCOPE   # confirm it targets the n2u5 project binding
vercel domains rm faraday-player.com --scope $SCOPE
#   NOTE: if `vercel domains rm` would remove the domain from the team rather than the project,
#   use Dashboard → v0-faraday-daily-challenge-n2u5 → Settings → Domains → Remove instead.
vercel domains add www.faraday-player.com faraday-player --scope $SCOPE
vercel domains add faraday-player.com faraday-player --scope $SCOPE
#   Dashboard → faraday-player → Domains: www primary; apex "Redirect to www.faraday-player.com" (308)

# 5. Verify (§4). 6. Apply the Vault migration (§5).
```

## 4. Post-move smoke tests — all must pass, else roll back (§6)

| Check | Expect |
| --- | --- |
| `curl -sI https://www.faraday-player.com/` | 200, served by `faraday-player` (`x-vercel-id`, `vercel domains inspect`) |
| `curl -sI https://faraday-player.com/` | 308 → `https://www.faraday-player.com/` |
| `/data-center-power-foundations`, `/the-threat-surface`, `/from-megawatts-to-money-the-capstone` | 200, no redirect |
| `/academy/data-center-power-foundations` | 308 → `/data-center-power-foundations` |
| `npm run check:links -- --live` (this repo) | 99/99 → 200, no redirect |
| `POST /api/revalidate` without secret | 401 (or the player's deliberate opaque 404) |
| Signed-in progress sync on one lesson | progress persists across reload |
| Go-deeper panel (`/api/academy/deeper`, one request) | 200; meter not reset |
| Other domains on n2u5 | unchanged: `faraday-intelligence.ai`, `faradaydailychallenge.com` still 200/308 as before |

## 5. After a passing move

1. Apply `supabase/migrations/20261107043000_fdy33_academy_revalidate_url.sql` (Myke, via
   `apply_migration`, project `ycadmmngkdhvpcsrcuaq`). Not before the move.
2. Toggle one approved course's status in a dev-safe way (or wait for the next real change) and
   confirm the player's page refreshes without waiting for ISR.
3. Crons: leave **disabled** on `faraday-player`. Re-enable only one at a time, only with the
   matching cron off on n2u5 in the same change (FDY-33 D2).

## 6. Rollback

1. Remove `www.faraday-player.com` and `faraday-player.com` from `faraday-player`.
2. Re-add them to `v0-faraday-daily-challenge-n2u5`: www with **Git branch `cc-academy-player`**,
   apex redirecting 308 → www.
3. Re-run the §4 URL checks against the old project.
4. If the Vault migration was already applied, the canonical URL still resolves to whichever project
   holds the domain, so no Vault rollback is needed.
5. Lobby rollback (unrelated to this move, kept for reference): `faraday-academy` deployment
   `dpl_6kd5aKpnXtzh5fRPXTrFJPGHRYxg` → Instant Rollback.
