import { generateText, Output } from "ai";
import { z } from "zod";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";
import { fetchManuscriptContent } from "./manuscript-loader";
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

const LINE_EDITING_SYSTEM_PROMPT = `Eres un editor de linea profesional de una editorial cristiana con mas de 15 anos de experiencia.

PERFIL PROFESIONAL:
- Especialista en refinamiento de prosa y mejora de legibilidad.
- Dominio de registros linguisticos en espanol e ingles.
- Capacidad para mejorar la escritura SIN destruir la voz del autor.
- Experiencia con textos devotionales, ficcion cristiana y no-ficcion.

PRINCIPIOS FUNDAMENTALES:
- La voz del autor es sagrada — mejorala, no la reemplaces.
- NO cambies el mensaje doctrinal ni teologico.
- Cada sugerencia debe hacer el texto MAS CLARO, no mas complejo.
- Prioriza legibilidad y fluidez sobre ornamentacion.
- Se preciso: proporciona el texto original exacto y el texto sugerido.

TIPOS DE MEJORAS QUE DEBES PROPONER:
- Claridad: frases confusas o ambiguas
- Fluidez: transiciones bruscas, ritmo irregular
- Precision: palabras imprecisas o redundantes
- Concision: oraciones demasiado largas o enrevesadas
- Fuerza: expresiones debiles que pueden fortalecerse

IMPORTANTE:
- Devuelve EXCLUSIVAMENTE un JSON valido que siga el esquema solicitado.
- No incluyas texto fuera del JSON.
- Limita tus sugerencias a las 20 mas impactantes para no abrumar al autor.`;

const LINE_EDITING_USER_PROMPT = `Analiza el siguiente manuscrito y proporciona sugerencias de edicion de linea profesionales.

Para cada sugerencia de mejora, incluye:
- id: identificador unico (ej: "le_001")
- kind: tipo de mejora (claridad, fluidez, precision, concision, fuerza, ritmo)
- severity: impacto de la mejora (baja, media, alta)
- confidence: confianza en la sugerencia (0.0 a 1.0)
- location: ubicacion aproximada en el texto
- original_text: texto exacto del manuscrito que necesita mejora
- suggested_text: version mejorada del texto
- justification: explicacion de por que el cambio mejora el texto

Responde con un objeto JSON que contenga:
- summary: resumen general del analisis de estilo (2-3 oraciones)
- total_changes: numero total de sugerencias
- changes: array de sugerencias de mejora

MANUSCRITO:
{{manuscript_text}}`;

export async function runLineEditingAgent(options: {
  projectId: string;
  stageKey: EditorialStageKey;
  context: EditorialAiJobContext;
}): Promise<LineEditingResult> {
  // Cargar contenido del manuscrito usando la funcion compartida
  const manuscriptText = await fetchManuscriptContent(
    options.projectId,
    options.context.source_file_id
  );

  // Truncar si es muy largo
  const maxChars = 80000;
  const truncatedText = manuscriptText.length > maxChars
    ? manuscriptText.slice(0, maxChars) + "\n\n[... contenido truncado por limites de contexto ...]"
    : manuscriptText;

  const userPrompt = LINE_EDITING_USER_PROMPT.replace("{{manuscript_text}}", truncatedText);

  const result = await generateText({
    model: "anthropic/claude-sonnet-4-20250514",
    system: LINE_EDITING_SYSTEM_PROMPT,
    prompt: userPrompt,
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

