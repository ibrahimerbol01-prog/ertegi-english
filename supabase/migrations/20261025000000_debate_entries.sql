-- Words of the week: one debate answer per learner per week (Monday start).
-- The app keeps working from localStorage until this table exists.
create table if not exists public.debate_entries (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  week_start date        not null,
  side       text        check (side in ('yes', 'no')),
  text       text        not null default '' check (char_length(text) <= 400),
  reply_text text        not null default '' check (char_length(reply_text) <= 240),
  words_used text[]      not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.debate_entries enable row level security;

create policy "debate_entries_select_own" on public.debate_entries
  for select using (auth.uid() = user_id);
create policy "debate_entries_insert_own" on public.debate_entries
  for insert with check (auth.uid() = user_id);
create policy "debate_entries_update_own" on public.debate_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
