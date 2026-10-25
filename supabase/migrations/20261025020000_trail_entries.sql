-- Thinking Trail (Claim–Support–Question): every revision is a new row, so a
-- teacher can see how a learner's thinking changed. Own rows only.
create table if not exists public.trail_entries (
  id           bigserial   primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  tale_id      text        not null,
  cefr_level   text        not null,
  claim_choice text        not null check (claim_choice in ('yes', 'no', 'partly')),
  claim_text   text        not null default '' check (char_length(claim_text) <= 280),
  evidence_ids int[]       not null default '{}',
  wonder_text  text        not null default '' check (char_length(wonder_text) <= 160),
  revision     int         not null default 1,
  created_at   timestamptz not null default now(),
  unique (user_id, tale_id, revision)
);

alter table public.trail_entries enable row level security;

create policy "trail_entries_select_own" on public.trail_entries
  for select using (auth.uid() = user_id);
create policy "trail_entries_insert_own" on public.trail_entries
  for insert with check (auth.uid() = user_id);
