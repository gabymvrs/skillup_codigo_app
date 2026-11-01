begin;
create function private.validate_average_mission(p_input jsonb) returns void language plpgsql set search_path='' as $$
declare a text;b text;
begin
 if p_input is null or jsonb_typeof(p_input)<>'object' or p_input->'order' is distinct from '["read","sum","mean","show"]'::jsonb or p_input->'ran' is distinct from 'true'::jsonb then raise exception 'Organize e teste as quatro instruções.';end if;
 if jsonb_typeof(p_input->'first') is distinct from 'string' or jsonb_typeof(p_input->'second') is distinct from 'string' then raise exception 'Informe duas notas.';end if;
 a:=replace(trim(p_input->>'first'),',','.');b:=replace(trim(p_input->>'second'),',','.');
 if length(a)>10 or length(b)>10 or a !~ '^[0-9]+([.][0-9]+)?$' or b !~ '^[0-9]+([.][0-9]+)?$' then raise exception 'Informe duas notas válidas.';end if;
 if a::numeric not between 0 and 10 or b::numeric not between 0 and 10 then raise exception 'As notas precisam estar entre 0 e 10.';end if;
end$$;
revoke all on function private.validate_average_mission(jsonb) from public,anon,authenticated;
create or replace function public.lesson_action(p_module_id uuid,p_action text,p_payload jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
  if p.dynamic->>'kind'='trace' then perform private.validate_average_mission(p_payload->'interaction');end if;
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


commit;
