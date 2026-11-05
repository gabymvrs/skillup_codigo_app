begin;
create table private.practice_catalog(id text primary key,question_ids uuid[] not null);
revoke all on private.practice_catalog from public,anon,authenticated;
create table public.practice_completions(user_id uuid not null references public.profiles(id) on delete cascade,set_id text not null,completed_at timestamptz not null default now(),primary key(user_id,set_id));
alter table public.practice_completions enable row level security;
revoke all on public.practice_completions from public,anon,authenticated;
grant select on public.practice_completions to authenticated;
create policy own_completions on public.practice_completions for select to authenticated using(user_id=(select auth.uid()) and private.session_allowed());
create function public.complete_practice_set(p_set_id text,p_question_ids uuid[]) returns void language plpgsql security definer set search_path='' as $$
declare expected uuid[];
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select question_ids into expected from private.practice_catalog where id=p_set_id;
 if expected is null and p_set_id ~ '^[0-9a-f-]{36}$' then select array_agg(id order by id) into expected from public.questions where subject_id=p_set_id::uuid and category='Prática guiada';end if;
 if expected is null or cardinality(expected)<5 or p_question_ids is null or cardinality(expected)<>cardinality(p_question_ids) or not(expected @> p_question_ids and p_question_ids @> expected) then raise exception 'Bloco inválido ou incompleto.';end if;
 if exists(select 1 from unnest(expected) q where not exists(select 1 from public.attempts a where a.user_id=auth.uid() and a.question_id=q)) then raise exception 'Responda todas as questões antes de concluir o bloco.';end if;
 insert into public.practice_completions(user_id,set_id) values(auth.uid(),p_set_id) on conflict do nothing;
end$$;
revoke all on function public.complete_practice_set(text,uuid[]) from public,anon,authenticated;
grant execute on function public.complete_practice_set(text,uuid[]) to authenticated;
insert into private.practice_catalog values('logica',array['00000000-0000-4000-8000-000000000400','00000000-0000-4000-8000-000000010000','00000000-0000-4000-8000-000000010001','00000000-0000-4000-8000-000000010002','00000000-0000-4000-8000-000000010003']::uuid[]);
insert into private.practice_catalog values('laboratorio',array['00000000-0000-4000-8000-000000000402','00000000-0000-4000-8000-000000010004','00000000-0000-4000-8000-000000010005','00000000-0000-4000-8000-000000010006','00000000-0000-4000-8000-000000010007']::uuid[]);
insert into private.practice_catalog values('equipe',array['00000000-0000-4000-8000-000000000403','00000000-0000-4000-8000-000000010008','00000000-0000-4000-8000-000000010009','00000000-0000-4000-8000-000000010010','00000000-0000-4000-8000-000000010011']::uuid[]);
insert into private.practice_catalog values('exame-algoritmos',array['00000000-0000-4000-8000-000000010012','00000000-0000-4000-8000-000000010013','00000000-0000-4000-8000-000000010014','00000000-0000-4000-8000-000000010015','00000000-0000-4000-8000-000000010016','00000000-0000-4000-8000-000000010017','00000000-0000-4000-8000-000000010018','00000000-0000-4000-8000-000000010019','00000000-0000-4000-8000-000000010020','00000000-0000-4000-8000-000000010021']::uuid[]);
insert into private.practice_catalog values('exame-logistica',array['00000000-0000-4000-8000-000000010022','00000000-0000-4000-8000-000000010023','00000000-0000-4000-8000-000000010024','00000000-0000-4000-8000-000000010025','00000000-0000-4000-8000-000000010026','00000000-0000-4000-8000-000000010027','00000000-0000-4000-8000-000000010028','00000000-0000-4000-8000-000000010029','00000000-0000-4000-8000-000000010030','00000000-0000-4000-8000-000000010031']::uuid[]);
commit;
