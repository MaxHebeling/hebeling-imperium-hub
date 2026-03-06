-- =========================
-- iKingdom Leads Table
-- Stores detailed lead information from the /apply form
-- =========================

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Lead identification
  lead_code text UNIQUE NOT NULL,
  
  -- Basic information
  full_name text NOT NULL,
  company_name text,
  email text,
  whatsapp text,
  country text,
  city text,
  
  -- Project details
  project_description text,
  organization_type text,
  website_url text,
  social_links text,
  main_goal text,
  expected_result text,
  main_service text,
  ideal_client text,
  
  -- Branding
  has_logo boolean,
  has_brand_colors boolean,
  visual_style text,
  available_content text,
  reference_websites text,
  has_current_landing boolean,
  
  -- Project scope
  project_type text,
  budget_range text,
  timeline text,
  preferred_contact_method text,
  additional_notes text,
  
  -- Tracking & source
  source text DEFAULT 'website',
  brand text,
  origin_page text,
  form_type text,
  
  -- Status
  status text NOT NULL DEFAULT 'new_lead',
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_lead_code ON leads(lead_code);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Add lead_id and lead_code columns to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_code text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pipeline text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner text;

-- Create index for lead_id in deals
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);

-- Counter table for daily lead code generation
CREATE TABLE IF NOT EXISTS lead_code_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key text UNIQUE NOT NULL,
  counter int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_code_counters ENABLE ROW LEVEL SECURITY;

-- RLS policy for leads
DROP POLICY IF EXISTS "staff read leads in org" ON leads;
CREATE POLICY "staff read leads in org"
ON leads FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin', 'sales', 'ops')
);

-- RLS policy for lead_code_counters (internal use)
DROP POLICY IF EXISTS "staff read counters" ON lead_code_counters;
CREATE POLICY "staff read counters"
ON lead_code_counters FOR SELECT
USING (true);
