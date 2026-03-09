import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import type { EditorialProject, EditorialFile, EditorialFileVisibility, EditorialStageKey } from "../types/editorial";
import { EDITORIAL_STAGE_KEYS } from "../pipeline/constants";
import { calculateProgressPercent } from "../pipeline/progress";

export interface CreateEditorialProjectInput {
  title: string;
  subtitle?: string;
  author_name?: string;
  language?: string;
  genre?: string;
  target_audience?: string;
  client_id?: string;
  created_by?: string;
}

export async function createEditorialProject(
  input: CreateEditorialProjectInput
): Promise<EditorialProject> {
  const supabase = getAdminClient();

  const { data: project, error } = await supabase
    .from("editorial_projects")
    .insert({
      org_id: ORG_ID,
      client_id: input.client_id ?? null,
      title: input.title,
      subtitle: input.subtitle ?? null,
      author_name: input.author_name ?? null,
      language: input.language ?? "es",
      genre: input.genre ?? null,
      target_audience: input.target_audience ?? null,
      current_stage: "ingesta",
      status: "created",
      progress_percent: 0,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();

  if (error || !project) {
    throw new Error(`Failed to create editorial project: ${error?.message}`);
  }

  // Create one stage record per pipeline stage
  const stageRows = EDITORIAL_STAGE_KEYS.map((key) => ({
    project_id: project.id,
    stage_key: key,
    status: "pending",
  }));

  const { error: stagesError } = await supabase
    .from("editorial_stages")
    .insert(stageRows);

  if (stagesError) {
    throw new Error(`Failed to create editorial stages: ${stagesError.message}`);
  }

  return project as EditorialProject;
}

export async function registerManuscriptFile(
  projectId: string,
  storagePath: string,
  mimeType: string,
  sizeBytes: number,
  uploadedBy?: string,
  version = 1,
  visibility: EditorialFileVisibility = "client"
): Promise<EditorialFile> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_files")
    .insert({
      project_id: projectId,
      stage_key: "ingesta",
      file_type: "manuscript_original",
      version,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      uploaded_by: uploadedBy ?? null,
      visibility,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to register file: ${error?.message}`);
  }

  return data as EditorialFile;
}

export async function logEditorialActivity(
  projectId: string,
  eventType: string,
  options?: {
    stageKey?: string;
    actorId?: string;
    actorType?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = getAdminClient();
  await supabase.from("editorial_activity_log").insert({
    project_id: projectId,
    stage_key: options?.stageKey ?? null,
    event_type: eventType,
    actor_id: options?.actorId ?? null,
    actor_type: options?.actorType ?? null,
    payload: options?.payload ?? null,
  });
}

export async function updateStageStatus(
  projectId: string,
  stageKey: string,
  status: string
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("editorial_stages")
    .update({ status })
    .eq("project_id", projectId)
    .eq("stage_key", stageKey);

  if (error) {
    throw new Error(`Failed to update stage status: ${error.message}`);
  }
}

export async function advanceProjectStage(
  projectId: string,
  stageKey: string
): Promise<void> {
  const supabase = getAdminClient();
  const progress = calculateProgressPercent(stageKey as EditorialStageKey);
  const { error } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: stageKey,
      progress_percent: progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(`Failed to advance project stage: ${error.message}`);
  }
}
