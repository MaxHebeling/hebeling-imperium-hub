import { generateText, Output } from "ai";
import { z } from "zod";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";
import { getActivePromptTemplate, buildPrompt } from "./prompts";
import type { LineEditingResult } from "./agent-contracts";

const LineEditingSchema = z.object({
  summary: z.string(),
  total_changes: z.number().int().nonnegative(),
  changes: z.array(
    z.object({
      id: z.string(),
      kind: z.string().default("estilo"),
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

export async function runLineEditingAgent(options: {
  projectId: string;
  stageKey: EditorialStageKey;
  context: EditorialAiJobContext;
}): Promise<LineEditingResult> {
  const supabase = getAdminClient();

  // Obtener prompt activo
  const template = await getActivePromptTemplate({
    orgId: options.projectId, // NOTE: en el futuro usar orgId real; por ahora reusamos projectId como fallback.
    stageKey: options.stageKey,
    taskKey: "line_editing",
  });

  if (!template) {
    throw new Error("No hay un prompt de AI activo para line_editing en esta etapa.");
  }

  // Cargar contenido del manuscrito (texto plano) desde editorial_files/editorial-manuscripts
  // Para v1, usamos el processor genérico ya existente para obtener el texto.
  const { data: fileRow, error: fileError } = await supabase
    .from("editorial_files")
    .select("id, storage_path")
    .eq("id", options.context.source_file_id)
    .maybeSingle();

  if (fileError || !fileRow) {
    throw new Error("No se pudo localizar el archivo de manuscrito para line_editing.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("editorial-manuscripts")
    .download(fileRow.storage_path);

  if (downloadError || !fileData) {
    throw new Error("No se pudo descargar el manuscrito para line_editing.");
  }

  const manuscriptText = await fileData.text();

  const prompt = buildPrompt(template, {
    manuscript_text: manuscriptText,
  });

  const result = await generateText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: `
Eres un editor de línea profesional de una editorial cristiana.
Debes proponer mejoras de redacción y legibilidad, sin cambiar el mensaje doctrinal.

IMPORTANTE:
- Devuelve EXCLUSIVAMENTE un JSON válido que siga este esquema (LineEditingSchema).
- No incluyas texto fuera del JSON.
`,
    prompt,
    output: Output.object({
      schema: LineEditingSchema,
    }),
  });

  const parsed = result.object as z.infer<typeof LineEditingSchema>;

  return {
    summary: parsed.summary,
    total_changes: parsed.total_changes,
    changes: parsed.changes,
  };
}

