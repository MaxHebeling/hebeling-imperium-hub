'use server'

import { createClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/editorial/guards/require-manager'
import type { AssignmentRole, EditorialStaffAssignment } from '@/types/editorial'

// --------------------------
// Input / Result
// --------------------------

export interface AssignStaffToProjectInput {
  projectId: string
  staffProfileId: string
  role: AssignmentRole
  notes?: string
}

export type AssignStaffResult =
  | { data: EditorialStaffAssignment; error: null }
  | { data: null; error: string }

// --------------------------
// Action
// --------------------------

/**
 * Assigns an editorial staff member to a project with a given role.
 *
 * Requires manager-level access (coordinator role or org admin).
 * Regular editors cannot assign other staff members.
 *
 * Uses upsert on (project_id, staff_profile_id) so re-assigning the same
 * staff member updates their role instead of creating a duplicate.
 */
export async function assignStaffToProject(
  input: AssignStaffToProjectInput,
): Promise<AssignStaffResult> {
  try {
    const manager = await requireManager()
    const supabase = await createClient()

    // Verify the target staff_profile belongs to the same org.
    const { data: targetProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('id, org_id, is_active')
      .eq('id', input.staffProfileId)
      .single()

    if (profileError || !targetProfile) {
      return { data: null, error: 'Staff profile not found' }
    }

    if (targetProfile.org_id !== manager.org_id) {
      return { data: null, error: 'Staff profile does not belong to your organization' }
    }

    if (!targetProfile.is_active) {
      return { data: null, error: 'Cannot assign an inactive staff member' }
    }

    const { data, error } = await supabase
      .from('editorial_staff_assignments')
      .upsert(
        {
          org_id: manager.org_id,
          project_id: input.projectId,
          staff_profile_id: input.staffProfileId,
          role: input.role,
          assigned_by: manager.user_id,
          notes: input.notes ?? null,
        },
        { onConflict: 'project_id,staff_profile_id' },
      )
      .select()
      .single()

    if (error || !data) {
      return { data: null, error: error?.message ?? 'Failed to assign staff to project' }
    }

    return { data: data as EditorialStaffAssignment, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { data: null, error: message }
  }
}
