-- Learning path progress: one row per finished story level (A1..C1) or
-- passed story quiz ("quiz"). Read and written by the signed-in user only.
create table if not exists public.story_progress (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  story_id     text        not null,
  step         text        not null check (step in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'quiz')),
  completed_at timestamptz not null default now(),
  primary key (user_id, story_id, step)
);

alter table public.story_progress enable row level security;

create policy "story_progress_select_own" on public.story_progress
  for select using (auth.uid() = user_id);
create policy "story_progress_insert_own" on public.story_progress
  for insert with check (auth.uid() = user_id);
create policy "story_progress_update_own" on public.story_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Spaced repetition: when a saved word is due again. Null means due now.
alter table public.saved_words
  add column if not exists next_review_at timestamptz;
