import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialFile } from "@/lib/editorial/types/editorial";

export interface LatestManuscriptResult {
  file: EditorialFile;
}

/**
 * Find the most recent manuscript file for a project.
 *
 * For el MVP consideramos cualquier file_type que empiece por "manuscript"
 * (por ejemplo: manuscript_original, manuscript_edited).
 */
export async function getLatestManuscriptForProject(
  projectId: string
): Promise<LatestManuscriptResult | null> {
  const supabase = getAdminClient();

  // Usamos starts_with(file_type, 'manuscript') para cubrir original/edited.
  const { data, error } = await supabase
    .from("editorial_files")
    .select("*")
    .eq("project_id", projectId)
    .like("file_type", "manuscript%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[editorial-ai][process] getLatestManuscriptForProject error", {
      projectId,
      code: (error as any).code,
      message: error.message,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  return { file: data as EditorialFile };
}

