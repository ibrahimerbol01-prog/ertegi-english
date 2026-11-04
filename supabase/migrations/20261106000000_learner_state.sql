-- Learner state that used to live only in the browser (R3): collected legend
-- cards, proverbs, "I know it" words, Steppe Council votes, Thinking Trail
-- entries and drafts, Words-of-the-week debate answers. One small row per
-- item, so a set (cards, words) merges by union and a record (a vote, a
-- draft) by "the newer one wins". The device stays the first place it is
-- written (src/utils/learnerSync.ts); this table is the copy that follows the
-- learner to another device and that a teacher view (R8) can read later.
-- Own rows only. Safe to run more than once.

create table if not exists public.learner_state (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text        not null check (kind in (
               'card',         -- legend card id; value true
               'maqal',        -- proverb index; value true
               'known_word',   -- word marked "I know it"; value true
               'council_vote', -- question id; value: the vote (rounds, reason, xp)
               'debate',       -- day (YYYY-MM-DD); value: the debate answer
               'trail',        -- "<tale>|<saved at>"; value: one Thinking Trail revision
               'trail_draft'   -- "<tale>|<level>"; value: the unfinished trail, null once saved
             )),
  key        text        not null check (char_length(key) between 1 and 200),
  -- null marks a removed item (a draft that was saved), so the removal also wins on other devices.
  value      jsonb       check (value is null or octet_length(value::text) < 4096),
  -- When the learner changed it on the device; the server keeps the newest.
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

-- "The newer one wins" also on the server: an update from a device that was
-- offline for a while does not overwrite a newer row from another device.
-- A wrong device clock can't put a row into the future.
create or replace function public.learner_state_keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := least(coalesce(new.updated_at, now()), now() + interval '5 minutes');
  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.kind <> old.kind or new.key <> old.key then
      raise exception 'learner_state key is fixed' using errcode = '23514';
    end if;
    if new.updated_at < old.updated_at then
      return null; -- keep the newer row, no error: the device just reads it on the next sign-in
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists learner_state_keep_newest on public.learner_state;
create trigger learner_state_keep_newest before insert or update on public.learner_state
  for each row execute function public.learner_state_keep_newest();

alter table public.learner_state enable row level security;
drop policy if exists "learner_state_select_own" on public.learner_state;
create policy "learner_state_select_own" on public.learner_state
  for select using (auth.uid() = user_id);
drop policy if exists "learner_state_insert_own" on public.learner_state;
create policy "learner_state_insert_own" on public.learner_state
  for insert with check (auth.uid() = user_id);
drop policy if exists "learner_state_update_own" on public.learner_state;
create policy "learner_state_update_own" on public.learner_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "learner_state_delete_own" on public.learner_state;
create policy "learner_state_delete_own" on public.learner_state
  for delete using (auth.uid() = user_id);
revoke all on public.learner_state from anon;
grant select, insert, update, delete on public.learner_state to authenticated;

-- delete_my_account() from 20261105000000, with learner_state added. The
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
