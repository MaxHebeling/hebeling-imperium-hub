import { createClient } from '@/lib/supabase/server'
import type { StaffProfile } from '@/types/editorial'
import type { AppRole } from '@/lib/supabase/middleware'
import { isManagerStaffRole, isManagerAppRole } from '@/lib/editorial/utils/roles'

// --------------------------
// Result types
// --------------------------

export type StaffProfileResult =
  | { profile: StaffProfile; error: null }
  | { profile: null; error: string }

// --------------------------
// Queries
// --------------------------

/**
 * Fetches the staff_profile row for the given auth.users UUID.
 * Returns null (not throws) when no row is found.
 */
export async function getStaffProfileByUserId(userId: string): Promise<StaffProfileResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return { profile: null, error: 'No editorial staff profile found for this user' }
  }

  return { profile: data as StaffProfile, error: null }
}

/**
 * Checks whether a staff_profile is directly assigned to the given project
 * via editorial_staff_assignments.
 */
export async function isStaffAssignedToProject(
  staffProfileId: string,
  projectId: string,
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('editorial_staff_assignments')
    .select('id')
    .eq('staff_profile_id', staffProfileId)
    .eq('project_id', projectId)
    .maybeSingle()

  return !error && data !== null
}

/**
 * Returns the app-level role for a given auth.users UUID (from the `profiles` table).
 * Returns null when no profile row exists.
 */
export async function getAppRoleByUserId(userId: string): Promise<AppRole | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return data.role as AppRole
}

/**
 * Returns true when the given staff profile — or their underlying app role — grants
 * manager-level editorial access.
 *
 * Manager access is granted when:
 *  - staff_profiles.role is 'coordinator', OR
 *  - profiles.role is 'superadmin' or 'admin'
 */
export async function hasManagerAccess(staffProfile: StaffProfile): Promise<boolean> {
  if (isManagerStaffRole(staffProfile.role)) return true

  const appRole = await getAppRoleByUserId(staffProfile.user_id)
  return appRole !== null && isManagerAppRole(appRole)
}
