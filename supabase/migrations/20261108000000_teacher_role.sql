-- Teacher role checked on the server (audit 03.11). Until now anyone could
-- pick "Мұғалім" (auth user_metadata.role, src/utils/role.ts), open a class
-- and, once learners joined, read their progress and texts (R8). Now a class
-- can be opened only by a teacher the project owner has approved:
--  * public.teacher_profiles keeps one row per teacher request:
--    pending -> approved (or revoked);
--  * request_teacher_role() files the request for the signed-in user;
--  * create_class() refuses with 'not_approved' unless the row is approved;
--  * is_class_teacher() still means "owns the class", but a revoked teacher
--    no longer passes it, so class_report, student_report, student_work,
--    class_events_summary and assignments are closed to them.
-- Existing teachers who already have a class are approved here, so nothing
-- breaks in production; other accounts marked teacher in user_metadata wait
-- as pending. Users can read their own row and file a pending one; they can
-- never change the status. Safe to run more than once.
--
-- For the project owner (Supabase SQL Editor, which runs as postgres and
-- bypasses RLS):
--   -- requests waiting for a decision
--   select t.user_id, u.email, t.requested_at
--   from public.teacher_profiles t join auth.users u on u.id = t.user_id
--   where t.status = 'pending' order by t.requested_at;
--   -- approve (note: optional, up to 200 letters, e.g. the school)
--   update public.teacher_profiles set status = 'approved', decided_at = now(), note = 'School No. 12'
--   where user_id = '<uuid>';
--   -- take access away (classes stay, reports close)
--   update public.teacher_profiles set status = 'revoked', decided_at = now()
--   where user_id = '<uuid>';

create table if not exists public.teacher_profiles (
  user_id      uuid        primary key default auth.uid() references auth.users(id) on delete cascade,
  status       text        not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  -- The owner's note on the decision (school, how it was checked); never shown to learners.
  note         text        check (note is null or char_length(note) <= 200)
);

alter table public.teacher_profiles enable row level security;
drop policy if exists "teacher_profiles_select_own" on public.teacher_profiles;
create policy "teacher_profiles_select_own" on public.teacher_profiles
  for select using (auth.uid() = user_id);
-- Only a fresh request: no approved row, no decision, no note.
drop policy if exists "teacher_profiles_insert_pending" on public.teacher_profiles;
create policy "teacher_profiles_insert_pending" on public.teacher_profiles
  for insert with check (auth.uid() = user_id and status = 'pending' and decided_at is null and note is null);
-- No update or delete policy, and no rights either: only the owner decides.
revoke all on public.teacher_profiles from anon;
revoke update, delete, truncate on public.teacher_profiles from authenticated;
grant select, insert on public.teacher_profiles to authenticated;

-- Teachers who already run a class keep working.
insert into public.teacher_profiles (user_id, status, decided_at, note)
select distinct c.teacher_id, 'approved', now(), 'had a class before 20261108'
from public.classes c
on conflict (user_id) do nothing;

-- Other accounts that chose the teacher role wait for a decision.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'auth' and table_name = 'users' and column_name = 'raw_user_meta_data'
  ) then
    insert into public.teacher_profiles (user_id, status)
    select u.id, 'pending' from auth.users u
    where u.raw_user_meta_data->>'role' = 'teacher'
    on conflict (user_id) do nothing;
  end if;
end $$;

-- The signed-in user asks to be a teacher; returns the status. Asking again
-- changes nothing, so an approved teacher stays approved and a revoked one
-- stays revoked.
create or replace function public.request_teacher_role()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  s text;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  insert into teacher_profiles (user_id) values (uid) on conflict (user_id) do nothing;
  select status into s from teacher_profiles where user_id = uid;
  return s;
end;
$$;
revoke all on function public.request_teacher_role() from public, anon;
grant execute on function public.request_teacher_role() to authenticated;

-- Owns the class and has not been revoked.
create or replace function public.is_class_teacher(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid())
     and not exists (select 1 from teacher_profiles where user_id = auth.uid() and status = 'revoked');
$$;

-- create_class() from 20261026010000, with the approval check.
create or replace function public.create_class(p_name text)
returns public.classes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  row public.classes;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from teacher_profiles where user_id = auth.uid() and status = 'approved') then
    raise exception 'not_approved' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 60 then raise exception 'bad_name'; end if;
  -- One teacher's parallel requests count one after another.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if (select count(*) from classes where teacher_id = auth.uid() and archived_at is null) >= 30 then
    raise exception 'too_many_classes';
  end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into classes (teacher_id, name, code) values (auth.uid(), btrim(p_name), new_code) returning * into row;
      return row;
    exception when unique_violation then
      -- taken: draw again
    end;
  end loop;
end;
$$;
revoke all on function public.is_class_teacher(uuid), public.create_class(text) from public, anon;
grant execute on function public.is_class_teacher(uuid), public.create_class(text) to authenticated;

-- delete_my_account() from 20261106000000, with teacher_profiles added. The
-- whole function is repeated so this file is the one place to read it.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  t text;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;

  -- A teacher's classes, with their members and assignments (cascade).
  if to_regclass('public.classes') is not null then
    execute 'delete from public.classes where teacher_id = $1' using uid;
  end if;

  -- The user's own rows. Order: tables that might point at others first.
  foreach t in array array[
    'class_members',      -- membership in other teachers' classes
    'teacher_profiles',   -- the teacher request and its status
    'quiz_results',
    'story_progress',
    'saved_words',        -- hand-made
    'user_achievements',  -- hand-made
    'debate_entries',
    'council_votes',
    'trail_entries',
    'learner_state',
    'learning_events',
    'api_usage_daily'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I where user_id = $1', t) using uid;
    end if;
  end loop;

  if to_regclass('public.profiles') is not null then
    execute 'delete from public.profiles where id = $1' using uid;
  end if;

  delete from auth.users where id = uid;
end;
$$;

-- Only a signed-in user, and only for themselves (auth.uid() inside).
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
