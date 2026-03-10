import { createClient } from '@/lib/supabase/server'
import { getStaffProfileByUserId } from '@/lib/editorial/services/staff-profile.service'
import type { StaffProfile } from '@/types/editorial'

// --------------------------
// Typed error
// --------------------------

export class StaffAuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHENTICATED' | 'NOT_STAFF' | 'INACTIVE_STAFF',
  ) {
    super(message)
    this.name = 'StaffAuthError'
  }
}

// --------------------------
// Guard
// --------------------------

/**
 * Validates that the current request is made by an authenticated, active
 * editorial staff member (i.e. has a row in `staff_profiles` with is_active = true).
 *
 * Designed for Server Components and Server Actions.
 *
 * @throws {StaffAuthError} UNAUTHENTICATED — no Supabase session.
 * @throws {StaffAuthError} NOT_STAFF — user has no staff_profiles row.
 * @throws {StaffAuthError} INACTIVE_STAFF — staff profile has is_active = false.
 * @returns The StaffProfile of the authenticated staff member.
 */
export async function requireStaff(): Promise<StaffProfile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new StaffAuthError('Not authenticated', 'UNAUTHENTICATED')
  }

  const { profile, error } = await getStaffProfileByUserId(user.id)

  if (error || !profile) {
    throw new StaffAuthError('No editorial staff profile found', 'NOT_STAFF')
  }

  if (!profile.is_active) {
    throw new StaffAuthError('Staff profile is inactive', 'INACTIVE_STAFF')
  }

  return profile
}
