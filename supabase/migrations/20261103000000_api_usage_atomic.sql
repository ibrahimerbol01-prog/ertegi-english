-- Atomic daily limits for the AI and speech endpoints.
-- Before: the API read the counter, then wrote count + 1, so parallel
-- requests all passed the check. Now one UPDATE ... WHERE count < limit
-- both checks and counts under a row lock.
-- Buckets: chat (Shoqan chat), tool (thinking trail, debate), azure (speech tokens).

alter table public.api_usage_daily add column if not exists tool_count  integer not null default 0;
alter table public.api_usage_daily add column if not exists azure_count integer not null default 0;

-- Returns the new count, or -1 when the limit is already reached.
create or replace function public.bump_api_usage(p_user uuid, p_kind text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'utc')::date;
  n integer;
begin
  if p_kind not in ('chat', 'tool', 'azure') then
    raise exception 'unknown usage kind %', p_kind;
  end if;
  insert into api_usage_daily (user_id, date) values (p_user, d)
  on conflict (user_id, date) do nothing;
  if p_kind = 'chat' then
    update api_usage_daily set shoqan_count = shoqan_count + 1
     where user_id = p_user and date = d and shoqan_count < p_limit
     returning shoqan_count into n;
  elsif p_kind = 'tool' then
    update api_usage_daily set tool_count = tool_count + 1
     where user_id = p_user and date = d and tool_count < p_limit
     returning tool_count into n;
  else
    update api_usage_daily set azure_count = azure_count + 1
     where user_id = p_user and date = d and azure_count < p_limit
     returning azure_count into n;
  end if;
  return coalesce(n, -1);
end;
$$;

-- Gives a request back when the AI service failed, so a busy model does not
-- eat a learner's questions.
create or replace function public.refund_api_usage(p_user uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'utc')::date;
begin
  if p_kind = 'chat' then
    update api_usage_daily set shoqan_count = greatest(shoqan_count - 1, 0) where user_id = p_user and date = d;
  elsif p_kind = 'tool' then
    update api_usage_daily set tool_count = greatest(tool_count - 1, 0) where user_id = p_user and date = d;
  elsif p_kind = 'azure' then
    update api_usage_daily set azure_count = greatest(azure_count - 1, 0) where user_id = p_user and date = d;
  end if;
end;
$$;

-- Only the server (service role) may call these.
revoke all on function public.bump_api_usage(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.refund_api_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.bump_api_usage(uuid, text, integer) to service_role;
grant execute on function public.refund_api_usage(uuid, text) to service_role;
