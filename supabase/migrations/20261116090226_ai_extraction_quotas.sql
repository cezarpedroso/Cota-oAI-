-- Durable, server-enforced limits for paid AI extraction.
-- These tables intentionally have no direct grants for anon or authenticated.
create table public.ai_extraction_limit_config (
  id boolean primary key default true check (id),
  per_minute_limit integer not null default 5 check (per_minute_limit between 1 and 1000),
  daily_limit integer not null default 50 check (daily_limit between 1 and 10000),
  updated_at timestamptz not null default now()
);

insert into public.ai_extraction_limit_config (id)
values (true);

create table public.ai_extraction_usage_windows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, window_started_at)
);

create table public.ai_extraction_usage_daily (
  user_id uuid not null references public.profiles(id) on delete cascade,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.ai_extraction_limit_config enable row level security;
alter table public.ai_extraction_usage_windows enable row level security;
alter table public.ai_extraction_usage_daily enable row level security;

create function public.consume_ai_extraction_quota()
returns table (window_remaining integer, daily_remaining integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_started_at timestamptz := date_trunc('minute', now());
  v_usage_date date := (now() at time zone 'UTC')::date;
  v_per_minute_limit integer;
  v_daily_limit integer;
  v_window_count integer;
  v_daily_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  -- Serializes only one user's quota consumption, preventing concurrent bypasses.
  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select per_minute_limit, daily_limit
  into strict v_per_minute_limit, v_daily_limit
  from public.ai_extraction_limit_config
  where id = true;

  delete from public.ai_extraction_usage_windows
  where user_id = v_user_id
    and window_started_at < now() - interval '2 days';

  delete from public.ai_extraction_usage_daily
  where user_id = v_user_id
    and usage_date < v_usage_date - 90;

  insert into public.ai_extraction_usage_windows (
    user_id,
    window_started_at,
    request_count
  )
  values (v_user_id, v_window_started_at, 1)
  on conflict (user_id, window_started_at) do update
    set request_count = public.ai_extraction_usage_windows.request_count + 1
    where public.ai_extraction_usage_windows.request_count < v_per_minute_limit
  returning request_count into v_window_count;

  if not found then
    raise exception 'ai_extraction_rate_limit_exceeded';
  end if;

  insert into public.ai_extraction_usage_daily (user_id, usage_date, request_count)
  values (v_user_id, v_usage_date, 1)
  on conflict (user_id, usage_date) do update
    set request_count = public.ai_extraction_usage_daily.request_count + 1
    where public.ai_extraction_usage_daily.request_count < v_daily_limit
  returning request_count into v_daily_count;

  if not found then
    raise exception 'ai_extraction_daily_quota_exceeded';
  end if;

  return query
  select
    v_per_minute_limit - v_window_count,
    v_daily_limit - v_daily_count;
end;
$$;

revoke all on function public.consume_ai_extraction_quota() from public, anon;
grant execute on function public.consume_ai_extraction_quota() to authenticated;

revoke all on table public.ai_extraction_limit_config from public, anon, authenticated;
revoke all on table public.ai_extraction_usage_windows from public, anon, authenticated;
revoke all on table public.ai_extraction_usage_daily from public, anon, authenticated;
