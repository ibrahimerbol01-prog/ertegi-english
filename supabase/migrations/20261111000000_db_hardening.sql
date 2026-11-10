-- DB hardening from the 09.11.2026 security audit. NOT applied to production yet:
-- run on a Supabase branch first, then apply after the pitch.
-- Everything here is a narrowing of rights; RLS policies stay as they are.

-- 1. anon never needs table rights: signed-out visitors use only SECURITY DEFINER RPCs.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- 2. authenticated does not need TRUNCATE / REFERENCES / TRIGGER anywhere.
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;

-- 3. handle_new_user is a trigger function: fixed search_path, nobody calls it directly.
alter function public.handle_new_user() set search_path = public, pg_temp;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4. Old join_class overload that took a client-supplied nickname.
drop function if exists public.join_class(text, text);

-- 5. profiles: the client still saves xp/streak itself (see KazakhTalesApp saveProfile),
-- so the columns stay writable, but identity and consent fields are locked:
-- a user may set the consent once and may not rewrite its timestamp or id.
-- Proper fix (counters computed on the server from quiz_results/learning_events) is a
-- separate change; until then xp/streak are self-reported and must not be used as
-- research outcomes. Use learning_events / quiz_results instead.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;
  if old.privacy_agreed_at is not null and new.privacy_agreed_at is distinct from old.privacy_agreed_at then
    raise exception 'privacy_agreed_at is set once';
  end if;
  if old.agreed_to_privacy_policy is true and new.agreed_to_privacy_policy is not true then
    raise exception 'consent cannot be withdrawn here';
  end if;
  return new;
end;
$$;
revoke execute on function public.profiles_guard() from public, anon, authenticated;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
