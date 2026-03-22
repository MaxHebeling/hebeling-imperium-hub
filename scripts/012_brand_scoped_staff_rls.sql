-- =========================
-- Brand-scoped staff access
-- Restricts sales/ops users to their assigned brand while
-- preserving full org-wide access for superadmin/admin.
-- =========================

create or replace function public.get_my_brand_id()
returns uuid
language sql
stable
as $$
  select brand_id from profiles where id = auth.uid()
$$;

create or replace function public.get_my_brand_slug()
returns text
language sql
stable
as $$
  select b.slug
  from profiles p
  left join brands b on b.id = p.brand_id
  where p.id = auth.uid()
$$;

create or replace function public.staff_brand_matches_id(target_brand_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
  role_value app_role;
  scoped_brand_id uuid;
begin
  role_value := public.get_my_role();

  if role_value in ('superadmin', 'admin') then
    return true;
  end if;

  if role_value not in ('sales', 'ops') then
    return false;
  end if;

  scoped_brand_id := public.get_my_brand_id();

  if scoped_brand_id is null then
    return true;
  end if;

  if target_brand_id is null then
    return false;
  end if;

  return target_brand_id = scoped_brand_id;
end;
$$;

create or replace function public.staff_brand_matches_slug(target_brand text)
returns boolean
language plpgsql
stable
as $$
declare
  role_value app_role;
  scoped_slug text;
  normalized_target text;
begin
  role_value := public.get_my_role();

  if role_value in ('superadmin', 'admin') then
    return true;
  end if;

  if role_value not in ('sales', 'ops') then
    return false;
  end if;

  scoped_slug := lower(coalesce(public.get_my_brand_slug(), ''));
  normalized_target := lower(coalesce(target_brand, ''));

  if scoped_slug = '' then
    return true;
  end if;

  return normalized_target = scoped_slug
    or normalized_target = replace(scoped_slug, '-', '_')
    or normalized_target = replace(scoped_slug, '_', '-');
end;
$$;

-- Leads (brand stored as text slug)
drop policy if exists "staff read leads in org" on leads;
drop policy if exists "staff insert leads in scoped brand" on leads;
drop policy if exists "staff update leads in scoped brand" on leads;
drop policy if exists "staff delete leads in scoped brand" on leads;

create policy "staff read leads in org"
on leads for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_slug(brand)
);

create policy "staff insert leads in scoped brand"
on leads for insert
with check (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_slug(brand)
);

create policy "staff update leads in scoped brand"
on leads for update
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_slug(brand)
)
with check (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_slug(brand)
);

create policy "staff delete leads in scoped brand"
on leads for delete
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_slug(brand)
);

-- Brand-owned business tables
drop policy if exists "staff read tenants in org" on tenants;
create policy "staff read tenants in org"
on tenants for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read companies in org" on companies;
create policy "staff read companies in org"
on companies for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read contacts in org" on contacts;
create policy "staff read contacts in org"
on contacts for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read pipelines in org" on pipelines;
create policy "staff read pipelines in org"
on pipelines for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read deals in org" on deals;
create policy "staff read deals in org"
on deals for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read projects in org" on projects;
create policy "staff read projects in org"
on projects for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read documents in org" on documents;
create policy "staff read documents in org"
on documents for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read websites in org" on websites;
create policy "staff read websites in org"
on websites for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);

drop policy if exists "staff read activity logs in org" on activity_logs;
create policy "staff read activity logs in org"
on activity_logs for select
using (
  org_id = public.get_my_org_id()
  and public.get_my_role() in ('superadmin', 'admin', 'sales', 'ops')
  and public.staff_brand_matches_id(brand_id)
);
