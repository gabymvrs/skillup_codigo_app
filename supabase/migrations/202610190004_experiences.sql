begin;
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(length(trim(title)) between 2 and 120),
  organization text not null check(length(trim(organization)) between 2 and 160),
  kind text not null check(kind in ('projeto','estagio','emprego','voluntariado')),
  description text not null check(length(trim(description)) between 10 and 3000),
  started_on date not null, ended_on date,
  check(ended_on is null or ended_on>=started_on)
);
create index experiences_user on public.experiences(user_id,started_on desc);
alter table public.experiences enable row level security;
revoke all on public.experiences from anon,authenticated;
grant select,insert,delete on public.experiences to authenticated;
grant update(title,organization,kind,description,started_on,ended_on) on public.experiences to authenticated;
create policy experiences_session on public.experiences as restrictive for all to authenticated using(private.session_allowed()) with check(private.session_allowed());
create policy experiences_read on public.experiences for select to authenticated using(user_id=auth.uid() or private.can_see_candidate(user_id));
create policy experiences_create on public.experiences for insert to authenticated with check(user_id=auth.uid());
create policy experiences_update on public.experiences for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy experiences_remove on public.experiences for delete to authenticated using(user_id=auth.uid());
commit;
