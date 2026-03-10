import { requireStaff } from '@/lib/editorial/guards/require-staff'
import {
  hasManagerAccess,
  isStaffAssignedToProject,
} from '@/lib/editorial/services/staff-profile.service'
import type { StaffProfile } from '@/types/editorial'

// --------------------------
// Typed error
// --------------------------

export class ProjectAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectAccessError'
  }
}

// --------------------------
// Guard
// --------------------------

/**
 * Validates that the current request has access to a specific editorial project.
 *
 * Access is granted when either condition is true:
 *  1. The user is a manager/admin (can access ALL projects), OR
 *  2. The user is an active staff member explicitly assigned to the project
 *     via `editorial_staff_assignments`.
 *
 * Designed for Server Components and Server Actions.
 *
 * @param projectId — The UUID of the editorial project to check access for.
 * @throws {StaffAuthError}    — when the user is not valid staff (see require-staff).
 * @throws {ProjectAccessError} — when the user is not assigned to the project
 *                                and lacks manager-level permissions.
 * @returns The StaffProfile of the authenticated user.
 */
export async function requireProjectStaffAccess(projectId: string): Promise<StaffProfile> {
  const staffProfile = await requireStaff()

  // Managers and org-level admins can access all projects without an explicit assignment.
  const isManager = await hasManagerAccess(staffProfile)
  if (isManager) return staffProfile

  // For non-managers, verify an explicit assignment record exists.
  const isAssigned = await isStaffAssignedToProject(staffProfile.id, projectId)
  if (!isAssigned) {
    throw new ProjectAccessError(
      `Staff member is not assigned to project ${projectId}`,
    )
  }

  return staffProfile
}
