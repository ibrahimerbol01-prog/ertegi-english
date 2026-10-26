-- Teacher cabinet: classes joined by code, assignments with a due date, and
-- quiz scores the teacher can read. Learners join under a nickname only (no
-- full name or phone), and progress stays the learner's own: leaving a class
-- or an archived class never deletes it. Teachers read their learners only
-- through class_report() and student_report(), which return a fixed set of
-- fields, so no learner table is opened wider than before.

-- Every finished quiz with its score (story_progress only says "passed").
create table if not exists public.quiz_results (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  story_id   text        not null,
  step       text        not null check (step in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'quiz')),
  score      smallint    not null check (score >= 0),
  total      smallint    not null check (total > 0 and score <= total),
  first_try  smallint    not null default 0 check (first_try >= 0),
  created_at timestamptz not null default now()
);
create index if not exists quiz_results_user_story on public.quiz_results (user_id, story_id, step);

alter table public.quiz_results enable row level security;
create policy "quiz_results_select_own" on public.quiz_results
  for select using (auth.uid() = user_id);
create policy "quiz_results_insert_own" on public.quiz_results
  for insert with check (auth.uid() = user_id);

create table if not exists public.classes (
  id          uuid        primary key default gen_random_uuid(),
  teacher_id  uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name        text        not null check (char_length(btrim(name)) between 1 and 60),
  code        text        not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists classes_teacher on public.classes (teacher_id);

alter table public.classes enable row level security;
-- Teachers manage their own classes; new classes come from create_class() so
-- the join code is always generated on the server.
create policy "classes_select_own" on public.classes
  for select using (auth.uid() = teacher_id);
create policy "classes_update_own" on public.classes
  for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create table if not exists public.class_members (
  class_id   uuid        not null references public.classes(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  nickname   text        not null check (char_length(btrim(nickname)) between 1 and 30),
  joined_at  timestamptz not null default now(),
  left_at    timestamptz,
  -- Removed by the teacher: the code no longer lets this learner back in.
  removed    boolean     not null default false,
  primary key (class_id, user_id)
);
create index if not exists class_members_user on public.class_members (user_id);

alter table public.class_members enable row level security;
-- Reads only; every change goes through the functions below.
create policy "class_members_select_own" on public.class_members
  for select using (auth.uid() = user_id);

create table if not exists public.assignments (
  id         uuid        primary key default gen_random_uuid(),
  class_id   uuid        not null references public.classes(id) on delete cascade,
  story_id   text        not null check (char_length(story_id) between 1 and 80),
  step       text        not null check (step in ('A1', 'A2', 'B1', 'B2', 'C1', 'quiz')),
  due_at     timestamptz,
  note       text        not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists assignments_class on public.assignments (class_id);

-- Security definer, so policies can ask about classes without the policies
-- of classes and class_members calling each other.
create or replace function public.is_class_teacher(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from classes where id = cid and teacher_id = auth.uid());
$$;
revoke all on function public.is_class_teacher(uuid) from public;
grant execute on function public.is_class_teacher(uuid) to authenticated;

alter table public.assignments enable row level security;
create policy "assignments_teacher_select" on public.assignments
  for select using (public.is_class_teacher(class_id));
create policy "assignments_teacher_insert" on public.assignments
  for insert with check (public.is_class_teacher(class_id));
create policy "assignments_teacher_update" on public.assignments
  for update using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));
create policy "assignments_teacher_delete" on public.assignments
  for delete using (public.is_class_teacher(class_id));

-- A new class with a fresh six-letter code (no 0/O/1/I, easy to read aloud).
create or replace function public.create_class(p_name text)
returns public.classes
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  row public.classes;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 60 then raise exception 'bad_name'; end if;
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
revoke all on function public.create_class(text) from public;
grant execute on function public.create_class(text) to authenticated;

-- A new code for a class (an old code was shared too widely).
create or replace function public.new_class_code(p_class uuid)
returns text
language plpgsql
security definer
set search_path = public
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
revoke all on function public.new_class_code(uuid) from public;
grant execute on function public.new_class_code(uuid) to authenticated;

-- A learner joins by code. Leaving and joining again keeps the old progress;
-- a learner the teacher removed cannot come back with the same code.
create or replace function public.join_class(p_code text, p_nickname text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classes;
  m public.class_members;
  nick text := btrim(coalesce(p_nickname, ''));
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(nick) not between 1 and 30 then raise exception 'bad_nickname'; end if;
  select * into c from classes where code = upper(btrim(coalesce(p_code, ''))) and archived_at is null;
  if not found then raise exception 'class_not_found'; end if;
  if c.teacher_id = auth.uid() then raise exception 'own_class'; end if;
  select * into m from class_members where class_id = c.id and user_id = auth.uid();
  if found and m.removed then raise exception 'removed'; end if;
  if (select count(*) from class_members where class_id = c.id and left_at is null) >= 60 then
    raise exception 'class_full';
  end if;
  insert into class_members (class_id, user_id, nickname)
  values (c.id, auth.uid(), nick)
  on conflict (class_id, user_id) do update set nickname = excluded.nickname, left_at = null;
  return json_build_object('class_id', c.id, 'name', c.name);
end;
$$;
revoke all on function public.join_class(text, text) from public;
grant execute on function public.join_class(text, text) to authenticated;

create or replace function public.leave_class(p_class uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update class_members set left_at = now()
  where class_id = p_class and user_id = auth.uid() and left_at is null;
$$;
revoke all on function public.leave_class(uuid) from public;
grant execute on function public.leave_class(uuid) to authenticated;

-- The teacher takes a learner out of the class, or brings them back.
create or replace function public.set_member_removed(p_class uuid, p_user uuid, p_removed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  update class_members
  set removed = p_removed,
      left_at = case when p_removed then coalesce(left_at, now()) else null end
  where class_id = p_class and user_id = p_user;
end;
$$;
revoke all on function public.set_member_removed(uuid, uuid, boolean) from public;
grant execute on function public.set_member_removed(uuid, uuid, boolean) to authenticated;

-- The learner's classes (still open) and their assignments.
create or replace function public.my_classes()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'class_id', c.id,
    'name', c.name,
    'nickname', m.nickname,
    'assignments', (
      select coalesce(json_agg(json_build_object(
        'id', a.id, 'story_id', a.story_id, 'step', a.step, 'due_at', a.due_at, 'note', a.note, 'created_at', a.created_at
      ) order by a.due_at nulls last, a.created_at), '[]'::json)
      from assignments a where a.class_id = c.id
    )
  ) order by m.joined_at), '[]'::json)
  from class_members m
  join classes c on c.id = m.class_id
  where m.user_id = auth.uid() and m.left_at is null and c.archived_at is null;
$$;
revoke all on function public.my_classes() from public;
grant execute on function public.my_classes() to authenticated;

-- Everything the class page shows, for the class's own teacher only.
create or replace function public.class_report(p_class uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  select json_build_object(
    'members', (
      select coalesce(json_agg(json_build_object(
        'user_id', m.user_id,
        'nickname', m.nickname,
        'joined_at', m.joined_at,
        'left_at', m.left_at,
        'removed', m.removed,
        'xp', coalesce(p.xp, 0),
        'streak_days', coalesce(p.streak_days, 0),
        'last_active_date', p.last_active_date,
        'words_total', (select count(*) from saved_words w where w.user_id = m.user_id),
        'words_learned', (select count(*) from saved_words w where w.user_id = m.user_id and coalesce(w.mastery, 0) >= 3),
        'words_due', (select count(*) from saved_words w where w.user_id = m.user_id and (w.next_review_at is null or w.next_review_at <= now())),
        'steps', (
          select coalesce(json_agg(json_build_object('story_id', s.story_id, 'step', s.step, 'completed_at', s.completed_at)), '[]'::json)
          from story_progress s where s.user_id = m.user_id
        ),
        'quizzes', (
          select coalesce(json_agg(json_build_object(
            'story_id', q.story_id, 'step', q.step, 'best', q.best, 'total', q.total, 'attempts', q.attempts, 'last_at', q.last_at
          )), '[]'::json)
          from (
            select story_id, step,
                   max(score::float / total) as best,
                   max(total) as total,
                   count(*) as attempts,
                   max(created_at) as last_at
            from quiz_results r where r.user_id = m.user_id
            group by story_id, step
          ) q
        )
      ) order by lower(m.nickname)), '[]'::json)
      from class_members m
      left join profiles p on p.id = m.user_id
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
revoke all on function public.class_report(uuid) from public;
grant execute on function public.class_report(uuid) to authenticated;

-- One learner in detail: words and recent quizzes.
create or replace function public.student_report(p_class uuid, p_user uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result json;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher'; end if;
  if not exists (select 1 from class_members where class_id = p_class and user_id = p_user) then
    raise exception 'not_member';
  end if;
  select json_build_object(
    'words', (
      select coalesce(json_agg(json_build_object(
        'word', w.word, 'translation', w.translation, 'mastery', coalesce(w.mastery, 0), 'next_review_at', w.next_review_at
      ) order by coalesce(w.mastery, 0), w.word), '[]'::json)
      from (select * from saved_words where user_id = p_user order by created_at desc limit 300) w
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
revoke all on function public.student_report(uuid, uuid) from public;
grant execute on function public.student_report(uuid, uuid) to authenticated;
