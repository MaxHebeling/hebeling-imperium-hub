import { generateText, Output } from "ai";
import { z } from "zod";
import { getAdminClient } from "@/lib/leads/helpers";
import { markAiJobStatus } from "./jobs";
import { getDefaultPrompt, buildPromptFromDefault } from "./default-prompts";
import type { EditorialAiTaskKey, EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import { runLineEditingAgent } from "./line-editing";
import { runCopyeditingAgent } from "./copyediting";
import { saveSuggestionsFromLineEditing, saveSuggestionsFromCopyediting } from "./suggestions";

// Schema for structured AI output
const AnalysisResultSchema = z.object({
  summary: z.string().describe("Resumen general del analisis"),
  score: z.number().min(1).max(10).nullable().describe("Puntuacion general del 1 al 10"),
  strengths: z.array(z.string()).describe("Lista de fortalezas identificadas"),
  improvements: z.array(z.string()).describe("Lista de areas de mejora"),
  issues: z.array(z.object({
    type: z.enum(["error", "warning", "suggestion"]),
    description: z.string(),
    location: z.string().nullable(),
    suggestion: z.string().nullable(),
  })).describe("Lista de problemas encontrados"),
  recommendations: z.array(z.string()).describe("Recomendaciones especificas"),
  metadata: z.record(z.unknown()).nullable().describe("Metadatos adicionales especificos de la tarea"),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

interface ProcessJobOptions {
  jobId: string;
  projectId: string;
  stageKey: EditorialStageKey;
  taskKey: EditorialAiTaskKey;
  context: EditorialAiJobContext;
}

/**
 * Fetch manuscript content from storage
 */
async function fetchManuscriptContent(projectId: string, fileId?: string | null): Promise<string> {
  const supabase = getAdminClient();

  // Get the file record
  let fileQuery = supabase
    .from("editorial_files")
    .select("storage_path")
    .eq("project_id", projectId);

  if (fileId) {
    fileQuery = fileQuery.eq("id", fileId);
  } else {
    fileQuery = fileQuery.order("version", { ascending: false }).limit(1);
  }

  const { data: fileRecord, error: fileError } = await fileQuery.single();

  if (fileError || !fileRecord) {
    throw new Error(`No se encontro el archivo del manuscrito: ${fileError?.message}`);
  }

  // Download from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("editorial-manuscripts")
    .download(fileRecord.storage_path);

  if (downloadError || !fileData) {
    throw new Error(`Error al descargar el manuscrito: ${downloadError?.message}`);
  }

  // Convert to text - handle different file types based on storage path
  const fileName = fileRecord.storage_path.toLowerCase();
  
  if (fileName.endsWith(".txt")) {
    return await fileData.text();
  }
  
  if (fileName.endsWith(".docx")) {
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const { parseDocxToText } = await import("@/lib/editorial/docx");
      const buffer = Buffer.from(arrayBuffer);
      return await parseDocxToText(buffer);
    } catch (err) {
      console.error("[editorial-ai][processor] DOCX parse error", (err as Error).message);
      throw new Error("No se pudo extraer texto del DOCX.");
    }
  }

  if (fileName.endsWith(".pdf")) {
    // PDF extraction would require a library like pdf-parse
    // For now, return a placeholder message
    return "[Contenido PDF - extraccion pendiente de implementar]";
  }

  // Default: try to read as text
  return await fileData.text();
}

/**
 * Process a single AI job
 */
export async function processAiJob(options: ProcessJobOptions): Promise<AnalysisResult | null> {
  const supabase = getAdminClient();

  try {
    // Mark job as running
    await markAiJobStatus({ jobId: options.jobId, status: "running" });

    // Para los nuevos agentes de corrector editorial (Modo B v1) delegamos en
    // implementaciones especializadas y normalizamos sugerencias en otra tabla.
    if (options.taskKey === "line_editing") {
      const result = await runLineEditingAgent({
        projectId: options.projectId,
        stageKey: options.stageKey,
        context: options.context,
      });

      await saveSuggestionsFromLineEditing(
        {
          projectId: options.projectId,
          jobId: options.jobId,
          fileId: options.context.source_file_id ?? "",
          fileVersion: options.context.source_file_version ?? 1,
          taskKey: options.taskKey,
        },
        result
      );

      await markAiJobStatus({ jobId: options.jobId, status: "succeeded" });

      await supabase
        .from("editorial_jobs")
        .update({
          output_ref: JSON.stringify(result),
        })
        .eq("id", options.jobId);

      return null;
    }

    if (options.taskKey === "copyediting") {
      const result = await runCopyeditingAgent({
        projectId: options.projectId,
        stageKey: options.stageKey,
        context: options.context,
      });

      await saveSuggestionsFromCopyediting(
        {
          projectId: options.projectId,
          jobId: options.jobId,
          fileId: options.context.source_file_id ?? "",
          fileVersion: options.context.source_file_version ?? 1,
          taskKey: options.taskKey,
        },
        result
      );

      await markAiJobStatus({ jobId: options.jobId, status: "succeeded" });

      await supabase
        .from("editorial_jobs")
        .update({
          output_ref: JSON.stringify(result),
        })
        .eq("id", options.jobId);

      return null;
    }

    // Get default prompt for classic manuscript_analysis and similar tasks
    const defaultPrompt = getDefaultPrompt(options.stageKey, options.taskKey);
    
    if (!defaultPrompt) {
      throw new Error(`No hay prompt definido para ${options.stageKey}/${options.taskKey}`);
    }

    // Fetch manuscript content
    const manuscriptContent = await fetchManuscriptContent(
      options.projectId,
      options.context.source_file_id
    );

    // Truncate if too long (model context limits)
    const maxChars = 100000; // ~25k tokens approximately
    const truncatedContent = manuscriptContent.length > maxChars
      ? manuscriptContent.slice(0, maxChars) + "\n\n[... contenido truncado por limites de contexto ...]"
      : manuscriptContent;

    // Build the prompt
    const { system, user } = buildPromptFromDefault(defaultPrompt, truncatedContent);

    // Call AI with structured output
    const result = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: `${system}

IMPORTANTE: Debes responder con un objeto JSON valido que siga este esquema:
{
  "summary": "string - resumen del analisis",
  "score": number | null - puntuacion del 1 al 10,
  "strengths": ["string"] - lista de fortalezas,
  "improvements": ["string"] - lista de mejoras necesarias,
  "issues": [{ "type": "error|warning|suggestion", "description": "string", "location": "string|null", "suggestion": "string|null" }],
  "recommendations": ["string"] - recomendaciones,
  "metadata": {} | null - datos adicionales
}`,
      prompt: user,
      output: Output.object({
        schema: AnalysisResultSchema,
      }),
    });

    const analysisResult = result.object as AnalysisResult;

    // Mark job as succeeded (this also sets finished_at)
    await markAiJobStatus({ jobId: options.jobId, status: "succeeded" });

    // Save result output to database
    await supabase
      .from("editorial_jobs")
      .update({
        output_ref: JSON.stringify(analysisResult),
      })
      .eq("id", options.jobId);

    // Also save to stage status (ai_summary)
    await supabase
      .from("editorial_stages")
      .update({
        ai_summary: analysisResult.summary,
        status: "review_required",
      })
      .eq("project_id", options.projectId)
      .eq("stage_key", options.stageKey);

    return analysisResult;
  } catch (error) {
    // Mark job as failed
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    await markAiJobStatus({
      jobId: options.jobId,
      status: "failed",
      errorLog: errorMessage,
    });

    throw error;
  }
}

/**
 * Get pending jobs and process them
 */
export async function processPendingJobs(limit = 5): Promise<{ processed: number; failed: number }> {
  const supabase = getAdminClient();

  // Get queued jobs
  const { data: jobs, error } = await supabase
    .from("editorial_jobs")
    .select("id, project_id, stage_key, job_type, input_ref")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !jobs) {
    console.error("[AI Processor] Error fetching jobs:", error);
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const context: EditorialAiJobContext = typeof job.input_ref === "string"
        ? JSON.parse(job.input_ref)
        : job.input_ref;

      await processAiJob({
        jobId: job.id,
        projectId: job.project_id,
        stageKey: job.stage_key as EditorialStageKey,
        taskKey: job.job_type as EditorialAiTaskKey,
        context,
      });

      processed++;
    } catch (err) {
      console.error(`[AI Processor] Error processing job ${job.id}:`, err);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Get job result
 */
export async function getJobResult(jobId: string): Promise<AnalysisResult | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_jobs")
    .select("output_ref, status")
    .eq("id", jobId)
    .single();

  if (error || !data || data.status !== "completed") {
    return null;
  }

  if (!data.output_ref) {
    return null;
  }

  return typeof data.output_ref === "string"
    ? JSON.parse(data.output_ref)
    : data.output_ref as AnalysisResult;
}
