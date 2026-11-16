-- Keep a server-timestamped record of the terms accepted during email signup.
begin;

create table private.terms_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (length(terms_version) between 1 and 80),
  accepted_at timestamptz not null default now(),
  source text not null default 'email_signup' check (source = 'email_signup'),
  primary key (user_id, terms_version)
);

comment on table private.terms_acceptances is
  'Server-timestamped evidence of the terms version accepted during signup.';

revoke all on private.terms_acceptances from public, anon, authenticated;

create function private.record_signup_terms_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted boolean;
  version text;
begin
  if new.raw_app_meta_data->>'provider' <> 'email' then
    return new;
  end if;

  accepted := coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false);
  version := nullif(trim(new.raw_user_meta_data->>'terms_version'), '');

  if not accepted or version is null then
    raise exception using
      errcode = '22023',
      message = 'terms_acceptance_required';
  end if;

  insert into private.terms_acceptances(user_id, terms_version)
  values (new.id, left(version, 80));
  return new;
exception
  when invalid_text_representation then
    raise exception using
      errcode = '22023',
      message = 'terms_acceptance_required';
end;
$$;

revoke all on function private.record_signup_terms_acceptance()
  from public, anon, authenticated;

create trigger skillup_signup_terms_acceptance
after insert on auth.users
for each row execute function private.record_signup_terms_acceptance();

commit;
