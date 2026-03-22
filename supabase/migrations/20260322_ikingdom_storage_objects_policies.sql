drop policy if exists "staff manage ikingdom storage objects" on storage.objects;
create policy "staff manage ikingdom storage objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'ikingdom-files'
  and exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id::text = split_part(name, '/', 1)
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
)
with check (
  bucket_id = 'ikingdom-files'
  and exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id::text = split_part(name, '/', 1)
      and project.org_id = public.get_my_org_id()
      and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  )
);

drop policy if exists "clients read own ikingdom storage objects" on storage.objects;
create policy "clients read own ikingdom storage objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ikingdom-files'
  and exists (
    select 1
    from public.ikingdom_web_projects project
    where project.id::text = split_part(name, '/', 1)
      and project.client_id = auth.uid()
  )
);
