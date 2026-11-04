-- R1: a learner or teacher deletes their own account from the profile.
-- Removes every row of the signed-in user in every app table, then the auth
-- user itself (sign-in identities and sessions go with it). One transaction:
-- if any step fails, nothing is deleted and the app offers to retry.
--
-- profiles, saved_words and user_achievements were created by hand in the
-- dashboard, not by a migration, and an older project may lack a table a
-- later migration adds, so every table is checked with to_regclass and
-- deleted from with dynamic SQL: a missing table is skipped, not an error.
--
-- Order: the teacher's classes first (class_members and assignments of those
-- classes go by ON DELETE CASCADE; the learners keep their own progress),
-- then the user's own rows, profiles, and last auth.users. All migrated
-- tables also cascade from auth.users; deleting them explicitly keeps this
-- working for the hand-made tables, whose foreign keys we cannot see.

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
    'quiz_results',
    'story_progress',
    'saved_words',        -- hand-made
    'user_achievements',  -- hand-made
    'debate_entries',
    'council_votes',
    'trail_entries',
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
