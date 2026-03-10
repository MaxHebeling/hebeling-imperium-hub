'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProjectStaffAccess } from '@/lib/editorial/guards/require-project-staff-access'
import type { EditorialStage } from '@/types/editorial'

// --------------------------
// Input / Result
// --------------------------

export interface MarkStageInProgressInput {
  stageId: string
  projectId: string
}

export type MarkStageInProgressResult =
  | { data: EditorialStage; error: null }
  | { data: null; error: string }

// --------------------------
// Action
// --------------------------

/**
 * Marks an editorial stage as in-progress, recording the start timestamp.
 *
 * Requires the caller to be an active staff member assigned to the project
 * (or a manager/admin). Authors cannot trigger stage transitions.
 *
 * The stage must currently be in 'pending' status; otherwise the action
 * returns an error to prevent unintended state rewrites.
 *
 * Assumption:
 *  - `editorial_stages` has columns: id, project_id, status, started_at,
 *    updated_at. Adjust if Phase 1/2 schema differs.
 *  - TODO: verify column names against actual DB schema.
 */
export async function markStageInProgress(
  input: MarkStageInProgressInput,
): Promise<MarkStageInProgressResult> {
  try {
    await requireProjectStaffAccess(input.projectId)
    const supabase = await createClient()

    // Fetch the stage and verify it belongs to the project.
    const { data: stage, error: fetchError } = await supabase
      .from('editorial_stages')
      .select('*')
      .eq('id', input.stageId)
      .eq('project_id', input.projectId)
      .single()

    if (fetchError || !stage) {
      return { data: null, error: 'Stage not found in this project' }
    }

    if (stage.status !== 'pending') {
      return {
        data: null,
        error: `Stage cannot be started from status '${stage.status}'. Expected 'pending'.`,
      }
    }

    const now = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('editorial_stages')
      .update({ status: 'in_progress', started_at: now, updated_at: now })
      .eq('id', input.stageId)
      .select()
      .single()

    if (updateError || !updated) {
      return { data: null, error: updateError?.message ?? 'Failed to update stage status' }
    }

    return { data: updated as EditorialStage, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { data: null, error: message }
  }
}
