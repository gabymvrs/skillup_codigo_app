begin;

alter table public.notifications
  add column link text
  check (link is null or link ~ '^/app/[a-z0-9/?=&_-]+$');

create function private.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
begin
  select full_name into sender_name
    from public.profiles
    where id = new.sender_id;

  insert into public.notifications(user_id, title, body, link)
  values (
    new.recipient_id,
    'Nova mensagem de ' || coalesce(sender_name, 'um contato'),
    'Abra a conversa para ler e responder.',
    '/app/mensagens?para=' || new.sender_id::text
  );
  return new;
end;
$$;

create trigger message_notification
after insert on public.messages
for each row execute function private.notify_new_message();

revoke all on function private.notify_new_message() from public, anon, authenticated;

-- Keep the notification bell in sync without requiring a page refresh.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception
  when duplicate_object then null;
end
$$;

commit;
