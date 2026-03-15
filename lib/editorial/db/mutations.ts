import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import type {
  EditorialProject,
  EditorialFile,
  EditorialFileVisibility,
  EditorialStageKey,
} from "../types/editorial";
import { EDITORIAL_STAGE_KEYS } from "../pipeline/constants";
import { calculateProgressPercent } from "../pipeline/progress";
import { initializeProjectWorkflow } from "../workflow/professional";

export interface CreateEditorialProjectInput {
  title: string;
  subtitle?: string;
  author_name?: string;
  language?: string;
  genre?: string;
  target_audience?: string;
  client_id?: string;
  created_by?: string;
  service_type?: string;
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

  // Create one stage record per pipeline stage (only for existing stages in the database)
  // export and distribution are handled separately or may need a migration
  const stageKeys = EDITORIAL_STAGE_KEYS.filter(
    (key) => key !== "export" && key !== "distribution"
  );
  
  const stageRows = stageKeys.map((key) => ({
    project_id: project.id,
    stage_key: key,
    status: "pending",
  }));

  const { error: stagesError } = await supabase
    .from("editorial_stages")
    .insert(stageRows);

  if (stagesError) {
    console.error("[v0] Stages error details:", {
      code: stagesError.code,
      message: stagesError.message,
      details: stagesError.details,
      hint: stagesError.hint,
      stageRows,
    });
    throw new Error(`Failed to create editorial stages: ${stagesError.message}`);
  }

  // Ensure the creator is a member so RLS ep_member_read can see the project.
  if (project.created_by) {
    const now = new Date().toISOString();
    const { error: memberError } = await supabase
      .from("editorial_project_members")
      .insert({
        project_id: project.id,
        user_id: project.created_by,
        role: "owner",
        invited_at: now,
      });

    if (memberError) {
      console.error("[editorial] Failed to create project membership", {
        projectId: project.id,
        created_by: project.created_by,
        code: memberError.code,
        message: memberError.message,
        details: memberError.details,
        hint: memberError.hint,
      });
      // Do not throw: project itself was created successfully.
    }
  }

  // Initialize the professional workflow (11-phase system) so both the legacy
  // 6-stage view and the new workflow view start from the same known state.
  try {
    await initializeProjectWorkflow(project.id, "intake", "manuscript_upload");
  } catch (wfErr) {
    console.error("[editorial] Failed to initialize professional workflow", {
      projectId: project.id,
      error: wfErr instanceof Error ? wfErr.message : wfErr,
    });
    // Do not throw: the project and stages were created successfully.
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

export async function registerEditorialFile(options: {
  projectId: string;
  stageKey?: EditorialStageKey | null;
  fileType: string;
  version: number;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: string;
  visibility: EditorialFileVisibility;
}): Promise<EditorialFile> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_files")
    .insert({
      project_id: options.projectId,
      stage_key: options.stageKey ?? null,
      file_type: options.fileType,
      version: options.version,
      storage_path: options.storagePath,
      mime_type: options.mimeType,
      size_bytes: options.sizeBytes,
      uploaded_by: options.uploadedBy ?? null,
      visibility: options.visibility,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to register file: ${error?.message}`);
  }
  return data as EditorialFile;
}

export async function createEditorialComment(options: {
  projectId: string;
  stageKey?: EditorialStageKey | null;
  comment: string;
  visibility: "internal" | "client" | "public";
  authorType: string;
  authorId?: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("editorial_comments").insert({
    project_id: options.projectId,
    stage_key: options.stageKey ?? null,
    author_type: options.authorType,
    author_id: options.authorId ?? null,
    comment: options.comment,
    visibility: options.visibility,
  });
  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }
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

export async function approveStage(options: {
  projectId: string;
  stageKey: string;
  actorId?: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("editorial_stages")
    .update({
      status: "approved",
      approved_at: now,
      approved_by: options.actorId ?? null,
      completed_at: now,
    })
    .eq("project_id", options.projectId)
    .eq("stage_key", options.stageKey);

  if (error) {
    throw new Error(`Failed to approve stage: ${error.message}`);
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

export async function upsertProjectMember(options: {
  projectId: string;
  userId: string;
  role: "author" | "reviewer" | "editor";
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("editorial_project_members")
    .upsert(
      {
        project_id: options.projectId,
        user_id: options.userId,
        role: options.role,
        
      },
      { onConflict: "project_id,user_id" }
    );
  if (error) {
    throw new Error(`Failed to assign member: ${error.message}`);
  }
}

export async function upsertStaffAssignment(options: {
  projectId: string;
  userId: string;
  role: "manager" | "editor" | "reviewer" | "proofreader" | "designer";
  assignedBy?: string;
}): Promise<void> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("editorial_project_staff_assignments")
    .upsert(
      {
        project_id: options.projectId,
        user_id: options.userId,
        role: options.role,
        assigned_by: options.assignedBy ?? null,
        assigned_at: now,
      },
      { onConflict: "project_id,role" }
    );
  if (error) {
    throw new Error(`Failed to assign staff: ${error.message}`);
  }
}

export async function deleteEditorialProject(projectId: string): Promise<void> {
  const supabase = getAdminClient();

  /**
   * IMPORTANT:
   * Production DB does not include `editorial_project_staff_assignments` yet.
   * Deleting from non-existent tables fails with: "Could not find the table ... in the schema cache".
   *
   * We rely on FK ON DELETE CASCADE from real child tables to clean up dependents.
   */
  const { error: projectError } = await supabase
    .from("editorial_projects")
    .delete()
    .eq("id", projectId);

  if (projectError) {
    throw new Error(`Failed to delete editorial project: ${projectError.message}`);
  }
}
