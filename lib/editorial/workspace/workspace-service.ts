// =============================================================================
// Workspace Service
// Editorial AI Workspace · Phase 6
// =============================================================================
// Loads the full context a workspace page needs in a single call:
//   - project metadata
//   - current stage
//   - latest document version for that stage
//   - active edit session for the current user (if any)
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialProject,
  EditorialStage,
  EditorialDocumentVersion,
  EditorialEditSession,
  WorkspaceContext,
  CreateEditSessionInput,
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
 * Loads the full workspace context for a project + stage + editor.
 * Safe to call from Server Components — uses the service-role client.
 */
export async function loadWorkspaceContext(
  projectId: string,
  stage: EditorialStage,
  editorId: string
): Promise<WorkspaceContext> {
  const db = getAdminClient();

  // Run project, latest version, and active session fetches in parallel
  const [projectResult, versionResult, sessionResult] = await Promise.all([
    db
      .from("editorial_projects")
      .select("*")
      .eq("id", projectId)
      .single(),

    db
      .from("editorial_document_versions")
      .select("*")
      .eq("project_id", projectId)
      .eq("stage", stage)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle(),

    db
      .from("editorial_edit_sessions")
      .select("*")
      .eq("project_id", projectId)
      .eq("stage", stage)
      .eq("editor_id", editorId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (projectResult.error || !projectResult.data) {
    throw new Error(
      `[workspace-service] Project ${projectId} not found: ${projectResult.error?.message ?? "no data"}`
    );
  }

  return {
    project: projectResult.data as EditorialProject,
    stage,
    currentVersion: (versionResult.data as EditorialDocumentVersion) ?? null,
    activeSession: (sessionResult.data as EditorialEditSession) ?? null,
  };
}

/**
 * Opens a new edit session for the current editor, or returns the existing
 * active session if one is already open for this project + stage.
 */
export async function openEditSession(
  input: CreateEditSessionInput
): Promise<EditorialEditSession> {
  const db = getAdminClient();

  // Check for existing open session
  const { data: existing } = await db
    .from("editorial_edit_sessions")
    .select("*")
    .eq("project_id", input.project_id)
    .eq("stage", input.stage)
    .eq("editor_id", input.editor_id)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Refresh last_active_at
    await db
      .from("editorial_edit_sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing as EditorialEditSession;
  }

  const { data, error } = await db
    .from("editorial_edit_sessions")
    .insert({
      project_id: input.project_id,
      stage: input.stage,
      editor_id: input.editor_id,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[workspace-service] openEditSession failed: ${error.message}`);
  }
  return data as EditorialEditSession;
}

/**
 * Closes an active edit session (sets ended_at to now).
 */
export async function closeEditSession(sessionId: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from("editorial_edit_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    console.error(`[workspace-service] closeEditSession(${sessionId}) failed:`, error.message);
  }
}

/**
 * Returns the list of editorial projects accessible to the given org,
 * for use in workspace navigation.
 */
export async function listWorkspaceProjects(orgId: string): Promise<EditorialProject[]> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_projects")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[workspace-service] listWorkspaceProjects failed: ${error.message}`);
  }
  return (data ?? []) as EditorialProject[];
}
