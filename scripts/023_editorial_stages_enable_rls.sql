-- Fix: Enable RLS on editorial_stages and add a service-role policy.
-- Without this, if RLS is accidentally enabled in the Supabase dashboard
-- without a matching INSERT policy, the stage upsert silently fails.
-- Run this in Supabase SQL Editor to harden the stages table.
-- Safe to run multiple times (DO $$ / IF NOT EXISTS guards).

ALTER TABLE editorial_stages ENABLE ROW LEVEL SECURITY;

-- Service role (used by all server-side API routes) can do everything.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'editorial_stages' AND policyname = 'es_service_all'
  ) THEN
    CREATE POLICY "es_service_all" ON editorial_stages
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Staff can read stages for projects in their org.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'editorial_stages' AND policyname = 'es_staff_read'
  ) THEN
    CREATE POLICY "es_staff_read" ON editorial_stages
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM editorial_projects ep
          WHERE ep.id = project_id
            AND ep.org_id = public.get_my_org_id()
            AND public.get_my_role() IN ('superadmin', 'admin', 'sales', 'ops')
        )
      );
  END IF;
END $$;

-- Also ensure the activity log table has service-role access.
ALTER TABLE editorial_activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'editorial_activity_log' AND policyname = 'eal_service_all'
  ) THEN
    CREATE POLICY "eal_service_all" ON editorial_activity_log
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'editorial_activity_log' AND policyname = 'eal_staff_read'
  ) THEN
    CREATE POLICY "eal_staff_read" ON editorial_activity_log
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM editorial_projects ep
          WHERE ep.id = project_id
            AND ep.org_id = public.get_my_org_id()
            AND public.get_my_role() IN ('superadmin', 'admin', 'sales', 'ops')
        )
      );
  END IF;
END $$;
