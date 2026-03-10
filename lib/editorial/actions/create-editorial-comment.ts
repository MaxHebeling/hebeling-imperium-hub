'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProjectStaffAccess } from '@/lib/editorial/guards/require-project-staff-access'
import type { CommentVisibility, EditorialComment } from '@/types/editorial'

// --------------------------
// Input / Result
// --------------------------

export interface CreateEditorialCommentInput {
  projectId: string
  stageId?: string
  content: string
  /**
   * 'staff'  — visible only to staff (default).
   * 'author' — visible to the assigned author and all staff.
   */
  visibility?: CommentVisibility
}

export type CreateCommentResult =
  | { data: EditorialComment; error: null }
  | { data: null; error: string }

// --------------------------
// Action
// --------------------------

/**
 * Creates a new editorial comment on a project (optionally scoped to a stage).
 *
 * Requires the caller to be an active staff member assigned to the project
 * (or a manager/admin with global access).
 *
 * Authors cannot post staff comments — the `author_id` column is set to
 * the staff member's user_id, distinguishing it from author-facing messages.
 *
 * Assumption:
 *  - `editorial_comments` has columns: project_id, stage_id, author_id,
 *    content, visibility. Adjust if Phase 1/2 schema differs.
 *  - TODO: verify column names against actual DB schema.
 */
export async function createEditorialComment(
  input: CreateEditorialCommentInput,
): Promise<CreateCommentResult> {
  try {
    if (!input.content.trim()) {
      return { data: null, error: 'Comment content cannot be empty' }
    }

    const staffProfile = await requireProjectStaffAccess(input.projectId)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('editorial_comments')
      .insert({
        project_id: input.projectId,
        stage_id: input.stageId ?? null,
        author_id: staffProfile.user_id,
        content: input.content.trim(),
        visibility: input.visibility ?? 'staff',
      })
      .select()
      .single()

    if (error || !data) {
      return { data: null, error: error?.message ?? 'Failed to create comment' }
    }

    return { data: data as EditorialComment, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { data: null, error: message }
  }
}
