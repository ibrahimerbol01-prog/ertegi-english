-- R2: learning events in the spirit of xAPI (actor, verb, object, result,
-- context). Product learning analytics under the normal privacy policy: what
-- the learner did (opened a tale, tapped a word, answered a question), never
-- what they wrote. Texts of "Ой ізі", debates and Shoqan chats are NOT stored
-- here, only their length or word count. The dictionary of verbs and fields
-- is docs/events.md; the client is src/utils/events.ts.
--
-- Learners only insert and read their own rows; nobody updates or deletes
-- them except delete_my_account() (below) and the auth.users cascade. A
-- teacher sees only aggregates through class_events_summary().
-- Safe to run more than once.

create table if not exists public.learning_events (
  id          bigint      generated always as identity primary key,
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  -- Made on the device: the same event sent twice (two tabs, a lost reply) is stored once.
  client_id   uuid        not null,
  verb        text        not null check (verb in (
                'session_start', 'story_open', 'level_complete', 'word_tap', 'audio_play',
                'quiz_answer', 'quiz_complete', 'srs_review', 'word_save',
                'daily_words_seen', 'daily_word_known', 'council_vote', 'trail_entry',
                'debate_entry', 'shoqan_open', 'shoqan_message', 'pronunciation_attempt'
              )),
  object_type text        check (char_length(object_type) <= 40),
  object_id   text        check (char_length(object_id) <= 200),
  story_id    text        check (char_length(story_id) <= 80),
  level       text        check (char_length(level) <= 10),
  -- Small facts only: correct, score, attempt, duration_ms, counts.
  result      jsonb       check (result is null or (jsonb_typeof(result) = 'object' and octet_length(result::text) < 2000)),
  -- app_version, content_version, lang, class_id when there is one.
  context     jsonb       check (context is null or (jsonb_typeof(context) = 'object' and octet_length(context::text) < 2000)),
  occurred_at timestamptz not null,
  created_at  timestamptz not null default now(),
  constraint learning_events_client unique (user_id, client_id)
);

create index if not exists learning_events_user_time on public.learning_events (user_id, occurred_at);
create index if not exists learning_events_verb_time on public.learning_events (verb, occurred_at);
create index if not exists learning_events_story on public.learning_events (story_id) where story_id is not null;

-- An event from the offline queue keeps its own time, but a wrong device
-- clock can't put it in the future or more than 30 days back. created_at is
-- always the server's.
create or replace function public.learning_events_clamp_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.occurred_at := least(greatest(coalesce(new.occurred_at, now()), now() - interval '30 days'), now());
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists learning_events_clamp_time on public.learning_events;
create trigger learning_events_clamp_time before insert on public.learning_events
  for each row execute function public.learning_events_clamp_time();

alter table public.learning_events enable row level security;
drop policy if exists "learning_events_select_own" on public.learning_events;
create policy "learning_events_select_own" on public.learning_events
  for select using (auth.uid() = user_id);
drop policy if exists "learning_events_insert_own" on public.learning_events;
create policy "learning_events_insert_own" on public.learning_events
  for insert with check (auth.uid() = user_id);
-- No update or delete policy, and no such rights either: the log is append-only.
revoke all on public.learning_events from anon;
revoke update, delete, truncate on public.learning_events from authenticated;
grant select, insert on public.learning_events to authenticated;

-- For the class's own teacher: what the class did in the last 30 days, as
-- counts only (no texts, no single events). Per learner still in the class:
-- events by verb since they joined; for the class: the words most often
-- tapped or forgotten in review, and the quiz questions most often missed.
-- The base for the teacher and researcher views of R8.
create or replace function public.class_events_summary(p_class uuid)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  since timestamptz := now() - interval '30 days';
  res json;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher' using errcode = '42501'; end if;

  with members as (
    select m.user_id, m.nickname, greatest(m.joined_at, since) as from_at
    from class_members m
    where m.class_id = p_class and m.left_at is null and not m.removed
  ),
  ev as (
    select e.user_id, e.verb, e.object_id, e.story_id, e.level, e.result, e.occurred_at
    from learning_events e
    join members m on m.user_id = e.user_id and e.occurred_at >= m.from_at
  ),
  per_verb as (
    select user_id, verb, count(*) as n from ev group by user_id, verb
  ),
  per_member as (
    select m.user_id, m.nickname,
           coalesce((select sum(n) from per_verb v where v.user_id = m.user_id), 0) as total,
           coalesce((select json_object_agg(v.verb, v.n order by v.verb) from per_verb v where v.user_id = m.user_id), '{}'::json) as by_verb,
           (select count(distinct (e.occurred_at at time zone 'Asia/Almaty')::date) from ev e where e.user_id = m.user_id) as active_days,
           (select max(e.occurred_at) from ev e where e.user_id = m.user_id) as last_at
    from members m
  ),
  words as (
    select lower(object_id) as word,
           count(*) filter (where verb = 'word_tap') as taps,
           count(*) filter (where verb = 'srs_review') as misses,
           count(distinct user_id) as learners
    from ev
    where object_id is not null
      and (verb = 'word_tap' or (verb = 'srs_review' and (result->>'correct') = 'false'))
    group by lower(object_id)
  ),
  questions as (
    select story_id, level, object_id as question,
           count(*) filter (where (result->>'correct') = 'false') as wrong,
           count(*) as answers,
           count(distinct user_id) as learners
    from ev
    where verb = 'quiz_answer' and object_id is not null and coalesce(result->>'practice', 'false') <> 'true'
    group by story_id, level, object_id
  )
  select json_build_object(
    'since', since,
    'members', (
      select coalesce(json_agg(json_build_object(
        'user_id', p.user_id, 'nickname', p.nickname, 'events', p.total, 'by_verb', p.by_verb,
        'active_days', p.active_days, 'last_at', p.last_at
      ) order by lower(p.nickname)), '[]'::json)
      from per_member p
    ),
    'hard_words', (
      select coalesce(json_agg(json_build_object('word', w.word, 'taps', w.taps, 'misses', w.misses, 'learners', w.learners)
             order by w.learners desc, w.taps + w.misses desc, w.word), '[]'::json)
      from (select * from words order by learners desc, taps + misses desc, word limit 10) w
    ),
    'hard_questions', (
      select coalesce(json_agg(json_build_object('story_id', q.story_id, 'level', q.level, 'question', q.question,
             'wrong', q.wrong, 'answers', q.answers, 'learners', q.learners)
             order by q.wrong desc, q.answers desc), '[]'::json)
      from (select * from questions where wrong > 0 order by wrong desc, answers desc limit 10) q
    )
  ) into res;
  return res;
end;
$$;
revoke all on function public.class_events_summary(uuid) from public;
revoke all on function public.class_events_summary(uuid) from anon;
grant execute on function public.class_events_summary(uuid) to authenticated;

-- delete_my_account() from 20261104000000, with learning_events added. The
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
