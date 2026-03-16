-- Migration: Create editorial_custom_prompts table
-- This table stores custom prompt overrides per editorial stage.
-- When no custom prompt exists, the system falls back to DEFAULT_PROMPTS.

CREATE TABLE IF NOT EXISTS public.editorial_custom_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  stage_key text NOT NULL,
  task_key text NOT NULL,
  prompt_type text NOT NULL DEFAULT 'system',
  title text,
  system_prompt text,
  user_prompt_template text,
  prompt_content text,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ecp_project_id ON public.editorial_custom_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_ecp_stage_key ON public.editorial_custom_prompts(stage_key);
CREATE INDEX IF NOT EXISTS idx_ecp_project_stage ON public.editorial_custom_prompts(project_id, stage_key);

-- Unique constraints for upsert (conditional)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ecp_stage_task
  ON public.editorial_custom_prompts(stage_key, task_key)
  WHERE project_id IS NULL AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ecp_project_stage_task
  ON public.editorial_custom_prompts(project_id, stage_key, task_key)
  WHERE project_id IS NOT NULL AND is_active = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ecp_updated_at ON public.editorial_custom_prompts;
CREATE TRIGGER trg_ecp_updated_at
BEFORE UPDATE ON public.editorial_custom_prompts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.editorial_custom_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ecp_auth_select ON public.editorial_custom_prompts;
CREATE POLICY ecp_auth_select ON public.editorial_custom_prompts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ecp_auth_insert ON public.editorial_custom_prompts;
CREATE POLICY ecp_auth_insert ON public.editorial_custom_prompts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS ecp_auth_update ON public.editorial_custom_prompts;
CREATE POLICY ecp_auth_update ON public.editorial_custom_prompts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ecp_auth_delete ON public.editorial_custom_prompts;
CREATE POLICY ecp_auth_delete ON public.editorial_custom_prompts FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS ecp_service_all ON public.editorial_custom_prompts;
CREATE POLICY ecp_service_all ON public.editorial_custom_prompts FOR ALL TO service_role USING (true) WITH CHECK (true);
