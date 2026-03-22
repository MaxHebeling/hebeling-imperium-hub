import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialAiTaskKey } from "@/lib/editorial/types/ai";
import type {
  EditorialFile,
  EditorialPipelineStageKey,
  EditorialStageKey,
} from "@/lib/editorial/types/editorial";
import type {
  EditorialArtifactRole,
  EditorialFileVersion,
  EditorialFindingStatusV2,
  EditorialFindingType,
  EditorialFindingV2,
  EditorialStageRun,
  EditorialWorkflowStageKey,
  EditorialWorkflowStageStatus,
} from "@/lib/editorial/types/stage-engine";

export interface StageRunAiConfig {
  workflowStageKey: EditorialWorkflowStageKey;
  aiStageKey: EditorialPipelineStageKey | null;
  aiTaskKey: EditorialAiTaskKey | null;
}

const ACTIVE_STAGE_RUN_STATUSES: EditorialWorkflowStageStatus[] = [
  "ready",
  "ai_processing",
  "human_review",
  "changes_requested",
];

function isMissingRelationError(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("schema cache")
  );
}

export const LEGACY_PROJECT_STAGE_TO_WORKFLOW_STAGE: Record<EditorialStageKey, EditorialWorkflowStageKey> = {
  recepcion: "ingesta",
  preparacion: "diagnostico_editorial",
  correccion_linguistica: "copyediting_ortotipografia",
  edicion_editorial: "edicion_estructural",
  preprensa_kdp: "cierre_texto",
  maquetacion_interior: "diseno_interior",
  validacion_paginas: "prueba_final",
  briefing_portada: "portada",
  generacion_portada: "portada",
  marketing_editorial: "publicacion",
  entrega_final: "postpublicacion",
};

export const WORKFLOW_STAGE_AI_CONFIG: Record<EditorialWorkflowStageKey, StageRunAiConfig> = {
  ingesta: {
    workflowStageKey: "ingesta",
    aiStageKey: "ingesta",
    aiTaskKey: "manuscript_analysis",
  },
  diagnostico_editorial: {
    workflowStageKey: "diagnostico_editorial",
    aiStageKey: "ingesta",
    aiTaskKey: "quality_scoring",
  },
  edicion_estructural: {
    workflowStageKey: "edicion_estructural",
    aiStageKey: "estructura",
    aiTaskKey: "structure_analysis",
  },
  edicion_linea: {
    workflowStageKey: "edicion_linea",
    aiStageKey: "estilo",
    aiTaskKey: "line_editing",
  },
  copyediting_ortotipografia: {
    workflowStageKey: "copyediting_ortotipografia",
    aiStageKey: "ortotipografia",
    aiTaskKey: "copyediting",
  },
  cierre_texto: {
    workflowStageKey: "cierre_texto",
    aiStageKey: "revision_final",
    aiTaskKey: "redline_diff",
  },
  diseno_interior: {
    workflowStageKey: "diseno_interior",
    aiStageKey: "maquetacion",
    aiTaskKey: "layout_analysis",
  },
  portada: {
    workflowStageKey: "portada",
    aiStageKey: null,
    aiTaskKey: null,
  },
  prueba_final: {
    workflowStageKey: "prueba_final",
    aiStageKey: "export",
    aiTaskKey: "export_validation",
  },
  publicacion: {
    workflowStageKey: "publicacion",
    aiStageKey: "distribution",
    aiTaskKey: "metadata_generation",
  },
  postpublicacion: {
    workflowStageKey: "postpublicacion",
    aiStageKey: null,
    aiTaskKey: null,
  },
};

function mapEditorialFileRole(fileType: string): EditorialArtifactRole {
  if (fileType.startsWith("manuscript")) return "manuscript_original";
  if (fileType === "cover") return "cover_final";
  if (fileType.includes("proof")) return "proof_pack";
  if (fileType.includes("distribution") || fileType.includes("export")) return "distribution_asset";
  return "editorial_working";
}

export function mapLegacyStageToWorkflowStage(stageKey: EditorialStageKey): EditorialWorkflowStageKey {
  return LEGACY_PROJECT_STAGE_TO_WORKFLOW_STAGE[stageKey] ?? "ingesta";
}

export async function getActiveStageRun(
  projectId: string,
  stageKey: EditorialWorkflowStageKey
): Promise<EditorialStageRun | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_stage_runs")
    .select("*")
    .eq("project_id", projectId)
    .eq("stage_key", stageKey)
    .in("status", ACTIVE_STAGE_RUN_STATUSES)
    .order("sequence_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingRelationError(error.message)) return null;
  if (error || !data) return null;
  return data as EditorialStageRun;
}

export async function ensureStageRun(options: {
  projectId: string;
  stageKey: EditorialWorkflowStageKey;
  ownerUserId?: string | null;
  inputVersionId?: string | null;
}): Promise<EditorialStageRun | null> {
  const existing = await getActiveStageRun(options.projectId, options.stageKey);
  if (existing) return existing;

  const supabase = getAdminClient();
  const { count, error: countError } = await supabase
    .from("editorial_stage_runs")
    .select("id", { count: "exact", head: true })
    .eq("project_id", options.projectId)
    .eq("stage_key", options.stageKey);

  if (countError && isMissingRelationError(countError.message)) {
    return null;
  }

  const sequenceNumber = (count ?? 0) + 1;
  const { data, error } = await supabase
    .from("editorial_stage_runs")
    .insert({
      project_id: options.projectId,
      stage_key: options.stageKey,
      status: "ready",
      sequence_number: sequenceNumber,
      owner_user_id: options.ownerUserId ?? null,
      input_version_id: options.inputVersionId ?? null,
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error && isMissingRelationError(error.message)) {
    return null;
  }

  if (error || !data) {
    throw new Error(`Failed to ensure stage run: ${error?.message}`);
  }

  await supabase
    .from("editorial_projects")
    .update({
      current_stage_run_id: data.id,
      project_status_v2: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", options.projectId);

  return data as EditorialStageRun;
}

export async function updateStageRunStatus(options: {
  stageRunId: string;
  status: EditorialWorkflowStageStatus;
  aiSummary?: string | null;
  qualityScore?: number | null;
}): Promise<void> {
  const supabase = getAdminClient();
  const patch: Record<string, unknown> = {
    status: options.status,
    updated_at: new Date().toISOString(),
  };

  if (options.aiSummary !== undefined) patch.ai_summary = options.aiSummary;
  if (options.qualityScore !== undefined) patch.quality_score = options.qualityScore;
  if (options.status === "human_review") patch.submitted_for_review_at = new Date().toISOString();
  if (options.status === "approved" || options.status === "locked") patch.approved_at = new Date().toISOString();
  if (options.status === "failed") patch.closed_at = new Date().toISOString();

  const { error } = await supabase
    .from("editorial_stage_runs")
    .update(patch)
    .eq("id", options.stageRunId);

  if (error && isMissingRelationError(error.message)) {
    return;
  }

  if (error) {
    throw new Error(`Failed to update stage run status: ${error.message}`);
  }
}

export async function getLatestEditorialFile(projectId: string): Promise<EditorialFile | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EditorialFile;
}

export async function ensureFileVersionFromEditorialFile(options: {
  projectId: string;
  file: EditorialFile;
  stageRunId?: string | null;
  createdBy?: string | null;
}): Promise<EditorialFileVersion | null> {
  const supabase = getAdminClient();
  const fileRole = mapEditorialFileRole(options.file.file_type);
  const versionNumber = options.file.version ?? 1;

  const { data: existing, error: existingError } = await supabase
    .from("editorial_file_versions")
    .select("*")
    .eq("project_id", options.projectId)
    .eq("storage_path", options.file.storage_path)
    .limit(1)
    .maybeSingle();

  if (existingError && isMissingRelationError(existingError.message)) {
    return null;
  }

  if (existing) {
    return existing as EditorialFileVersion;
  }

  const { data, error } = await supabase
    .from("editorial_file_versions")
    .insert({
      project_id: options.projectId,
      stage_run_id: options.stageRunId ?? null,
      file_role: fileRole,
      version_number: versionNumber,
      label: options.file.file_type,
      storage_path: options.file.storage_path,
      mime_type: options.file.mime_type,
      size_bytes: options.file.size_bytes,
      created_by: options.createdBy ?? options.file.uploaded_by ?? null,
    })
    .select("*")
    .single();

  if (error && isMissingRelationError(error.message)) {
    return null;
  }

  if (error || !data) {
    throw new Error(`Failed to ensure file version: ${error?.message}`);
  }

  await supabase
    .from("editorial_projects")
    .update({
      current_version_id: data.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", options.projectId);

  return data as EditorialFileVersion;
}

export async function replaceFindingsForStageRun(options: {
  projectId: string;
  stageRunId: string;
  jobId?: string | null;
  fileVersionId?: string | null;
  findings: Array<{
    findingType: EditorialFindingType;
    severity: "info" | "warning" | "critical";
    title: string;
    description: string;
    suggestion?: string | null;
    locationRef?: Record<string, unknown> | null;
    evidenceRef?: Record<string, unknown> | null;
    status?: EditorialFindingStatusV2;
  }>;
}): Promise<EditorialFindingV2[]> {
  const supabase = getAdminClient();

  const { error: deleteError } = await supabase
    .from("editorial_findings_v2")
    .delete()
    .eq("project_id", options.projectId)
    .eq("stage_run_id", options.stageRunId);

  if (deleteError && isMissingRelationError(deleteError.message)) {
    return [];
  }

  if (options.findings.length === 0) return [];

  const { data, error } = await supabase
    .from("editorial_findings_v2")
    .insert(
      options.findings.map((finding) => ({
        project_id: options.projectId,
        stage_run_id: options.stageRunId,
        file_version_id: options.fileVersionId ?? null,
        job_id: options.jobId ?? null,
        finding_type: finding.findingType,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        suggestion: finding.suggestion ?? null,
        location_ref: finding.locationRef ?? null,
        evidence_ref: finding.evidenceRef ?? null,
        status: finding.status ?? "open",
      }))
    )
    .select("*");

  if (error && isMissingRelationError(error.message)) {
    return [];
  }

  if (error) {
    throw new Error(`Failed to replace findings for stage run: ${error.message}`);
  }

  return (data ?? []) as EditorialFindingV2[];
}
