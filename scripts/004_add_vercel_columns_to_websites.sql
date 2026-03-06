-- Add Vercel-specific columns to websites table
-- For importing and syncing projects from Vercel

-- Vercel project ID (unique identifier from Vercel)
ALTER TABLE websites ADD COLUMN IF NOT EXISTS vercel_project_id text UNIQUE;

-- Preview URL for the project
ALTER TABLE websites ADD COLUMN IF NOT EXISTS preview_url text;

-- Framework detected by Vercel (nextjs, react, vue, etc.)
ALTER TABLE websites ADD COLUMN IF NOT EXISTS framework text;

-- GitHub/GitLab repository name
ALTER TABLE websites ADD COLUMN IF NOT EXISTS repo_name text;

-- Deployment status from Vercel
ALTER TABLE websites ADD COLUMN IF NOT EXISTS deployment_status text;

-- Last sync timestamp
ALTER TABLE websites ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Create index for faster lookups by vercel_project_id
CREATE INDEX IF NOT EXISTS idx_websites_vercel_project_id ON websites(vercel_project_id);
