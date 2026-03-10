-- Phase 4B – Human review & approval for AI findings
-- Adds editorial_ai_finding_decisions to capture explicit human decisions on AI findings.

CREATE TABLE IF NOT EXISTS editorial_ai_finding_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_key text NOT NULL,
  finding_id uuid NOT NULL REFERENCES editorial_ai_findings (id) ON DELETE CASCADE,

  decision_status text NOT NULL,
  decision_comment text NULL,

  decided_by uuid NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_eafd_finding_id
  ON editorial_ai_finding_decisions (finding_id);

CREATE INDEX IF NOT EXISTS idx_eafd_project_stage_decided_at
  ON editorial_ai_finding_decisions (project_id, stage_key, decided_at DESC);

ALTER TABLE editorial_ai_finding_decisions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_ai_finding_decisions' AND policyname = 'eafd_service_all'
  ) THEN
    CREATE POLICY "eafd_service_all" ON editorial_ai_finding_decisions
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

