import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import { markAiJobStatus } from "./jobs";
import { getDefaultPrompt, buildPromptFromDefault } from "./default-prompts";
import { fetchManuscriptContent } from "./manuscript-loader";
import type { EditorialAiTaskKey, EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type {
  EditorialAnyStageKey,
  EditorialPipelineStageKey,
} from "@/lib/editorial/types/editorial";
import { runLineEditingAgent } from "./line-editing";
import { runCopyeditingAgent } from "./copyediting";
import { saveSuggestionsFromLineEditing, saveSuggestionsFromCopyediting } from "./suggestions";
import { initializeNextStage } from "@/lib/editorial/pipeline/stage-transitions";
import {
  getNextPipelineStage,
  mapPipelineStageToProjectStage,
  resolvePipelineStageKey,
} from "@/lib/editorial/pipeline/stage-compat";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import {
  getNextTransition,
  validateEditorialQuality,
  runErrorPreventionChecks,
  type OrchestratorState,
} from "@/lib/editorial/orchestrator/editorial-orchestrator";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

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
  metadata: z.record(z.string(), z.string()).nullable().describe("Metadatos adicionales especificos de la tarea"),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

function extractFirstJsonObject(rawText: string): string | null {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i) ?? rawText.match(/```\s*([\s\S]*?)```/);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = rawText.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return rawText.slice(start, index + 1);
      }
    }
  }

  return null;
}

function sanitizeJsonStringControls(value: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === "\"") {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
        continue;
      }
      if (char === "\r") {
        result += "\\r";
        continue;
      }
      if (char === "\t") {
        result += "\\t";
        continue;
      }
      if (char.charCodeAt(0) < 0x20) {
        result += " ";
        continue;
      }
    }

    result += char;
  }

  return result;
}

function fallbackAnalysisResult(rawText: string): AnalysisResult {
  const cleaned = rawText.replace(/```json|```/gi, "").replace(/\s+/g, " ").trim();
  return {
    summary:
      cleaned.slice(0, 500) ||
      "La IA devolvio una respuesta no estructurada. Conviene reintentar la etapa para obtener hallazgos trazables.",
    score: null,
    strengths: [],
    improvements: [],
    issues: [],
    recommendations: [
      "Reintentar la etapa si necesitas hallazgos estructurados antes de aprobar.",
    ],
    metadata: {
      mode: "unstructured_fallback",
    },
  };
}

function parseAnalysisResultFromRawText(rawText: string): AnalysisResult {
  const extractedJson = extractFirstJsonObject(rawText);
  if (!extractedJson) {
    return fallbackAnalysisResult(rawText);
  }

  try {
    const parsed = AnalysisResultSchema.safeParse(JSON.parse(sanitizeJsonStringControls(extractedJson)));
    if (parsed.success) return parsed.data;
  } catch {
    // ignore and fall back below
  }

  return fallbackAnalysisResult(rawText);
}

interface ProcessJobOptions {
  jobId: string;
  projectId: string;
  stageKey: EditorialPipelineStageKey;
  taskKey: EditorialAiTaskKey;
  context: EditorialAiJobContext;
  /** Pre-fetched manuscript text — avoids re-downloading for every stage. */
  manuscriptText?: string;
  /** When true, skip the auto-advance chain (caller handles orchestration). */
  skipAutoAdvance?: boolean;
}

// Re-export fetchManuscriptContent for backwards compatibility
export { fetchManuscriptContent } from "./manuscript-loader";

/**
 * Fetch a custom prompt override from the database (if it exists).
 * Uses the `editorial_ai_prompt_templates` table (script 019_ai_jobs.sql).
 * Falls back to null so the caller can use the built-in default prompt.
 */
async function fetchCustomPrompt(
  stageKey: EditorialPipelineStageKey,
  taskKey: EditorialAiTaskKey
): Promise<{ taskKey: EditorialAiTaskKey; stageKey: EditorialPipelineStageKey; systemPrompt: string; userPromptTemplate: string } | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("editorial_ai_prompt_templates")
      .select("prompt_text")
      .eq("org_id", ORG_ID)
      .eq("stage_key", stageKey)
      .eq("task_key", taskKey)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // The table stores a single prompt_text. Use the default system prompt
    // and treat prompt_text as the user prompt template.
    const defaultPrompt = getDefaultPrompt(stageKey, taskKey);
    if (!defaultPrompt) {
      console.warn(
        `[fetchCustomPrompt] No default system prompt found for ${stageKey}/${taskKey}. ` +
        `Skipping custom prompt override to avoid empty system prompt.`
      );
      return null;
    }
    return {
      taskKey,
      stageKey,
      systemPrompt: defaultPrompt.systemPrompt,
      userPromptTemplate: data.prompt_text,
    };
  } catch {
    // Table may not be migrated yet — silently fall back to default
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

      let persistedSuggestions = true;
      try {
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
      } catch (suggestionError) {
        persistedSuggestions = false;
        console.error("[editorial-ai][processor] line_editing suggestions persistence failed; continuing", {
          projectId: options.projectId,
          jobId: options.jobId,
          stageKey: options.stageKey,
          taskKey: options.taskKey,
          error:
            suggestionError instanceof Error ? suggestionError.message : "unknown_error",
        });
      }

      await markAiJobStatus({ jobId: options.jobId, status: "succeeded" });

      const analysisResult: AnalysisResult = {
        summary: result.summary,
        score: result.total_changes > 0 ? Math.max(1, 10 - Math.min(result.total_changes, 9)) : 10,
        strengths: [
          "Se generaron sugerencias de estilo y claridad sobre la version actual del manuscrito.",
        ],
        improvements: result.changes.slice(0, 5).map((change) => change.justification),
        issues: result.changes.map((change) => ({
          type:
            change.severity === "alta"
              ? "error"
              : change.severity === "media"
                ? "warning"
                : "suggestion",
          description: change.justification,
          location:
            change.location?.paragraph_index !== undefined &&
            change.location?.paragraph_index !== null
              ? `Parrafo ${change.location.paragraph_index + 1}`
              : null,
          suggestion: change.suggested_text,
        })),
        recommendations: [
          "Revisa las sugerencias, sube una version corregida y vuelve a correr la IA antes de aprobar.",
        ],
        metadata: {
          mode: "line_editing",
          total_changes: String(result.total_changes),
          suggestions_persisted: persistedSuggestions ? "true" : "false",
        },
      };

      await supabase
        .from("editorial_jobs")
        .update({
          output_ref: JSON.stringify(analysisResult),
        })
        .eq("id", options.jobId);

      return analysisResult;
    }

    if (options.taskKey === "copyediting") {
      const result = await runCopyeditingAgent({
        projectId: options.projectId,
        stageKey: options.stageKey,
        context: options.context,
      });

      let persistedSuggestions = true;
      try {
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
      } catch (suggestionError) {
        persistedSuggestions = false;
        console.error("[editorial-ai][processor] copyediting suggestions persistence failed; continuing", {
          projectId: options.projectId,
          jobId: options.jobId,
          stageKey: options.stageKey,
          taskKey: options.taskKey,
          error:
            suggestionError instanceof Error ? suggestionError.message : "unknown_error",
        });
      }

      await markAiJobStatus({ jobId: options.jobId, status: "succeeded" });

      const analysisResult: AnalysisResult = {
        summary: result.summary,
        score: result.total_changes > 0 ? Math.max(1, 10 - Math.min(result.total_changes, 9)) : 10,
        strengths: [
          "Se detectaron correcciones ortotipograficas concretas sobre la version actual del manuscrito.",
        ],
        improvements: result.changes.slice(0, 5).map((change) => change.justification),
        issues: result.changes.map((change) => ({
          type:
            change.severity === "alta"
              ? "error"
              : change.severity === "media"
                ? "warning"
                : "suggestion",
          description: change.justification,
          location:
            change.location?.paragraph_index !== undefined &&
            change.location?.paragraph_index !== null
              ? `Parrafo ${change.location.paragraph_index + 1}`
              : null,
          suggestion: change.suggested_text,
        })),
        recommendations: [
          "Corrige las observaciones ortotipograficas, sube una nueva version y repite la etapa antes de aprobar.",
        ],
        metadata: {
          mode: "copyediting",
          total_changes: String(result.total_changes),
          suggestions_persisted: persistedSuggestions ? "true" : "false",
        },
      };

      await supabase
        .from("editorial_jobs")
        .update({
          output_ref: JSON.stringify(analysisResult),
        })
        .eq("id", options.jobId);

      return analysisResult;
    }

    // Get prompt: check for custom override first, then fall back to default
    const customPrompt = await fetchCustomPrompt(options.stageKey, options.taskKey);
    const defaultPrompt = getDefaultPrompt(options.stageKey, options.taskKey);
    
    if (!customPrompt && !defaultPrompt) {
      throw new Error(`No hay prompt definido para ${options.stageKey}/${options.taskKey}`);
    }

    const activePrompt = customPrompt ?? defaultPrompt!;

    // Use pre-fetched content when available, otherwise download
    const manuscriptContent = options.manuscriptText
      ?? await fetchManuscriptContent(
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

    // Select model based on task complexity:
    // - Critical editorial stages (structure, style, orthotypography, redline) → GPT-4o (best quality)
    // - Simpler stages (metadata, export validation, layout analysis) → GPT-4o-mini (3-5x faster)
    const FAST_TASKS: EditorialAiTaskKey[] = [
      "metadata_generation",
      "export_validation",
      "layout_analysis",
      "quality_scoring",
      "typography_check",
      "page_flow_review",
    ];
    const model = FAST_TASKS.includes(options.taskKey)
      ? openai("gpt-4o-mini")
      : openai("gpt-4o");

    let analysisResult: AnalysisResult;
    try {
      const result = await generateText({
        model,
        system,
        prompt: user,
        output: Output.object({
          schema: AnalysisResultSchema,
        }),
      });

      analysisResult = (result.output as AnalysisResult) ??
        parseAnalysisResultFromRawText(result.text?.trim() ?? "");
    } catch {
      const fallbackResult = await generateText({
        model,
        system,
        prompt: `${user}\n\nSi no puedes seguir un schema exacto, devuelve un unico objeto JSON valido con las claves summary, score, strengths, improvements, issues, recommendations y metadata.`,
      });
      analysisResult = parseAnalysisResultFromRawText(fallbackResult.text?.trim() ?? "");
    }

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
      .eq("stage_key", mapPipelineStageToProjectStage(options.stageKey));

    // Auto-advance: complete this stage and initialize the next one
    // (skipped when the caller orchestrates stages in parallel)
    if (!options.skipAutoAdvance) {
      await autoAdvanceToNextStage(options.projectId, options.stageKey);
    }

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
 * Auto-advance the pipeline using orchestrator-based transition rules.
 *
 * Instead of blindly moving to the next stage, this function:
 * 1. Looks up the orchestrator's WORKFLOW_TRANSITIONS for the completed stage
 * 2. Runs quality validations when a checkpoint is defined
 * 3. Respects requiresApproval gates (stops and waits for staff)
 * 4. Runs error-prevention checks before advancing
 * 5. Falls back to simple linear progression only when no transition is defined
 */
async function autoAdvanceToNextStage(
  projectId: string,
  completedStageKey: EditorialPipelineStageKey
): Promise<void> {
  const supabase = getAdminClient();

  // Look up orchestrator transition rules
  const transition = getNextTransition(completedStageKey);
  const nextStageKey = transition?.toStage ?? getNextPipelineStage(completedStageKey);
  const completedProjectStageKey = mapPipelineStageToProjectStage(completedStageKey);

  if (!nextStageKey) {
    // Last stage (distribution) completed — mark project as finished
    await supabase
      .from("editorial_projects")
      .update({
        status: "completed",
        current_stage: completedProjectStageKey,
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
        actorId: null,
        actorRole: "system",
        payload: { autoAdvanced: true, pipelineCompleted: true },
      });
    }

    console.log(`[AI Processor] Pipeline completed for project ${projectId}`);
    return;
  }

  // ── Run orchestrator validation checkpoint if defined ──
  if (transition?.validationCheckpoint) {
    const { data: allStages } = await supabase
      .from("editorial_stages")
      .select("stage_key, status")
      .eq("project_id", projectId);

    const stageStatuses = (allStages ?? []).map((s) => ({
      stageKey: resolvePipelineStageKey(s.stage_key as EditorialAnyStageKey),
      status: s.status as "pending" | "processing" | "completed" | "approved" | "review_required" | "failed",
    }));

    if (transition.validationCheckpoint === "editorial_quality") {
      const validation = validateEditorialQuality(stageStatuses);
      if (!validation.passed) {
        const failDetails = validation.details
          .filter((d) => !d.passed)
          .map((d) => d.message)
          .join("; ");

        console.warn(
          `[AI Processor] Validation checkpoint "editorial_quality" FAILED for ${completedStageKey} → ${nextStageKey}: ${failDetails}`
        );

        await logWorkflowEvent({
          orgId: (await supabase.from("editorial_projects").select("org_id").eq("id", projectId).single()).data?.org_id ?? "",
          projectId,
          stageKey: completedStageKey,
          eventType: "stage_completed",
          actorId: null,
          actorRole: "system",
          payload: {
            autoAdvanced: false,
            blockedByValidation: transition.validationCheckpoint,
            failDetails,
          },
        });

        // Don't advance — stage stays completed but next stage doesn't start
        return;
      }
    }

    // Run error prevention checks
    const { data: projMeta } = await supabase
      .from("editorial_projects")
      .select("title, author_name, genre, language, page_estimate")
      .eq("id", projectId)
      .single();

    const blockingIssues = runErrorPreventionChecks(nextStageKey, {
      stages: stageStatuses,
      hasMetadata: Boolean(projMeta?.title && projMeta?.author_name),
      hasTrimSize: true, // Preset defaults to trade_6x9
      hasISBN: false,
      pageCount: projMeta?.page_estimate ?? 0,
    });

    const criticalIssues = blockingIssues.filter((i) => i.severity === "critical");
    if (criticalIssues.length > 0) {
      console.warn(
        `[AI Processor] Error prevention: ${criticalIssues.length} critical issue(s) block ${completedStageKey} → ${nextStageKey}`
      );

      await logWorkflowEvent({
        orgId: (await supabase.from("editorial_projects").select("org_id").eq("id", projectId).single()).data?.org_id ?? "",
        projectId,
        stageKey: completedStageKey,
        eventType: "stage_completed",
        actorId: null,
        actorRole: "system",
        payload: {
          autoAdvanced: false,
          blockedByErrors: criticalIssues.map((i) => i.message),
        },
      });

      return;
    }
  }

  // ── Respect requiresApproval gate ──
  if (transition?.requiresApproval) {
    // Mark the current stage as completed but don't auto-advance
    await supabase
      .from("editorial_projects")
      .update({ current_stage: completedProjectStageKey })
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
        actorId: null,
        actorRole: "system",
        payload: {
          autoAdvanced: false,
          requiresApproval: true,
          nextStage: nextStageKey,
        },
      });
    }

    console.log(
      `[AI Processor] Stage ${completedStageKey} completed — awaiting staff approval before advancing to ${nextStageKey}`
    );
    return;
  }

  const nextProjectStageKey = mapPipelineStageToProjectStage(nextStageKey);

  // ── Advance to next stage ──
  await supabase
    .from("editorial_projects")
    .update({ current_stage: nextProjectStageKey })
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
      actorId: null,
      actorRole: "system",
      payload: { autoAdvanced: true, nextStage: nextStageKey },
    });
  }

  // Initialize the next stage (this will queue its AI task if autoTriggerAI)
  try {
    await initializeNextStage({
      projectId,
      stageKey: nextStageKey,
      actorId: undefined,
    });

    console.log(`[AI Processor] Auto-advanced ${completedStageKey} → ${nextStageKey} for project ${projectId}`);

    // If orchestrator says auto-trigger AI, find and process the queued job
    if (transition?.autoTriggerAI !== false) {
      const { data: queuedJobs } = await supabase
        .from("editorial_jobs")
        .select("id, project_id, stage_key, job_type, input_ref")
        .eq("project_id", projectId)
        .eq("stage_key", nextStageKey)
        .eq("status", "queued")
        .order("created_at", { ascending: false })
        .limit(1);

      if (queuedJobs && queuedJobs.length > 0) {
        const nextJob = queuedJobs[0];
        const context: EditorialAiJobContext = typeof nextJob.input_ref === "string"
          ? JSON.parse(nextJob.input_ref)
          : nextJob.input_ref;

        console.log(`[AI Processor] Processing queued job ${nextJob.id} for stage ${nextStageKey}`);

        await processAiJob({
          jobId: nextJob.id,
          projectId: nextJob.project_id,
          stageKey: nextJob.stage_key as EditorialPipelineStageKey,
          taskKey: nextJob.job_type as EditorialAiTaskKey,
          context,
        });
      }
    }
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
        stageKey: job.stage_key as EditorialPipelineStageKey,
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
