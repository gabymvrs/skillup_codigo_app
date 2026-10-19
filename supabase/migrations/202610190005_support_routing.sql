begin;
alter table public.support_tickets add column assigned_to uuid references public.profiles(id), add column response text check(length(response) between 10 and 4000);
create index tickets_assignee on public.support_tickets(assigned_to,status,created_at desc);
drop policy tickets_read on public.support_tickets;
create policy tickets_read on public.support_tickets for select to authenticated using(user_id=auth.uid() or (assigned_to=auth.uid() and private.supervises(user_id)));
drop policy tickets_create on public.support_tickets;
create policy tickets_create on public.support_tickets for insert to authenticated with check(user_id=auth.uid() and status='open' and assigned_to is null and response is null);
-- Sharing is an explicit action, never an automatic consequence of talking to the bot.
create function public.route_support_ticket(p_ticket_id uuid,p_teacher_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare t public.support_tickets;
begin
 if not private.session_allowed() then raise exception 'Acesso não autorizado.';end if;
 select * into t from public.support_tickets where id=p_ticket_id for update;
 if t.id is null or t.user_id<>auth.uid() or t.assigned_to is not null then raise exception 'Resumo indisponível para compartilhamento.';end if;
 if not exists(select 1 from public.enrollments e join public.classes c on c.id=e.class_id where e.user_id=auth.uid() and c.teacher_id=p_teacher_id) then raise exception 'Selecione um docente vinculado à sua turma.';end if;
 update public.support_tickets set assigned_to=p_teacher_id where id=t.id;
 insert into public.notifications(user_id,title,body) values(p_teacher_id,'Dúvida compartilhada','Um estudante compartilhou um resumo. Consulte Aprenda → Suporte.');
end$$;
create function public.answer_support_ticket(p_ticket_id uuid,p_response text) returns void language plpgsql security definer set search_path='' as $$
declare t public.support_tickets;
begin
 if not private.session_allowed() then raise exception 'Acesso não autorizado.';end if;
 select * into t from public.support_tickets where id=p_ticket_id for update;
 if t.id is null or t.assigned_to is distinct from auth.uid() or not private.supervises(t.user_id) then raise exception 'Sem permissão para responder esta dúvida.';end if;
 if p_response is null or length(trim(p_response))<10 or length(p_response)>4000 then raise exception 'Escreva uma orientação entre 10 e 4000 caracteres.';end if;
 update public.support_tickets set response=trim(p_response),status='answered' where id=t.id;
 insert into public.notifications(user_id,title,body) values(t.user_id,'Sua dúvida recebeu uma resposta','Consulte o histórico em Aprenda → Suporte.');
end$$;
revoke all on function public.route_support_ticket(uuid,uuid),public.answer_support_ticket(uuid,text) from public,anon,authenticated;
grant execute on function public.route_support_ticket(uuid,uuid),public.answer_support_ticket(uuid,text) to authenticated;
commit;
