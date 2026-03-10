'use server'

import { createClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/editorial/guards/require-manager'
import type { EditorialProjectMember } from '@/types/editorial'

// --------------------------
// Input / Result
// --------------------------

export interface AssignAuthorToProjectInput {
  projectId: string
  /** auth.users UUID of the author to assign. Must have an author_profiles row. */
  authorUserId: string
  /** Role within the project — default 'author'. */
  role?: string
}

export type AssignAuthorResult =
  | { data: EditorialProjectMember; error: null }
  | { data: null; error: string }

// --------------------------
// Action
// --------------------------

/**
 * Assigns an author (from author_profiles) to an editorial project.
 *
 * Requires manager-level access (coordinator role or org admin).
 * Authors cannot perform this action.
 *
 * Assumptions:
 *  - `author_profiles` table exists (Phase 1/2) with a `user_id` column.
 *  - `editorial_project_members` table exists (Phase 1/2) with columns:
 *    project_id, user_id, role, added_by, added_at.
 *  - TODO: adjust column names if Phase 1/2 schema differs.
 */
export async function assignAuthorToProject(
  input: AssignAuthorToProjectInput,
): Promise<AssignAuthorResult> {
  try {
    const manager = await requireManager()
    const supabase = await createClient()

    // Verify the target user has an active author_profiles row.
    const { data: authorProfile, error: authorError } = await supabase
      .from('author_profiles')
      .select('id')
      .eq('user_id', input.authorUserId)
      .eq('is_active', true)
      .single()

    if (authorError || !authorProfile) {
      return { data: null, error: 'Author profile not found or inactive' }
    }

    // Insert the project membership. Use upsert to be idempotent.
    const { data, error } = await supabase
      .from('editorial_project_members')
      .upsert(
        {
          project_id: input.projectId,
          user_id: input.authorUserId,
          role: input.role ?? 'author',
          added_by: manager.user_id,
        },
        { onConflict: 'project_id,user_id' },
      )
      .select()
      .single()

    if (error || !data) {
      return { data: null, error: error?.message ?? 'Failed to assign author to project' }
    }

    return { data: data as EditorialProjectMember, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { data: null, error: message }
  }
}
