-- SQL test for 20261106000000_learner_state.sql on a plain local Postgres.
-- Run (Postgres 16 binaries in /usr/lib/postgresql/16/bin):
--   initdb -D /tmp/r3pg/data -A trust -U postgres
--   pg_ctl -D /tmp/r3pg/data -o "-p 5499 -k /tmp/r3pg" start
--   createdb -h /tmp/r3pg -p 5499 -U postgres r3
--   psql ... -d r3 -f supabase/tests/stub.sql
--   for f in supabase/migrations/*.sql; do psql ... -d r3 -f $f; done   (twice: idempotent)
--   psql ... -d r3 -v ON_ERROR_STOP=1 -f supabase/tests/learner_state.sql
-- Every check raises an exception when it fails; the last line prints "ok".

\set A '''aaaaaaaa-0000-4000-8000-000000000011'''
\set B '''bbbbbbbb-0000-4000-8000-000000000012'''

reset role;
delete from auth.users where id in (:A, :B);
insert into auth.users (id) values (:A), (:B);
insert into public.profiles (id) values (:A), (:B);

-- Learner A writes cards, a vote and a draft (the upsert PostgREST sends).
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);

insert into public.learner_state (kind, key, value, updated_at) values
  ('card', 'aldar_kose', 'true', now() - interval '1 day'),
  ('known_word', 'cunning', 'true', now() - interval '1 day'),
  ('council_vote', 'q1', '{"first":1,"done":false}', now() - interval '2 hours'),
  ('trail_draft', 'aldar_kose|A2', '{"step":2,"claim":"He was clever"}', now() - interval '1 hour'),
  -- From the future: the server brings it back to now() + 5 minutes at most.
  ('debate', '2026-11-04', '{"side":"yes"}', now() + interval '3 days')
on conflict (user_id, kind, key) do update set value = excluded.value, updated_at = excluded.updated_at;

do $$ begin
  if (select count(*) from public.learner_state) <> 5 then raise exception 'A should see 5 own rows'; end if;
  if (select updated_at from public.learner_state where kind = 'debate') > now() + interval '5 minutes' then
    raise exception 'future time not clamped';
  end if;
end $$;

-- A newer change wins.
insert into public.learner_state (kind, key, value, updated_at)
  values ('council_vote', 'q1', '{"first":1,"done":true}', now() - interval '1 hour')
on conflict (user_id, kind, key) do update set value = excluded.value, updated_at = excluded.updated_at;
-- An older one (a device that was offline) is ignored without an error.
insert into public.learner_state (kind, key, value, updated_at)
  values ('council_vote', 'q1', '{"first":0,"done":false}', now() - interval '3 hours')
on conflict (user_id, kind, key) do update set value = excluded.value, updated_at = excluded.updated_at;
do $$ begin
  if (select value->>'done' from public.learner_state where kind = 'council_vote' and key = 'q1') <> 'true' then
    raise exception 'older update overwrote a newer row';
  end if;
end $$;

-- A saved draft becomes a null value (the removal syncs too).
insert into public.learner_state (kind, key, value, updated_at)
  values ('trail_draft', 'aldar_kose|A2', null, now())
on conflict (user_id, kind, key) do update set value = excluded.value, updated_at = excluded.updated_at;
do $$ begin
  if (select value from public.learner_state where kind = 'trail_draft') is not null then raise exception 'tombstone not stored'; end if;
end $$;

-- Unknown kind, empty key and a value of 4 KB or more: refused.
do $$ begin
  insert into public.learner_state (kind, key, value) values ('xp', 'x', 'true');
  raise exception 'unknown kind accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.learner_state (kind, key, value) values ('card', '', 'true');
  raise exception 'empty key accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.learner_state (kind, key, value) values ('debate', '2026-11-05', jsonb_build_object('text', repeat('a', 4100)));
  raise exception 'big value accepted';
exception when check_violation then null;
end $$;

-- Someone else's user_id: refused by RLS.
do $$ begin
  insert into public.learner_state (user_id, kind, key, value)
    values ('bbbbbbbb-0000-4000-8000-000000000012', 'card', 'x', 'true');
  raise exception 'insert for another user went through';
exception when insufficient_privilege then null;
end $$;

-- Learner B: sees nothing of A, cannot change or delete it.
select set_config('request.jwt.claim.sub', :B, false);
insert into public.learner_state (kind, key, value) values ('maqal', '3', 'true');
do $$ begin
  if (select count(*) from public.learner_state) <> 1 then raise exception 'B sees rows that are not theirs'; end if;
end $$;
update public.learner_state set value = '"hacked"' where kind = 'card';
delete from public.learner_state where kind = 'known_word';
-- B can delete their own row.
delete from public.learner_state where kind = 'maqal';

-- Anonymous: no rights at all.
reset role;
set role anon;
do $$ begin
  perform 1 from public.learner_state;
  raise exception 'anon can read';
exception when insufficient_privilege then null;
end $$;

reset role;
do $$ begin
  if (select value from public.learner_state where user_id = 'aaaaaaaa-0000-4000-8000-000000000011' and kind = 'card') <> 'true'::jsonb then
    raise exception 'B changed A''s card';
  end if;
  if (select count(*) from public.learner_state where user_id = 'aaaaaaaa-0000-4000-8000-000000000011') <> 5 then
    raise exception 'B deleted A''s row';
  end if;
  if (select count(*) from public.learner_state where user_id = 'bbbbbbbb-0000-4000-8000-000000000012') <> 0 then
    raise exception 'B could not delete own row';
  end if;
end $$;

-- delete_my_account() removes A's state, B keeps theirs.
set role authenticated;
select set_config('request.jwt.claim.sub', :B, false);
insert into public.learner_state (kind, key, value) values ('card', 'zhirenshe', 'true');
select set_config('request.jwt.claim.sub', :A, false);
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from public.learner_state where user_id = 'aaaaaaaa-0000-4000-8000-000000000011') then
    raise exception 'A''s state survived account deletion';
  end if;
  if (select count(*) from public.learner_state where user_id = 'bbbbbbbb-0000-4000-8000-000000000012') <> 1 then
    raise exception 'B''s state went with A';
  end if;
end $$;
delete from auth.users where id = 'bbbbbbbb-0000-4000-8000-000000000012';

select 'ok';
