-- Apply after 008. Additive migration; existing projects remain community-only.
begin;
alter table public.projects add column visibility text not null default 'community' check(visibility in ('public','community','private'));
alter table public.projects add column knowledge_level text not null default 'iniciante' check(knowledge_level in ('iniciante','intermediario','avancado'));
alter table public.projects add column cover_path text;
alter table public.projects add column external_url text not null default '' check(external_url='' or external_url ~ '^https://');
alter table public.projects add constraint project_cover_owner check(cover_path is null or cover_path like owner_id::text||'/%');
grant update(visibility,knowledge_level,cover_path,external_url) on public.projects to authenticated;
alter table public.posts add column project_id uuid references public.projects(id) on delete cascade;
create index posts_project_idx on public.posts(project_id);
create function private.portfolio_student() returns boolean language sql stable security definer set search_path='' as $$select private.session_allowed() and private.current_role()='estudante'$$;
create function private.visible_project(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.projects where id=p_id and (owner_id=auth.uid() and private.session_allowed() or status<>'archived' and (visibility='public' or visibility='community' and private.session_allowed())))$$;
drop policy projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated using(private.visible_project(id));
-- Public pages use curated RPC projections, never direct anonymous access to profiles.
drop policy posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using(project_id is null or private.visible_project(project_id));
create policy shared_project_insert on public.posts as restrictive for insert to authenticated with check(project_id is null or private.portfolio_student() and exists(select 1 from public.projects where id=project_id and visibility<>'private' and status<>'archived'));
drop policy comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated using(exists(select 1 from public.posts where id=post_id));
create policy comment_parent on public.comments as restrictive for insert to authenticated with check(exists(select 1 from public.posts where id=post_id));
drop policy reactions_read on public.reactions;
create policy reactions_read on public.reactions for select to authenticated using(exists(select 1 from public.posts where id=post_id));
create policy reaction_parent on public.reactions as restrictive for insert to authenticated with check(exists(select 1 from public.posts where id=post_id));

create table public.student_portfolios(
 id uuid primary key references public.profiles(id) on delete cascade,
 study_area text not null default '' check(length(study_area)<=120),
 education text not null default '' check(length(education)<=2000),
 interests text[] not null default '{}' check(cardinality(interests)<=20),
 technologies text[] not null default '{}' check(cardinality(technologies)<=20),
 knowledge_level text not null default 'iniciante' check(knowledge_level in ('iniciante','intermediario','avancado')),
 public_portfolio boolean not null default false,
 featured_badges text[] not null default '{}' check(cardinality(featured_badges)<=3)
);
create table public.profile_highlights(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('Certificado','Experiência acadêmica','Experiência profissional','Projeto pessoal','Evento','Curso concluído','Conquista')),
 title text not null check(length(trim(title)) between 2 and 160),organization text not null default '' check(length(organization)<=160),
 description text not null default '' check(length(description)<=4000),started_on date not null,ended_on date check(ended_on>=started_on),
 external_url text not null default '' check(external_url='' or external_url ~ '^https://'),
 file_path text check(file_path is null or file_path like user_id::text||'/%'),file_name text not null default '' check(length(file_name)<=200),
 visibility text not null default 'private' check(visibility in ('public','community','private')),pinned boolean not null default false,
 created_at timestamptz not null default now(),check(kind<>'Certificado' or length(trim(organization))>=2)
);
create index highlights_user_idx on public.profile_highlights(user_id,created_at desc);
create table public.student_resumes(id uuid primary key default gen_random_uuid(),user_id uuid not null unique references public.profiles(id) on delete cascade,
 file_path text not null unique check(file_path like user_id::text||'/%' and file_path ~ '\.pdf$'),file_name text not null check(length(file_name) between 1 and 200),
 size_bytes integer not null check(size_bytes between 5 and 5242880),created_at timestamptz not null default now());
alter table public.applications add column resume_id uuid references public.student_resumes(id) on delete set null;
create index applications_resume_idx on public.applications(resume_id);
create function private.resume_attached(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$select private.session_allowed() and exists(select 1 from public.applications a join public.jobs j on j.id=a.job_id where a.resume_id=p_id and a.status<>'withdrawn' and j.owner_id=auth.uid())$$;
create policy application_resume_owner on public.applications as restrictive for insert to authenticated with check(resume_id is null or exists(select 1 from public.student_resumes r where r.id=resume_id and r.user_id=auth.uid()));
create table public.comment_reports(id uuid primary key default gen_random_uuid(),comment_id uuid not null references public.comments(id) on delete cascade,reporter_id uuid not null references public.profiles(id),
 reason text not null check(reason in ('Spam','Assédio ou bullying','Discurso de ódio','Conteúdo inadequado','Divulgação de dados pessoais','Outro')),
 description text not null default '' check(length(description)<=2000),status text not null default 'pending' check(status in ('pending','reviewed','dismissed')),created_at timestamptz not null default now(),unique(comment_id,reporter_id));
create index reports_queue_idx on public.comment_reports(status,created_at);
create table public.project_signals(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,project_id uuid not null references public.projects(id) on delete cascade,saved boolean not null default false,viewed_at timestamptz,unique(user_id,project_id));
create table public.achievement_definitions(id text primary key,name text not null,description text not null,icon text not null);
insert into public.achievement_definitions values
('first_lesson','Primeiros Passos','Concluir a primeira lição.','book'),('first_code','Programador Iniciante','Concluir corretamente uma prática de código.','code'),('streak7','Estudante Dedicado','Estudar por 7 dias consecutivos.','flame'),('explorer','Explorador','Iniciar 3 trilhas diferentes.','compass'),('creator','Criador','Publicar o primeiro projeto público ou da comunidade.','briefcase'),('weekly_top3','Destaque Semanal','Terminar uma semana entre os três primeiros do ranking.','trophy');
create table public.student_achievements(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,achievement_id text not null references public.achievement_definitions(id),earned_at timestamptz not null default now(),unique(user_id,achievement_id));
create index achievements_user_idx on public.student_achievements(user_id);

do $$declare t text;begin foreach t in array array['student_portfolios','profile_highlights','student_resumes','comment_reports','project_signals','achievement_definitions','student_achievements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy verified_session on public.%I as restrictive for all to authenticated using (private.session_allowed()) with check(private.session_allowed())',t);
end loop;end$$;
create policy portfolio_read on public.student_portfolios for select to authenticated using(id=auth.uid() or exists(select 1 from public.profiles p where p.id=student_portfolios.id and p.public_profile));
create policy portfolio_write on public.student_portfolios for all to authenticated using(id=auth.uid() and private.portfolio_student()) with check(id=auth.uid() and private.portfolio_student());
grant insert,update on public.student_portfolios to authenticated;
create policy highlights_read on public.profile_highlights for select to authenticated using(user_id=auth.uid() or visibility in ('community','public'));
create policy highlights_write on public.profile_highlights for all to authenticated using(user_id=auth.uid() and private.portfolio_student()) with check(user_id=auth.uid() and private.portfolio_student());
grant insert,delete on public.profile_highlights to authenticated;
grant update(kind,title,organization,description,started_on,ended_on,external_url,file_path,file_name,visibility,pinned) on public.profile_highlights to authenticated;
create policy resume_read on public.student_resumes for select to authenticated using(user_id=auth.uid() or private.resume_attached(id));
create policy resume_write on public.student_resumes for all to authenticated using(user_id=auth.uid() and private.portfolio_student()) with check(user_id=auth.uid() and private.portfolio_student());
grant insert,delete on public.student_resumes to authenticated;grant update(file_path,file_name,size_bytes,created_at) on public.student_resumes to authenticated;
create policy reports_read on public.comment_reports for select to authenticated using(reporter_id=auth.uid());
create policy signals_own on public.project_signals for all to authenticated using(user_id=auth.uid() and private.portfolio_student()) with check(user_id=auth.uid() and private.portfolio_student() and private.visible_project(project_id));
grant insert,delete on public.project_signals to authenticated;grant update(saved,viewed_at) on public.project_signals to authenticated;
create policy definitions_read on public.achievement_definitions for select to authenticated using(true);
create policy achievements_read on public.student_achievements for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.profiles p where p.id=user_id and p.public_profile));

create function private.portfolio_limits() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,91));
 if tg_table_name='profile_highlights' then
  if new.pinned and (select count(*) from public.profile_highlights where user_id=new.user_id and pinned and id<>new.id)>=3 then raise exception 'Você pode fixar até três destaques.';end if;
 elsif tg_table_name='student_portfolios' then
  if cardinality(new.featured_badges)<>(select count(distinct a) from unnest(new.featured_badges) a) or exists(select 1 from unnest(new.featured_badges) a where not exists(select 1 from public.student_achievements e where e.user_id=new.id and e.achievement_id=a)) then raise exception 'Selecione apenas conquistas desbloqueadas, sem repetições.';end if;
 end if;return new;end$$;
create trigger highlights_limits before insert or update on public.profile_highlights for each row execute function private.portfolio_limits();
create trigger portfolio_limits before insert or update on public.student_portfolios for each row execute function private.portfolio_limits();
create function private.profile_skills_validation() returns trigger language plpgsql set search_path='' as $$begin
 if cardinality(new.skills)>30 or exists(select 1 from unnest(new.skills) s where length(trim(s)) not between 1 and 60) or cardinality(new.skills)<>(select count(distinct lower(trim(s))) from unnest(new.skills) s) then raise exception 'Use até 30 habilidades únicas com até 60 caracteres.';end if;return new;end$$;
create trigger profile_skills_validation before insert or update of skills on public.profiles for each row execute function private.profile_skills_validation();

create function public.report_comment(p_comment_id uuid,p_reason text,p_description text default '') returns void language plpgsql security definer set search_path='' as $$begin
 if not private.portfolio_student() then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,92));
 if not exists(select 1 from public.comments c join public.posts p on p.id=c.post_id where c.id=p_comment_id and (p.project_id is null or private.visible_project(p.project_id))) then raise exception 'Comentário indisponível.';end if;
 if exists(select 1 from public.comment_reports where comment_id=p_comment_id and reporter_id=auth.uid()) then raise exception 'Você já denunciou este comentário.';end if;
 if (select count(*) from public.comment_reports where reporter_id=auth.uid() and created_at>now()-interval '24 hours')>=5 then raise exception 'Limite de cinco denúncias por 24 horas. Tente mais tarde.';end if;
 insert into public.comment_reports(comment_id,reporter_id,reason,description) values(p_comment_id,auth.uid(),p_reason,coalesce(p_description,''));
end$$;
create function public.refresh_student_achievements() returns void language plpgsql security definer set search_path='' as $$declare u uuid:=auth.uid();begin
 if not private.portfolio_student() then raise exception 'Acesso não autorizado.';end if;
 insert into public.student_achievements(user_id,achievement_id,earned_at)
 select u,'first_lesson',min(completed_at) from public.progress where user_id=u having count(*)>0 on conflict do nothing;
 insert into public.student_achievements(user_id,achievement_id,earned_at)
 select u,'first_code',min(a.created_at) from public.attempts a join public.questions q on q.id=a.question_id where a.user_id=u and a.correct and q.activity_type='code_practice' having count(*)>0 on conflict do nothing;
 if (select count(*) from public.track_enrollments where user_id=u)>=3 then insert into public.student_achievements(user_id,achievement_id) values(u,'explorer') on conflict do nothing;end if;
 if exists(select 1 from (select day-row_number() over(order by day)::integer as streak from public.study_days where user_id=u) s group by streak having count(*)>=7) then insert into public.student_achievements(user_id,achievement_id) values(u,'streak7') on conflict do nothing;end if;
 if exists(select 1 from public.projects where owner_id=u and visibility<>'private' and status<>'archived') then insert into public.student_achievements(user_id,achievement_id) values(u,'creator') on conflict do nothing;end if;
 -- Award only closed weeks, using the same Brazil week boundary as the leaderboard.
 if exists(with scores as (select r.user_id,date_trunc('week',r.created_at at time zone 'America/Recife') week,sum(r.xp) xp from public.reward_events r join public.profiles p on p.id=r.user_id where p.public_profile and r.xp>0 and r.created_at at time zone 'America/Recife'<date_trunc('week',now() at time zone 'America/Recife') group by r.user_id,week),ranked as(select user_id,row_number() over(partition by week order by xp desc,user_id) pos from scores) select 1 from ranked where user_id=u and pos<=3) then insert into public.student_achievements(user_id,achievement_id) values(u,'weekly_top3') on conflict do nothing;end if;
end$$;

create function public.public_project(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',p.id,'title',p.title,'description',p.description,'category',p.category,'skills',p.skills,'image',p.image,'cover_path',p.cover_path,'external_url',p.external_url,'author',a.full_name,'owner_id',p.owner_id) from public.projects p join public.profiles a on a.id=p.owner_id where p.id=p_id and p.visibility='public' and p.status<>'archived'$$;
create function public.public_student_portfolio(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',p.id,'full_name',p.full_name,'avatar_path',p.avatar_path,'headline',p.headline,'bio',p.bio,'skills',p.skills,'website',p.website,'education',s.education,'study_area',s.study_area,'highlights',coalesce((select jsonb_agg(h order by h.pinned desc,h.created_at desc) from public.profile_highlights h where h.user_id=p.id and h.visibility='public'),'[]'::jsonb),'projects',coalesce((select jsonb_agg(public.public_project(j.id)) from public.projects j where j.owner_id=p.id and j.visibility='public' and j.status<>'archived'),'[]'::jsonb),'achievements',coalesce((select jsonb_agg(jsonb_build_object('name',d.name,'description',d.description,'earned_at',a.earned_at,'featured',a.achievement_id=any(s.featured_badges))) from public.student_achievements a join public.achievement_definitions d on d.id=a.achievement_id where a.user_id=p.id),'[]'::jsonb)) from public.profiles p join public.student_portfolios s on s.id=p.id where p.id=p_id and s.public_portfolio$$;
create function public.public_highlight(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('highlight',to_jsonb(h),'full_name',p.full_name,'headline',p.headline) from public.profile_highlights h join public.profiles p on p.id=h.user_id where h.id=p_id and h.visibility='public'$$;
revoke all on function public.public_highlight(uuid) from public;grant execute on function public.public_highlight(uuid) to anon,authenticated;
create function private.validate_student_file_reference() returns trigger language plpgsql security definer set search_path='' as $$declare p text;b text;begin
 if tg_table_name='student_resumes' then p:=new.file_path;b:='student-resumes';
 elsif tg_table_name='profile_highlights' then p:=new.file_path;b:='portfolio-files';
 else p:=new.cover_path;b:='portfolio-files';if p is not null and p !~ '\.(png|jpg|webp)$' then raise exception 'A capa deve ser uma imagem.';end if;end if;
 if p is not null and not exists(select 1 from storage.objects where bucket_id=b and name=p) then raise exception 'Arquivo não confirmado no armazenamento.';end if;
 return new;end$$;
create trigger resume_file_exists before insert or update of file_path on public.student_resumes for each row execute function private.validate_student_file_reference();
create trigger highlight_file_exists before insert or update of file_path on public.profile_highlights for each row execute function private.validate_student_file_reference();
create trigger project_file_exists before insert or update of cover_path on public.projects for each row execute function private.validate_student_file_reference();
revoke all on function private.validate_student_file_reference() from public,anon,authenticated;
create function private.public_student_avatar(p_path text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles p join public.student_portfolios s on s.id=p.id where p.avatar_path=p_path and s.public_portfolio)$$;
revoke all on function private.public_student_avatar(text) from public;
grant execute on function private.public_student_avatar(text) to anon,authenticated;
create policy public_portfolio_avatar on storage.objects for select to anon,authenticated using(bucket_id='avatars' and private.public_student_avatar(name));
-- No resume, preferences, account e-mail, documents or private highlights in anonymous payloads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('student-resumes','student-resumes',false,5242880,array['application/pdf']),('portfolio-files','portfolio-files',false,5242880,array['application/pdf','image/jpeg','image/png','image/webp']);
create function private.visible_portfolio_file(p_path text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profile_highlights h where h.file_path=p_path and (h.visibility='public' or private.session_allowed() and (h.user_id=auth.uid() or h.visibility='community'))) or exists(select 1 from public.projects p where p.cover_path=p_path and private.visible_project(p.id))$$;
create policy student_files_upload on storage.objects for insert to authenticated with check(bucket_id in ('student-resumes','portfolio-files') and private.portfolio_student() and (storage.foldername(name))[1]=auth.uid()::text);
create policy student_files_delete on storage.objects for delete to authenticated using(bucket_id in ('student-resumes','portfolio-files') and private.portfolio_student() and (storage.foldername(name))[1]=auth.uid()::text);
create policy student_files_read on storage.objects for select to authenticated using(private.session_allowed() and (bucket_id in ('student-resumes','portfolio-files') and (storage.foldername(name))[1]=auth.uid()::text or bucket_id='portfolio-files' and private.visible_portfolio_file(name) or bucket_id='student-resumes' and exists(select 1 from public.student_resumes r where r.file_path=name and private.resume_attached(r.id))));
grant select on storage.objects to anon;
create policy public_portfolio_files on storage.objects for select to anon using(bucket_id='portfolio-files' and private.visible_portfolio_file(name));

revoke all on function private.portfolio_student(),private.visible_project(uuid),private.resume_attached(uuid),private.portfolio_limits(),private.profile_skills_validation(),private.visible_portfolio_file(text) from public,anon,authenticated;
grant execute on function private.portfolio_student(),private.visible_project(uuid),private.resume_attached(uuid),private.visible_portfolio_file(text) to authenticated;
grant usage on schema private to anon;
grant execute on function private.visible_portfolio_file(text) to anon;
revoke all on function public.report_comment(uuid,text,text),public.refresh_student_achievements(),public.public_project(uuid),public.public_student_portfolio(uuid) from public,anon,authenticated;
grant execute on function public.report_comment(uuid,text,text),public.refresh_student_achievements() to authenticated;
grant execute on function public.public_project(uuid),public.public_student_portfolio(uuid) to anon,authenticated;
commit;
