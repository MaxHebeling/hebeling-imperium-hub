-- =========================
-- Fase 3: Reino Editorial Staff Dashboard
-- staff_profiles + editorial_staff_assignments
-- Adds new columns to editorial_stages, editorial_files, editorial_comments
-- =========================

-- =========================
-- 1) staff_profiles
-- Links auth.users to editorial staff roles
-- =========================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'editor'
    CHECK (role IN ('editor', 'reviewer', 'coordinator', 'designer', 'proofreader')),
  bio text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- =========================
-- 2) editorial_staff_assignments
-- Links staff to editorial projects with a specific role
-- =========================
CREATE TABLE IF NOT EXISTS editorial_staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  staff_profile_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor'
    CHECK (role IN ('lead_editor', 'editor', 'reviewer', 'designer', 'proofreader', 'coordinator')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================
-- 3) ALTER editorial_stages
-- Add workflow tracking columns
-- =========================
ALTER TABLE editorial_stages ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE editorial_stages ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE editorial_stages ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE editorial_stages ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE editorial_stages ADD COLUMN IF NOT EXISTS internal_notes text;

-- =========================
-- 4) ALTER editorial_files
-- Add visibility control
-- =========================
ALTER TABLE editorial_files ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'staff'
  CHECK (visibility IN ('staff', 'author', 'public'));

-- =========================
-- 5) ALTER editorial_comments
-- Add visibility control
-- =========================
ALTER TABLE editorial_comments ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'staff'
  CHECK (visibility IN ('staff', 'author'));

-- =========================
-- 6) INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_staff_profiles_org_id ON staff_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON staff_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_editorial_staff_assignments_org_id ON editorial_staff_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_editorial_staff_assignments_project_id ON editorial_staff_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_editorial_staff_assignments_staff_profile_id ON editorial_staff_assignments(staff_profile_id);
CREATE INDEX IF NOT EXISTS idx_editorial_staff_assignments_role ON editorial_staff_assignments(role);

CREATE INDEX IF NOT EXISTS idx_editorial_stages_assigned_to ON editorial_stages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_editorial_stages_approved_by ON editorial_stages(approved_by);

CREATE INDEX IF NOT EXISTS idx_editorial_files_visibility ON editorial_files(visibility);

CREATE INDEX IF NOT EXISTS idx_editorial_comments_visibility ON editorial_comments(visibility);

-- =========================
-- 7) ENABLE RLS
-- =========================
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_staff_assignments ENABLE ROW LEVEL SECURITY;

-- =========================
-- 8) RLS POLICIES — staff_profiles
-- =========================
DROP POLICY IF EXISTS "staff read staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff read staff_profiles in org"
ON staff_profiles FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin', 'ops')
);

DROP POLICY IF EXISTS "staff insert staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff insert staff_profiles in org"
ON staff_profiles FOR INSERT
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "staff update staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff update staff_profiles in org"
ON staff_profiles FOR UPDATE
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "staff delete staff_profiles in org" ON staff_profiles;
CREATE POLICY "staff delete staff_profiles in org"
ON staff_profiles FOR DELETE
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

-- =========================
-- 9) RLS POLICIES — editorial_staff_assignments
-- =========================
DROP POLICY IF EXISTS "staff read assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff read assignments in org"
ON editorial_staff_assignments FOR SELECT
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin', 'ops')
);

DROP POLICY IF EXISTS "staff insert assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff insert assignments in org"
ON editorial_staff_assignments FOR INSERT
WITH CHECK (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "staff update assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff update assignments in org"
ON editorial_staff_assignments FOR UPDATE
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "staff delete assignments in org" ON editorial_staff_assignments;
CREATE POLICY "staff delete assignments in org"
ON editorial_staff_assignments FOR DELETE
USING (
  org_id = public.get_my_org_id()
  AND public.get_my_role() IN ('superadmin', 'admin')
);
