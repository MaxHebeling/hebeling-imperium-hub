-- Add location columns to external_forms_ikingdom (optional fields).
-- REQUIRED for the intake form to work end-to-end (frontend → submit → Supabase → email).
-- Run this in Supabase SQL Editor. Does not drop or rename existing columns.

ALTER TABLE external_forms_ikingdom ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE external_forms_ikingdom ADD COLUMN IF NOT EXISTS state_region text;
ALTER TABLE external_forms_ikingdom ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE external_forms_ikingdom ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE external_forms_ikingdom ADD COLUMN IF NOT EXISTS address_line_1 text;
ALTER TABLE external_forms_ikingdom ADD COLUMN IF NOT EXISTS address_line_2 text;
