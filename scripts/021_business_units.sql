-- =============================================================================
-- MIGRATION 021: Business Units — Hebeling OS Company-First Architecture
-- =============================================================================
-- Purpose: Creates the top-level business_units table that represents the four
-- primary companies/business units operating inside Hebeling OS.
--
-- This table is the root entity for the company-first architecture.
-- Every shared infrastructure module (CRM, Billing, Files, Intelligence, etc.)
-- can optionally scope data to a specific business unit via business_unit_id.
--
-- Current business units:
--   1. Reino Editorial — Editorial AI Engine (book production, distribution, AI)
--   2. iKingdom        — Digital coaching and personal development platform
--   3. Imperium        — Business consulting and strategy operations
--   4. Max Hebeling    — Personal brand, content, and speaking platform
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: business_units
-- ---------------------------------------------------------------------------
-- Represents the four top-level companies managed inside Hebeling OS.
-- Acts as the root of the company-first navigation and data architecture.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_units (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT        NOT NULL UNIQUE,      -- machine-readable: 'reino_editorial'
    slug         TEXT        NOT NULL UNIQUE,      -- url-safe: 'reino-editorial'
    name         TEXT        NOT NULL,             -- display: 'Reino Editorial'
    description  TEXT,
    business_type TEXT       NOT NULL DEFAULT 'internal',
    -- Allowed: editorial | coaching | consulting | personal_brand | internal | other

    active       BOOLEAN     NOT NULL DEFAULT true,
    color        TEXT,                             -- brand color hex e.g. '#7C3AED'
    logo_url     TEXT,
    metadata     JSONB,                            -- future: tagline, social links, etc.

    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE business_units IS
    'Top-level business units in Hebeling OS. Each represents an independent company or brand.';

COMMENT ON COLUMN business_units.code IS
    'Machine-readable unique code, snake_case (e.g. reino_editorial).';
COMMENT ON COLUMN business_units.slug IS
    'URL-safe slug used in route paths (e.g. reino-editorial → /app/companies/reino-editorial).';
COMMENT ON COLUMN business_units.business_type IS
    'Broad category: editorial | coaching | consulting | personal_brand | internal | other.';

-- Index for active lookups and slug-based route resolution
CREATE INDEX IF NOT EXISTS idx_business_units_slug   ON business_units (slug);
CREATE INDEX IF NOT EXISTS idx_business_units_active ON business_units (active);

-- ---------------------------------------------------------------------------
-- TRIGGER: updated_at auto-maintenance
-- ---------------------------------------------------------------------------
-- Depends on migration 020_architecture_audit_fixes.sql which creates the
-- shared set_updated_at() trigger function. If running this migration in
-- isolation (e.g., test environments), create the function here as a fallback.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_business_units_updated_at
    BEFORE UPDATE ON business_units
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

-- Service role: full management access
CREATE POLICY "business_units_manage_service_role"
    ON business_units
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated staff: read all active business units
CREATE POLICY "business_units_read_authenticated"
    ON business_units
    FOR SELECT
    TO authenticated
    USING (active = true);

-- ---------------------------------------------------------------------------
-- SEED DATA: The four Hebeling OS business units
-- ---------------------------------------------------------------------------
INSERT INTO business_units (code, slug, name, description, business_type, color)
VALUES
    (
        'reino_editorial',
        'reino-editorial',
        'Reino Editorial',
        'Editorial AI Engine — book production, AI automation, marketplace, distribution, and executive intelligence for publishing operations.',
        'editorial',
        '#7C3AED'
    ),
    (
        'ikingdom',
        'ikingdom',
        'iKingdom',
        'Digital coaching and personal development platform — lead intake, diagnosis, programs, and community.',
        'coaching',
        '#059669'
    ),
    (
        'imperium',
        'imperium',
        'Imperium',
        'Business consulting and strategy operations — advisory, transformation programs, and enterprise engagements.',
        'consulting',
        '#DC2626'
    ),
    (
        'max_hebeling',
        'max-hebeling',
        'Max Hebeling',
        'Personal brand, content, speaking, and thought leadership platform.',
        'personal_brand',
        '#D97706'
    )
ON CONFLICT (code) DO NOTHING;
