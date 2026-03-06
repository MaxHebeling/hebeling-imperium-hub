-- Create vercel_projects table for storing imported Vercel projects
CREATE TABLE IF NOT EXISTS vercel_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  vercel_project_id text NOT NULL UNIQUE,
  name text NOT NULL,
  framework text,
  repo_name text,
  repo_url text,
  production_domain text,
  preview_url text,
  vercel_url text,
  deployment_status text,
  account_name text,
  team_id text,
  metadata jsonb,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vercel_projects_org_id ON vercel_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_vercel_projects_vercel_project_id ON vercel_projects(vercel_project_id);
CREATE INDEX IF NOT EXISTS idx_vercel_projects_brand_id ON vercel_projects(brand_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_vercel_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vercel_projects_updated_at ON vercel_projects;
CREATE TRIGGER trigger_vercel_projects_updated_at
  BEFORE UPDATE ON vercel_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_vercel_projects_updated_at();

-- Enable RLS
ALTER TABLE vercel_projects ENABLE ROW LEVEL SECURITY;

-- RLS policy for authenticated users to read their org's projects
CREATE POLICY "Users can view their organization's vercel projects"
  ON vercel_projects FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS policy for service role to insert/update
CREATE POLICY "Service role can manage vercel projects"
  ON vercel_projects FOR ALL
  USING (true)
  WITH CHECK (true);
