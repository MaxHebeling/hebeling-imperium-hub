import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type { AiSuggestionKind } from "./suggestions-types";
import { fetchManuscriptContent } from "./manuscript-loader";
import type { LineEditingResult } from "./agent-contracts";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

const LineEditingSchema = z.object({
  summary: z.string(),
  total_changes: z.number().int().nonnegative(),
  changes: z.array(
    z.object({
      id: z.string(),
      kind: z.enum([
        "claridad",
        "fluidez",
        "precision",
        "concision",
        "fuerza",
        "ritmo",
      ] satisfies [AiSuggestionKind, ...AiSuggestionKind[]]),
      severity: z.enum(["baja", "media", "alta"]),
      confidence: z.number().min(0).max(1),
      location: z.object({
        chapter: z.number().int().nonnegative().nullable(),
        section_id: z.string().nullable(),
        paragraph_index: z.number().int().nonnegative().nullable(),
        sentence_index: z.number().int().nonnegative().nullable(),
        offset_start: z.number().int().nonnegative().nullable(),
        offset_end: z.number().int().nonnegative().nullable(),
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

function normalizeLocation(
  value: unknown
): {
  chapter: number | null;
  section_id: string | null;
  paragraph_index: number | null;
  sentence_index: number | null;
  offset_start: number | null;
  offset_end: number | null;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      chapter: null,
      section_id: typeof value === "string" ? value : null,
      paragraph_index: null,
      sentence_index: null,
      offset_start: null,
      offset_end: null,
    };
  }

  const raw = value as Record<string, unknown>;
  return {
    chapter: typeof raw.chapter === "number" ? raw.chapter : null,
    section_id: typeof raw.section_id === "string" ? raw.section_id : null,
    paragraph_index: typeof raw.paragraph_index === "number" ? raw.paragraph_index : null,
    sentence_index: typeof raw.sentence_index === "number" ? raw.sentence_index : null,
    offset_start: typeof raw.offset_start === "number" ? raw.offset_start : null,
    offset_end: typeof raw.offset_end === "number" ? raw.offset_end : null,
  };
}

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

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
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

function fallbackLineEditingResult(rawText: string): LineEditingResult {
  const cleaned = rawText
    .replace(/```json|```/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    summary:
      cleaned.slice(0, 320) ||
      "La IA devolvio una respuesta no estructurada. Conviene reintentar la etapa para obtener sugerencias trazables.",
    total_changes: 0,
    changes: [],
  };
}

export async function runLineEditingAgent(options: {
  projectId: string;
  stageKey: EditorialPipelineStageKey;
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
    model: openai("gpt-4o"),
    system: LINE_EDITING_SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  const rawText = result.text?.trim() ?? "";
  const extractedJson = extractFirstJsonObject(rawText);
  if (!extractedJson) {
    return fallbackLineEditingResult(rawText);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(sanitizeJsonStringControls(extractedJson));
  } catch {
    return fallbackLineEditingResult(rawText);
  }

  if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
    return fallbackLineEditingResult(rawText);
  }

  const normalizedPayload = parsedJson as Record<string, unknown>;
  if (Array.isArray(normalizedPayload.changes)) {
    normalizedPayload.changes = normalizedPayload.changes.map((change: Record<string, unknown>) => ({
      ...change,
      location: normalizeLocation(change.location),
    }));
  }

  const parsed = LineEditingSchema.safeParse(normalizedPayload);
  if (!parsed.success) {
    return fallbackLineEditingResult(rawText);
  }

  return {
    summary: parsed.data.summary,
    total_changes: parsed.data.total_changes,
    changes: parsed.data.changes,
  };
}
