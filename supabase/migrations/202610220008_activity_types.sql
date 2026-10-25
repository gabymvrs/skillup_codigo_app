-- Incremental update after 007. Preserves attempts, rewards and completed modules.
begin;
alter table public.questions add column activity_type text;
update public.questions set activity_type=case kind when 'choice' then 'multiple_choice' when 'blank' then 'fill_blank' when 'challenge' then 'case_study' else kind end;
alter table public.questions alter column activity_type set not null;
alter table public.questions add constraint questions_activity_type_check check (
 (activity_type in ('multiple_choice','image_identification') and kind='choice') or
 (activity_type in ('fill_blank','calculation','code_practice') and kind='blank') or
 (activity_type in ('true_false','matching','ordering') and kind=activity_type) or
 (activity_type='case_study' and kind in ('choice','challenge'))
);
create function private.default_activity_type() returns trigger language plpgsql set search_path='' as $$
begin
 new.activity_type:=coalesce(new.activity_type,case new.kind when 'choice' then 'multiple_choice' when 'blank' then 'fill_blank' when 'challenge' then 'case_study' else new.kind end);
 return new;
end$$;
create trigger default_activity_type before insert on public.questions for each row execute function private.default_activity_type();
-- Keep the already-tested six-format grading path private. New types dispatch explicitly.
alter function public.submit_exercise(uuid,jsonb) set schema private;
alter function private.submit_exercise(uuid,jsonb) rename to submit_exercise_v7;
revoke all on function private.submit_exercise_v7(uuid,jsonb) from public,anon,authenticated;
create function public.submit_exercise(p_question_id uuid,p_response jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.questions;expected jsonb;answer numeric;correct boolean;award integer;raw text;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 select * into q from public.questions where id=p_question_id;
 if q.id is null then raise exception 'Atividade indisponível.';end if;
 if q.activity_type='code_practice' then raise exception 'Esta atividade precisa de validação de código no servidor.';end if;
 if q.activity_type<>'calculation' then return private.submit_exercise_v7(p_question_id,p_response);end if;
 if p_response is null or jsonb_typeof(p_response)<>'string' or octet_length(p_response::text)>100 then raise exception 'Digite um resultado numérico.';end if;
 raw:=replace(trim(p_response#>>'{}'),',','.');
 if raw !~ '^[+-]?([0-9]+([.][0-9]+)?|[.][0-9]+)$' then raise exception 'Digite um resultado numérico.';end if;
 answer:=raw::numeric;
 select a.expected into expected from private.question_answers a where a.question_id=q.id;
 if expected->>'value' is null then raise exception 'Critério de correção indisponível.';end if;
 correct:=abs(answer-(expected->>'value')::numeric)<=coalesce((expected->>'tolerance')::numeric,0);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 award:=case when correct and not exists(select 1 from public.reward_events where user_id=auth.uid() and source='question:'||q.id) then q.xp else 0 end;
 insert into public.attempts(user_id,question_id,selected_index,response,correct,xp) values(auth.uid(),q.id,-1,p_response,correct,award);
 return jsonb_build_object('correct',correct,'xp',award,'explanation',q.explanation);
end$$;
create table private.code_validation_requests(user_id uuid primary key references auth.users(id) on delete cascade,requested_at timestamptz not null default now());
revoke all on private.code_validation_requests from public,anon,authenticated;
-- The user-scoped call validates current RLS/session requirements and rate-limits grading requests.
create function public.code_activity_context(p_question_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.questions;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 select * into q from public.questions where id=p_question_id and activity_type='code_practice';
 if q.id is null then raise exception 'Atividade de código indisponível.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from private.code_validation_requests where user_id=auth.uid() and requested_at>now()-interval '5 seconds') then raise exception 'Aguarde alguns segundos antes de validar novamente.';end if;
 insert into private.code_validation_requests(user_id) values(auth.uid()) on conflict(user_id) do update set requested_at=now();
 return jsonb_build_object('id',q.id,'language',q.payload->>'language');
end$$;
-- Only a trusted backend may record a code verdict. Never grant this function to clients.
create function public.record_code_result(p_user_id uuid,p_session_id uuid,p_aal text,p_question_id uuid,p_source text,p_correct boolean,p_feedback text) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.questions;award integer;
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',p_user_id,'session_id',p_session_id,'aal',p_aal)::text,true);
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Sessão não autorizada.';end if;
 if p_source is null or length(p_source) not between 1 and 10000 or p_correct is null then raise exception 'Resposta inválida.';end if;
 select * into q from public.questions where id=p_question_id and activity_type='code_practice';
 if q.id is null then raise exception 'Atividade indisponível.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 award:=case when p_correct and not exists(select 1 from public.reward_events where user_id=p_user_id and source='question:'||q.id) then q.xp else 0 end;
 insert into public.attempts(user_id,question_id,selected_index,response,correct,xp) values(p_user_id,q.id,-1,to_jsonb(p_source),p_correct,award);
 return jsonb_build_object('correct',p_correct,'xp',award,'explanation',case when p_correct then q.explanation else left(coalesce(p_feedback,'Revise o código e tente novamente.'),2000) end);
end$$;
revoke all on function private.default_activity_type(),public.submit_exercise(uuid,jsonb),public.code_activity_context(uuid),public.record_code_result(uuid,uuid,text,uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.submit_exercise(uuid,jsonb),public.code_activity_context(uuid) to authenticated;
grant execute on function public.record_code_result(uuid,uuid,text,uuid,text,boolean,text) to service_role;
create function public.code_grading_spec(p_question_id uuid) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('language',q.payload->>'language','expected',a.expected) from public.questions q join private.question_answers a on a.question_id=q.id where q.id=p_question_id and q.activity_type='code_practice'
$$;
revoke all on function public.code_grading_spec(uuid) from public,anon,authenticated;
grant execute on function public.code_grading_spec(uuid) to service_role;
commit;
