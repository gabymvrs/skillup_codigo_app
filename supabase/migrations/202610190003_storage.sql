begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('learning-materials','learning-materials',false,10485760,array['application/pdf','text/plain']),
 ('profile-documents','profile-documents',false,5242880,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do nothing;
create policy skillup_learning_upload on storage.objects for insert to authenticated with check(bucket_id='learning-materials' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text and private.has_role(array['docente','instituicao']::public.app_role[]));
create policy skillup_learning_read on storage.objects for select to authenticated using(bucket_id='learning-materials' and private.session_allowed() and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.materials m where m.file_path=storage.objects.name)));
create policy skillup_learning_remove on storage.objects for delete to authenticated using(bucket_id='learning-materials' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text);
create policy skillup_documents_upload on storage.objects for insert to authenticated with check(bucket_id='profile-documents' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text);
create policy skillup_documents_read on storage.objects for select to authenticated using(bucket_id='profile-documents' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text);
create policy skillup_documents_remove on storage.objects for delete to authenticated using(bucket_id='profile-documents' and private.session_allowed() and (storage.foldername(name))[1]=auth.uid()::text);
-- Realtime is optional. Enable only the messages table; RLS still filters delivery.
do $$begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.messages;end if;exception when duplicate_object then null;end$$;
commit;
