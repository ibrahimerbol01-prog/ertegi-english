-- SQL test for 20261108000000_teacher_role.sql on a plain local Postgres.
-- Run (Postgres 16 binaries in /usr/lib/postgresql/16/bin; initdb refuses
-- root, so run the server as the postgres user):
--   initdb -D /tmp/tpg/data -A trust -U postgres
--   pg_ctl -D /tmp/tpg/data -o "-p 5499 -k /tmp/tpg" start
--   createdb -h /tmp/tpg -p 5499 -U postgres tr
--   psql ... -d tr -f supabase/tests/stub.sql
--   for f in supabase/migrations/*.sql; do psql ... -d tr -f $f; done   (twice: idempotent)
--   psql ... -d tr -v ON_ERROR_STOP=1 -f supabase/tests/teacher_role.sql
-- The test runs the migration again itself (\ir), after making a teacher who
-- already has a class, to check the backfill. Every check raises an
-- exception when it fails; the last line prints "ok".

\set E '''eeeeeeee-0000-4000-8000-000000000101'''
\set P '''cccccccc-0000-4000-8000-000000000102'''
\set S '''aaaaaaaa-0000-4000-8000-000000000103'''
\set S2 '''aaaaaaaa-0000-4000-8000-000000000104'''
\set A '''bbbbbbbb-0000-4000-8000-000000000105'''
\set C '''dddddddd-0000-4000-8000-000000000106'''

reset role;
delete from auth.users where id in (:E, :P, :S, :S2, :A);
-- E: an existing teacher with a class from before the migration (no request row).
-- P: chose "Мұғалім" in the app (user_metadata), no class yet.
insert into auth.users (id, raw_user_meta_data) values
  (:E, '{"role":"teacher"}'), (:P, '{"role":"teacher"}'), (:S, '{"role":"student"}'), (:S2, null), (:A, '{"role":"student"}');
insert into public.profiles (id) values (:E), (:P), (:S), (:S2), (:A);
insert into public.classes (id, teacher_id, name, code) values (:C, :E, 'Role test', 'RLTEST');
insert into public.class_members (class_id, user_id, nickname, joined_at) values (:C, :A, 'Aru', now() - interval '1 day');
insert into public.assignments (class_id, story_id, step) values (:C, 'aldar_kose', 'A1');

-- The migration again: E is approved because of the class, P waits.
\ir ../migrations/20261108000000_teacher_role.sql
\ir ../migrations/20261108000000_teacher_role.sql

do $$ begin
  if (select status from public.teacher_profiles where user_id = 'eeeeeeee-0000-4000-8000-000000000101') is distinct from 'approved' then
    raise exception 'existing teacher with a class is not approved';
  end if;
  if (select status from public.teacher_profiles where user_id = 'cccccccc-0000-4000-8000-000000000102') is distinct from 'pending' then
    raise exception 'metadata teacher without a class is not pending';
  end if;
  if exists (select 1 from public.teacher_profiles where user_id in ('aaaaaaaa-0000-4000-8000-000000000103', 'bbbbbbbb-0000-4000-8000-000000000105')) then
    raise exception 'a learner got a teacher row';
  end if;
end $$;

set role authenticated;

-- Pending P: may ask again (still pending), may not open a class.
select set_config('request.jwt.claim.sub', :P, false);
do $$ begin
  if public.request_teacher_role() <> 'pending' then raise exception 'P should be pending'; end if;
  begin
    perform public.create_class('P class');
    raise exception 'pending teacher created a class';
  exception when insufficient_privilege then
    if sqlerrm <> 'not_approved' then raise; end if;
  end;
end $$;

-- Approved E: opens a class and reads the report.
select set_config('request.jwt.claim.sub', :E, false);
do $$ begin
  if public.request_teacher_role() <> 'approved' then raise exception 'asking again changed approved'; end if;
  if (public.create_class('E second class')).name <> 'E second class' then raise exception 'approved teacher could not create'; end if;
  if json_array_length(public.class_report('dddddddd-0000-4000-8000-000000000106')->'members') <> 1 then
    raise exception 'approved teacher does not see the class';
  end if;
end $$;

-- A learner asks: pending, and can't approve themselves in any way.
select set_config('request.jwt.claim.sub', :S, false);
do $$ begin
  if public.request_teacher_role() <> 'pending' then raise exception 'S should be pending'; end if;
  begin
    update public.teacher_profiles set status = 'approved' where user_id = auth.uid();
    raise exception 'learner updated own status';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.teacher_profiles where user_id = auth.uid();
    raise exception 'learner deleted own request';
  exception when insufficient_privilege then null;
  end;
  if (select status from public.teacher_profiles where user_id = auth.uid()) <> 'pending' then raise exception 'S status changed'; end if;
  if (select count(*) from public.teacher_profiles) <> 1 then raise exception 'S sees other rows'; end if;
end $$;
-- S2 (no row yet) tries to insert an approved row, or a row for someone else.
select set_config('request.jwt.claim.sub', :S2, false);
do $$ begin
  begin
    insert into public.teacher_profiles (user_id, status) values (auth.uid(), 'approved');
    raise exception 'learner inserted an approved row';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.teacher_profiles (user_id, status) values ('aaaaaaaa-0000-4000-8000-000000000105', 'pending');
    raise exception 'inserted a row for another user';
  exception when insufficient_privilege then null;
  end;
  -- A plain pending request is allowed (the same as request_teacher_role()).
  insert into public.teacher_profiles (status) values ('pending');
  begin
    perform public.create_class('S2 class');
    raise exception 'S2 created a class';
  exception when insufficient_privilege then null;
  end;
end $$;

-- anon: nothing.
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  begin
    perform public.request_teacher_role();
    raise exception 'anon called request_teacher_role';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.teacher_profiles;
    raise exception 'anon read teacher_profiles';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The owner approves P and revokes E (SQL Editor runs as postgres).
reset role;
update public.teacher_profiles set status = 'approved', decided_at = now() where user_id = :P;
update public.teacher_profiles set status = 'revoked', decided_at = now() where user_id = :E;

set role authenticated;
select set_config('request.jwt.claim.sub', :P, false);
do $$ begin
  if (public.create_class('P class')).name <> 'P class' then raise exception 'approved P could not create'; end if;
end $$;

-- Revoked E: no reports, no work, no summary, no new classes; asking again keeps revoked.
select set_config('request.jwt.claim.sub', :E, false);
do $$ begin
  if public.request_teacher_role() <> 'revoked' then raise exception 'asking again changed revoked'; end if;
  if public.is_class_teacher('dddddddd-0000-4000-8000-000000000106') then raise exception 'revoked still is_class_teacher'; end if;
  begin
    perform public.class_report('dddddddd-0000-4000-8000-000000000106');
    raise exception 'revoked teacher read class_report';
  exception when others then if sqlerrm <> 'not_teacher' then raise; end if;
  end;
  begin
    perform public.student_report('dddddddd-0000-4000-8000-000000000106', 'bbbbbbbb-0000-4000-8000-000000000105');
    raise exception 'revoked teacher read student_report';
  exception when others then if sqlerrm <> 'not_teacher' then raise; end if;
  end;
  begin
    perform public.student_work('dddddddd-0000-4000-8000-000000000106', 'bbbbbbbb-0000-4000-8000-000000000105');
    raise exception 'revoked teacher read student_work';
  exception when others then if sqlerrm <> 'not_teacher' then raise; end if;
  end;
  begin
    perform public.class_events_summary('dddddddd-0000-4000-8000-000000000106');
    raise exception 'revoked teacher read class_events_summary';
  exception when others then if sqlerrm <> 'not_teacher' then raise; end if;
  end;
  if exists (select 1 from public.assignments where class_id = 'dddddddd-0000-4000-8000-000000000106') then
    raise exception 'revoked teacher sees assignments';
  end if;
  begin
    perform public.create_class('E third class');
    raise exception 'revoked teacher created a class';
  exception when insufficient_privilege then null;
  end;
end $$;

-- delete_my_account removes the request row too.
select set_config('request.jwt.claim.sub', :P, false);
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from public.teacher_profiles where user_id = 'cccccccc-0000-4000-8000-000000000102') then
    raise exception 'teacher_profiles row left after delete_my_account';
  end if;
  if exists (select 1 from public.classes where teacher_id = 'cccccccc-0000-4000-8000-000000000102') then
    raise exception 'P classes left';
  end if;
end $$;

delete from auth.users where id in (:E, :P, :S, :S2, :A);
select 'ok' as teacher_role_test;
