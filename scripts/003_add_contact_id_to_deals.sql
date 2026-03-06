-- Add contact_id column to deals table to link deals to contacts
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- Add source column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source text;

-- Add source column to contacts table (for tracking where leads come from)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source text;

-- Create index for faster lookups by contact_id
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);

-- Create index for faster lookups by source
CREATE INDEX IF NOT EXISTS idx_deals_source ON deals(source);
