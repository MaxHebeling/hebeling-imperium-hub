import { getAdminClient } from "@/lib/leads/helpers";
import type {
  EditorialProject,
  EditorialStage,
  EditorialFile,
  EditorialComment,
  EditorialExport,
} from "../types/editorial";

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

export async function getProjectComments(projectId: string): Promise<EditorialComment[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_comments")
    .select("*")
    .eq("project_id", projectId)
    .eq("visibility", "internal")
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
