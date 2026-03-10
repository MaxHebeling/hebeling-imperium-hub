'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProjectStaffAccess } from '@/lib/editorial/guards/require-project-staff-access'
import type { EditorialFile, FileVisibility } from '@/types/editorial'

// --------------------------
// Input / Result
// --------------------------

export interface UploadEditorialFileInput {
  projectId: string
  stageId?: string
  /** Display name for the file. */
  name: string
  /**
   * Full URL of the already-uploaded file.
   * The actual upload to Supabase Storage must be completed client-side
   * before calling this action. This action only registers the metadata.
   */
  fileUrl: string
  fileType?: string
  sizeBytes?: number
  /**
   * 'staff'  — visible only to staff (default).
   * 'author' — visible to the assigned author and all staff.
   * 'public' — visible to everyone.
   */
  visibility?: FileVisibility
}

export type UploadEditorialFileResult =
  | { data: EditorialFile; error: null }
  | { data: null; error: string }

// --------------------------
// Action
// --------------------------

/**
 * Registers an editorial file record after the file has been uploaded to storage.
 *
 * Requires the caller to be an active staff member assigned to the project
 * (or a manager/admin with global access).
 *
 * NOTE: This action does NOT perform the file upload itself. The caller must
 * upload the file to Supabase Storage and pass the resulting URL as `fileUrl`.
 *
 * Assumption:
 *  - `editorial_files` has columns: project_id, stage_id, name, file_url,
 *    file_type, size_bytes, uploaded_by, visibility. Adjust if schema differs.
 *  - TODO: verify column names against actual DB schema.
 */
export async function uploadEditorialFile(
  input: UploadEditorialFileInput,
): Promise<UploadEditorialFileResult> {
  try {
    if (!input.name.trim()) {
      return { data: null, error: 'File name cannot be empty' }
    }

    if (!input.fileUrl.trim()) {
      return { data: null, error: 'File URL cannot be empty' }
    }

    const staffProfile = await requireProjectStaffAccess(input.projectId)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('editorial_files')
      .insert({
        project_id: input.projectId,
        stage_id: input.stageId ?? null,
        name: input.name.trim(),
        file_url: input.fileUrl.trim(),
        file_type: input.fileType ?? null,
        size_bytes: input.sizeBytes ?? null,
        uploaded_by: staffProfile.user_id,
        visibility: input.visibility ?? 'staff',
      })
      .select()
      .single()

    if (error || !data) {
      return { data: null, error: error?.message ?? 'Failed to register file' }
    }

    return { data: data as EditorialFile, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { data: null, error: message }
  }
}
