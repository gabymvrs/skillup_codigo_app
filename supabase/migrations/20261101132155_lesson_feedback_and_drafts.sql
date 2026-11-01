begin;
alter table public.lesson_sessions add column draft jsonb not null default '{}';
create or replace function private.save_lesson_result(p_module uuid,p_question uuid,p_result jsonb) returns void language plpgsql security definer set search_path='' as $$
declare old jsonb;answer jsonb;expected jsonb;q public.questions;
begin
 select * into q from public.questions where id=p_question;
 select results->p_question::text into old from public.lesson_sessions where user_id=auth.uid() and module_id=p_module;
 select coalesce(response,to_jsonb(selected_index)) into answer from public.attempts where user_id=auth.uid() and lesson_module_id=p_module and question_id=p_question order by created_at desc,id desc limit 1;
 if q.activity_type<>'code_practice' and q.kind<>'challenge' then
  select coalesce(a.expected,to_jsonb(a.correct_index)) into expected from private.question_answers a where a.question_id=p_question;
 end if;
 update public.lesson_sessions set results=jsonb_set(results,array[p_question::text],jsonb_build_object('correct',(p_result->>'correct')::boolean,'firstCorrect',coalesce(old->'firstCorrect',p_result->'correct'),'tries',coalesce((old->>'tries')::integer,0)+1,'explanation',p_result->>'explanation','response',answer,'firstResponse',case when old is null then answer else old->'firstResponse' end,'expected',expected,'objective',q.kind<>'challenge')),updated_at=now() where user_id=auth.uid() and module_id=p_module;
end$$;
create function public.save_lesson_draft(p_module_id uuid,p_draft jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 if p_draft is null or jsonb_typeof(p_draft)<>'object' or octet_length(p_draft::text)>100000 then raise exception 'Rascunho inválido ou muito grande.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if not exists(select 1 from public.lesson_sessions s join public.modules m on m.id=s.module_id where s.user_id=auth.uid() and s.module_id=p_module_id and private.can_read_track(m.track_id)) then raise exception 'Atividade indisponível.';end if;
 update public.lesson_sessions set draft=p_draft where user_id=auth.uid() and module_id=p_module_id;
end$$;
revoke all on function public.save_lesson_draft(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_lesson_draft(uuid,jsonb) to authenticated;
commit;
