begin;

create table public.ai_tutor_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null check (length(content) between 1 and 10000),
  subject text not null default '' check (length(subject) <= 120),
  created_at timestamptz not null default now()
);

create index ai_tutor_messages_user_created
  on public.ai_tutor_messages(user_id, created_at desc);

alter table public.ai_tutor_messages enable row level security;
revoke all on public.ai_tutor_messages from public, anon, authenticated;
grant select, delete on public.ai_tutor_messages to authenticated;

create policy "Students read their tutor messages"
on public.ai_tutor_messages for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Students delete their tutor messages"
on public.ai_tutor_messages for delete
to authenticated
using ((select auth.uid()) = user_id);

drop function public.consume_ai_tutor_quota();

create or replace function public.consume_ai_tutor_quota()
returns jsonb
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

  minute_count := coalesce(minute_count, 0);
  day_count := coalesce(day_count, 0);
  if minute_count >= 10 or day_count >= 100 then
    return jsonb_build_object(
      'allowed', false,
      'minute_used', minute_count,
      'daily_used', day_count
    );
  end if;

  insert into public.ai_tutor_quota(user_id, bucket, bucket_start, request_count)
  values
    (auth.uid(), 'minute', minute_start, 1),
    (auth.uid(), 'day', day_start, 1)
  on conflict (user_id, bucket, bucket_start) do update
    set request_count = public.ai_tutor_quota.request_count + 1;

  return jsonb_build_object(
    'allowed', true,
    'minute_used', minute_count + 1,
    'daily_used', day_count + 1
  );
end;
$$;

create or replace function public.get_ai_tutor_usage()
returns jsonb
language plpgsql
security definer
stable
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

  select request_count into minute_count
  from public.ai_tutor_quota
  where user_id = auth.uid() and bucket = 'minute' and bucket_start = minute_start;
  select request_count into day_count
  from public.ai_tutor_quota
  where user_id = auth.uid() and bucket = 'day' and bucket_start = day_start;

  return jsonb_build_object(
    'minute_used', coalesce(minute_count, 0),
    'daily_used', coalesce(day_count, 0)
  );
end;
$$;

revoke all on function public.consume_ai_tutor_quota() from public, anon, authenticated;
grant execute on function public.consume_ai_tutor_quota() to authenticated;
revoke all on function public.get_ai_tutor_usage() from public, anon, authenticated;
grant execute on function public.get_ai_tutor_usage() to authenticated;

commit;
