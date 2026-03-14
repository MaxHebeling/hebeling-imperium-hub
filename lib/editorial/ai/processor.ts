import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { getAdminClient } from "@/lib/leads/helpers";
import { markAiJobStatus } from "./jobs";
import { getDefaultPrompt, buildPromptFromDefault } from "./default-prompts";
import type { EditorialAiTaskKey, EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import { runLineEditingAgent } from "./line-editing";
import { runCopyeditingAgent } from "./copyediting";
import { saveSuggestionsFromLineEditing, saveSuggestionsFromCopyediting } from "./suggestions";
import { getNextStage } from "@/lib/editorial/pipeline/stage-utils";
import { initializeNextStage } from "@/lib/editorial/pipeline/stage-transitions";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";

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
 * Fetch a custom prompt override from the database (if it exists).
 */
async function fetchCustomPrompt(
  stageKey: EditorialStageKey,
  taskKey: EditorialAiTaskKey
): Promise<{ taskKey: EditorialAiTaskKey; stageKey: EditorialStageKey; systemPrompt: string; userPromptTemplate: string } | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("editorial_custom_prompts")
      .select("system_prompt, user_prompt_template")
      .eq("stage_key", stageKey)
      .eq("task_key", taskKey)
      .maybeSingle();

    if (error || !data) return null;

    return {
      taskKey,
      stageKey,
      systemPrompt: data.system_prompt,
      userPromptTemplate: data.user_prompt_template,
    };
  } catch {
    // Table may not exist yet — silently fall back to default
    return null;
  }
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

    // Get prompt: check for custom override first, then fall back to default
    const customPrompt = await fetchCustomPrompt(options.stageKey, options.taskKey);
    const defaultPrompt = getDefaultPrompt(options.stageKey, options.taskKey);
    
    if (!customPrompt && !defaultPrompt) {
      throw new Error(`No hay prompt definido para ${options.stageKey}/${options.taskKey}`);
    }

    const activePrompt = customPrompt ?? defaultPrompt!;

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
    const { system, user } = buildPromptFromDefault(activePrompt, truncatedContent);

    // Call AI with structured output
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
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

    // Save AI summary to stage
    await supabase
      .from("editorial_stages")
      .update({
        ai_summary: analysisResult.summary,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("project_id", options.projectId)
      .eq("stage_key", options.stageKey);

    // Auto-advance: complete this stage and initialize the next one
    await autoAdvanceToNextStage(options.projectId, options.stageKey);

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
 * Auto-advance the pipeline: after AI completes a stage, move to the next one.
 * This creates a chain where each stage's AI completion triggers the next stage.
 */
async function autoAdvanceToNextStage(
  projectId: string,
  completedStageKey: EditorialStageKey
): Promise<void> {
  const supabase = getAdminClient();
  const nextStageKey = getNextStage(completedStageKey);

  if (!nextStageKey) {
    // Last stage (distribution) completed — mark project as finished
    await supabase
      .from("editorial_projects")
      .update({
        status: "completed",
        current_stage: completedStageKey,
      })
      .eq("id", projectId);

    const { data: project } = await supabase
      .from("editorial_projects")
      .select("org_id")
      .eq("id", projectId)
      .single();

    if (project) {
      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey: completedStageKey,
        eventType: "stage_completed",
        actorId: "system",
        payload: { autoAdvanced: true, pipelineCompleted: true },
      });
    }

    console.log(`[AI Processor] Pipeline completed for project ${projectId}`);
    return;
  }

  // Update project's current_stage pointer
  await supabase
    .from("editorial_projects")
    .update({ current_stage: nextStageKey })
    .eq("id", projectId);

  const { data: project } = await supabase
    .from("editorial_projects")
    .select("org_id")
    .eq("id", projectId)
    .single();

  if (project) {
    await logWorkflowEvent({
      orgId: project.org_id,
      projectId,
      stageKey: completedStageKey,
      eventType: "stage_completed",
      actorId: "system",
      payload: { autoAdvanced: true, nextStage: nextStageKey },
    });
  }

  // Initialize the next stage (this will auto-trigger its AI task)
  try {
    await initializeNextStage({
      projectId,
      stageKey: nextStageKey,
      actorId: "system",
    });

    console.log(`[AI Processor] Auto-advanced ${completedStageKey} → ${nextStageKey} for project ${projectId}`);
  } catch (err) {
    console.error(`[AI Processor] Failed to auto-advance to ${nextStageKey}:`, err);
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
