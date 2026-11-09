-- Security hardening from the 2026-11-09 audit. Not applied to production by the PR itself.
-- Apply after the pitch window, in the Supabase SQL editor, then re-run get_advisors.

-- 1. profiles: the app writes xp / streak from the client, so the columns stay writable,
--    but the consent record is immutable and counters can only grow in plausible steps.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if new.id <> old.id then raise exception 'profiles.id is immutable'; end if;
  -- consent can be given once, never rewritten or withdrawn by a direct update
  if old.agreed_to_privacy_policy is true and new.agreed_to_privacy_policy is distinct from true then
    raise exception 'consent record is immutable';
  end if;
  if new.privacy_agreed_at is distinct from old.privacy_agreed_at and old.privacy_agreed_at is not null then
    raise exception 'consent timestamp is immutable';
  end if;
  -- counters never go down and cannot jump by a single update (stopgap until server-side scoring)
  if new.xp < old.xp or new.xp - old.xp > 500 then raise exception 'xp change out of range'; end if;
  if new.quizzes_completed < old.quizzes_completed or new.quizzes_completed - old.quizzes_completed > 10 then
    raise exception 'quizzes_completed change out of range'; end if;
  if new.perfect_quizzes < old.perfect_quizzes or new.perfect_quizzes - old.perfect_quizzes > 10 then
    raise exception 'perfect_quizzes change out of range'; end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- 2. Least privilege: anonymous visitors have no table rights; nobody needs TRUNCATE/REFERENCES/TRIGGER.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- 3. handle_new_user: fixed search_path, not callable by clients.
alter function public.handle_new_user() set search_path = public, pg_temp;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. The old two-argument join_class accepted a client-supplied nickname.
drop function if exists public.join_class(text, text);
