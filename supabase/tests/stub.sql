-- Minimal stand-in for what Supabase provides, so the migrations run on a
-- plain local Postgres (16): the auth schema with auth.users and auth.uid(),
-- the anon and authenticated roles, and the tables made by hand in the
-- dashboard (profiles, saved_words, user_achievements). auth.uid() reads the
-- setting request.jwt.claim.sub, as in Supabase; a test sets it with
--   set role authenticated; set request.jwt.claim.sub = '<uuid>';
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
alter table auth.users add column if not exists raw_user_meta_data jsonb;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase grants table rights to these roles by default; RLS does the rest.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, xp int default 0, streak_days int default 0, last_active_date date,
  quizzes_completed int default 0, perfect_quizzes int default 0,
  agreed_to_privacy_policy boolean, privacy_agreed_at timestamptz
);
create table if not exists public.saved_words (
  user_id uuid references auth.users(id) on delete cascade, word text, translation text,
  mastery int default 0, created_at timestamptz default now(), primary key (user_id, word)
);
create table if not exists public.user_achievements (
  user_id uuid references auth.users(id) on delete cascade, achievement_id text,
  primary key (user_id, achievement_id)
);
