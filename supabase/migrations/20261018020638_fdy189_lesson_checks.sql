-- FDY-189: flip-card checks for Academy lessons. Additive only: no change to
-- academy_courses or any other academy table.
--
-- Access mirrors the academy_* tables: RLS on, no policies, so anon and
-- authenticated read nothing; the academy-public edge function reads with the
-- service role and serves only approved/published rows of servable courses.
--
-- Keyed by lesson_id (the join the read path uses). lesson_slug is the
-- human-readable label: 3 slugified lesson titles collide across courses, so
-- it cannot be unique on its own. ON DELETE SET NULL keeps cards if a lesson
-- row is rebuilt; an orphaned card is simply not served until re-linked.

create table public.lesson_checks (
  id                uuid primary key default gen_random_uuid(),
  lesson_id         uuid references public.academy_course_lessons(id) on delete set null,
  lesson_slug       text not null check (btrim(lesson_slug) <> ''),
  card_index        integer not null check (card_index >= 1),
  question          text not null check (btrim(question) <> ''),
  options           jsonb not null check (
                      jsonb_typeof(options) = 'object'
                      and options ?& array['A','B','C','D']
                      and options - array['A','B','C','D'] = '{}'::jsonb),
  correct_key       text not null check (correct_key in ('A','B','C','D')),
  rationales        jsonb not null check (
                      jsonb_typeof(rationales) = 'object'
                      and rationales ?& array['A','B','C','D']
                      and rationales - array['A','B','C','D'] = '{}'::jsonb),
  wrong_choice_note text not null check (btrim(wrong_choice_note) <> ''),
  source_excerpt    text not null check (btrim(source_excerpt) <> ''),
  status            text not null default 'draft' check (status in ('draft','approved','published')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (lesson_id, card_index)
);

create index lesson_checks_lesson_slug_idx on public.lesson_checks (lesson_slug);

comment on table public.lesson_checks is
  'FDY-189 flip-card checks per Academy lesson. Service-role only (RLS on, no policies). '
  'Served by academy-public only when status is approved/published; approved/published '
  'requires SET LOCAL academy.myke_signoff = ''true'' (same gate as academy_courses).';

alter table public.lesson_checks enable row level security;
revoke all on table public.lesson_checks from anon, authenticated;

create trigger trg_lesson_checks_touch
  before update on public.lesson_checks
  for each row execute function public.academy_touch_updated_at();

-- Same human gate as academy_courses: a pipeline can write drafts, never
-- approved or published, unless the transaction carries Myke's sign-off.
create or replace function public.lesson_checks_enforce_approval_gate()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status in ('approved','published')
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and coalesce(current_setting('academy.myke_signoff', true), '') <> 'true' then
    raise exception
      'Governance gate: moving lesson check % #% into status "%" requires explicit Myke sign-off. Run SET LOCAL academy.myke_signoff = ''true'' in the same transaction.',
      new.lesson_slug, new.card_index, new.status;
  end if;
  return new;
end;
$$;

revoke execute on function public.lesson_checks_enforce_approval_gate() from public, anon, authenticated;

create trigger trg_lesson_checks_approval_gate
  before insert or update on public.lesson_checks
  for each row execute function public.lesson_checks_enforce_approval_gate();

