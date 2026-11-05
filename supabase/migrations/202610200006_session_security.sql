-- Run AFTER 001–005. Preserves accounts, roles and application data.
begin;

-- A signed JWT can outlive sign-out. Check the session in Auth as well as
-- the current account state; never trust user-editable metadata for access.
create or replace function private.session_allowed()
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1
    from auth.users u
    join auth.sessions s on s.user_id = u.id
    where u.id = (select auth.uid())
      and s.id = nullif((select auth.jwt())->>'session_id', '')::uuid
      and u.email_confirmed_at is not null
      and not coalesce(u.is_anonymous, false)
      and (u.banned_until is null or u.banned_until <= now())
      and (s.not_after is null or s.not_after > now())
      and exists (select 1 from public.user_roles r where r.user_id = u.id)
  ) and (
    coalesce((select auth.jwt())->>'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors
      where user_id = (select auth.uid()) and status::text = 'verified'
    )
  )
$$;
revoke all on function private.session_allowed() from public, anon;
grant execute on function private.session_allowed() to authenticated;

commit;
