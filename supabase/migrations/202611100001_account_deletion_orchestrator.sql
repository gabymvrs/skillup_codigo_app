-- Account deletion orchestration. Destructive processing stays blocked until
-- the retention policy is approved and a later migration replaces the
-- preparation function.
begin;

create table private.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_hash text not null,
  status text not null default 'requested' check (status in (
    'requested',
    'processing',
    'awaiting_policy_review',
    'failed',
    'ready_for_auth_deletion',
    'completed'
  )),
  current_step text not null default 'requested',
  attempts integer not null default 0 check (attempts >= 0),
  requested_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  completed_at timestamptz,
  error_code text check (error_code is null or length(error_code) <= 80),
  check ((status = 'completed') = (completed_at is not null)),
  check (status <> 'completed' or user_id is null)
);

create unique index account_deletion_one_active_user
  on private.account_deletion_requests(user_id)
  where user_id is not null and status <> 'completed';
create index account_deletion_pending
  on private.account_deletion_requests(status, requested_at);

comment on table private.account_deletion_requests is
  'Minimal server-only state for idempotent account deletion processing.';
comment on column private.account_deletion_requests.user_hash is
  'SHA-256 of the user UUID. This supports reconciliation after the UUID is removed.';

revoke all on private.account_deletion_requests from public, anon, authenticated;

create function public.create_account_deletion_request(
  p_user_id uuid,
  p_user_hash text
)
returns table(request_id uuid, request_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing private.account_deletion_requests;
  created private.account_deletion_requests;
  signed_in_at timestamptz;
begin
  if p_user_id is null or p_user_hash is null or p_user_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'invalid_user';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select last_sign_in_at into signed_in_at
    from auth.users
    where id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'user_not_found';
  end if;
  if signed_in_at is null or signed_in_at < now() - interval '10 minutes' then
    raise exception using errcode = '28000', message = 'recent_authentication_required';
  end if;

  select * into existing
    from private.account_deletion_requests
    where user_id = p_user_id and status <> 'completed'
    order by requested_at desc
    limit 1;

  if found then
    return query select existing.id, existing.status;
    return;
  end if;

  insert into private.account_deletion_requests(user_id, user_hash)
  values (p_user_id, p_user_hash)
  returning * into created;

  return query select created.id, created.status;
end;
$$;

create function public.prepare_account_deletion(
  p_request_id uuid,
  p_user_id uuid
)
returns table(request_status text, ready_for_auth_deletion boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target private.account_deletion_requests;
begin
  if p_request_id is null or p_user_id is null then
    raise exception using errcode = '22023', message = 'invalid_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select * into target
    from private.account_deletion_requests
    where id = p_request_id and user_id = p_user_id
    for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'request_not_found';
  end if;

  update private.account_deletion_requests
    set status = 'processing',
        current_step = 'policy_gate',
        attempts = attempts + 1,
        last_attempt_at = now(),
        error_code = null
    where id = p_request_id;

  -- Intentionally fail closed. The preliminary matrix is not an approved
  -- deletion policy, so shared records, educational records and certificates
  -- cannot be deleted or anonymized safely yet.
  update private.account_deletion_requests
    set status = 'awaiting_policy_review',
        current_step = 'policy_gate',
        error_code = 'retention_policy_not_approved'
    where id = p_request_id;

  return query select 'awaiting_policy_review'::text, false;
end;
$$;

create function public.complete_account_deletion(
  p_request_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if not exists (
    select 1 from private.account_deletion_requests
    where id = p_request_id
      and user_id = p_user_id
      and status = 'ready_for_auth_deletion'
  ) then
    raise exception using errcode = '55000', message = 'request_not_ready';
  end if;

  update private.account_deletion_requests
    set user_id = null,
        status = 'completed',
        current_step = 'completed',
        completed_at = now(),
        error_code = null
    where id = p_request_id;
end;
$$;

revoke all on function public.create_account_deletion_request(uuid, text) from public, anon, authenticated;
revoke all on function public.prepare_account_deletion(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_account_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_account_deletion_request(uuid, text) to service_role;
grant execute on function public.prepare_account_deletion(uuid, uuid) to service_role;
grant execute on function public.complete_account_deletion(uuid, uuid) to service_role;

commit;
