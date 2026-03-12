import { getAdminClient } from "@/lib/leads/helpers";
import type { LineEditingResult, CopyeditingResult } from "./agent-contracts";
import type { AiTextSuggestion } from "./suggestions-types";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";

interface SaveSuggestionsContext {
  projectId: string;
  jobId: string;
  fileId: string;
  fileVersion: number;
  taskKey: EditorialAiTaskKey;
}

function mapLineEditingChangeToSuggestion(
  ctx: SaveSuggestionsContext,
  change: LineEditingResult["changes"][number]
): Omit<AiTextSuggestion, "created_at"> {
  return {
    id: change.id,
    job_id: ctx.jobId,
    project_id: ctx.projectId,
    file_id: ctx.fileId,
    file_version: ctx.fileVersion,
    task_key: ctx.taskKey,
    kind: change.kind,
    severity: change.severity,
    confidence: change.confidence,
    location: change.location,
    original_text: change.original_text,
    suggested_text: change.suggested_text,
    justification: change.justification,
    applied: false,
    applied_at: null,
    validated_by: null,
  };
}

export async function saveSuggestionsFromLineEditing(
  ctx: SaveSuggestionsContext,
  result: LineEditingResult
): Promise<number> {
  const supabase = getAdminClient();
  const rows = result.changes.map((change) => mapLineEditingChangeToSuggestion(ctx, change));

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("editorial_ai_suggestions").insert(
    rows.map((row) => ({
      project_id: row.project_id,
      job_id: row.job_id,
      file_id: row.file_id,
      file_version: row.file_version,
      task_key: row.task_key,
      kind: row.kind,
      severity: row.severity,
      confidence: row.confidence,
      location: row.location,
      original_text: row.original_text,
      suggested_text: row.suggested_text,
      justification: row.justification,
      applied: row.applied,
      applied_at: row.applied_at,
      validated_by: row.validated_by,
    }))
  );

  if (error) {
    console.error("[editorial-ai][suggestions] failed to save line_editing suggestions", {
      projectId: ctx.projectId,
      jobId: ctx.jobId,
      fileId: ctx.fileId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("No se pudieron guardar las sugerencias de line_editing.");
  }

  return rows.length;
}

export async function saveSuggestionsFromCopyediting(
  ctx: SaveSuggestionsContext,
  result: CopyeditingResult
): Promise<number> {
  const supabase = getAdminClient();

  const rows = result.changes.map((change) => ({
    project_id: ctx.projectId,
    job_id: ctx.jobId,
    file_id: ctx.fileId,
    file_version: ctx.fileVersion,
    task_key: ctx.taskKey,
    kind: change.kind,
    severity: change.severity,
    confidence: change.confidence,
    location: change.location,
    original_text: change.original_text,
    suggested_text: change.suggested_text,
    justification: change.justification,
    applied: false,
    applied_at: null,
    validated_by: null,
  }));

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("editorial_ai_suggestions").insert(rows);

  if (error) {
    console.error("[editorial-ai][suggestions] failed to save copyediting suggestions", {
      projectId: ctx.projectId,
      jobId: ctx.jobId,
      fileId: ctx.fileId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("No se pudieron guardar las sugerencias de copyediting.");
  }

  return rows.length;
}

export async function listSuggestionsForFile(options: {
  projectId: string;
  fileId: string;
  taskKey?: EditorialAiTaskKey;
  onlyPending?: boolean;
}): Promise<AiTextSuggestion[]> {
  const supabase = getAdminClient();

  let query = supabase
    .from("editorial_ai_suggestions")
    .select("*")
    .eq("project_id", options.projectId)
    .eq("file_id", options.fileId)
    .order("created_at", { ascending: true });

  if (options.taskKey) {
    query = query.eq("task_key", options.taskKey);
  }

  if (options.onlyPending) {
    query = query.eq("applied", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[editorial-ai][suggestions] listSuggestionsForFile error", {
      projectId: options.projectId,
      fileId: options.fileId,
      taskKey: options.taskKey,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data ?? []) as AiTextSuggestion[];
}

