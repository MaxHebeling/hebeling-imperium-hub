import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialFile } from "@/lib/editorial/types/editorial";

export interface LatestManuscriptResult {
  file: EditorialFile;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

/**
 * Find the most recent manuscript file for a project.
 *
 * For el MVP consideramos cualquier file_type textual procesable:
 * - manuscript_original
 * - manuscript_edited
 * - working_file
 */
export async function getLatestManuscriptForProject(
  projectId: string
): Promise<LatestManuscriptResult | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .or("file_type.like.manuscript%,file_type.eq.working_file")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[editorial-ai][process] getLatestManuscriptForProject error", {
      projectId,
      code: getErrorCode(error),
      message: error.message,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return { file: data as EditorialFile };
}
