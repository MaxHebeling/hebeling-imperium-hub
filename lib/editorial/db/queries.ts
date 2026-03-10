import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialComment,
  EditorialExport,
  EditorialActivityLogEntry,
} from "../types/editorial";

/** Profile row for staff display (creator/assignee). */
export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

// ---------------------------------------------------------------------------
// Staff queries (full access)
// ---------------------------------------------------------------------------

export async function getEditorialProject(projectId: string): Promise<EditorialProject | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error) return null;
  return data as EditorialProject;
}

export async function listEditorialProjects(orgId: string): Promise<EditorialProject[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_projects")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialProject[];
}

export async function getProjectStages(projectId: string): Promise<EditorialStage[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_stages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as EditorialStage[];
}

/** All files for a project (staff: all visibilities). */
export async function getProjectFiles(projectId: string): Promise<EditorialFile[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialFile[];
}

export async function getEditorialFile(fileId: string): Promise<EditorialFile | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("id", fileId)
    .single();
  if (error || !data) return null;
  return data as EditorialFile;
}

/** All comments for a project (staff: all visibilities — internal, client, and public). */
export async function getProjectComments(projectId: string): Promise<EditorialComment[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialComment[];
}

export async function getProjectExports(projectId: string): Promise<EditorialExport[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_exports")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialExport[];
}

// ---------------------------------------------------------------------------
// Client/author queries (filtered access – no internal data exposed)
// ---------------------------------------------------------------------------

/**
 * List all editorial projects that belong to a given client (by their user id).
 * client_id in editorial_projects = profiles.id of the authenticated user.
 */
export async function listClientEditorialProjects(
  clientId: string
): Promise<EditorialProject[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialProject[];
}

/**
 * Get a single editorial project, verifying it belongs to the given client.
 * Returns null if not found or ownership mismatch.
 */
export async function getClientEditorialProject(
  projectId: string,
  clientId: string
): Promise<EditorialProject | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_projects")
    .select("*")
    .eq("id", projectId)
    .eq("client_id", clientId)
    .single();
  if (error) return null;
  return data as EditorialProject;
}

/** Files visible to the client: visibility = 'client' or 'public'. */
export async function getClientProjectFiles(projectId: string): Promise<EditorialFile[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .in("visibility", ["client", "public"])
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialFile[];
}

/** Comments visible to the client: visibility = 'client' or 'public'. */
export async function getClientProjectComments(
  projectId: string
): Promise<EditorialComment[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_comments")
    .select("*")
    .eq("project_id", projectId)
    .in("visibility", ["client", "public"])
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialComment[];
}

/** Exports that are ready (status = 'ready'). */
export async function getClientProjectExports(
  projectId: string
): Promise<EditorialExport[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_exports")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "ready")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as EditorialExport[];
}

/**
 * Get the highest version number for a specific file_type in a project.
 * Used to calculate the next version number on upload.
 */
export async function getLatestFileVersion(
  projectId: string,
  fileType: string
): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_files")
    .select("version")
    .eq("project_id", projectId)
    .eq("file_type", fileType)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return 0;
  return data.version as number;
}

// ---------------------------------------------------------------------------
// Staff helpers (profiles, activity)
// ---------------------------------------------------------------------------

/** Fetch profiles by id for staff display (creator/assignee labels). */
export async function getProfilesByIds(
  ids: string[]
): Promise<ProfileRow[]> {
  if (ids.length === 0) return [];
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);
  if (error) return [];
  return (data ?? []) as ProfileRow[];
}

export async function getProfileByEmail(email: string): Promise<ProfileRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProfileRow;
}

/** Latest activity for a project (audit trail). */
export async function getProjectActivity(
  projectId: string,
  limit = 30
): Promise<EditorialActivityLogEntry[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_activity_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as EditorialActivityLogEntry[];
}

/** Member row for staff: project membership (author, reviewer, editor). */
export interface EditorialProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
}

/** All members of a project (staff view). */
export async function getProjectMembers(
  projectId: string
): Promise<EditorialProjectMemberRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_members")
    .select("*")
    .eq("project_id", projectId);
  if (error) return [];
  return (data ?? []) as EditorialProjectMemberRow[];
}

export interface EditorialProjectStaffAssignmentRow {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  assigned_by: string | null;
  assigned_at: string;
}

export async function getProjectStaffAssignments(
  projectId: string
): Promise<EditorialProjectStaffAssignmentRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_project_staff_assignments")
    .select("*")
    .eq("project_id", projectId);
  if (error) return [];
  return (data ?? []) as EditorialProjectStaffAssignmentRow[];
}
