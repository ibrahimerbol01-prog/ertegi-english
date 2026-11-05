-- SQL test for 20261109000000_study_code.sql on a plain local Postgres 16.
-- Run as in the header of supabase/tests/learner_state.sql (initdb as the
-- postgres user, stub.sql, every migration twice), then:
--   psql ... -v ON_ERROR_STOP=1 -f supabase/tests/study_code.sql
-- Every check raises an exception when it fails; the last line prints "ok".

\set A '''aaaaaaaa-0000-4000-8000-000000000021'''
\set B '''bbbbbbbb-0000-4000-8000-000000000022'''

reset role;
delete from auth.users where id in (:A, :B);
insert into auth.users (id) values (:A), (:B);
insert into public.profiles (id) values (:A), (:B);

set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);

-- The participant code and the old kinds are accepted.
insert into public.learner_state (kind, key, value) values
  ('study_code', 'code', '{"code":"ERT-5724","at":"2026-11-05T09:00:00Z"}'),
  ('card', 'aldar_kose', 'true');

-- Wrong key, wrong shape, not an object: refused.
do $$ begin
  insert into public.learner_state (kind, key, value) values ('study_code', 'other', '{"code":"ERT-5724"}');
  raise exception 'study_code with another key accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.learner_state (kind, key, value) values ('study_code', 'code', '{"code":"Aigerim"}')
  on conflict (user_id, kind, key) do update set value = excluded.value, updated_at = now() + interval '1 minute';
  raise exception 'a name as study code accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.learner_state (kind, key, value) values ('study_code', 'code', '"ERT-5724"')
  on conflict (user_id, kind, key) do update set value = excluded.value, updated_at = now() + interval '1 minute';
  raise exception 'study code as a bare string accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.learner_state (kind, key, value) values ('xp', 'x', 'true');
  raise exception 'unknown kind accepted';
exception when check_violation then null;
end $$;

-- New verbs of the test are accepted, old ones too, unknown ones refused.
insert into public.learning_events (client_id, verb, object_type, object_id, result, context, occurred_at) values
  (gen_random_uuid(), 'test_answer', 'test_item', 'A-mean-01', '{"correct":1,"form":"A","timepoint":"pre"}', '{"research":true,"study_id":"s0","study_code":"ERT-5724"}', now()),
  (gen_random_uuid(), 'test_complete', 'test', 'sample|pre', '{"answered":4,"total":4}', '{"research":true}', now()),
  (gen_random_uuid(), 'quiz_answer', 'quiz_question', '1', '{"correct":true}', null, now());
do $$ begin
  insert into public.learning_events (client_id, verb, occurred_at) values (gen_random_uuid(), 'test_peek', now());
  raise exception 'unknown verb accepted';
exception when check_violation then null;
end $$;

-- B sees none of A's code or answers.
select set_config('request.jwt.claim.sub', :B, false);
do $$ begin
  if (select count(*) from public.learner_state where kind = 'study_code') <> 0 then raise exception 'B sees A''s code'; end if;
  if (select count(*) from public.learning_events where verb like 'test_%') <> 0 then raise exception 'B sees A''s answers'; end if;
end $$;

reset role;
do $$ begin
  if (select value->>'code' from public.learner_state where user_id = 'aaaaaaaa-0000-4000-8000-000000000021' and kind = 'study_code') <> 'ERT-5724' then
    raise exception 'code not stored';
  end if;
  if (select count(*) from public.learning_events where user_id = 'aaaaaaaa-0000-4000-8000-000000000021') <> 3 then
    raise exception 'events not stored';
  end if;
end $$;

-- Account deletion takes the code and the answers with it.
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from public.learner_state where user_id = 'aaaaaaaa-0000-4000-8000-000000000021') then raise exception 'code survived deletion'; end if;
  if exists (select 1 from public.learning_events where user_id = 'aaaaaaaa-0000-4000-8000-000000000021') then raise exception 'answers survived deletion'; end if;
end $$;

delete from auth.users where id = :B;
select 'ok';
