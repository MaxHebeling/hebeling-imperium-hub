import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type {
  EditorialAiFinding,
  EditorialAiFindingSeverity,
  EditorialAiFindingStatus,
  EditorialAiFindingType,
  EditorialAiFindingReference,
} from "@/lib/editorial/types/ai-findings";

export async function createAiFinding(options: {
  orgId: string;
  projectId: string;
  stageKey?: EditorialStageKey | null;
  aiJobId: string;
  sourceFileId?: string | null;
  findingType: EditorialAiFindingType;
  severity: EditorialAiFindingSeverity;
  title: string;
  description: string;
  snippet?: string | null;
  reference?: EditorialAiFindingReference | null;
  suggestedAction?: string | null;
  createdBy?: string | null;
}): Promise<EditorialAiFinding> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_ai_findings")
    .insert({
      org_id: options.orgId,
      project_id: options.projectId,
      stage_key: options.stageKey ?? null,
      ai_job_id: options.aiJobId,
      source_file_id: options.sourceFileId ?? null,
      finding_type: options.findingType,
      severity: options.severity,
      status: "open",
      title: options.title,
      description: options.description,
      snippet: options.snippet ?? null,
      reference: options.reference ?? null,
      suggested_action: options.suggestedAction ?? null,
      created_by: options.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create AI finding: ${error?.message}`);
  }

  return data as EditorialAiFinding;
}

export async function listAiFindings(options: {
  projectId: string;
  stageKey?: EditorialStageKey | null;
  status?: EditorialAiFindingStatus;
  severity?: EditorialAiFindingSeverity;
  findingType?: EditorialAiFindingType;
  limit?: number;
}): Promise<EditorialAiFinding[]> {
  const supabase = getAdminClient();
  let q = supabase.from("editorial_ai_findings").select("*").eq("project_id", options.projectId);

  if (options.stageKey) q = q.eq("stage_key", options.stageKey);
  if (options.status) q = q.eq("status", options.status);
  if (options.severity) q = q.eq("severity", options.severity);
  if (options.findingType) q = q.eq("finding_type", options.findingType);

  q = q.order("created_at", { ascending: false }).limit(options.limit ?? 200);

  const { data, error } = await q;
  if (error || !data) return [];
  return data as EditorialAiFinding[];
}

export async function updateAiFindingStatus(options: {
  findingId: string;
  status: EditorialAiFindingStatus;
  updatedBy?: string | null;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: options.status,
    updated_at: now,
  };
  // Keep audit minimal in 4B.2. If we later add decided_by/decided_at, wire it here.
  void options.updatedBy;

  const { error } = await supabase.from("editorial_ai_findings").update(patch).eq("id", options.findingId);
  if (error) {
    throw new Error(`Failed to update AI finding status: ${error.message}`);
  }
}

