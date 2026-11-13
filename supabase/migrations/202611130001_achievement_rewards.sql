begin;

alter table public.achievement_definitions
  add column xp_reward integer not null default 0 check (xp_reward between 0 and 1000);

insert into public.achievement_definitions(id, name, description, icon, xp_reward)
values
  ('first_activity', 'Primeira Atividade', 'Acertar a primeira atividade.', 'check', 20),
  ('first_lesson', 'Primeiros Passos', 'Concluir a primeira lição.', 'book', 25),
  ('first_code', 'Programador Iniciante', 'Concluir corretamente uma prática de código.', 'code', 30),
  ('practice_5', 'Ritmo de Prática', 'Acertar cinco atividades diferentes.', 'zap', 40),
  ('practice_10', 'Prática Constante', 'Acertar dez atividades diferentes.', 'award', 75),
  ('streak7', 'Estudante Dedicado', 'Estudar por 7 dias consecutivos.', 'flame', 100),
  ('explorer', 'Explorador', 'Iniciar 3 trilhas diferentes.', 'compass', 50),
  ('creator', 'Criador', 'Publicar o primeiro projeto público ou da comunidade.', 'briefcase', 75),
  ('weekly_top3', 'Destaque Semanal', 'Terminar uma semana entre os três primeiros do ranking.', 'trophy', 150)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  xp_reward = excluded.xp_reward;

create function private.unlock_achievement(p_user uuid, p_achievement text, p_earned_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  added uuid;
  reward integer;
  achievement_name text;
begin
  insert into public.student_achievements(user_id, achievement_id, earned_at)
  values (p_user, p_achievement, p_earned_at)
  on conflict (user_id, achievement_id) do nothing
  returning id into added;

  if added is null then return; end if;

  select xp_reward, name into reward, achievement_name
  from public.achievement_definitions
  where id = p_achievement;

  if coalesce(reward, 0) > 0 then
    insert into public.reward_events(user_id, source, xp, label, created_at)
    values (
      p_user,
      'achievement:' || p_achievement,
      reward,
      'Conquista: ' || achievement_name,
      p_earned_at
    )
    on conflict (user_id, source) do nothing;
  end if;
end;
$$;

create function private.refresh_achievement_rewards(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  correct_count integer;
begin
  select count(distinct question_id) into correct_count
  from public.attempts
  where user_id = p_user and correct;

  if correct_count >= 1 then perform private.unlock_achievement(p_user, 'first_activity'); end if;
  if correct_count >= 5 then perform private.unlock_achievement(p_user, 'practice_5'); end if;
  if correct_count >= 10 then perform private.unlock_achievement(p_user, 'practice_10'); end if;

  if exists(select 1 from public.progress where user_id = p_user) then
    perform private.unlock_achievement(p_user, 'first_lesson');
  end if;
  if exists(
    select 1 from public.attempts a
    join public.questions q on q.id = a.question_id
    where a.user_id = p_user and a.correct and q.activity_type = 'code_practice'
  ) then
    perform private.unlock_achievement(p_user, 'first_code');
  end if;
  if (select count(*) from public.track_enrollments where user_id = p_user) >= 3 then
    perform private.unlock_achievement(p_user, 'explorer');
  end if;
  if exists(
    select 1
    from (
      select day - row_number() over(order by day)::integer as streak
      from public.study_days where user_id = p_user
    ) s
    group by streak having count(*) >= 7
  ) then
    perform private.unlock_achievement(p_user, 'streak7');
  end if;
  if exists(
    select 1 from public.projects
    where owner_id = p_user and visibility <> 'private' and status <> 'archived'
  ) then
    perform private.unlock_achievement(p_user, 'creator');
  end if;
  if exists(
    with scores as (
      select r.user_id,
        date_trunc('week', r.created_at at time zone 'America/Recife') week,
        sum(r.xp) xp
      from public.reward_events r
      join public.profiles p on p.id = r.user_id
      where p.public_profile and r.xp > 0
        and r.created_at at time zone 'America/Recife' < date_trunc('week', now() at time zone 'America/Recife')
      group by r.user_id, week
    ), ranked as (
      select user_id, row_number() over(partition by week order by xp desc, user_id) pos
      from scores
    )
    select 1 from ranked where user_id = p_user and pos <= 3
  ) then
    perform private.unlock_achievement(p_user, 'weekly_top3');
  end if;
end;
$$;

create or replace function public.refresh_student_achievements()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.portfolio_student() then raise exception 'Acesso não autorizado.'; end if;
  perform private.refresh_achievement_rewards(auth.uid());
end;
$$;

-- Existing earned badges receive their configured bonus once during migration.
insert into public.reward_events(user_id, source, xp, label, created_at)
select a.user_id, 'achievement:' || a.achievement_id, d.xp_reward,
  'Conquista: ' || d.name, a.earned_at
from public.student_achievements a
join public.achievement_definitions d on d.id = a.achievement_id
where d.xp_reward > 0
on conflict (user_id, source) do nothing;

revoke all on function private.unlock_achievement(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function private.refresh_achievement_rewards(uuid) from public, anon, authenticated;

commit;
