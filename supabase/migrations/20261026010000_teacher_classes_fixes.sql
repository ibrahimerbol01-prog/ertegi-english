-- Fixes after the review of the teacher cabinet (20261026000000):
--  * a learner who left or was removed is no longer visible to the teacher;
--  * the teacher can only let a removed learner back in, not pull them back;
--  * the 60-learner limit holds under parallel joins; nicknames are unique per class;
--  * quiz times can't be back-dated and finished steps keep their first date;
--  * anon gets nothing; join codes change only through new_class_code().
-- Safe to run more than once.

-- Each score carries an id made on the device, so the same score sent from
-- two tabs (or sent again after a lost reply) is stored once.
alter table public.quiz_results add column if not exists client_id uuid;
create unique index if not exists quiz_results_client_id on public.quiz_results (user_id, client_id);

-- Times and counts the learner can't bend.
alter table public.quiz_results drop constraint if exists quiz_results_first_try_le_total;
alter table public.quiz_results add constraint quiz_results_first_try_le_total check (first_try <= total);

-- A score sent from the offline queue keeps its own time, but never more
-- than two weeks back and never in the future.
create or replace function public.quiz_results_clamp_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := least(greatest(coalesce(new.created_at, now()), now() - interval '14 days'), now());
  return new;
end;
$$;
drop trigger if exists quiz_results_clamp_time on public.quiz_results;
create trigger quiz_results_clamp_time before insert on public.quiz_results
  for each row execute function public.quiz_results_clamp_time();

-- "Done on time" depends on completed_at: it is set once, on the server.
create or replace function public.story_progress_keep_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.completed_at := least(coalesce(new.completed_at, now()), now());
  else
    new.completed_at := old.completed_at;
  end if;
  return new;
end;
$$;
drop trigger if exists story_progress_keep_time on public.story_progress;
create trigger story_progress_keep_time before insert or update on public.story_progress
  for each row execute function public.story_progress_keep_time();

-- Nicknames: no control characters, one of each per class among those still in it.
alter table public.class_members drop constraint if exists class_members_nickname_clean;
alter table public.class_members add constraint class_members_nickname_clean check (nickname !~ '[[:cntrl:]]');
create unique index if not exists class_members_nickname_unique
  on public.class_members (class_id, lower(btrim(nickname))) where left_at is null;

-- The code is changed only by new_class_code(), never typed in by hand.
revoke update on public.classes from authenticated;
grant update (name, archived_at) on public.classes to authenticated;

-- Nothing here is for signed-out visitors.
revoke all on public.classes, public.class_members, public.assignments, public.quiz_results from anon;

create or replace function public.create_class(p_name text)
returns public.classes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  row public.classes;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 60 then raise exception 'bad_name'; end if;
  -- One teacher's parallel requests count one after another.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if (select count(*) from classes where teacher_id = auth.uid() and archived_at is null) >= 30 then
    raise exception 'too_many_classes';
  end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into classes (teacher_id, name, code) values (auth.uid(), btrim(p_name), new_code) returning * into row;
      return row;
    exception when unique_violation then
      -- taken: draw again
    end;
  end loop;
end;
$$;

create or replace function public.new_class_code(p_class uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      update classes set code = new_code where id = p_class;
      return new_code;
    exception when unique_violation then
    end;
  end loop;
end;
$$;

create or replace function public.join_class(p_code text, p_nickname text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c public.classes;
  m public.class_members;
  nick text := btrim(coalesce(p_nickname, ''));
  already_in boolean;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(nick) not between 1 and 30 or nick ~ '[[:cntrl:]]' then raise exception 'bad_nickname'; end if;
  -- Locks the class row, so two joins at once can't both take the last place.
  select * into c from classes where code = upper(btrim(coalesce(p_code, ''))) and archived_at is null for update;
  if not found then raise exception 'class_not_found'; end if;
  if c.teacher_id = auth.uid() then raise exception 'own_class'; end if;
  select * into m from class_members where class_id = c.id and user_id = auth.uid();
  if found and m.removed then raise exception 'removed'; end if;
  already_in := found and m.left_at is null;
  if not already_in and (select count(*) from class_members where class_id = c.id and left_at is null) >= 60 then
    raise exception 'class_full';
  end if;
  if exists (
    select 1 from class_members
    where class_id = c.id and left_at is null and user_id <> auth.uid() and lower(btrim(nickname)) = lower(nick)
  ) then
    raise exception 'nickname_taken';
  end if;
  insert into class_members (class_id, user_id, nickname)
  values (c.id, auth.uid(), nick)
  on conflict (class_id, user_id) do update set nickname = excluded.nickname, left_at = null
  where not class_members.removed;
  return json_build_object('class_id', c.id, 'name', c.name);
end;
$$;

create or replace function public.leave_class(p_class uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update class_members set left_at = now()
  where class_id = p_class and user_id = auth.uid() and left_at is null;
$$;

-- Removing takes a learner out; undoing it only lets them join again with
-- the code. Nobody is put back into a class without their own step.
create or replace function public.set_member_removed(p_class uuid, p_user uuid, p_removed boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  update class_members
  set removed = p_removed,
      left_at = case when p_removed then coalesce(left_at, now()) else left_at end
  where class_id = p_class and user_id = p_user;
end;
$$;

-- Archived classes are listed too (flagged), so a learner can still leave them.
create or replace function public.my_classes()
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(json_agg(json_build_object(
    'class_id', c.id,
    'name', c.name,
    'nickname', m.nickname,
    'archived', c.archived_at is not null,
    'assignments', case when c.archived_at is not null then '[]'::json else (
      select coalesce(json_agg(json_build_object(
        'id', a.id, 'story_id', a.story_id, 'step', a.step, 'due_at', a.due_at, 'note', a.note, 'created_at', a.created_at
      ) order by a.due_at nulls last, a.created_at), '[]'::json)
      from assignments a where a.class_id = c.id
    ) end
  ) order by m.joined_at), '[]'::json)
  from class_members m
  join classes c on c.id = m.class_id
  where m.user_id = auth.uid() and m.left_at is null;
$$;

-- Progress only for learners still in the class; for the rest, just who they were.
-- Steps and quizzes only for the tales this class has assignments on.
create or replace function public.class_report(p_class uuid)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result json;
  tales text[];
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  select coalesce(array_agg(distinct story_id), '{}') into tales from assignments where class_id = p_class;
  select json_build_object(
    'members', (
      select coalesce(json_agg(
        case when m.left_at is null then json_build_object(
          'user_id', m.user_id,
          'nickname', m.nickname,
          'joined_at', m.joined_at,
          'left_at', m.left_at,
          'removed', m.removed,
          'xp', coalesce(p.xp, 0),
          'streak_days', coalesce(p.streak_days, 0),
          'last_active_date', p.last_active_date,
          'words_total', coalesce(w.total, 0),
          'words_learned', coalesce(w.learned, 0),
          'words_due', coalesce(w.due, 0),
          'steps', (
            select coalesce(json_agg(json_build_object('story_id', s.story_id, 'step', s.step, 'completed_at', s.completed_at)), '[]'::json)
            from story_progress s where s.user_id = m.user_id and s.story_id = any(tales)
          ),
          'quizzes', (
            select coalesce(json_agg(json_build_object(
              'story_id', q.story_id, 'step', q.step, 'best', q.best, 'total', q.total, 'attempts', q.attempts, 'last_at', q.last_at
            )), '[]'::json)
            from (
              select story_id, step,
                     max(score::float / total) as best,
                     (array_agg(total order by score::float / total desc, created_at desc))[1] as total,
                     count(*) as attempts,
                     max(created_at) as last_at
              from quiz_results r where r.user_id = m.user_id and r.story_id = any(tales)
              group by story_id, step
            ) q
          )
        ) else json_build_object(
          'user_id', m.user_id,
          'nickname', m.nickname,
          'joined_at', m.joined_at,
          'left_at', m.left_at,
          'removed', m.removed
        ) end
        order by lower(m.nickname)), '[]'::json)
      from class_members m
      left join profiles p on p.id = m.user_id
      left join lateral (
        select count(*) as total,
               count(*) filter (where coalesce(sw.mastery, 0) >= 3) as learned,
               count(*) filter (where sw.next_review_at is null or sw.next_review_at <= now()) as due
        from saved_words sw where sw.user_id = m.user_id
      ) w on m.left_at is null
      where m.class_id = p_class
    ),
    'assignments', (
      select coalesce(json_agg(json_build_object(
        'id', a.id, 'story_id', a.story_id, 'step', a.step, 'due_at', a.due_at, 'note', a.note, 'created_at', a.created_at
      ) order by a.created_at desc), '[]'::json)
      from assignments a where a.class_id = p_class
    )
  ) into result;
  return result;
end;
$$;

-- One learner still in the class: words, every finished step, recent quizzes.
create or replace function public.student_report(p_class uuid, p_user uuid)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result json;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  if not exists (
    select 1 from class_members where class_id = p_class and user_id = p_user and left_at is null and not removed
  ) then
    raise exception 'not_member';
  end if;
  select json_build_object(
    'words', (
      select coalesce(json_agg(json_build_object(
        'word', w.word, 'translation', w.translation, 'mastery', coalesce(w.mastery, 0), 'next_review_at', w.next_review_at
      ) order by coalesce(w.mastery, 0), w.word), '[]'::json)
      from (select * from saved_words where user_id = p_user order by created_at desc limit 300) w
    ),
    'steps', (
      select coalesce(json_agg(json_build_object('story_id', s.story_id, 'step', s.step, 'completed_at', s.completed_at)), '[]'::json)
      from story_progress s where s.user_id = p_user
    ),
    'quizzes', (
      select coalesce(json_agg(json_build_object(
        'story_id', r.story_id, 'step', r.step, 'score', r.score, 'total', r.total, 'first_try', r.first_try, 'created_at', r.created_at
      ) order by r.created_at desc), '[]'::json)
      from (select * from quiz_results where user_id = p_user order by created_at desc limit 20) r
    )
  ) into result;
  return result;
end;
$$;

create or replace function public.is_class_teacher(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid());
$$;

revoke all on function
  public.is_class_teacher(uuid), public.create_class(text), public.new_class_code(uuid),
  public.join_class(text, text), public.leave_class(uuid), public.set_member_removed(uuid, uuid, boolean),
  public.my_classes(), public.class_report(uuid), public.student_report(uuid, uuid)
from public, anon;
grant execute on function
  public.is_class_teacher(uuid), public.create_class(text), public.new_class_code(uuid),
  public.join_class(text, text), public.leave_class(uuid), public.set_member_removed(uuid, uuid, boolean),
  public.my_classes(), public.class_report(uuid), public.student_report(uuid, uuid)
to authenticated;

-- Restoring a class from the archive counts against the same 30 open classes as creating one.
create or replace function public.classes_unarchive_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.archived_at is not null and new.archived_at is null then
    perform pg_advisory_xact_lock(hashtextextended(new.teacher_id::text, 0));
    if (select count(*) from classes where teacher_id = new.teacher_id and archived_at is null and id <> new.id) >= 30 then
      raise exception 'too_many_classes';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists classes_unarchive_limit on public.classes;
create trigger classes_unarchive_limit
  before update of archived_at on public.classes
  for each row execute function public.classes_unarchive_limit();
