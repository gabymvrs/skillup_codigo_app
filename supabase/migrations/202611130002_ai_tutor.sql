begin;

create table public.ai_tutor_quota (
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null check (bucket in ('minute', 'day')),
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, bucket, bucket_start)
);

create table public.ai_tutor_metrics (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  model text not null check (length(model) between 1 and 80),
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default now()
);

create index ai_tutor_metrics_user_created
  on public.ai_tutor_metrics(user_id, created_at desc);

alter table public.ai_tutor_quota enable row level security;
alter table public.ai_tutor_metrics enable row level security;
revoke all on public.ai_tutor_quota, public.ai_tutor_metrics from public, anon, authenticated;

create function public.consume_ai_tutor_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  minute_start timestamptz := date_trunc('minute', now());
  day_start timestamptz := date_trunc('day', now() at time zone 'America/Recife') at time zone 'America/Recife';
  minute_count integer;
  day_count integer;
begin
  if not private.session_allowed() or private.current_role() <> 'estudante' then
    raise exception 'Acesso não autorizado.';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select request_count into minute_count
  from public.ai_tutor_quota
  where user_id = auth.uid() and bucket = 'minute' and bucket_start = minute_start;
  select request_count into day_count
  from public.ai_tutor_quota
  where user_id = auth.uid() and bucket = 'day' and bucket_start = day_start;

  if coalesce(minute_count, 0) >= 10 or coalesce(day_count, 0) >= 100 then
    return false;
  end if;

  insert into public.ai_tutor_quota(user_id, bucket, bucket_start, request_count)
  values
    (auth.uid(), 'minute', minute_start, 1),
    (auth.uid(), 'day', day_start, 1)
  on conflict (user_id, bucket, bucket_start) do update
    set request_count = public.ai_tutor_quota.request_count + 1;
  return true;
end;
$$;

revoke all on function public.consume_ai_tutor_quota() from public, anon, authenticated;
grant execute on function public.consume_ai_tutor_quota() to authenticated;

commit;
