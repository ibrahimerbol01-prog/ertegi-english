-- SQL test for 20261105000000_learning_events.sql on a plain local Postgres.
-- Run (Postgres 16 binaries in /usr/lib/postgresql/16/bin):
--   initdb -D /tmp/r2pg/data -A trust -U postgres
--   pg_ctl -D /tmp/r2pg/data -o "-p 5499 -k /tmp/r2pg" start
--   createdb -h /tmp/r2pg -p 5499 -U postgres r2
--   psql ... -d r2 -f supabase/tests/stub.sql
--   for f in supabase/migrations/*.sql; do psql ... -d r2 -f $f; done
--   psql ... -d r2 -v ON_ERROR_STOP=1 -f supabase/tests/learning_events.sql
-- Every check raises an exception when it fails; the last line prints "ok".

\set A '''aaaaaaaa-0000-4000-8000-000000000001'''
\set B '''bbbbbbbb-0000-4000-8000-000000000002'''
\set T '''cccccccc-0000-4000-8000-000000000003'''

reset role;
delete from auth.users where id in (:A, :B, :T);
insert into auth.users (id) values (:A), (:B), (:T);
insert into public.profiles (id) values (:A), (:B), (:T);

-- Teacher T with one class; A is in it, B joined and left.
insert into public.classes (id, teacher_id, name, code)
  values ('dddddddd-0000-4000-8000-000000000004', :T, 'Test', 'ABCDEF');
insert into public.class_members (class_id, user_id, nickname, joined_at)
  values ('dddddddd-0000-4000-8000-000000000004', :A, 'Aru', now() - interval '10 days'),
         ('dddddddd-0000-4000-8000-000000000004', :B, 'Bek', now() - interval '10 days');
update public.class_members set left_at = now() - interval '1 day' where user_id = :B;

-- Learner A writes their own events.
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);

insert into public.learning_events (client_id, verb, object_type, object_id, story_id, level, result, context, occurred_at) values
  ('00000000-0000-4000-8000-0000000000a1', 'word_tap', 'word', 'cunning', 'aldar_kose', 'A2', null, '{"lang":"kk"}', now() - interval '1 hour'),
  ('00000000-0000-4000-8000-0000000000a2', 'word_tap', 'word', 'Cunning', 'aldar_kose', 'A2', null, null, now() - interval '2 hours'),
  ('00000000-0000-4000-8000-0000000000a3', 'srs_review', 'word', 'cunning', null, null, '{"correct":false,"box_before":2,"box_after":1}', null, now() - interval '3 hours'),
  ('00000000-0000-4000-8000-0000000000a4', 'quiz_answer', 'quiz_question', '3', 'aldar_kose', 'A2', '{"correct":false,"attempt":1}', null, now() - interval '3 hours'),
  ('00000000-0000-4000-8000-0000000000a5', 'story_open', 'story', 'aldar_kose', 'aldar_kose', 'A2', null, null, now() - interval '20 days'),
  -- From the future: the server puts it at now().
  ('00000000-0000-4000-8000-0000000000a6', 'session_start', null, null, null, null, null, null, now() + interval '3 days');

-- The same client_id again (PostgREST upsert with ignoreDuplicates): stored once, no error.
insert into public.learning_events (user_id, client_id, verb, occurred_at)
  values (:A, '00000000-0000-4000-8000-0000000000a1', 'word_tap', now())
  on conflict (user_id, client_id) do nothing;

do $$ begin
  if (select count(*) from public.learning_events) <> 6 then raise exception 'A should see 6 own events'; end if;
  if (select occurred_at from public.learning_events where client_id = '00000000-0000-4000-8000-0000000000a6') > now() then
    raise exception 'future time not clamped';
  end if;
end $$;

-- Someone else's user_id: refused by RLS.
do $$ begin
  insert into public.learning_events (user_id, client_id, verb, occurred_at)
    values ('bbbbbbbb-0000-4000-8000-000000000002', gen_random_uuid(), 'word_tap', now());
  raise exception 'insert for another user went through';
exception when insufficient_privilege then null;
end $$;

-- Unknown verb and an oversized result: refused by checks.
do $$ begin
  insert into public.learning_events (client_id, verb, occurred_at) values (gen_random_uuid(), 'hacked', now());
  raise exception 'unknown verb accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.learning_events (client_id, verb, result, occurred_at)
    values (gen_random_uuid(), 'word_tap', jsonb_build_object('x', repeat('a', 3000)), now());
  raise exception 'big result accepted';
exception when check_violation then null;
end $$;

-- No update or delete for users.
do $$ begin
  update public.learning_events set verb = 'word_save';
  raise exception 'update allowed';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  delete from public.learning_events;
  raise exception 'delete allowed';
exception when insufficient_privilege then null;
end $$;

-- A learner is not the teacher: no summary.
do $$ begin
  perform public.class_events_summary('dddddddd-0000-4000-8000-000000000004');
  raise exception 'learner got the class summary';
exception when insufficient_privilege then null;
end $$;

-- Learner B (left the class) writes too; B sees only B's rows.
select set_config('request.jwt.claim.sub', :B, false);
insert into public.learning_events (client_id, verb, object_type, object_id, occurred_at)
  values ('00000000-0000-4000-8000-0000000000b1', 'word_tap', 'word', 'steppe', now() - interval '3 days');
do $$ begin
  if (select count(*) from public.learning_events) <> 1 then raise exception 'B should see only 1 own event'; end if;
end $$;

-- anon: nothing at all.
reset role;
set role anon;
do $$ begin
  perform 1 from public.learning_events;
  raise exception 'anon can read';
exception when insufficient_privilege then null;
end $$;

-- The teacher's summary: A only (B left), A's event from before joining left out.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :T, false);
do $$
declare s json := public.class_events_summary('dddddddd-0000-4000-8000-000000000004');
begin
  raise notice 'summary: %', s;
  if json_array_length(s->'members') <> 1 then raise exception 'members: %', s->'members'; end if;
  if (s->'members'->0->>'nickname') <> 'Aru' then raise exception 'wrong member'; end if;
  if (s->'members'->0->>'events')::int <> 5 then raise exception 'A should have 5 events in the window, got %', s->'members'->0->>'events'; end if;
  if (s->'members'->0->'by_verb'->>'word_tap')::int <> 2 then raise exception 'by_verb'; end if;
  if (s->'members'->0->'by_verb'->>'story_open') is not null then raise exception 'event before joining counted'; end if;
  if (s->'hard_words'->0->>'word') <> 'cunning' or (s->'hard_words'->0->>'taps')::int <> 2 or (s->'hard_words'->0->>'misses')::int <> 1 then
    raise exception 'hard_words: %', s->'hard_words';
  end if;
  if exists (select 1 from json_array_elements(s->'hard_words') w where w->>'word' = 'steppe') then raise exception 'left learner counted'; end if;
  if (s->'hard_questions'->0->>'question') <> '3' or (s->'hard_questions'->0->>'wrong')::int <> 1 then
    raise exception 'hard_questions: %', s->'hard_questions';
  end if;
end $$;

-- Deleting the account takes A's events with it.
select set_config('request.jwt.claim.sub', :A, false);
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from public.learning_events where user_id = 'aaaaaaaa-0000-4000-8000-000000000001') then raise exception 'A events left after delete'; end if;
  if not exists (select 1 from public.learning_events where user_id = 'bbbbbbbb-0000-4000-8000-000000000002') then raise exception 'B events gone'; end if;
end $$;

delete from auth.users where id in (:B, :T);
select 'ok' as learning_events_test;
