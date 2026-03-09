-- Reino Editorial AI Engine: Author Portal – Phase 2.1
-- Creates author_profiles, editorial_project_members, and RLS policies.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ blocks).

-- ---------------------------------------------------------------------------
-- author_profiles
-- Extends auth.users with author-specific metadata.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS author_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  bio          text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz
);

COMMENT ON TABLE author_profiles IS
  'Author-specific profile data that extends auth.users. One row per author user.';

ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile row.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'author_profiles' AND policyname = 'author_profiles_self_read'
  ) THEN
    CREATE POLICY "author_profiles_self_read" ON author_profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'author_profiles' AND policyname = 'author_profiles_self_update'
  ) THEN
    CREATE POLICY "author_profiles_self_update" ON author_profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Service role (backend) can do everything.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'author_profiles' AND policyname = 'author_profiles_service_all'
  ) THEN
    CREATE POLICY "author_profiles_service_all" ON author_profiles
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_project_members
-- Maps authenticated users (authors, reviewers, editors) to editorial projects.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editorial_project_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES editorial_projects (id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'author'
                CHECK (role IN ('author', 'reviewer', 'editor')),
  invited_at  timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE (project_id, user_id)
);

COMMENT ON TABLE editorial_project_members IS
  'Membership table linking users to editorial projects. role = author | reviewer | editor.';
COMMENT ON COLUMN editorial_project_members.role IS
  'Member role within the project: author | reviewer | editor';

CREATE INDEX IF NOT EXISTS idx_epm_user_id    ON editorial_project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_epm_project_id ON editorial_project_members (project_id);

ALTER TABLE editorial_project_members ENABLE ROW LEVEL SECURITY;

-- Members can read only their own membership rows.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_members' AND policyname = 'epm_self_read'
  ) THEN
    CREATE POLICY "epm_self_read" ON editorial_project_members
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can manage all memberships.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_project_members' AND policyname = 'epm_service_all'
  ) THEN
    CREATE POLICY "epm_service_all" ON editorial_project_members
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- editorial_projects – enable RLS and add member-read policy
-- Service role keeps full access so existing staff routes are unaffected.
-- ---------------------------------------------------------------------------
ALTER TABLE editorial_projects ENABLE ROW LEVEL SECURITY;

-- Service role (admin client used by staff routes) bypasses all restrictions.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_projects' AND policyname = 'ep_service_all'
  ) THEN
    CREATE POLICY "ep_service_all" ON editorial_projects
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Authenticated members can read projects they belong to.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'editorial_projects' AND policyname = 'ep_member_read'
  ) THEN
    CREATE POLICY "ep_member_read" ON editorial_projects
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM   editorial_project_members epm
          WHERE  epm.project_id = id
            AND  epm.user_id    = auth.uid()
        )
      );
  END IF;
END $$;
