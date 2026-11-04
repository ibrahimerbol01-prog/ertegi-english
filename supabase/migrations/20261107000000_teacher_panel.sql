-- R8: teacher panel. The class's own teacher reads the thinking work of a
-- learner who is in the class now (debates of "Апта сөздері", "Ой ізі" with
-- every revision, votes and reasons in "Дала кеңесі"), and only what the
-- learner wrote after joining this class. The teacher can let a reason be
-- shown to other learners (without a name). council_stats() can count one
-- class instead of the whole site.
--
-- No new tables, so delete_my_account() is unchanged. Raw learning events are
-- still not given to teachers: class_events_summary() (20261105000000) stays
-- the only way, and it returns totals.
-- Safe to run more than once.

-- A learner who left (or was let back in after being removed) and joins again
-- starts a new membership: joined_at moves to the day of the new join. So the
-- work done while out of the class stays hidden from the teacher, here and in
-- class_events_summary(). Works for both join_class() versions.
create or replace function public.class_members_rejoin_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.left_at is not null and new.left_at is null then
    new.joined_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists class_members_rejoin_time on public.class_members;
create trigger class_members_rejoin_time before update of left_at on public.class_members
  for each row execute function public.class_members_rejoin_time();

-- One learner's thinking work, for the class's own teacher. Texts are shown
-- as the learner wrote them; nothing from before joined_at.
create or replace function public.student_work(p_class uuid, p_user uuid)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  since timestamptz;
  res json;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher' using errcode = '42501'; end if;
  select m.joined_at into since
  from class_members m
  where m.class_id = p_class and m.user_id = p_user and m.left_at is null and not m.removed;
  if not found then raise exception 'not_member' using errcode = '42501'; end if;

  select json_build_object(
    'joined_at', since,
    -- One row a day (week_start holds the day of the answer); the latest 20.
    'debates', (
      select coalesce(json_agg(json_build_object(
        'week_start', d.week_start, 'side', d.side, 'text', d.text, 'reply_text', d.reply_text,
        'words_used', d.words_used, 'updated_at', d.updated_at
      ) order by d.week_start desc), '[]'::json)
      from (
        select * from debate_entries
        where user_id = p_user and updated_at >= since
        order by week_start desc limit 20
      ) d
    ),
    -- Every revision is its own row; the latest 50.
    'trails', (
      select coalesce(json_agg(json_build_object(
        'tale_id', t.tale_id, 'cefr_level', t.cefr_level, 'claim_choice', t.claim_choice, 'claim_text', t.claim_text,
        'evidence_ids', t.evidence_ids, 'wonder_text', t.wonder_text, 'revision', t.revision, 'created_at', t.created_at
      ) order by t.tale_id, t.revision), '[]'::json)
      from (
        select * from trail_entries
        where user_id = p_user and created_at >= since
        order by created_at desc, id desc limit 50
      ) t
    ),
    'council', (
      select coalesce(json_agg(json_build_object(
        'question_id', c.question_id, 'round', c.round, 'choice', c.choice, 'confidence', c.confidence,
        'reason', c.reason, 'approved', c.approved, 'created_at', c.created_at
      ) order by c.question_id, c.round), '[]'::json)
      from council_votes c
      where c.user_id = p_user and c.created_at >= since
    )
  ) into res;
  return res;
end;
$$;
revoke all on function public.student_work(uuid, uuid) from public;
revoke all on function public.student_work(uuid, uuid) from anon;
grant execute on function public.student_work(uuid, uuid) to authenticated;

-- The teacher lets a learner's round-1 reason be shown to others (or takes it
-- back). Only for a learner in the class now, and only for a vote the teacher
-- can see (cast after joining). A learner who changes the vote sends
-- approved = false again (Council.tsx), so a new text is checked again.
create or replace function public.set_council_reason_approved(p_class uuid, p_user uuid, p_question text, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  since timestamptz;
begin
  if not is_class_teacher(p_class) then raise exception 'not_teacher' using errcode = '42501'; end if;
  select m.joined_at into since
  from class_members m
  where m.class_id = p_class and m.user_id = p_user and m.left_at is null and not m.removed;
  if not found then raise exception 'not_member' using errcode = '42501'; end if;
  update council_votes
  set approved = coalesce(p_approved, false)
  where user_id = p_user and question_id = p_question and round = 1 and created_at >= since;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.set_council_reason_approved(uuid, uuid, text, boolean) from public;
revoke all on function public.set_council_reason_approved(uuid, uuid, text, boolean) from anon;
grant execute on function public.set_council_reason_approved(uuid, uuid, text, boolean) to authenticated;

-- council_stats with an optional class. The old one-argument function goes,
-- so PostgREST sees one candidate: rpc('council_stats', { q }) still works
-- through the default. With p_class, a learner in that class (or its teacher)
-- gets the class's own numbers once the class has enough first votes;
-- otherwise, and for anyone else, the whole site, as before.
drop function if exists public.council_stats(text);
create or replace function public.council_stats(q text, p_class uuid default null)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  -- Equals COUNCIL_MIN_VOTES in src/research/params.ts (checked by params.test.ts).
  min_votes constant int := 10;
  scope text := 'all';
  members uuid[];
begin
  if p_class is not null and auth.uid() is not null and (
    is_class_teacher(p_class)
    or exists (
      select 1 from class_members
      where class_id = p_class and user_id = auth.uid() and left_at is null and not removed
    )
  ) then
    select coalesce(array_agg(user_id), '{}') into members
    from class_members
    where class_id = p_class and left_at is null and not removed;
    if (select count(*) from council_votes where question_id = q and round = 1 and user_id = any(members)) >= min_votes then
      scope := 'class';
    end if;
  end if;

  return json_build_object(
    'scope', scope,
    'total', (
      select count(*) from council_votes
      where question_id = q and round = 1 and (scope = 'all' or user_id = any(members))
    ),
    'counts', (
      select coalesce(json_agg(coalesce(c.n, 0) order by i), '[]'::json)
      from generate_series(0, 3) as i
      left join (
        select choice, count(*) as n from council_votes
        where question_id = q and round = 1 and (scope = 'all' or user_id = any(members))
        group by choice
      ) c on c.choice = i
    ),
    -- Approved reasons only, never a name.
    'reasons', (
      select coalesce(json_agg(json_build_object('choice', r.choice, 'reason', r.reason)), '[]'::json)
      from (
        select choice, reason from council_votes
        where question_id = q and round = 1 and approved and reason is not null
          and (scope = 'all' or user_id = any(members))
        order by random() limit 6
      ) r
    )
  );
end;
$$;
revoke all on function public.council_stats(text, uuid) from public;
revoke all on function public.council_stats(text, uuid) from anon;
grant execute on function public.council_stats(text, uuid) to authenticated;
