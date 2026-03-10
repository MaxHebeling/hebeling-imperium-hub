// =============================================================================
// Manuscript Content Service
// Editorial AI Workspace · Phase 6
// =============================================================================
// Manages document version snapshots (read + write).
// Each save creates an immutable version row so the full history is preserved.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialDocumentVersion,
  EditorialStage,
  CreateDocumentVersionInput,
  DocumentVersionSource,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the latest document version for a project + stage.
 * Returns null when no content has been saved yet.
 */
export async function getLatestVersion(
  projectId: string,
  stage: EditorialStage
): Promise<EditorialDocumentVersion | null> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_document_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("stage", stage)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[manuscript-content-service] getLatestVersion failed: ${error.message}`
    );
  }
  return (data as EditorialDocumentVersion) ?? null;
}

/**
 * Returns a specific version by its numeric ID.
 */
export async function getVersionByNumber(
  projectId: string,
  stage: EditorialStage,
  versionNumber: number
): Promise<EditorialDocumentVersion | null> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_document_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("stage", stage)
    .eq("version_number", versionNumber)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[manuscript-content-service] getVersionByNumber failed: ${error.message}`
    );
  }
  return (data as EditorialDocumentVersion) ?? null;
}

/**
 * Returns the full version history for a project + stage, newest first.
 * Used by the WorkspaceHistoryPanel.
 */
export async function listVersionHistory(
  projectId: string,
  stage: EditorialStage,
  limit = 50
): Promise<EditorialDocumentVersion[]> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_document_versions")
    .select("id, project_id, stage, version_number, source, job_run_id, created_by, created_at")
    .eq("project_id", projectId)
    .eq("stage", stage)
    .order("version_number", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `[manuscript-content-service] listVersionHistory failed: ${error.message}`
    );
  }
  // content is omitted in list view to keep payloads small
  return (data ?? []) as EditorialDocumentVersion[];
}

/**
 * Saves a new version snapshot.
 *
 * Automatically computes the next version_number for the (project, stage) pair
 * using a SELECT MAX + 1 pattern (safe for single-writer; add a DB sequence
 * when concurrent writes become a concern).
 */
export async function saveVersion(
  input: CreateDocumentVersionInput
): Promise<EditorialDocumentVersion> {
  const db = getAdminClient();

  // Compute next version number
  const { data: maxRow } = await db
    .from("editorial_document_versions")
    .select("version_number")
    .eq("project_id", input.project_id)
    .eq("stage", input.stage)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = maxRow ? (maxRow as { version_number: number }).version_number + 1 : 1;

  const { data, error } = await db
    .from("editorial_document_versions")
    .insert({
      project_id: input.project_id,
      stage: input.stage,
      version_number: nextVersion,
      content: input.content,
      source: input.source,
      job_run_id: input.job_run_id ?? null,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[manuscript-content-service] saveVersion failed: ${error.message}`);
  }
  return data as EditorialDocumentVersion;
}

/**
 * Restores a previous version by creating a new version whose content
 * matches the specified version_number and source = 'restore'.
 */
export async function restoreVersion(
  projectId: string,
  stage: EditorialStage,
  targetVersionNumber: number,
  restoredBy: string
): Promise<EditorialDocumentVersion> {
  const target = await getVersionByNumber(projectId, stage, targetVersionNumber);
  if (!target) {
    throw new Error(
      `[manuscript-content-service] Version ${targetVersionNumber} not found for project ${projectId}/${stage}`
    );
  }

  return saveVersion({
    project_id: projectId,
    stage,
    content: target.content,
    source: "restore" as DocumentVersionSource,
    created_by: restoredBy,
  });
}
