import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  AiFinding,
  AiFindingFilters,
  AiFindingPatch,
  AiFindingPayload,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Persist a new AI finding tied to a project, stage, and job.
 */
export async function createFinding(
  payload: AiFindingPayload
): Promise<AiFinding> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_findings")
    .insert({
      project_id: payload.project_id,
      stage_key: payload.stage_key,
      ai_job_id: payload.ai_job_id,
      source_file_id: payload.source_file_id ?? null,
      finding_type: payload.finding_type,
      severity: payload.severity,
      title: payload.title,
      description: payload.description,
      snippet: payload.snippet ?? null,
      suggested_action: payload.suggested_action,
      status: payload.status ?? "open",
    })
    .select()
    .single();

  if (error) {
    console.error("[editorial] createFinding error:", error);
    throw new Error(`Failed to create editorial finding: ${error.message}`);
  }

  return data as AiFinding;
}

/**
 * List findings for a project, with optional filters for stage, status,
 * and severity. Results are ordered by severity (critical first) then
 * creation date (newest first).
 */
export async function listFindings(
  filters: AiFindingFilters
): Promise<AiFinding[]> {
  const supabase = getAdminClient();

  let query = supabase
    .from("editorial_ai_findings")
    .select()
    .eq("project_id", filters.project_id);

  if (filters.stage_key) {
    query = query.eq("stage_key", filters.stage_key);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }

  // Sort by severity weight then creation date
  query = query
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[editorial] listFindings error:", error);
    throw new Error(`Failed to list editorial findings: ${error.message}`);
  }

  const severityOrder: Record<string, number> = {
    critical: 0,
    major: 1,
    minor: 2,
    suggestion: 3,
  };

  return ((data ?? []) as AiFinding[]).sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
  );
}

/**
 * Apply a partial update to a finding (status, title, description,
 * or suggested_action). The DB trigger stamps updated_at automatically.
 */
export async function updateFinding(
  id: string,
  patch: AiFindingPatch
): Promise<AiFinding> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_findings")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[editorial] updateFinding error:", error);
    throw new Error(`Failed to update editorial finding: ${error.message}`);
  }

  return data as AiFinding;
}
