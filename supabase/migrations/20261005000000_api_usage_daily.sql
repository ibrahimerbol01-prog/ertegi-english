-- Tracks per-user daily Shoqan request counts for rate limiting.
-- The API functions use the service role key (bypasses RLS) to read/write this table.
-- Users must not have direct access.

create table if not exists public.api_usage_daily (
  user_id  uuid    not null references auth.users(id) on delete cascade,
  date     date    not null default current_date,
  shoqan_count integer not null default 0,
  primary key (user_id, date)
);

alter table public.api_usage_daily enable row level security;
-- No RLS policies — only the service-role key (backend) may access this table.
