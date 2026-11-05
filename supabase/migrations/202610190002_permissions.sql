begin;
-- Enable RLS and a restrictive MFA policy on every exposed table.
do $$declare t text;begin foreach t in array array['organizations','profiles','user_roles','role_requests','subjects','materials','tracks','modules','progress','questions','attempts','classes','enrollments','assignments','submissions','posts','comments','reactions','projects','project_members','jobs','applications','saved_jobs','study_events','certificates','support_tickets','messages','notifications'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy verified_session on public.%I as restrictive for all to authenticated using ((select private.session_allowed())) with check ((select private.session_allowed()))',t);
end loop;end$$;

create policy organizations_read on public.organizations for select to authenticated using(id=private.current_org());
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public_profile or private.supervises(id) or private.can_see_candidate(id) or private.can_message(id));
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
grant update(full_name,headline,bio,skills,website,public_profile,preferences) on public.profiles to authenticated;
create policy roles_read on public.user_roles for select to authenticated using(user_id=auth.uid() or (private.current_role()='instituicao' and organization_id=private.current_org()));
-- No INSERT/UPDATE/DELETE grants or policies on roles, organizations, XP or certificates.
create policy requests_read on public.role_requests for select to authenticated using(user_id=auth.uid());
create policy requests_create on public.role_requests for insert to authenticated with check(user_id=auth.uid() and status='pending' and cardinality(document_paths)=0);
create policy requests_update on public.role_requests for update to authenticated using(user_id=auth.uid() and status='pending') with check(user_id=auth.uid() and status='pending' and not exists(select 1 from unnest(document_paths) p where p not like auth.uid()::text||'/%'));
grant insert on public.role_requests to authenticated;
grant update(organization_name,registration_number,cnae,document_paths) on public.role_requests to authenticated;
create policy subjects_read on public.subjects for select to authenticated using(true);
create policy materials_read on public.materials for select to authenticated using(owner_id=auth.uid() or (published and (organization_id is null or organization_id=private.current_org())));
create policy materials_create on public.materials for insert to authenticated with check(owner_id=auth.uid() and private.has_role(array['docente','instituicao']::public.app_role[]) and (organization_id is null or organization_id=private.current_org()) and (file_path is null or file_path like auth.uid()::text||'/%'));
create policy materials_update on public.materials for update to authenticated using(owner_id=auth.uid() and private.has_role(array['docente','instituicao']::public.app_role[])) with check(owner_id=auth.uid() and (file_path is null or file_path like auth.uid()::text||'/%'));
grant insert on public.materials to authenticated;grant update(title,summary,body,kind,file_path,allow_offline,published) on public.materials to authenticated;
create policy tracks_read on public.tracks for select to authenticated using(private.can_read_track(id));
create policy tracks_create on public.tracks for insert to authenticated with check(owner_id=auth.uid() and private.has_role(array['docente','instituicao']::public.app_role[]) and (organization_id is null or organization_id=private.current_org()));
create policy tracks_update on public.tracks for update to authenticated using(private.owns_track(id)) with check(owner_id=auth.uid());
grant insert on public.tracks to authenticated;grant update(title,description,category,skills,duration_hours,published) on public.tracks to authenticated;
create policy modules_read on public.modules for select to authenticated using(private.can_read_track(track_id));
create policy modules_create on public.modules for insert to authenticated with check(private.owns_track(track_id));
create policy modules_update on public.modules for update to authenticated using(private.owns_track(track_id)) with check(private.owns_track(track_id));
grant insert on public.modules to authenticated;grant update(title,body) on public.modules to authenticated;
create policy progress_read on public.progress for select to authenticated using(user_id=auth.uid() or private.supervises(user_id));
create policy questions_read on public.questions for select to authenticated using(true);
create policy attempts_read on public.attempts for select to authenticated using(user_id=auth.uid() or private.supervises(user_id));
create policy classes_read on public.classes for select to authenticated using(private.member_class(id));
create policy classes_create on public.classes for insert to authenticated with check(private.current_role()='instituicao' and organization_id=private.current_org());
create policy classes_update on public.classes for update to authenticated using(private.current_role()='instituicao' and organization_id=private.current_org()) with check(organization_id=private.current_org());
grant insert on public.classes to authenticated;grant update(title,subject,teacher_id) on public.classes to authenticated;
create policy enrollments_read on public.enrollments for select to authenticated using(user_id=auth.uid() or private.manages_class(class_id));
create policy enrollments_create on public.enrollments for insert to authenticated with check(private.current_role()='instituicao' and private.manages_class(class_id));
create policy enrollments_remove on public.enrollments for delete to authenticated using(private.current_role()='instituicao' and private.manages_class(class_id));
grant insert,delete on public.enrollments to authenticated;
create policy assignments_read on public.assignments for select to authenticated using(private.can_read_assignment(id));
create policy assignments_create on public.assignments for insert to authenticated with check(private.manages_class(class_id));
create policy assignments_update on public.assignments for update to authenticated using(private.manages_class(class_id)) with check(private.manages_class(class_id));
grant insert on public.assignments to authenticated;grant update(title,instructions,due_at) on public.assignments to authenticated;
create policy submissions_read on public.submissions for select to authenticated using(student_id=auth.uid() or private.can_grade(assignment_id));
create policy submissions_create on public.submissions for insert to authenticated with check(student_id=auth.uid() and private.current_role()='estudante' and grade is null and feedback is null and status='submitted' and exists(select 1 from public.assignments a join public.enrollments e on e.class_id=a.class_id where a.id=assignment_id and e.user_id=auth.uid()));
create policy submissions_update on public.submissions for update to authenticated using(student_id=auth.uid() and status='submitted') with check(student_id=auth.uid() and status='submitted' and grade is null and feedback is null);
grant insert on public.submissions to authenticated;grant update(body) on public.submissions to authenticated;

create policy posts_read on public.posts for select to authenticated using(true);
create policy posts_create on public.posts for insert to authenticated with check(user_id=auth.uid() and (kind<>'announcement' or private.has_role(array['docente','instituicao']::public.app_role[])));
create policy posts_update on public.posts for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy posts_remove on public.posts for delete to authenticated using(user_id=auth.uid());
grant insert,delete on public.posts to authenticated;grant update(title,body,category,image) on public.posts to authenticated;
create policy comments_read on public.comments for select to authenticated using(true);
create policy comments_create on public.comments for insert to authenticated with check(user_id=auth.uid());
create policy comments_remove on public.comments for delete to authenticated using(user_id=auth.uid());
grant insert,delete on public.comments to authenticated;
create policy reactions_read on public.reactions for select to authenticated using(true);
create policy reactions_create on public.reactions for insert to authenticated with check(user_id=auth.uid());
create policy reactions_remove on public.reactions for delete to authenticated using(user_id=auth.uid());
grant insert,delete on public.reactions to authenticated;
create policy projects_read on public.projects for select to authenticated using(status<>'archived' or owner_id=auth.uid());
create policy projects_create on public.projects for insert to authenticated with check(owner_id=auth.uid() and status='open');
create policy projects_update on public.projects for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
grant insert on public.projects to authenticated;grant update(title,description,category,skills,status,image) on public.projects to authenticated;
create policy project_members_read on public.project_members for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id));
create policy project_members_create on public.project_members for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.projects p where p.id=project_id and p.status='open'));
create policy project_members_remove on public.project_members for delete to authenticated using(user_id=auth.uid());
grant insert,delete on public.project_members to authenticated;

create policy jobs_read on public.jobs for select to authenticated using(status='open' or private.owns_job(id) or private.applied_to_job(id));
create policy jobs_create on public.jobs for insert to authenticated with check(owner_id=auth.uid() and private.current_role()='recrutador');
create policy jobs_update on public.jobs for update to authenticated using(private.owns_job(id)) with check(owner_id=auth.uid() and private.current_role()='recrutador');
grant insert on public.jobs to authenticated;grant update(title,company,location,mode,description,skills,status,application_url) on public.jobs to authenticated;
create policy applications_read on public.applications for select to authenticated using(student_id=auth.uid() or private.owns_job(job_id));
create policy applications_create on public.applications for insert to authenticated with check(student_id=auth.uid() and private.current_role()='estudante' and status='submitted' and exists(select 1 from public.jobs j where j.id=job_id and j.status='open' and j.application_url is null));
grant insert on public.applications to authenticated;
create policy saved_jobs_read on public.saved_jobs for select to authenticated using(user_id=auth.uid());
create policy saved_jobs_create on public.saved_jobs for insert to authenticated with check(user_id=auth.uid() and private.current_role()='estudante');
create policy saved_jobs_remove on public.saved_jobs for delete to authenticated using(user_id=auth.uid());
grant insert,delete on public.saved_jobs to authenticated;
create policy events_read on public.study_events for select to authenticated using(user_id=auth.uid() or (class_id is not null and private.member_class(class_id)));
create policy events_create on public.study_events for insert to authenticated with check(user_id=auth.uid() and (class_id is null or private.manages_class(class_id)));
create policy events_update on public.study_events for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and (class_id is null or private.manages_class(class_id)));
create policy events_remove on public.study_events for delete to authenticated using(user_id=auth.uid());
grant insert,delete on public.study_events to authenticated;grant update(title,description,starts_at,duration_minutes) on public.study_events to authenticated;
create policy certificates_read on public.certificates for select to authenticated using(user_id=auth.uid() or private.supervises(user_id));
create policy tickets_read on public.support_tickets for select to authenticated using(user_id=auth.uid());
create policy tickets_create on public.support_tickets for insert to authenticated with check(user_id=auth.uid() and status='open');
grant insert on public.support_tickets to authenticated;
create policy messages_read on public.messages for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
create policy messages_create on public.messages for insert to authenticated with check(sender_id=auth.uid() and private.can_message(recipient_id));
grant insert on public.messages to authenticated;
create policy notifications_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy notifications_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant update(read_at) on public.notifications to authenticated;

create function public.complete_module(p_module_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.modules;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into m from public.modules where id=p_module_id;
 if m.id is null or not private.can_read_track(m.track_id) then raise exception 'Módulo não disponível.';end if;
 if m.prerequisite_id is not null and not exists(select 1 from public.progress where user_id=auth.uid() and module_id=m.prerequisite_id) then raise exception 'Conclua a etapa anterior.';end if;
 insert into public.progress(user_id,module_id) values(auth.uid(),m.id) on conflict(user_id,module_id) do nothing;
end$$;
create function public.submit_answer(p_question_id uuid,p_selected_index integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.questions;correct_index integer;is_correct boolean;award integer;
begin
 if not private.session_allowed() or private.current_role()<>'estudante' then raise exception 'Acesso não autorizado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into q from public.questions where id=p_question_id;
 if q.id is null or p_selected_index is null or p_selected_index<0 or p_selected_index>=jsonb_array_length(q.options) then raise exception 'Resposta inválida.';end if;
 select a.correct_index into correct_index from private.question_answers a where question_id=q.id;
 if correct_index is null then raise exception 'Este exercício ainda não tem gabarito publicado.';end if;
 is_correct:=correct_index=p_selected_index;
 award:=case when is_correct and not exists(select 1 from public.attempts where user_id=auth.uid() and question_id=q.id and correct) then q.xp else 0 end;
 insert into public.attempts(user_id,question_id,selected_index,correct,xp) values(auth.uid(),q.id,p_selected_index,is_correct,award);
 return jsonb_build_object('correct',is_correct,'xp',award,'explanation',q.explanation);
end$$;
create function public.grade_submission(p_submission_id uuid,p_grade numeric,p_feedback text) returns void language plpgsql security definer set search_path='' as $$
declare s public.submissions;
begin
 if not private.session_allowed() then raise exception 'Acesso não autorizado.';end if;
 select * into s from public.submissions where id=p_submission_id for update;
 if s.id is null or not private.can_grade(s.assignment_id) then raise exception 'Sem permissão para avaliar esta atividade.';end if;
 if p_grade is null or p_grade<0 or p_grade>10 or p_feedback is null or length(trim(p_feedback))<10 or length(p_feedback)>4000 then raise exception 'Nota ou feedback inválido.';end if;
 update public.submissions set grade=p_grade,feedback=p_feedback,status='reviewed' where id=s.id;
 insert into public.notifications(user_id,title,body) values(s.student_id,'Sua atividade recebeu feedback','Confira a nota e os comentários em Aprenda → Prática → Atividades da turma.');
end$$;
create function public.set_application_status(p_application_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare a public.applications;
begin
 if not private.session_allowed() then raise exception 'Acesso não autorizado.';end if;
 select * into a from public.applications where id=p_application_id for update;
 if a.id is null then raise exception 'Candidatura não encontrada.';end if;
 if a.student_id=auth.uid() then
  if p_status<>'withdrawn' or a.status in ('withdrawn','accepted','rejected') then raise exception 'A candidatura não pode ser retirada neste estado.';end if;
 elsif private.owns_job(a.job_id) then
  if a.status='withdrawn' or p_status not in ('submitted','reviewing','interview','accepted','rejected') then raise exception 'Transição de status não permitida.';end if;
 else raise exception 'Sem permissão para esta candidatura.';end if;
 update public.applications set status=p_status where id=a.id;
 insert into public.notifications(user_id,title,body) values(a.student_id,'Candidatura atualizada','Confira o andamento em Emprego → Minhas candidaturas.');
end$$;
create function public.issue_certificate(p_student_id uuid,p_track_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not private.session_allowed() or not private.has_role(array['docente','instituicao']::public.app_role[]) or not private.supervises(p_student_id) or not private.can_read_track(p_track_id) then raise exception 'Sem permissão para emitir este comprovante.';end if;
 if not exists(select 1 from public.modules where track_id=p_track_id) or exists(select 1 from public.modules m where m.track_id=p_track_id and not exists(select 1 from public.progress p where p.module_id=m.id and p.user_id=p_student_id)) then raise exception 'O estudante ainda não concluiu todos os módulos.';end if;
 insert into public.certificates(user_id,track_id,issued_by) values(p_student_id,p_track_id,auth.uid()) returning id into result;return result;
end$$;
create function public.verify_certificate(p_code uuid) returns table(full_name text,title text,issued_at timestamptz) language sql stable security definer set search_path='' as $$select p.full_name,t.title,c.issued_at from public.certificates c join public.profiles p on p.id=c.user_id join public.tracks t on t.id=c.track_id where c.verification_code=p_code limit 1$$;
create function public.community_leaderboard() returns table(full_name text,xp bigint) language sql stable security definer set search_path='' as $$
 select p.full_name,coalesce((select sum(m.xp) from public.progress g join public.modules m on m.id=g.module_id where g.user_id=p.id),0)+coalesce((select sum(a.xp) from public.attempts a where a.user_id=p.id),0) as xp
 from public.profiles p where p.public_profile and private.session_allowed()
 order by xp desc,p.full_name limit 10
$$;
create function private.notify_application() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(user_id,title,body) select owner_id,'Nova candidatura', 'Uma candidatura foi registrada para '||title||'. Consulte a área de candidatos.' from public.jobs where id=new.job_id;
 return new;
end$$;
create trigger application_notification after insert on public.applications for each row execute function private.notify_application();

create function private.stamp_created_at() returns trigger language plpgsql set search_path='' as $$begin new.created_at:=now();return new;end$$;
do $$declare t text;begin foreach t in array array['role_requests','applications','submissions','messages','support_tickets','jobs','enrollments'] loop
 execute format('create trigger server_created_at before insert on public.%I for each row execute function private.stamp_created_at()',t);
end loop;end$$;

-- PUBLIC gets execution on new functions by default: revoke explicitly.
revoke all on all functions in schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_role(),private.current_org(),private.has_role(public.app_role[]),private.session_allowed(),private.manages_class(uuid),private.member_class(uuid),private.supervises(uuid),private.owns_job(uuid),private.can_see_candidate(uuid),private.can_message(uuid),private.can_read_track(uuid),private.owns_track(uuid),private.can_read_assignment(uuid),private.can_grade(uuid) to authenticated;
grant execute on function private.applied_to_job(uuid) to authenticated;
revoke all on function public.complete_module(uuid),public.submit_answer(uuid,integer),public.grade_submission(uuid,numeric,text),public.set_application_status(uuid,text),public.issue_certificate(uuid,uuid),public.community_leaderboard(),public.verify_certificate(uuid) from public,anon,authenticated;
grant execute on function public.complete_module(uuid),public.submit_answer(uuid,integer),public.grade_submission(uuid,numeric,text),public.set_application_status(uuid,text),public.issue_certificate(uuid,uuid),public.community_leaderboard() to authenticated;
grant execute on function public.verify_certificate(uuid) to anon,authenticated;
revoke all on private.question_answers from public,anon,authenticated;
commit;
