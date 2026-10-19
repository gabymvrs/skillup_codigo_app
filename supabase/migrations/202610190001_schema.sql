-- Apply to a new Supabase project. No service key belongs in the browser.
begin;
create schema if not exists private;
revoke all on schema private from public;
create type public.app_role as enum ('estudante','docente','recrutador','instituicao');
create table public.organizations (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 160), website text not null default '');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check(length(trim(full_name)) between 2 and 80), headline text not null default '' check(length(headline)<=160),
  bio text not null default '' check(length(bio)<=3000), skills text[] not null default '{}' check(cardinality(skills)<=30),
  website text not null default '' check(website='' or website ~ '^https://'), public_profile boolean not null default false,
  preferences jsonb not null default '{"study_minutes":15}'::jsonb check(jsonb_typeof(preferences)='object' and octet_length(preferences::text)<4096)
);
create table public.user_roles (user_id uuid primary key references public.profiles(id) on delete cascade, role public.app_role not null default 'estudante', organization_id uuid references public.organizations(id));
create table public.role_requests (
  id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role public.app_role not null,organization_name text not null default '' check(length(organization_name)<=160),
  registration_number text not null default '' check(length(registration_number)<=32),cnae text not null default '' check(length(cnae)<=30),
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  document_paths text[] not null default '{}' check(cardinality(document_paths)<=8),created_at timestamptz not null default now()
);
create unique index one_pending_role_request on public.role_requests(user_id) where status='pending';
create table public.subjects(id uuid primary key default gen_random_uuid(),name text not null unique,color text not null check(color ~ '^#[0-9A-Fa-f]{6}$'),icon text not null);
create table public.materials (
  id uuid primary key default gen_random_uuid(),subject_id uuid not null references public.subjects(id),title text not null check(length(trim(title)) between 2 and 120),
  summary text not null check(length(summary)<=240),body text not null check(length(body) between 1 and 30000),kind text not null check(kind in ('artigo','arquivo','video','slides')),
  file_path text,allow_offline boolean not null default false,published boolean not null default false,owner_id uuid references public.profiles(id),organization_id uuid references public.organizations(id)
);
create table public.tracks (
  id uuid primary key default gen_random_uuid(),title text not null check(length(trim(title)) between 2 and 120),description text not null check(length(description)<=2000),
  category text not null check(length(category)<=50),skills text[] not null default '{}',duration_hours integer not null check(duration_hours between 1 and 2000),
  owner_id uuid references public.profiles(id),organization_id uuid references public.organizations(id),published boolean not null default false
);
create table public.modules (
  id uuid primary key default gen_random_uuid(),track_id uuid not null references public.tracks(id) on delete cascade,title text not null check(length(title) between 2 and 120),
  body text not null check(length(body) between 1 and 30000),position integer not null check(position>=0),prerequisite_id uuid references public.modules(id),xp integer not null check(xp between 0 and 1000),
  unique(track_id,position),check(prerequisite_id is distinct from id)
);
create table public.progress(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,module_id uuid not null references public.modules(id) on delete cascade,completed_at timestamptz not null default now(),unique(user_id,module_id));
create table public.questions(id uuid primary key default gen_random_uuid(),title text not null,prompt text not null,options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 8),explanation text not null,category text not null,xp integer not null check(xp between 0 and 1000));
create table private.question_answers(question_id uuid primary key references public.questions(id) on delete cascade,correct_index integer not null check(correct_index between 0 and 7));
create table public.attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,question_id uuid not null references public.questions(id),selected_index integer not null,correct boolean not null,xp integer not null check(xp>=0),created_at timestamptz not null default now());
create unique index one_xp_award on public.attempts(user_id,question_id) where xp>0;
create table public.classes(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),teacher_id uuid not null references public.profiles(id),title text not null check(length(title) between 2 and 160),subject text not null check(length(subject) between 1 and 80));
create table public.enrollments(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,created_at timestamptz not null default now(),unique(class_id,user_id));
create table public.assignments(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id),teacher_id uuid not null references public.profiles(id),title text not null check(length(title) between 2 and 160),instructions text not null check(length(instructions) between 20 and 5000),due_at timestamptz not null);
create table public.submissions(id uuid primary key default gen_random_uuid(),assignment_id uuid not null references public.assignments(id),student_id uuid not null references public.profiles(id),body text not null check(length(trim(body)) between 20 and 20000),grade numeric(3,1) check(grade between 0 and 10),feedback text check(length(feedback)<=4000),status text not null default 'submitted' check(status in ('submitted','reviewed')),created_at timestamptz not null default now(),unique(assignment_id,student_id));
create table public.posts(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),author_name text not null default '',kind text not null check(kind in ('feed','forum','story','announcement')),category text not null check(length(category)<=80),title text not null check(length(trim(title)) between 2 and 160),body text not null check(length(trim(body)) between 5 and 5000),image text check(image is null or image ~ '^/assets/[a-zA-Z0-9_-]+\.(png|jpg|webp)$'),created_at timestamptz not null default now());
create table public.comments(id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,user_id uuid not null references public.profiles(id),author_name text not null default '',body text not null check(length(trim(body)) between 1 and 3000),created_at timestamptz not null default now());
create table public.reactions(id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts(id) on delete cascade,user_id uuid not null references public.profiles(id),unique(post_id,user_id));
create table public.projects(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id),title text not null check(length(trim(title)) between 2 and 160),description text not null check(length(description) between 20 and 5000),category text not null check(category in ('Design','Web','Mobile','IA')),skills text[] not null default '{}',status text not null default 'open' check(status in ('open','review','completed','archived')),image text check(image is null or image ~ '^/assets/[a-zA-Z0-9_-]+\.(png|jpg|webp)$'));
create table public.project_members(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.projects(id) on delete cascade,user_id uuid not null references public.profiles(id),unique(project_id,user_id));
create table public.jobs(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id),title text not null check(length(trim(title)) between 2 and 120),company text not null check(length(company) between 2 and 120),location text not null check(length(location) between 1 and 120),mode text not null check(mode in ('Remoto','Híbrido','Presencial')),description text not null check(length(description) between 30 and 10000),skills text[] not null default '{}',status text not null default 'open' check(status in ('open','paused','closed')),application_url text check(application_url is null or application_url ~ '^https://'),created_at timestamptz not null default now());
create table public.applications(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs(id),student_id uuid not null references public.profiles(id),cover_letter text not null check(length(trim(cover_letter)) between 20 and 4000),status text not null default 'submitted' check(status in ('submitted','reviewing','interview','accepted','rejected','withdrawn')),created_at timestamptz not null default now(),unique(job_id,student_id));
create table public.saved_jobs(id uuid primary key default gen_random_uuid(),job_id uuid not null references public.jobs(id) on delete cascade,user_id uuid not null references public.profiles(id),unique(job_id,user_id));
create table public.study_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),class_id uuid references public.classes(id),title text not null check(length(trim(title)) between 2 and 120),description text not null default '' check(length(description)<=2000),starts_at timestamptz not null,duration_minutes integer not null check(duration_minutes between 5 and 480));
create table public.certificates(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),track_id uuid not null references public.tracks(id),issued_by uuid not null references public.profiles(id),issued_at timestamptz not null default now(),verification_code uuid not null unique default gen_random_uuid(),unique(user_id,track_id));
create table public.support_tickets(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),topic text not null check(length(topic)<=80),urgency text not null check(urgency in ('Alta','Média','Baixa')),summary text not null check(length(summary) between 10 and 12000),status text not null default 'open' check(status in ('open','answered','closed')),created_at timestamptz not null default now());
create table public.messages(id uuid primary key default gen_random_uuid(),sender_id uuid not null references public.profiles(id),recipient_id uuid not null references public.profiles(id),body text not null check(length(trim(body)) between 1 and 4000),created_at timestamptz not null default now(),check(sender_id<>recipient_id));
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),title text not null,body text not null,read_at timestamptz,created_at timestamptz not null default now());

-- Indexes on foreign-key/filter paths, including policy lookups.
create index user_roles_org on public.user_roles(organization_id,role);
create index materials_subject on public.materials(subject_id);create index materials_owner on public.materials(owner_id);create index materials_org on public.materials(organization_id);
create index tracks_owner on public.tracks(owner_id);create index tracks_org on public.tracks(organization_id);
create index modules_prerequisite on public.modules(prerequisite_id);create index progress_module on public.progress(module_id);
create index attempts_question on public.attempts(question_id);create index attempts_user on public.attempts(user_id,created_at);
create index classes_teacher on public.classes(teacher_id);create index classes_org on public.classes(organization_id);
create index enrollments_user on public.enrollments(user_id);create index assignments_class on public.assignments(class_id);create index assignments_teacher on public.assignments(teacher_id);
create index submissions_student on public.submissions(student_id);create index posts_user on public.posts(user_id);create index posts_kind_date on public.posts(kind,created_at desc);
create index comments_post on public.comments(post_id,created_at);create index comments_user on public.comments(user_id);create index reactions_user on public.reactions(user_id);
create index projects_owner on public.projects(owner_id);create index project_members_user on public.project_members(user_id);
create index jobs_owner on public.jobs(owner_id);create index jobs_status on public.jobs(status,created_at desc);create index applications_student on public.applications(student_id);
create index saved_jobs_user on public.saved_jobs(user_id);create index events_user on public.study_events(user_id,starts_at);create index events_class on public.study_events(class_id);
create index cert_track on public.certificates(track_id);create index cert_issuer on public.certificates(issued_by);create index tickets_user on public.support_tickets(user_id,created_at desc);
create index messages_recipient on public.messages(recipient_id,created_at);create index messages_sender on public.messages(sender_id,created_at);create index notifications_user on public.notifications(user_id,created_at desc);

create function private.current_role() returns public.app_role language sql stable security definer set search_path='' as $$select role from public.user_roles where user_id=(select auth.uid())$$;
create function private.current_org() returns uuid language sql stable security definer set search_path='' as $$select organization_id from public.user_roles where user_id=(select auth.uid())$$;
create function private.has_role(roles public.app_role[]) returns boolean language sql stable security definer set search_path='' as $$select coalesce(private.current_role()=any(roles),false)$$;
create function private.session_allowed() returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (coalesce(auth.jwt()->>'aal','aal1')='aal2' or not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status::text='verified'))
$$;
create function private.manages_class(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.classes c where c.id=target and ((c.teacher_id=auth.uid() and private.current_role()='docente') or (private.current_role()='instituicao' and c.organization_id=private.current_org())))
$$;
create function private.member_class(target uuid) returns boolean language sql stable security definer set search_path='' as $$select private.manages_class(target) or exists(select 1 from public.enrollments where class_id=target and user_id=auth.uid())$$;
create function private.supervises(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.enrollments e where e.user_id=target and private.manages_class(e.class_id))
 or (private.current_role()='instituicao' and exists(select 1 from public.user_roles r where r.user_id=target and r.organization_id=private.current_org()))
$$;
create function private.owns_job(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.jobs where id=target and owner_id=auth.uid() and private.current_role()='recrutador')$$;
-- Avoid expanding applications RLS again from jobs_read during INSERT checks.
create function private.applied_to_job(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.applications where job_id=target and student_id=auth.uid())$$;
create function private.can_see_candidate(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.applications a where a.student_id=target and private.owns_job(a.job_id))$$;
create function private.can_message(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select target<>auth.uid() and (
 private.supervises(target) or private.can_see_candidate(target)
 or exists(select 1 from public.enrollments e join public.classes c on c.id=e.class_id where e.user_id=auth.uid() and c.teacher_id=target)
 or exists(select 1 from public.applications a join public.jobs j on j.id=a.job_id where a.student_id=auth.uid() and j.owner_id=target)
 or exists(select 1 from public.user_roles r where r.user_id=target and r.role='instituicao' and r.organization_id=private.current_org() and r.organization_id is not null))
$$;
create function private.can_read_track(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.tracks t where t.id=target and (t.owner_id=auth.uid() or (t.published and (t.organization_id is null or t.organization_id=private.current_org()))))$$;
create function private.owns_track(target uuid) returns boolean language sql stable security definer set search_path='' as $$select private.has_role(array['docente','instituicao']::public.app_role[]) and exists(select 1 from public.tracks where id=target and owner_id=auth.uid())$$;
create function private.can_read_assignment(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.assignments a where a.id=target and private.member_class(a.class_id)) or exists(select 1 from public.submissions s where s.assignment_id=target and s.student_id=auth.uid())$$;
create function private.can_grade(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.assignments a where a.id=target and private.manages_class(a.class_id))$$;

-- Only migration/server owners assign roles. user_metadata is never authorization.
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare requested public.app_role;
begin
 insert into public.profiles(id,full_name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Estudante'),80));
 insert into public.user_roles(user_id,role) values(new.id,'estudante');
 if new.raw_user_meta_data->>'requested_role' in ('docente','recrutador','instituicao') then
  requested:=(new.raw_user_meta_data->>'requested_role')::public.app_role;
  insert into public.role_requests(user_id,requested_role,organization_name,registration_number,cnae)
  values(new.id,requested,left(coalesce(new.raw_user_meta_data->>'organization_name',''),160),left(coalesce(new.raw_user_meta_data->>'registration_number',''),32),left(coalesce(new.raw_user_meta_data->>'cnae',''),30));
 end if;return new;
end$$;
create trigger skillup_new_user after insert on auth.users for each row execute function private.handle_new_user();

create function private.validate_relations() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='classes' then
  if not exists(select 1 from public.user_roles r where r.user_id=new.teacher_id and r.role='docente' and r.organization_id=new.organization_id) then raise exception 'Docente não vinculado à instituição.';end if;
 elsif tg_table_name='enrollments' then
  if not exists(select 1 from public.classes c join public.user_roles r on r.organization_id=c.organization_id where c.id=new.class_id and r.user_id=new.user_id and r.role='estudante') then raise exception 'Estudante não vinculado à instituição.';end if;
 elsif tg_table_name='assignments' then
  if not exists(select 1 from public.classes c where c.id=new.class_id and c.teacher_id=new.teacher_id) then raise exception 'Docente divergente da turma.';end if;
 elsif tg_table_name='modules' and new.prerequisite_id is not null then
  if not exists(select 1 from public.modules m where m.id=new.prerequisite_id and m.track_id=new.track_id and m.position<new.position) then raise exception 'Pré-requisito deve ser uma etapa anterior da mesma trilha.';end if;
 end if;return new;
end$$;
create trigger validate_class before insert or update on public.classes for each row execute function private.validate_relations();
create trigger validate_enrollment before insert or update on public.enrollments for each row execute function private.validate_relations();
create trigger validate_assignment before insert or update on public.assignments for each row execute function private.validate_relations();
create trigger validate_module before insert or update on public.modules for each row execute function private.validate_relations();
create function private.stamp_author() returns trigger language plpgsql security definer set search_path='' as $$begin select full_name into new.author_name from public.profiles where id=new.user_id;new.created_at:=now();return new;end$$;
create trigger stamp_post before insert on public.posts for each row execute function private.stamp_author();
create trigger stamp_comment before insert on public.comments for each row execute function private.stamp_author();
commit;
