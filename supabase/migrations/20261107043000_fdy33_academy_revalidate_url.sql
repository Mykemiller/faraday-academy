-- FDY-33 close-out: repoint Vault `academy_revalidate_url` from the
-- cc-academy-player git-branch alias on v0-faraday-daily-challenge-n2u5 to the
-- canonical player domain.
--
-- WRITTEN, NOT APPLIED. Myke applies it via apply_migration AFTER the
-- www.faraday-player.com domain move (FDY-41). Before the move the canonical
-- URL still routes to the old project, so applying early changes nothing
-- useful; applying never is what leaves the player stale after the move.
--
-- Scope: one Vault row, by name. No secret value is read into output, logged
-- or compared. `academy_revalidate_secret` and `academy_lobby_revalidate_url`
-- are not touched. public.academy_notify_revalidate() reads the URL by name at
-- call time, so no function or trigger change is needed.
--
-- Idempotent: re-running when the value is already canonical is a no-op.
-- Self-asserting: raises (and rolls back) if the row is missing, duplicated,
-- or not canonical afterwards.

do $$
declare
  v_target constant text := 'https://www.faraday-player.com/api/revalidate';
  v_id     uuid;
  v_n      integer;
begin
  select count(*) into v_n from vault.secrets where name = 'academy_revalidate_url';
  if v_n <> 1 then
    raise exception 'FDY-33: expected exactly 1 Vault row named academy_revalidate_url, found %', v_n;
  end if;

  select id into v_id from vault.secrets where name = 'academy_revalidate_url';

  if exists (
    select 1 from vault.decrypted_secrets
     where id = v_id and decrypted_secret = v_target
  ) then
    raise notice 'FDY-33: academy_revalidate_url already canonical; no change';
  else
    perform vault.update_secret(
      v_id,
      v_target,
      'academy_revalidate_url',
      'Academy: player revalidation endpoint (canonical domain, FDY-33)'
    );
  end if;

  if not exists (
    select 1 from vault.decrypted_secrets
     where id = v_id and decrypted_secret = v_target
  ) then
    raise exception 'FDY-33: academy_revalidate_url is not canonical after update';
  end if;

  -- The other two academy Vault rows must still exist, untouched by name.
  select count(*) into v_n from vault.secrets
   where name in ('academy_revalidate_secret', 'academy_lobby_revalidate_url');
  if v_n <> 2 then
    raise exception 'FDY-33: expected academy_revalidate_secret and academy_lobby_revalidate_url to exist, found %', v_n;
  end if;
end
$$;
