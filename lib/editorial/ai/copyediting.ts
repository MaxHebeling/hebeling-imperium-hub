import { generateText, Output } from "ai";
import { z } from "zod";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";
import { getActivePromptTemplate, buildPrompt } from "./prompts";
import type { CopyeditingResult } from "./agent-contracts";

const CopyeditingSchema = z.object({
  summary: z.string(),
  total_changes: z.number().int().nonnegative(),
  changes: z.array(
    z.object({
      id: z.string(),
      kind: z.string().default("gramatica"),
      severity: z.enum(["baja", "media", "alta"]),
      confidence: z.number().min(0).max(1),
      location: z.object({
        chapter: z.number().int().nonnegative().nullable().optional(),
        section_id: z.string().nullable().optional(),
        paragraph_index: z.number().int().nonnegative().nullable().optional(),
        sentence_index: z.number().int().nonnegative().nullable().optional(),
        offset_start: z.number().int().nonnegative().nullable().optional(),
        offset_end: z.number().int().nonnegative().nullable().optional(),
      }),
      original_text: z.string(),
      suggested_text: z.string(),
      justification: z.string(),
    })
  ),
});

export async function runCopyeditingAgent(options: {
  projectId: string;
  stageKey: EditorialStageKey;
  context: EditorialAiJobContext;
}): Promise<CopyeditingResult> {
  const supabase = getAdminClient();

  const template = await getActivePromptTemplate({
    orgId: options.projectId, // TODO: usar orgId real cuando esté disponible en el contexto
    stageKey: options.stageKey,
    taskKey: "copyediting",
  });

  if (!template) {
    throw new Error("No hay un prompt de AI activo para copyediting en esta etapa.");
  }

  const { data: fileRow, error: fileError } = await supabase
    .from("editorial_files")
    .select("id, storage_path")
    .eq("id", options.context.source_file_id)
    .maybeSingle();

  if (fileError || !fileRow) {
    throw new Error("No se pudo localizar el archivo de manuscrito para copyediting.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("editorial-manuscripts")
    .download(fileRow.storage_path);

  if (downloadError || !fileData) {
    throw new Error("No se pudo descargar el manuscrito para copyediting.");
  }

  const manuscriptText = await fileData.text();

  const prompt = buildPrompt(template, {
    manuscript_text: manuscriptText,
  });

  const result = await generateText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: `
Eres un corrector de estilo y ortotipografía de una editorial cristiana.
Debes detectar y proponer correcciones gramaticales, ortográficas y de puntuación sin cambiar el mensaje.

IMPORTANTE:
- Devuelve EXCLUSIVAMENTE un JSON válido que siga este esquema (CopyeditingSchema).
- No incluyas texto fuera del JSON.
`,
    prompt,
    output: Output.object({
      schema: CopyeditingSchema,
    }),
  });

  const parsed = result.object as z.infer<typeof CopyeditingSchema>;

  return {
    summary: parsed.summary,
    total_changes: parsed.total_changes,
    changes: parsed.changes,
  };
}

