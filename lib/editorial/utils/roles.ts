import type { StaffRole } from '@/types/editorial'
import type { AppRole } from '@/lib/supabase/middleware'

/**
 * StaffRoles that carry manager-level permissions within the editorial pipeline.
 * Coordinators can approve stages, assign other staff, and access all projects.
 */
export const MANAGER_STAFF_ROLES = ['coordinator'] as const satisfies readonly StaffRole[]

/**
 * App-level roles (from the `profiles` table) that also grant editorial manager access.
 * Superadmin and admin can do everything regardless of their staff_profile role.
 */
export const MANAGER_APP_ROLES = ['superadmin', 'admin'] as const satisfies readonly AppRole[]

/** Returns true if the given StaffRole carries manager-level editorial permissions. */
export function isManagerStaffRole(role: StaffRole): boolean {
  return (MANAGER_STAFF_ROLES as readonly string[]).includes(role)
}

/** Returns true if the given AppRole grants editorial manager access. */
export function isManagerAppRole(role: AppRole): boolean {
  return (MANAGER_APP_ROLES as readonly string[]).includes(role)
}
