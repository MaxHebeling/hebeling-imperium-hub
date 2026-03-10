// =============================================================================
// Export Service
// Editorial Publishing Engine · Phase 7
// =============================================================================
// Manages editorial_export_runs lifecycle:
//   queued → running → completed | failed | cancelled
//
// Actual file generation (Pandoc, WeasyPrint, Calibre) is out-of-scope for
// this layer — this service handles the database lifecycle only. A background
// worker or edge function calls `startExportRun` + `completeExportRun` /
// `failExportRun` once the file is generated.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialExportRun,
  ExportRunStatus,
  CreateExportRunInput,
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
 * Creates a new export run record in `queued` status.
 * Call `validatePublishingReadiness()` before invoking this function.
 */
export async function createExportRun(
  input: CreateExportRunInput
): Promise<EditorialExportRun> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_export_runs")
    .insert({
      project_id: input.project_id,
      publication_version_id: input.publication_version_id,
      format: input.format,
      status: "queued",
      engine: input.engine ?? null,
      engine_version: input.engine_version ?? null,
      export_config: input.export_config ?? {},
      initiated_by: input.initiated_by ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[export-service] createExportRun failed: ${error.message}`);
  }
  return data as EditorialExportRun;
}

/**
 * Transitions a run to `running` and records the start timestamp.
 */
export async function startExportRun(runId: string): Promise<EditorialExportRun> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_export_runs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", runId)
    .select()
    .single();

  if (error) throw new Error(`[export-service] startExportRun(${runId}) failed: ${error.message}`);
  return data as EditorialExportRun;
}

/**
 * Marks a run as `completed` and records the output file reference.
 */
export async function completeExportRun(
  runId: string,
  output: {
    file_url: string;
    storage_path?: string;
    size_bytes?: number;
    engine?: string;
    engine_version?: string;
  }
): Promise<EditorialExportRun> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_export_runs")
    .update({
      status: "completed",
      finished_at: new Date().toISOString(),
      output_file_url: output.file_url,
      output_storage_path: output.storage_path ?? null,
      output_size_bytes: output.size_bytes ?? null,
      engine: output.engine ?? null,
      engine_version: output.engine_version ?? null,
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    throw new Error(`[export-service] completeExportRun(${runId}) failed: ${error.message}`);
  }
  return data as EditorialExportRun;
}

/**
 * Marks a run as `failed` with error details.
 */
export async function failExportRun(
  runId: string,
  errorMessage: string,
  errorDetails?: Record<string, unknown>
): Promise<EditorialExportRun> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_export_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: errorMessage,
      error_details: errorDetails ?? null,
    })
    .eq("id", runId)
    .select()
    .single();

  if (error) {
    throw new Error(`[export-service] failExportRun(${runId}) failed: ${error.message}`);
  }
  return data as EditorialExportRun;
}

/**
 * Returns all export runs for a publication version, newest first.
 */
export async function listExportRuns(
  publicationVersionId: string
): Promise<EditorialExportRun[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_export_runs")
    .select("*")
    .eq("publication_version_id", publicationVersionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[export-service] listExportRuns failed: ${error.message}`);
  }
  return (data ?? []) as EditorialExportRun[];
}

/**
 * Returns all export runs for a project across all publication versions.
 */
export async function listProjectExportRuns(
  projectId: string,
  limit = 50
): Promise<EditorialExportRun[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_export_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[export-service] listProjectExportRuns failed: ${error.message}`);
  }
  return (data ?? []) as EditorialExportRun[];
}

/**
 * Cancels a queued or running export run.
 */
export async function cancelExportRun(runId: string): Promise<EditorialExportRun> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_export_runs")
    .update({
      status: "cancelled" as ExportRunStatus,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .in("status", ["queued", "running"])
    .select()
    .single();

  if (error) {
    throw new Error(`[export-service] cancelExportRun(${runId}) failed: ${error.message}`);
  }
  return data as EditorialExportRun;
}
