-- Seed initial organization and brands
insert into organizations (name, slug)
values ('Hebeling Imperium Group', 'hebeling-imperium-group')
on conflict (slug) do nothing;

with org as (
  select id from organizations where slug = 'hebeling-imperium-group'
)
insert into brands (org_id, name, slug, primary_domain)
select org.id, x.name, x.slug, x.primary_domain
from org,
(
  values
    ('iKingdom', 'ikingdom', 'ikingdom.org'),
    ('Editorial Reino', 'editorial-reino', 'editorialreino.com'),
    ('Inversionistas del Reino', 'idr', 'idr.com.mx'),
    ('Imperiug', 'imperiug', 'imperiug.org'),
    ('Max Hebeling', 'max-hebeling', 'maxhebeling.com')
) as x(name, slug, primary_domain)
on conflict (org_id, slug) do nothing;
