'use server'

import { createClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/editorial/guards/require-manager'
import type { EditorialStage } from '@/types/editorial'

// --------------------------
// Input / Result
// --------------------------

export interface ApproveEditorialStageInput {
  stageId: string
  projectId: string
  /** Optional manager notes saved to internal_notes on the approved stage. */
  internalNotes?: string
}

export interface ApproveEditorialStageData {
  /** The stage that was just approved. */
  approvedStage: EditorialStage
  /** The next pipeline stage (now set to 'in_progress'), if one exists. */
  nextStage: EditorialStage | null
}

export type ApproveEditorialStageResult =
  | { data: ApproveEditorialStageData; error: null }
  | { data: null; error: string }

// --------------------------
// Action
// --------------------------

/**
 * Approves an editorial stage and advances the pipeline.
 *
 * Requires manager-level access (coordinator role or org admin).
 * Regular editors and authors cannot approve stages.
 *
 * Pipeline advancement logic:
 *  1. Marks the current stage as 'approved', recording approved_at and approved_by.
 *  2. Saves any internalNotes to the stage.
 *  3. If a next stage exists (by position + 1) and it is still 'pending',
 *     automatically moves it to 'in_progress' with a started_at timestamp.
 *     This keeps the pipeline moving without manual intervention.
 *
 * Safe behaviour:
 *  - The stage MUST be in 'in_progress' status; an already-approved, rejected,
 *    or pending stage returns an error.
 *  - If the next stage is not 'pending' (e.g. already started or rejected),
 *    it is left untouched — the approval still succeeds.
 *
 * Assumption:
 *  - `editorial_stages` has columns: id, project_id, position, status,
 *    approved_at, approved_by, internal_notes, started_at, updated_at.
 *  - TODO: verify column names against actual DB schema.
 */
export async function approveEditorialStage(
  input: ApproveEditorialStageInput,
): Promise<ApproveEditorialStageResult> {
  try {
    const manager = await requireManager()
    const supabase = await createClient()

    // 1 — Fetch the target stage and verify project membership.
    const { data: stage, error: fetchError } = await supabase
      .from('editorial_stages')
      .select('*')
      .eq('id', input.stageId)
      .eq('project_id', input.projectId)
      .single()

    if (fetchError || !stage) {
      return { data: null, error: 'Stage not found in this project' }
    }

    if (stage.status !== 'in_progress') {
      return {
        data: null,
        error: `Stage cannot be approved from status '${stage.status}'. Expected 'in_progress'.`,
      }
    }

    const now = new Date().toISOString()

    // 2 — Approve the current stage.
    const { data: approvedStage, error: approveError } = await supabase
      .from('editorial_stages')
      .update({
        status: 'approved',
        approved_at: now,
        approved_by: manager.user_id,
        internal_notes: input.internalNotes ?? stage.internal_notes,
        updated_at: now,
      })
      .eq('id', input.stageId)
      .select()
      .single()

    if (approveError || !approvedStage) {
      return { data: null, error: approveError?.message ?? 'Failed to approve stage' }
    }

    // 3 — Advance pipeline: find the next stage by position.
    const { data: nextStageCandidate } = await supabase
      .from('editorial_stages')
      .select('*')
      .eq('project_id', input.projectId)
      .eq('position', stage.position + 1)
      .single()

    let nextStage: EditorialStage | null = null

    if (nextStageCandidate && nextStageCandidate.status === 'pending') {
      const { data: started } = await supabase
        .from('editorial_stages')
        .update({ status: 'in_progress', started_at: now, updated_at: now })
        .eq('id', nextStageCandidate.id)
        .select()
        .single()

      nextStage = started ? (started as EditorialStage) : null
    }

    return {
      data: {
        approvedStage: approvedStage as EditorialStage,
        nextStage,
      },
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { data: null, error: message }
  }
}
