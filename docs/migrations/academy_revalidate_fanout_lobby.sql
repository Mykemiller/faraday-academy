-- Migration: academy_revalidate_fanout_lobby
--
-- STATUS: NOT APPLIED. Written, reviewed and ready; it could not be applied in
-- the 2026-10-05 run because Supabase access was unavailable (the MCP server
-- needs re-authorisation and the local CLI token returns 401 Unauthorized).
-- Apply with apply_migration under the name `academy_revalidate_fanout_lobby`.
--
-- Purpose: when an academy course changes status, the player already gets an
-- on-demand revalidation ping. This adds the same ping to the lobby, so the
-- catalog page does not sit on stale data for up to its 300s ISR window.
--
-- DESIGN NOTE — why this adds a trigger instead of editing the existing one.
--
-- The issue asked for the existing revalidate function to be extended with a
-- second net.http_post. Doing that requires `create or replace function` with
-- the full body, and the deployed body could not be read this run
-- (pg_get_functiondef needs the database access that was missing). Replacing a
-- function whose body you have not seen is how you silently delete the player's
-- own revalidation call. An additional trigger reaches the same outcome, is
-- safe to apply blind, and leaves the player path provably untouched.
--
-- Properties:
--   • idempotent — re-running it is a no-op
--   • never blocks a status change — its own exception handler swallows
--     everything and returns the row
--   • never writes academy_courses.status, or any other column
--   • does nothing at all when either Vault secret is absent

create or replace function public.academy_lobby_revalidate()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_url    text;
  v_secret text;
begin
  -- Absent secrets mean "lobby fan-out not configured yet": do nothing, quietly.
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'academy_lobby_revalidate_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'academy_revalidate_secret';

  if v_url is null or v_secret is null then
    return coalesce(new, old);
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-academy-revalidate-secret', v_secret
               ),
    body    := jsonb_build_object(
                 'source', 'academy_courses',
                 'slug',   coalesce(new.public_slug, old.public_slug),
                 'status', coalesce(new.status, old.status)
               )
  );

  return coalesce(new, old);
exception
  -- A revalidation ping must never be able to fail an editorial status change.
  when others then
    raise warning 'academy_lobby_revalidate: %', sqlerrm;
    return coalesce(new, old);
end;
$$;

comment on function public.academy_lobby_revalidate() is
  'Posts to the Academy lobby''s /api/revalidate when a course status changes. '
  'No-op unless Vault carries academy_lobby_revalidate_url and academy_revalidate_secret. '
  'Never raises; never writes academy_courses.';

drop trigger if exists academy_courses_lobby_revalidate on public.academy_courses;

create trigger academy_courses_lobby_revalidate
after insert or update of status on public.academy_courses
for each row
when (
  tg_op = 'INSERT'
  or new.status is distinct from old.status
)
execute function public.academy_lobby_revalidate();
