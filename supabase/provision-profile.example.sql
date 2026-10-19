-- Roteiro administrativo. Executar apenas no SQL Editor/backend confiável.
-- Não é uma migration automática. Revise a identidade/documentação previamente.
-- Para criar uma organização, execute separadamente:
-- insert into public.organizations(name) values ('Nome revisado') returning id;
begin;
do $$
declare
  target_user uuid := null; -- UUID da conta que já confirmou e-mail
  target_org uuid := null; -- UUID revisado de public.organizations
  target_role public.app_role := 'docente';
begin
  if target_user is null then raise exception 'Informe o UUID da conta revisada.';end if;
  if target_role in ('docente','instituicao') and target_org is null then
    raise exception 'Vincule este perfil a uma organização revisada.';
  end if;
  if not exists(select 1 from auth.users where id=target_user and email_confirmed_at is not null) then
    raise exception 'Conta ausente ou e-mail ainda não confirmado.';
  end if;
  update public.user_roles set role=target_role,organization_id=target_org where user_id=target_user;
  if not found then raise exception 'Perfil não encontrado.';end if;
  update public.role_requests set status='approved'
    where user_id=target_user and requested_role=target_role and status='pending';
end$$;
commit;
-- Reabra a sessão no aplicativo depois de uma alteração administrativa de perfil.
