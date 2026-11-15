-- Complete account deletion for student accounts.
-- Shared institutional content owned by privileged roles remains outside this
-- automated flow and requires a separate transfer/retention decision.
begin;

create or replace function public.prepare_account_deletion(
  p_request_id uuid,
  p_user_id uuid
)
returns table(request_status text, ready_for_auth_deletion boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target private.account_deletion_requests%rowtype;
  account_role public.app_role;
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

  if target.status = 'ready_for_auth_deletion' then
    return query select target.status, true;
    return;
  end if;

  select role into account_role
    from public.user_roles
    where user_id = p_user_id;

  if account_role is distinct from 'estudante'::public.app_role then
    update private.account_deletion_requests
      set status = 'failed',
          current_step = 'role_policy',
          attempts = attempts + 1,
          last_attempt_at = now(),
          error_code = 'manual_review_required'
      where id = p_request_id;
    return query select 'failed'::text, false;
    return;
  end if;

  update private.account_deletion_requests
    set status = 'processing',
        current_step = 'database_cleanup',
        attempts = attempts + 1,
        last_attempt_at = now(),
        error_code = null
    where id = p_request_id;

  -- Rows that do not cascade from profiles are removed explicitly. Content
  -- authored by the student is deleted; rows belonging to other users are not.
  delete from public.comment_reports where reporter_id = p_user_id;
  delete from public.notifications where user_id = p_user_id;
  delete from public.messages
    where sender_id = p_user_id or recipient_id = p_user_id;
  delete from public.support_tickets
    where user_id = p_user_id or assigned_to = p_user_id;
  delete from public.certificates
    where user_id = p_user_id or issued_by = p_user_id;
  delete from public.study_events where user_id = p_user_id;
  delete from public.saved_jobs where user_id = p_user_id;
  delete from public.applications where student_id = p_user_id;
  delete from public.project_members where user_id = p_user_id;
  delete from public.reactions where user_id = p_user_id;
  delete from public.comments where user_id = p_user_id;
  delete from public.posts where user_id = p_user_id;
  delete from public.submissions where student_id = p_user_id;
  delete from public.enrollments where user_id = p_user_id;
  delete from public.projects where owner_id = p_user_id;

  -- Cascades remove learning progress, portfolio, achievements, AI usage
  -- metrics, role requests and the remaining account-scoped rows.
  delete from public.profiles where id = p_user_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'profile_not_found';
  end if;

  update private.account_deletion_requests
    set status = 'ready_for_auth_deletion',
        current_step = 'auth_deletion',
        error_code = null
    where id = p_request_id;

  return query select 'ready_for_auth_deletion'::text, true;
exception
  when others then
    update private.account_deletion_requests
      set status = 'failed',
          current_step = 'database_cleanup',
          last_attempt_at = now(),
          error_code = left(sqlstate, 80)
      where id = p_request_id;
    raise;
end;
$$;

revoke all on function public.prepare_account_deletion(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid, uuid)
  to service_role;

commit;
