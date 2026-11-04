-- SQL test for 20261107000000_teacher_panel.sql on a plain local Postgres.
-- Run (Postgres 16 binaries in /usr/lib/postgresql/16/bin; initdb refuses
-- root, so run the server as the postgres user):
--   initdb -D /tmp/r8pg/data -A trust -U postgres
--   pg_ctl -D /tmp/r8pg/data -o "-p 5499 -k /tmp/r8pg" start
--   createdb -h /tmp/r8pg -p 5499 -U postgres r8
--   psql ... -d r8 -f supabase/tests/stub.sql
--   for f in supabase/migrations/*.sql; do psql ... -d r8 -f $f; done   (twice)
--   psql ... -d r8 -v ON_ERROR_STOP=1 -f supabase/migrations/20261107000000_teacher_panel.sql   (once more: must not fail)
--   psql ... -d r8 -v ON_ERROR_STOP=1 -f supabase/tests/teacher_panel.sql
-- Every check raises an exception when it fails; the last line prints "ok".

\set T '''cccccccc-0000-4000-8000-000000000081'''
\set T2 '''cccccccc-0000-4000-8000-000000000082'''
\set A '''aaaaaaaa-0000-4000-8000-000000000083'''
\set B '''bbbbbbbb-0000-4000-8000-000000000084'''
\set R '''eeeeeeee-0000-4000-8000-000000000085'''
\set C '''dddddddd-0000-4000-8000-000000000086'''
\set C2 '''dddddddd-0000-4000-8000-000000000087'''

reset role;
delete from auth.users where id in (:T, :T2, :A, :B, :R) or id::text like 'ffffffff-0000-4000-8000-0000000009%';
delete from public.council_votes where question_id in ('q_r8', 'q_small', 'q_away');
insert into auth.users (id) values (:T), (:T2), (:A), (:B), (:R);
insert into public.profiles (id) values (:T), (:T2), (:A), (:B), (:R);
-- Ten more learners for the class-level council numbers.
insert into auth.users (id)
  select ('ffffffff-0000-4000-8000-0000000009' || lpad(i::text, 2, '0'))::uuid from generate_series(1, 10) i;

-- Teacher T: class C. Teacher T2: class C2.
insert into public.classes (id, teacher_id, name, code) values
  (:C, :T, 'R8 test', 'RRTEST'),
  (:C2, :T2, 'Other', 'RRTWZZ');
-- A joined two days ago; B joined and left; R was removed by the teacher.
insert into public.class_members (class_id, user_id, nickname, joined_at) values
  (:C, :A, 'Aru', now() - interval '2 days'),
  (:C, :B, 'Bek', now() - interval '10 days'),
  (:C, :R, 'Rau', now() - interval '10 days');
update public.class_members set left_at = now() - interval '1 day' where class_id = :C and user_id = :B;
update public.class_members set removed = true, left_at = now() - interval '1 day' where class_id = :C and user_id = :R;

-- A's work: one of each before joining (hidden), one of each after.
insert into public.debate_entries (user_id, week_start, side, text, reply_text, words_used, updated_at) values
  (:A, current_date - 5, 'no', 'Before I joined, no.', '', '{}', now() - interval '5 days'),
  (:A, current_date - 1, 'yes', 'He was clever because he helped the poor.', 'I still think so.', '{clever,poor}', now() - interval '1 day');
insert into public.trail_entries (user_id, tale_id, cefr_level, claim_choice, claim_text, evidence_ids, wonder_text, revision, created_at) values
  (:A, 'zhirenshe', 'A2', 'yes', 'Old claim', '{1}', 'why', 1, now() - interval '6 days'),
  (:A, 'aldar_kose', 'A2', 'yes', 'He was right', '{2,4}', 'I still wonder why', 1, now() - interval '1 day'),
  (:A, 'aldar_kose', 'B1', 'partly', 'Now I see both sides', '{3}', 'I still wonder who', 2, now() - interval '1 hour');
insert into public.council_votes (user_id, question_id, round, choice, confidence, reason, approved, created_at) values
  (:A, 'q_before', 1, 2, 0, 'written before joining', false, now() - interval '4 days'),
  (:A, 'q_r8', 1, 1, 0, 'because he shared the coat', false, now() - interval '1 day'),
  (:A, 'q_r8', 2, 1, null, null, false, now() - interval '1 day');
-- B (left) and R (removed) voted too, after joining.
insert into public.council_votes (user_id, question_id, round, choice, confidence, reason, created_at) values
  (:B, 'q_r8', 1, 0, 1, 'B reason', now() - interval '5 days'),
  (:R, 'q_r8', 1, 0, 1, 'R reason', now() - interval '5 days');

set role authenticated;

-- 1. The class's teacher sees A's work, and only what came after joining.
select set_config('request.jwt.claim.sub', :T, false);
do $$
declare w json := public.student_work('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083');
begin
  raise notice 'work: %', w;
  if json_array_length(w->'debates') <> 1 or (w->'debates'->0->>'text') <> 'He was clever because he helped the poor.' then
    raise exception 'debates: %', w->'debates';
  end if;
  if (w->'debates'->0->>'reply_text') <> 'I still think so.' or (w->'debates'->0->'words_used'->>0) <> 'clever' then
    raise exception 'debate fields: %', w->'debates'->0;
  end if;
  if json_array_length(w->'trails') <> 2 then raise exception 'trails: %', w->'trails'; end if;
  if exists (select 1 from json_array_elements(w->'trails') t where t->>'tale_id' = 'zhirenshe') then raise exception 'trail before joining shown'; end if;
  if (w->'trails'->0->>'revision')::int <> 1 or (w->'trails'->1->>'revision')::int <> 2 then raise exception 'revisions out of order'; end if;
  if (w->'trails'->0->'evidence_ids'->>1)::int <> 4 then raise exception 'evidence_ids: %', w->'trails'->0; end if;
  if json_array_length(w->'council') <> 2 then raise exception 'council: %', w->'council'; end if;
  if exists (select 1 from json_array_elements(w->'council') c where c->>'question_id' = 'q_before') then raise exception 'vote before joining shown'; end if;
  if (w->'council'->0->>'round')::int <> 1 or (w->'council'->0->>'reason') <> 'because he shared the coat' or (w->'council'->0->>'approved')::boolean then
    raise exception 'council fields: %', w->'council'->0;
  end if;
end $$;

-- 2. Left or removed learners: not_member, even for their own teacher.
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000086', 'bbbbbbbb-0000-4000-8000-000000000084');
  raise exception 'work of a learner who left was shown';
exception when insufficient_privilege then
  if sqlerrm <> 'not_member' then raise; end if;
end $$;
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000086', 'eeeeeeee-0000-4000-8000-000000000085');
  raise exception 'work of a removed learner was shown';
exception when insufficient_privilege then
  if sqlerrm <> 'not_member' then raise; end if;
end $$;
-- Someone who never was in the class: not_member too.
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000086', 'cccccccc-0000-4000-8000-000000000082');
  raise exception 'work of a stranger was shown';
exception when insufficient_privilege then
  if sqlerrm <> 'not_member' then raise; end if;
end $$;

-- 3. The teacher approves A's reason, then takes it back, then approves again.
select public.set_council_reason_approved(:C, :A, 'q_r8', true);
do $$ begin
  if not (public.student_work('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083')->'council'->0->>'approved')::boolean then
    raise exception 'approval not stored';
  end if;
end $$;
select public.set_council_reason_approved(:C, :A, 'q_r8', false);
do $$ begin
  if (public.student_work('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083')->'council'->0->>'approved')::boolean then
    raise exception 'approval not taken back';
  end if;
end $$;
select public.set_council_reason_approved(:C, :A, 'q_r8', true);
-- Round 2 is never touched.
reset role;
do $$ begin
  if (select approved from public.council_votes where user_id = 'aaaaaaaa-0000-4000-8000-000000000083' and question_id = 'q_r8' and round = 2) then
    raise exception 'round 2 approved';
  end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', :T, false);
-- No such vote, or a vote from before joining: not_found.
do $$ begin
  perform public.set_council_reason_approved('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083', 'q_none', true);
  raise exception 'missing vote approved';
exception when no_data_found then null;
end $$;
do $$ begin
  perform public.set_council_reason_approved('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083', 'q_before', true);
  raise exception 'vote from before joining approved';
exception when no_data_found then null;
end $$;
-- A learner who left: not_member.
do $$ begin
  perform public.set_council_reason_approved('dddddddd-0000-4000-8000-000000000086', 'bbbbbbbb-0000-4000-8000-000000000084', 'q_r8', true);
  raise exception 'reason of a learner who left approved';
exception when insufficient_privilege then null;
end $$;

-- 4. Another teacher: no work, no approval, even naming their own class.
select set_config('request.jwt.claim.sub', :T2, false);
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083');
  raise exception 'another teacher saw the work';
exception when insufficient_privilege then
  if sqlerrm <> 'not_teacher' then raise; end if;
end $$;
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000087', 'aaaaaaaa-0000-4000-8000-000000000083');
  raise exception 'another teacher saw the work through their own class';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.set_council_reason_approved('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083', 'q_r8', false);
  raise exception 'another teacher changed the approval';
exception when insufficient_privilege then null;
end $$;

-- 5. A learner: not their own work through this door, nor a classmate's.
select set_config('request.jwt.claim.sub', :A, false);
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083');
  raise exception 'a learner used student_work';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.set_council_reason_approved('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083', 'q_r8', true);
  raise exception 'a learner approved a reason';
exception when insufficient_privilege then null;
end $$;
-- The table itself still refuses approved = true from the learner.
do $$ begin
  update public.council_votes set approved = true where question_id = 'q_r8' and round = 1;
  raise exception 'learner set approved';
exception when insufficient_privilege then null;
end $$;

-- 6. council_stats. The old call with one argument works; the whole site, scope 'all'.
do $$
declare s json := public.council_stats('q_r8');
begin
  raise notice 'all: %', s;
  if s->>'scope' <> 'all' then raise exception 'old call scope: %', s; end if;
  if (s->>'total')::int <> 3 then raise exception 'old call total: %', s; end if;
  if json_array_length(s->'counts') <> 4 or (s->'counts'->>0)::int <> 2 or (s->'counts'->>1)::int <> 1 then raise exception 'counts: %', s; end if;
  -- Only the approved reason, without a name.
  if json_array_length(s->'reasons') <> 1 or (s->'reasons'->0->>'reason') <> 'because he shared the coat' then raise exception 'reasons: %', s->'reasons'; end if;
  if (s->'reasons'->0)::jsonb ? 'user_id' then raise exception 'reason carries a user'; end if;
end $$;
-- A's class has one active voter: fewer than 10, so the whole site.
do $$ begin
  if public.council_stats('q_r8', 'dddddddd-0000-4000-8000-000000000086')->>'scope' <> 'all' then raise exception 'class scope with < 10 votes'; end if;
end $$;

-- Ten more learners join class C and vote: now the class has 11 first votes.
reset role;
insert into public.class_members (class_id, user_id, nickname, joined_at)
  select 'dddddddd-0000-4000-8000-000000000086', ('ffffffff-0000-4000-8000-0000000009' || lpad(i::text, 2, '0'))::uuid, 'L' || i, now() - interval '3 days'
  from generate_series(1, 10) i;
insert into public.council_votes (user_id, question_id, round, choice, confidence, reason, approved, created_at)
  select ('ffffffff-0000-4000-8000-0000000009' || lpad(i::text, 2, '0'))::uuid, 'q_r8', 1, 3, 1, 'class reason ' || i, i = 1, now() - interval '1 hour'
  from generate_series(1, 10) i;
-- Another question with only 3 class votes.
insert into public.council_votes (user_id, question_id, round, choice, created_at)
  select ('ffffffff-0000-4000-8000-0000000009' || lpad(i::text, 2, '0'))::uuid, 'q_small', 1, 0, now() from generate_series(1, 3) i;
set role authenticated;

select set_config('request.jwt.claim.sub', :A, false);
do $$
declare s json := public.council_stats('q_r8', 'dddddddd-0000-4000-8000-000000000086');
begin
  raise notice 'class: %', s;
  if s->>'scope' <> 'class' then raise exception 'scope class expected: %', s; end if;
  -- A and the ten: B (left) and R (removed) are not counted.
  if (s->>'total')::int <> 11 then raise exception 'class total: %', s; end if;
  if (s->'counts'->>0)::int <> 0 or (s->'counts'->>1)::int <> 1 or (s->'counts'->>3)::int <> 10 then raise exception 'class counts: %', s; end if;
  -- Approved reasons of the class only (A's and L1's).
  if json_array_length(s->'reasons') <> 2 then raise exception 'class reasons: %', s->'reasons'; end if;
end $$;
-- The same class, a question with fewer than 10 class votes: scope all.
do $$ begin
  if public.council_stats('q_small', 'dddddddd-0000-4000-8000-000000000086')->>'scope' <> 'all' then raise exception 'q_small scope'; end if;
end $$;
-- The old call still answers for the whole site (13 votes on q_r8).
do $$ begin
  if (public.council_stats('q_r8')->>'total')::int <> 13 or public.council_stats('q_r8')->>'scope' <> 'all' then raise exception 'old call changed'; end if;
end $$;

-- The class's teacher gets the class numbers too.
select set_config('request.jwt.claim.sub', :T, false);
do $$ begin
  if public.council_stats('q_r8', 'dddddddd-0000-4000-8000-000000000086')->>'scope' <> 'class' then raise exception 'teacher scope'; end if;
end $$;

-- Someone else's class gives no class numbers: another teacher, a learner who left, a removed learner.
select set_config('request.jwt.claim.sub', :T2, false);
do $$
declare s json := public.council_stats('q_r8', 'dddddddd-0000-4000-8000-000000000086');
begin
  if s->>'scope' <> 'all' or (s->>'total')::int <> 13 then raise exception 'other teacher got class numbers: %', s; end if;
end $$;
select set_config('request.jwt.claim.sub', :B, false);
do $$ begin
  if public.council_stats('q_r8', 'dddddddd-0000-4000-8000-000000000086')->>'scope' <> 'all' then raise exception 'learner who left got class numbers'; end if;
end $$;
select set_config('request.jwt.claim.sub', :R, false);
do $$ begin
  if public.council_stats('q_r8', 'dddddddd-0000-4000-8000-000000000086')->>'scope' <> 'all' then raise exception 'removed learner got class numbers'; end if;
end $$;
-- A class id that does not exist: the whole site, no error.
do $$ begin
  if public.council_stats('q_r8', '00000000-0000-4000-8000-000000000000')->>'scope' <> 'all' then raise exception 'unknown class'; end if;
end $$;

-- anon: none of the three functions.
reset role;
set role anon;
do $$ begin
  perform public.council_stats('q_r8');
  raise exception 'anon called council_stats';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.student_work('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083');
  raise exception 'anon called student_work';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.set_council_reason_approved('dddddddd-0000-4000-8000-000000000086', 'aaaaaaaa-0000-4000-8000-000000000083', 'q_r8', true);
  raise exception 'anon called set_council_reason_approved';
exception when insufficient_privilege then null;
end $$;

-- 7. Rejoining starts a new membership: B comes back, B's work while away stays hidden.
reset role;
insert into public.council_votes (user_id, question_id, round, choice, created_at)
  values (:B, 'q_away', 1, 1, now() - interval '1 hour');
update public.class_members set left_at = null where class_id = :C and user_id = :B;
do $$ begin
  if (select joined_at from public.class_members where user_id = 'bbbbbbbb-0000-4000-8000-000000000084') < now() - interval '1 minute' then
    raise exception 'joined_at did not move on rejoin';
  end if;
end $$;
-- A change that is not a rejoin keeps joined_at.
update public.class_members set nickname = 'Aru K' where class_id = :C and user_id = :A;
do $$ begin
  if (select joined_at from public.class_members where user_id = 'aaaaaaaa-0000-4000-8000-000000000083') > now() - interval '1 day' then
    raise exception 'joined_at moved without a rejoin';
  end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', :T, false);
do $$
declare w json := public.student_work('dddddddd-0000-4000-8000-000000000086', 'bbbbbbbb-0000-4000-8000-000000000084');
begin
  if json_array_length(w->'council') <> 0 then raise exception 'work from before the rejoin shown: %', w->'council'; end if;
end $$;

-- 8. Deleting the account still works and takes A's work with it.
select set_config('request.jwt.claim.sub', :A, false);
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from public.council_votes where user_id = 'aaaaaaaa-0000-4000-8000-000000000083') then raise exception 'A votes left'; end if;
  if exists (select 1 from public.trail_entries where user_id = 'aaaaaaaa-0000-4000-8000-000000000083') then raise exception 'A trails left'; end if;
  if exists (select 1 from public.debate_entries where user_id = 'aaaaaaaa-0000-4000-8000-000000000083') then raise exception 'A debates left'; end if;
end $$;
-- Exactly one council_stats left, the two-argument one.
do $$ begin
  if (select count(*) from pg_proc where proname = 'council_stats' and pronamespace = 'public'::regnamespace) <> 1 then
    raise exception 'more than one council_stats';
  end if;
end $$;

delete from public.council_votes where question_id in ('q_r8', 'q_small', 'q_away');
delete from auth.users where id in (:T, :T2, :B, :R);
delete from auth.users where id::text like 'ffffffff-0000-4000-8000-0000000009%';
select 'ok' as teacher_panel_test;
