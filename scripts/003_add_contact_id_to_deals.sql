-- Add contact_id column to deals table
-- This allows linking deals to specific contacts from landing form submissions

ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- Add source column to deals table if it doesn't exist
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS source text;

-- Add status column to deals table if it doesn't exist  
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

-- Create index for faster lookups by contact_id
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);

-- Create index for faster lookups by source
CREATE INDEX IF NOT EXISTS idx_deals_source ON deals(source);
