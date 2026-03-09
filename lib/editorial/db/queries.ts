import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialComment,
  EditorialExport,
} from "../types/editorial";

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
