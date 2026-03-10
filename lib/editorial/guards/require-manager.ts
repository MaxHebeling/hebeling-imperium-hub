import { requireStaff } from '@/lib/editorial/guards/require-staff'
import { hasManagerAccess } from '@/lib/editorial/services/staff-profile.service'
import type { StaffProfile } from '@/types/editorial'

// --------------------------
// Typed error
// --------------------------

export class ManagerAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ManagerAuthError'
  }
}

// --------------------------
// Guard
// --------------------------

/**
 * Validates that the current request is made by an authenticated, active
 * editorial staff member with manager-level permissions.
 *
 * Manager access is granted when:
 *  - staff_profiles.role is 'coordinator'  (editorial manager), OR
 *  - profiles.role is 'superadmin' or 'admin' (org-level admin)
 *
 * Designed for Server Components and Server Actions.
 *
 * @throws {StaffAuthError}   — when the user is not valid staff (see require-staff).
 * @throws {ManagerAuthError} — when the user lacks manager-level permissions.
 * @returns The StaffProfile of the authenticated manager.
 */
export async function requireManager(): Promise<StaffProfile> {
  const staffProfile = await requireStaff()

  const isManager = await hasManagerAccess(staffProfile)
  if (!isManager) {
    throw new ManagerAuthError('Insufficient permissions: manager or admin role required')
  }

  return staffProfile
}
