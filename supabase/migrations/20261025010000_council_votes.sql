-- Steppe Council (Peer Instruction): each learner's vote in round 1 and 2.
-- Learners never read other rows; council_stats() returns only totals and
-- reasons a teacher has approved, without names.
create table if not exists public.council_votes (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  question_id text        not null,
  round       smallint    not null check (round in (1, 2)),
  choice      smallint    not null check (choice between 0 and 5),
  confidence  smallint    check (confidence between 0 and 2),
  reason      text        check (char_length(reason) <= 140),
  approved    boolean     not null default false,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id, round)
);

alter table public.council_votes enable row level security;

create policy "council_votes_select_own" on public.council_votes
  for select using (auth.uid() = user_id);
create policy "council_votes_insert_own" on public.council_votes
  for insert with check (auth.uid() = user_id and approved = false);
create policy "council_votes_update_own" on public.council_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id and approved = false);

create or replace function public.council_stats(q text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from council_votes where question_id = q and round = 1),
    'counts', (
      select coalesce(json_agg(coalesce(c.n, 0) order by i), '[]'::json)
      from generate_series(0, 3) as i
      left join (
        select choice, count(*) as n from council_votes where question_id = q and round = 1 group by choice
      ) c on c.choice = i
    ),
    'reasons', (
      select coalesce(json_agg(json_build_object('choice', choice, 'reason', reason)), '[]'::json)
      from (
        select choice, reason from council_votes
        where question_id = q and round = 1 and approved and reason is not null
        order by random() limit 6
      ) r
    )
  );
$$;

revoke all on function public.council_stats(text) from public;
grant execute on function public.council_stats(text) to authenticated;
