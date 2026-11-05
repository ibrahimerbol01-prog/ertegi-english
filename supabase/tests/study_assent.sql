-- SQL test for 20261110000000_study_assent.sql on a plain local Postgres 16.
-- Run as in the header of supabase/tests/learner_state.sql (initdb as the
-- postgres user, stub.sql, every migration twice), then:
--   psql ... -v ON_ERROR_STOP=1 -f supabase/tests/study_assent.sql
-- Every check raises an exception when it fails; the last line prints "ok".

\set A '''aaaaaaaa-0000-4000-8000-000000000031'''

reset role;
delete from auth.users where id = :A;
insert into auth.users (id) values (:A);
insert into public.profiles (id) values (:A);

set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);

-- A yes and a later change to no are accepted (the learner may change their mind).
insert into public.learner_state (kind, key, value) values
  ('study_assent', 'assent', '{"version":"draft-1","answer":"yes","at":"2026-11-05T09:00:00Z","sample":true}');
update public.learner_state set value = '{"version":"draft-1","answer":"no","at":"2026-11-05T09:05:00Z","sample":true}'
  where kind = 'study_assent' and key = 'assent';

-- Wrong key, wrong answer, no version, not an object: refused.
do $$ begin
  insert into public.learner_state (kind, key, value) values ('study_assent', 'other', '{"version":"v1","answer":"yes"}');
  raise exception 'assent with another key accepted';
exception when check_violation then null;
end $$;
do $$ begin
  update public.learner_state set value = '{"version":"draft-1","answer":"maybe"}' where kind = 'study_assent';
  raise exception 'answer other than yes/no accepted';
exception when check_violation then null;
end $$;
do $$ begin
  update public.learner_state set value = '{"answer":"yes"}' where kind = 'study_assent';
  raise exception 'assent without a version accepted';
exception when check_violation then null;
end $$;
do $$ begin
  update public.learner_state set value = '"yes"' where kind = 'study_assent';
  raise exception 'assent as a bare string accepted';
exception when check_violation then null;
end $$;

reset role;
delete from auth.users where id = :A;
\echo ok
