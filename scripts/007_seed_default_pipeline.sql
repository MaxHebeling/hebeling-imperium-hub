-- Seed default pipeline and stage for leads → deals (createDealFromLead looks for stage "New" or "Lead")
-- Run after 002_seed_org_brands.sql so organizations and brands exist. Idempotent.

INSERT INTO pipelines (org_id, name)
SELECT o.id, 'iKingdom'
FROM organizations o
WHERE o.slug = 'hebeling-imperium-group'
  AND NOT EXISTS (SELECT 1 FROM pipelines p WHERE p.org_id = o.id AND p.name = 'iKingdom')
LIMIT 1;

INSERT INTO stages (pipeline_id, name, position)
SELECT p.id, 'Lead', 0
FROM pipelines p
JOIN organizations o ON o.id = p.org_id
WHERE o.slug = 'hebeling-imperium-group'
  AND p.name = 'iKingdom'
  AND NOT EXISTS (SELECT 1 FROM stages s WHERE s.pipeline_id = p.id AND s.name IN ('Lead', 'New'))
LIMIT 1;
