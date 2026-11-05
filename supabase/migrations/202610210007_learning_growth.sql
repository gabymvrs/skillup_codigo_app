-- Incremental migration. Apply after 006; never rerun initial schema on an existing project.
begin;
alter table public.profiles add column avatar_path text check(avatar_path is null or (avatar_path like id::text||'/%' and length(avatar_path)<240));
grant update(avatar_path) on public.profiles to authenticated;
alter table public.tracks add column difficulty text not null default 'Iniciante' check(length(difficulty)<40);
alter table public.questions add column kind text not null default 'choice' check(kind in ('choice','true_false','blank','matching','ordering','challenge'));
alter table public.questions add column subject_id uuid references public.subjects(id);
alter table public.questions add column payload jsonb not null default '{}';
alter table public.questions drop constraint questions_options_check;
alter table public.questions add constraint question_options_shape check(jsonb_typeof(options)='array' and jsonb_array_length(options)<=12);
alter table private.question_answers alter column correct_index drop not null;
alter table private.question_answers add column expected jsonb;
alter table public.attempts add column response jsonb;
alter table public.modules add column question_id uuid references public.questions(id);
create index module_question on public.modules(question_id);
create index question_subject on public.questions(subject_id);
create table public.learning_settings(id uuid primary key references public.profiles(id) on delete cascade, timezone text not null);
create table public.reward_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,source text not null,xp integer not null check(xp>=0),label text not null,created_at timestamptz not null default now(),unique(user_id,source));
create index rewards_week on public.reward_events(created_at,user_id);
create table public.study_days(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,day date not null,unique(user_id,day));
create table public.track_enrollments(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,track_id uuid not null references public.tracks(id) on delete cascade,created_at timestamptz not null default now(),unique(user_id,track_id));
create index track_enrollments_track on public.track_enrollments(track_id);
create table public.material_reads(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,material_id uuid not null references public.materials(id) on delete cascade,last_opened_at timestamptz not null default now(),completed_at timestamptz,unique(user_id,material_id));
create index material_reads_material on public.material_reads(material_id);
do $$declare t text;begin foreach t in array array['reward_events','study_days','learning_settings','track_enrollments','material_reads'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy valid_session on public.%I as restrictive for all to authenticated using(private.session_allowed()) with check(private.session_allowed())',t);
 if t='learning_settings' then execute format('create policy own_read on public.%I for select to authenticated using(id=auth.uid())',t);
 else execute format('create policy own_read on public.%I for select to authenticated using(user_id=auth.uid())',t);end if;
end loop;end$$;

-- The first selected IANA zone is pinned before the first study day. No dates or XP supplied by the browser.
create function public.configure_learning_timezone(p_timezone text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.session_allowed() then raise exception 'Acesso não autorizado.';end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Fuso horário inválido.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 insert into public.learning_settings(id,timezone) values(auth.uid(),p_timezone) on conflict(id) do nothing;
end$$;
create function private.award_learning(p_user uuid,p_source text,p_xp integer,p_label text) returns void language plpgsql security definer set search_path='' as $$
declare zone text;today date;start_day date;streak integer;bonus integer;added uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 insert into public.reward_events(user_id,source,xp,label) values(p_user,p_source,p_xp,p_label) on conflict(user_id,source) do nothing returning id into added;
 if added is null then return;end if;
 select timezone into zone from public.learning_settings where id=p_user;
 -- Existing callers without timezone setup have an explicit Brazilian fallback.
 if zone is null then zone:='America/Sao_Paulo';insert into public.learning_settings(id,timezone) values(p_user,zone) on conflict do nothing;end if;
 today:=(now() at time zone zone)::date;
 insert into public.study_days(user_id,day) values(p_user,today) on conflict(user_id,day) do nothing;
 start_day:=today;
 while exists(select 1 from public.study_days where user_id=p_user and day=start_day-1) loop start_day:=start_day-1;end loop;
 streak:=today-start_day+1;
 bonus:=case streak when 1 then 10 when 3 then 30 when 7 then 75 when 14 then 150 when 30 then 350 else 0 end;
 if bonus>0 then insert into public.reward_events(user_id,source,xp,label) values(p_user,'streak:'||start_day::text||':'||streak,bonus,'Ofensiva de '||streak||' dia(s)') on conflict(user_id,source) do nothing;end if;
end$$;
create function private.record_learning_reward() returns trigger language plpgsql security definer set search_path='' as $$
declare m public.modules;
begin
 if tg_table_name='progress' then
  select * into m from public.modules where id=new.module_id;
  perform private.award_learning(new.user_id,'module:'||m.id,m.xp,'Módulo: '||m.title);
  insert into public.track_enrollments(user_id,track_id) values(new.user_id,m.track_id) on conflict do nothing;
 elsif tg_table_name='attempts' then
  if new.correct then perform private.award_learning(new.user_id,'question:'||new.question_id,(select xp from public.questions where id=new.question_id),'Exercício: '||(select title from public.questions where id=new.question_id));end if;
 elsif tg_table_name='submissions' and new.status='reviewed' and new.grade>=7 then
  -- A teacher's delayed review awards XP, but must not manufacture a study day for an absent student.
  perform pg_advisory_xact_lock(hashtextextended(new.student_id::text,0));
  insert into public.reward_events(user_id,source,xp,label) values(new.student_id,'assignment:'||new.assignment_id,100,'Atividade aprovada pelo docente') on conflict do nothing;
 end if;return new;
end$$;
-- Preserve historical points without awarding retroactive bonuses or inventing streaks.
insert into public.reward_events(user_id,source,xp,label,created_at)
 select p.user_id,'module:'||m.id,m.xp,'Módulo: '||m.title,p.completed_at from public.progress p join public.modules m on m.id=p.module_id on conflict do nothing;
insert into public.reward_events(user_id,source,xp,label,created_at)
 select a.user_id,'question:'||q.id,a.xp,'Exercício: '||q.title,a.created_at from public.attempts a join public.questions q on q.id=a.question_id where a.xp>0 on conflict do nothing;
insert into public.track_enrollments(user_id,track_id,created_at) select p.user_id,m.track_id,min(p.completed_at) from public.progress p join public.modules m on m.id=p.module_id group by p.user_id,m.track_id on conflict do nothing;
create trigger reward_module after insert on public.progress for each row execute function private.record_learning_reward();
create trigger reward_attempt after insert on public.attempts for each row execute function private.record_learning_reward();
create trigger reward_assignment after update on public.submissions for each row execute function private.record_learning_reward();

create function public.start_track(p_track_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.session_allowed() or private.current_role()<>'estudante' or not private.can_read_track(p_track_id) then raise exception 'Trilha indisponível.';end if;
 insert into public.track_enrollments(user_id,track_id) values(auth.uid(),p_track_id) on conflict do nothing;
end$$;
create function public.record_material_read(p_material_id uuid,p_completed boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.session_allowed() or not exists(select 1 from public.materials where id=p_material_id and (owner_id=auth.uid() or (published and (organization_id is null or organization_id=private.current_org())))) then raise exception 'Material indisponível.';end if;
 insert into public.material_reads(user_id,material_id,completed_at) values(auth.uid(),p_material_id,case when p_completed then now() end)
 on conflict(user_id,material_id) do update set last_opened_at=now(),completed_at=coalesce(material_reads.completed_at,excluded.completed_at);
end$$;
create or replace function public.complete_module(p_module_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.modules;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into m from public.modules where id=p_module_id;
 if m.id is null or not private.can_read_track(m.track_id) then raise exception 'Módulo não disponível.';end if;
 if m.prerequisite_id is not null and not exists(select 1 from public.progress where user_id=auth.uid() and module_id=m.prerequisite_id) then raise exception 'Conclua a etapa anterior.';end if;
 if m.question_id is not null and not exists(select 1 from public.attempts where user_id=auth.uid() and question_id=m.question_id and correct) then raise exception 'Conclua o exercício desta etapa.';end if;
 insert into public.progress(user_id,module_id) values(auth.uid(),m.id) on conflict(user_id,module_id) do nothing;
end$$;
create function public.submit_exercise(p_question_id uuid,p_response jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.questions;expected jsonb;correct boolean;award integer;flags jsonb;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 if p_response is null or octet_length(p_response::text)>12000 then raise exception 'Resposta inválida.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into q from public.questions where id=p_question_id;
 if q.id is null then raise exception 'Exercício indisponível.';end if;
 if q.kind='choice' then
  if jsonb_typeof(p_response)<>'number' or p_response::text !~ '^[0-9]+$' then raise exception 'Escolha uma alternativa.';end if;
  return public.submit_answer(q.id,(p_response::text)::integer);
 end if;
 select a.expected into expected from private.question_answers a where a.question_id=q.id;
 if q.kind='challenge' then
  flags:=p_response->'checks';
  if jsonb_typeof(p_response)<>'object' or jsonb_typeof(p_response->'text')<>'string' or jsonb_typeof(flags)<>'array' then raise exception 'Preencha o relato e os critérios.';end if;
  correct:=length(trim(p_response->>'text')) between coalesce((q.payload->>'minLength')::integer,120) and 8000
   and jsonb_array_length(flags)=jsonb_array_length(q.payload->'criteria')
   and not exists(select 1 from jsonb_array_elements(flags) v where v<>'true'::jsonb);
 elsif expected is null then raise exception 'Gabarito indisponível.';
 elsif q.kind='blank' then
  if jsonb_typeof(p_response)<>'string' then raise exception 'Digite a resposta.';end if;
  correct:=lower(trim(p_response#>>'{}'))=lower(trim(expected#>>'{}'));
 else
  if jsonb_typeof(p_response)<>'array' then raise exception 'Complete todas as respostas.';end if;
  correct:=p_response=expected;
 end if;
 award:=case when correct and not exists(select 1 from public.reward_events where user_id=auth.uid() and source='question:'||q.id) then q.xp else 0 end;
 insert into public.attempts(user_id,question_id,selected_index,response,correct,xp) values(auth.uid(),q.id,-1,p_response,coalesce(correct,false),award);
 return jsonb_build_object('correct',coalesce(correct,false),'xp',award,'explanation',case when q.kind='challenge' then 'Conclusão autodeclarada: relato e critérios registrados. Não equivale a uma avaliação docente.' else q.explanation end);
end$$;
-- Prevent calling the legacy MC endpoint against non-choice exercises.
create or replace function public.submit_answer(p_question_id uuid,p_selected_index integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.questions;correct_index integer;is_correct boolean;award integer;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into q from public.questions where id=p_question_id;
 if q.id is null or q.kind<>'choice' or p_selected_index is null or p_selected_index<0 or p_selected_index>=jsonb_array_length(q.options) then raise exception 'Resposta inválida.';end if;
 select a.correct_index into correct_index from private.question_answers a where question_id=q.id;
 if correct_index is null then raise exception 'Este exercício ainda não tem gabarito publicado.';end if;
 is_correct:=correct_index=p_selected_index;
 award:=case when is_correct and not exists(select 1 from public.reward_events where user_id=auth.uid() and source='question:'||q.id) then q.xp else 0 end;
 insert into public.attempts(user_id,question_id,selected_index,correct,xp) values(auth.uid(),q.id,p_selected_index,is_correct,award);
 return jsonb_build_object('correct',is_correct,'xp',award,'explanation',q.explanation);
end$$;
create function public.weekly_leaderboard() returns table(user_id uuid,full_name text,avatar_path text,xp bigint,previous_xp bigint,"position" bigint) language sql stable security definer set search_path='' as $$
 with bounds as(select date_trunc('week',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo' as start),
 totals as(select p.id,p.full_name,p.avatar_path,coalesce(sum(r.xp) filter(where r.created_at>=b.start),0)::bigint xp,coalesce(sum(r.xp) filter(where r.created_at<b.start and r.created_at>=b.start-interval '7 days'),0)::bigint previous_xp
 from public.profiles p join public.user_roles u on u.user_id=p.id and u.role='estudante' cross join bounds b left join public.reward_events r on r.user_id=p.id
 where p.public_profile and private.session_allowed() group by p.id),
 ranked as(select *,rank() over(order by xp desc) as rank_position from totals where xp>0)
 select id,full_name,avatar_path,xp,previous_xp,rank_position from ranked where rank_position<=3 or id=auth.uid() order by rank_position,id
$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy avatar_upload on storage.objects for insert to authenticated with check(bucket_id='avatars' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text and name ~ '\.(jpg|jpeg|png|webp)$');
create policy avatar_read on storage.objects for select to authenticated using(bucket_id='avatars' and private.session_allowed() and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.profiles p where p.avatar_path=storage.objects.name)));
create policy avatar_remove on storage.objects for delete to authenticated using(bucket_id='avatars' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text);
revoke all on function private.award_learning(uuid,text,integer,text),private.record_learning_reward() from public,anon,authenticated;
revoke all on function public.configure_learning_timezone(text),public.start_track(uuid),public.record_material_read(uuid,boolean),public.submit_exercise(uuid,jsonb),public.weekly_leaderboard() from public,anon,authenticated;
grant execute on function public.configure_learning_timezone(text),public.start_track(uuid),public.record_material_read(uuid,boolean),public.submit_exercise(uuid,jsonb),public.weekly_leaderboard() to authenticated;
commit;
