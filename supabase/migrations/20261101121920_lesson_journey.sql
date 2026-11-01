begin;
create table public.lesson_plans (
 module_id uuid primary key references public.modules(id) on delete cascade,
 level integer not null check(level between 1 and 100),
 question_ids uuid[] not null check(cardinality(question_ids) between 1 and 20),
 dynamic jsonb not null check(jsonb_typeof(dynamic)='object'),
 resource_ids text[] not null default '{}'
);
create table public.lesson_sessions (
 user_id uuid not null references public.profiles(id) on delete cascade,
 module_id uuid not null references public.lesson_plans(module_id) on delete cascade,
 stage text not null default 'theory' check(stage in ('theory','practice','dynamic','completed')),
 results jsonb not null default '{}',dynamic_response jsonb,
 xp integer not null default 0,
 updated_at timestamptz not null default now(),
 primary key(user_id,module_id)
);
create index lesson_sessions_module on public.lesson_sessions(module_id);
create table public.learning_resources (id text primary key,title text not null,publisher text not null,url text not null check(url like 'https://%'),kind text not null);
create table public.saved_learning_resources (
 user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 resource_id text not null references public.learning_resources(id) on delete cascade,
 primary key(user_id,resource_id)
);
create index saved_learning_resources_resource on public.saved_learning_resources(resource_id);
alter table public.attempts add column lesson_module_id uuid references public.modules(id) on delete set null;
create index attempts_lesson on public.attempts(user_id,lesson_module_id);
do $$declare t text;begin foreach t in array array['lesson_plans','lesson_sessions','learning_resources','saved_learning_resources'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy valid_session on public.%I as restrictive for all to authenticated using(private.session_allowed()) with check(private.session_allowed())',t);
end loop;end$$;
create policy plan_read on public.lesson_plans for select to authenticated using(exists(select 1 from public.modules m where m.id=module_id and private.can_read_track(m.track_id)));
create policy session_read on public.lesson_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy resource_read on public.learning_resources for select to authenticated using(true);
create policy saved_read on public.saved_learning_resources for select to authenticated using(user_id=(select auth.uid()));
create policy saved_insert on public.saved_learning_resources for insert to authenticated with check(user_id=(select auth.uid()));
create policy saved_update on public.saved_learning_resources for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy saved_delete on public.saved_learning_resources for delete to authenticated using(user_id=(select auth.uid()));
grant insert,update,delete on public.saved_learning_resources to authenticated;

-- This context is set only by the server wrappers below. Clients have no insert privilege on attempts.
create function private.defer_lesson_attempt() returns trigger language plpgsql security definer set search_path='' as $$
declare mid uuid;
begin
 mid:=nullif(current_setting('skillup.lesson_module_id',true),'')::uuid;
 if mid is not null then
  if not exists(select 1 from public.lesson_sessions s join public.lesson_plans p on p.module_id=s.module_id where s.user_id=new.user_id and s.module_id=mid and s.stage='practice' and new.question_id=any(p.question_ids)) then raise exception 'Prática não autorizada.';end if;
  new.lesson_module_id:=mid;new.xp:=0;
 end if;return new;
end$$;
create trigger defer_lesson_attempt before insert on public.attempts for each row execute function private.defer_lesson_attempt();

alter function public.complete_module(uuid) set schema private;
alter function private.complete_module(uuid) rename to complete_module_before_journey;
revoke all on function private.complete_module_before_journey(uuid) from public,anon,authenticated;
create function public.complete_module(p_module_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 if exists(select 1 from public.lesson_plans where module_id=p_module_id) and not exists(select 1 from public.lesson_sessions where module_id=p_module_id and user_id=auth.uid() and stage='completed') then raise exception 'Conclua teoria, prática e dinâmica nesta atividade.';end if;
 perform private.complete_module_before_journey(p_module_id);
end$$;

create function private.save_lesson_result(p_module uuid,p_question uuid,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
declare old jsonb;begin
 select results->p_question::text into old from public.lesson_sessions where user_id=auth.uid() and module_id=p_module;
 update public.lesson_sessions set results=jsonb_set(results,array[p_question::text],jsonb_build_object('correct',(p_result->>'correct')::boolean,'firstCorrect',coalesce(old->'firstCorrect',p_result->'correct'),'tries',coalesce((old->>'tries')::integer,0)+1,'explanation',p_result->>'explanation')),updated_at=now() where user_id=auth.uid() and module_id=p_module;
end$$;
create function public.lesson_action(p_module_id uuid,p_action text,p_payload jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.modules;p public.lesson_plans;s public.lesson_sessions;qid uuid;r jsonb;old_xp integer;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into m from public.modules where id=p_module_id;
 select * into p from public.lesson_plans where module_id=p_module_id;
 if m.id is null or p.module_id is null or not private.can_read_track(m.track_id) then raise exception 'Atividade indisponível.';end if;
 if m.prerequisite_id is not null and not exists(select 1 from public.progress where user_id=auth.uid() and module_id=m.prerequisite_id) then raise exception 'Conclua a etapa anterior.';end if;
 insert into public.lesson_sessions(user_id,module_id) values(auth.uid(),m.id) on conflict do nothing;
 select * into s from public.lesson_sessions where user_id=auth.uid() and module_id=m.id;
 if p_action='get' then null;
 elsif p_action='theory' and s.stage='theory' then
  update public.lesson_sessions set stage='practice',updated_at=now() where user_id=auth.uid() and module_id=m.id;
 elsif p_action='answer' and s.stage='practice' then
  if p_payload is null or octet_length(p_payload::text)>16000 then raise exception 'Resposta inválida.';end if;
  qid:=(p_payload->>'question_id')::uuid;
  if qid is null or not(qid=any(p.question_ids)) then raise exception 'Exercício inválido.';end if;
  perform set_config('skillup.lesson_module_id',m.id::text,true);
  r:=public.submit_exercise(qid,p_payload->'response');
  perform set_config('skillup.lesson_module_id','',true);
  perform private.save_lesson_result(m.id,qid,r);
 elsif p_action='practice' and s.stage='practice' then
  if exists(select 1 from unnest(p.question_ids) q where coalesce((s.results->q::text->>'correct')::boolean,false)=false) then raise exception 'Confira e corrija todos os exercícios.';end if;
  update public.lesson_sessions set stage='dynamic',updated_at=now() where user_id=auth.uid() and module_id=m.id;
 elsif p_action='finish' and s.stage='dynamic' then
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_payload->'text') is distinct from 'string' or jsonb_typeof(p_payload->'checks') is distinct from 'array' then raise exception 'Preencha o relato e os critérios.';end if;
  if length(trim(p_payload->>'text')) not between (p.dynamic->>'minLength')::integer and 8000 or jsonb_array_length(p_payload->'checks')<>jsonb_array_length(p.dynamic->'criteria') or exists(select 1 from jsonb_array_elements(p_payload->'checks') v where v<>'true'::jsonb) then raise exception 'Complete o relato e revise todos os critérios.';end if;
  select coalesce(sum(xp),0) into old_xp from public.reward_events where user_id=auth.uid() and source='module:'||m.id;
  update public.lesson_sessions set stage='completed',dynamic_response=p_payload,updated_at=now() where user_id=auth.uid() and module_id=m.id;
  perform public.complete_module(m.id);
  update public.lesson_sessions set xp=case when old_xp=0 and exists(select 1 from public.reward_events where user_id=auth.uid() and source='module:'||m.id) then m.xp else 0 end where user_id=auth.uid() and module_id=m.id;
 elsif p_action='finish' and s.stage='completed' then null;
 else raise exception 'Ação incompatível com a parte atual.';
 end if;
 select * into s from public.lesson_sessions where user_id=auth.uid() and module_id=m.id;
 return jsonb_build_object('plan',to_jsonb(p),'session',to_jsonb(s));
end$$;

-- Only the trusted grader supplies a verdict. Revalidate the signed user's live session.
create function public.record_lesson_code_result(p_user_id uuid,p_session_id uuid,p_aal text,p_module_id uuid,p_question_id uuid,p_source text,p_correct boolean,p_feedback text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p_user_id,'session_id',p_session_id,'aal',p_aal)::text,true);
 perform public.lesson_action(p_module_id,'get',null);
 if not exists(select 1 from public.lesson_sessions s join public.lesson_plans p on p.module_id=s.module_id where s.user_id=p_user_id and s.module_id=p_module_id and s.stage='practice' and p_question_id=any(p.question_ids)) then raise exception 'Prática não autorizada.';end if;
 perform set_config('skillup.lesson_module_id',p_module_id::text,true);
 r:=public.record_code_result(p_user_id,p_session_id,p_aal,p_question_id,p_source,p_correct,p_feedback);
 perform set_config('skillup.lesson_module_id','',true);
 perform private.save_lesson_result(p_module_id,p_question_id,r);
 return public.lesson_action(p_module_id,'get',null);
end$$;
revoke all on function private.defer_lesson_attempt(),private.save_lesson_result(uuid,uuid,jsonb),public.lesson_action(uuid,text,jsonb),public.complete_module(uuid),public.record_lesson_code_result(uuid,uuid,text,uuid,uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.lesson_action(uuid,text,jsonb),public.complete_module(uuid) to authenticated;
grant execute on function public.record_lesson_code_result(uuid,uuid,text,uuid,uuid,text,boolean,text) to service_role;

create or replace function private.record_learning_reward() returns trigger language plpgsql security definer set search_path='' as $$
declare m public.modules;
begin
 if tg_table_name='progress' then
  select * into m from public.modules where id=new.module_id;
  perform private.award_learning(new.user_id,'module:'||m.id,m.xp,'Módulo: '||m.title);
  insert into public.track_enrollments(user_id,track_id) values(new.user_id,m.track_id) on conflict do nothing;
 elsif tg_table_name='attempts' then
  if new.correct and new.lesson_module_id is null then perform private.award_learning(new.user_id,'question:'||new.question_id,(select xp from public.questions where id=new.question_id),'Exercício: '||(select title from public.questions where id=new.question_id));end if;
 elsif tg_table_name='submissions' and new.status='reviewed' and new.grade>=7 then
  -- A teacher's delayed review awards XP, but must not manufacture a study day for an absent student.
  perform pg_advisory_xact_lock(hashtextextended(new.student_id::text,0));
  insert into public.reward_events(user_id,source,xp,label) values(new.student_id,'assignment:'||new.assignment_id,100,'Atividade aprovada pelo docente') on conflict do nothing;
 end if;return new;
end$$;

commit;
