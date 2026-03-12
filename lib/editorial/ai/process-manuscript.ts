import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey, EditorialFile } from "@/lib/editorial/types/editorial";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import { extractManuscriptText } from "@/lib/editorial/files/extract-text";
import { runEditorialManuscriptAnalysis, type EditorialManuscriptAnalysis } from "@/lib/editorial/ai/openai";

export interface ProcessManuscriptJobResult {
  jobId: string;
  file: EditorialFile;
  analysis: EditorialManuscriptAnalysis;
}

const MANUSCRIPT_STAGE_KEY: EditorialStageKey = "ingesta";

export async function processManuscriptNow(options: {
  projectId: string;
  orgId: string;
  requestedBy: string;
}): Promise<ProcessManuscriptJobResult> {
  const supabase = getAdminClient();
  const { projectId, orgId, requestedBy } = options;

  console.info("[editorial-ai][process] start", {
    projectId,
    orgId,
    requestedBy,
  });

  const latest = await getLatestManuscriptForProject(projectId);
  if (!latest) {
    console.info("[editorial-ai][process] no manuscript found", { projectId });
    throw new Error("No se encontró ningún manuscrito para este proyecto.");
  }

  const file = latest.file;

  // Creamos el job en editorial_jobs con estado queued.
  const context = {
    project_id: projectId,
    stage_key: MANUSCRIPT_STAGE_KEY,
    source_file_id: file.id,
    source_file_version: file.version,
    requested_by: requestedBy,
  };

  const { data: jobRow, error: jobError } = await supabase
    .from("editorial_jobs")
    .insert({
      project_id: projectId,
      stage_key: MANUSCRIPT_STAGE_KEY,
      job_type: "manuscript_analysis",
      provider: "openai",
      status: "queued",
      input_ref: JSON.stringify(context),
    })
    .select("*")
    .single();

  if (jobError || !jobRow) {
    console.error("[editorial-ai][process] job insert error", {
      projectId,
      code: jobError?.code,
      message: jobError?.message,
    });
    throw new Error("No se pudo crear el job de análisis editorial.");
  }

  const jobId = jobRow.id as string;

  // Marcamos como processing
  await supabase
    .from("editorial_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    // 1) Extraer texto del manuscrito
    const extracted = await extractManuscriptText(file);

    // 2) Ejecutar análisis con OpenAI
    const analysis = await runEditorialManuscriptAnalysis(extracted);

    // 3) Guardar resultado en editorial_jobs.output_ref
    await supabase
      .from("editorial_jobs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        output_ref: JSON.stringify(analysis),
        error_log: null,
      })
      .eq("id", jobId);

    console.info("[editorial-ai][process] completed", {
      projectId,
      jobId,
    });

    return {
      jobId,
      file,
      analysis,
    };
  } catch (error) {
    console.error("[editorial-ai][process] failed", {
      projectId,
      jobId,
      message: (error as Error).message,
    });

    await supabase
      .from("editorial_jobs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_log: (error as Error).message,
      })
      .eq("id", jobId);

    throw error;
  }
}

