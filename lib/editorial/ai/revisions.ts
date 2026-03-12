import { getAdminClient } from "@/lib/leads/helpers";

export interface CreateRevisionInput {
  projectId: string;
  sourceFileId: string;
  sourceFileVersion: number;
  resultFileId: string;
  resultFileVersion: number;
  appliedSuggestionIds: string[];
  appliedBy?: string;
}

export async function createRevisionFromSuggestions(input: CreateRevisionInput): Promise<string> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_ai_revisions")
    .insert({
      project_id: input.projectId,
      source_file_id: input.sourceFileId,
      source_file_version: input.sourceFileVersion,
      result_file_id: input.resultFileId,
      result_file_version: input.resultFileVersion,
      applied_suggestions: input.appliedSuggestionIds,
      status: "draft",
      applied_by: input.appliedBy ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[editorial-ai][revisions] failed to create revision", {
      projectId: input.projectId,
      sourceFileId: input.sourceFileId,
      resultFileId: input.resultFileId,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("No se pudo registrar la revisión de IA.");
  }

  return data.id as string;
}

