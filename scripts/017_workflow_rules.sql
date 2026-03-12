-- Reino Editorial AI Engine: Workflow Rules Engine – Phase 4A (BLOCK 1)
-- Adds editorial_stage_rule_definitions for configurable pipeline rules.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards).

-- ---------------------------------------------------------------------------
-- editorial_stage_rule_definitions
-- One row per rule per org + stage.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_stage_rule_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  stage_key    text NOT NULL,
  rule_type    text NOT NULL CHECK (rule_type IN ('entry', 'exit', 'transition', 'blocking')),
  rule_key     text NOT NULL,
  severity     text NOT NULL DEFAULT 'blocking' CHECK (severity IN ('info', 'warning', 'blocking', 'critical')),
  is_enabled   boolean NOT NULL DEFAULT true,
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_esrd_org_stage
  ON editorial_stage_rule_definitions (org_id, stage_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_esrd_org_stage_rule
  ON editorial_stage_rule_definitions (org_id, stage_key, rule_key);

ALTER TABLE editorial_stage_rule_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_stage_rule_definitions' AND policyname = 'esrd_service_all'
  ) THEN
    CREATE POLICY "esrd_service_all" ON editorial_stage_rule_definitions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

