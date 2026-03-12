import { generateText, Output } from "ai";
import { z } from "zod";
import { getAdminClient } from "@/lib/leads/helpers";
import { markAiJobStatus } from "./jobs";
import { getDefaultPrompt, buildPromptFromDefault } from "./default-prompts";
import type { EditorialAiTaskKey, EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

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
    .select("storage_path, file_name")
    .eq("project_id", projectId);

  if (fileId) {
    fileQuery = fileQuery.eq("id", fileId);
  } else {
    fileQuery = fileQuery.order("version_number", { ascending: false }).limit(1);
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

  // Convert to text - handle different file types
  const fileName = fileRecord.file_name.toLowerCase();
  
  if (fileName.endsWith(".txt")) {
    return await fileData.text();
  }
  
  if (fileName.endsWith(".docx")) {
    // For DOCX, we extract text content
    // In production, you might want to use a library like mammoth
    // For now, we'll try to extract plain text
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const text = await extractTextFromDocx(arrayBuffer);
      return text;
    } catch {
      // Fallback: try to read as text
      return await fileData.text();
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
 * Simple DOCX text extraction
 * Note: For production, consider using mammoth.js
 */
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  // DOCX is a ZIP file containing XML
  // This is a simplified extraction that looks for text in the document.xml
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder("utf-8");
  const content = decoder.decode(uint8Array);
  
  // Try to find and extract text between <w:t> tags (Word text elements)
  const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  
  if (textMatches) {
    return textMatches
      .map(match => match.replace(/<[^>]+>/g, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Fallback: strip all XML tags
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Process a single AI job
 */
export async function processAiJob(options: ProcessJobOptions): Promise<AnalysisResult> {
  const supabase = getAdminClient();

  try {
    // Mark job as running
    await markAiJobStatus({ jobId: options.jobId, status: "running" });

    // Get default prompt for this task
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

    // Save result to database
    await supabase
      .from("editorial_jobs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
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

    // Mark job as succeeded
    await markAiJobStatus({ jobId: options.jobId, status: "succeeded" });

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
