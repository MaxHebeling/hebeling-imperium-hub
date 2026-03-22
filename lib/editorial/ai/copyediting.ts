import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";
import type { EditorialAiJobContext } from "@/lib/editorial/types/ai";
import type { AiSuggestionKind } from "./suggestions-types";
import { fetchManuscriptContent } from "./manuscript-loader";
import type { CopyeditingResult } from "./agent-contracts";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

const CopyeditingSchema = z.object({
  summary: z.string(),
  total_changes: z.number().int().nonnegative(),
  changes: z.array(
    z.object({
      id: z.string(),
      kind: z.enum([
        "ortografia",
        "gramatica",
        "puntuacion",
        "tipografia",
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

const COPYEDITING_SYSTEM_PROMPT = `Eres un corrector ortotipografico profesional de nivel editorial premium con mas de 15 anos de experiencia.

PERFIL PROFESIONAL:
- Especialista certificado en correccion de textos segun normas RAE (espanol) o CMOS (ingles).
- Dominio absoluto de ortografia, gramatica, puntuacion y tipografia editorial.
- Experiencia con textos devotionales, ficcion cristiana y no-ficcion.

ESTANDARES DE PRECISION:
- LA PRECISION ES MAS IMPORTANTE QUE LA VELOCIDAD.
- Cada correccion debe ser TRAZABLE: texto original exacto + correccion + justificacion.
- No inventes errores — solo reporta problemas reales y verificables.
- NO cambies el mensaje doctrinal ni teologico.
- Distingue entre errores objetivos y preferencias estilisticas.

TIPOS DE ERRORES A DETECTAR:
- ortografia: errores ortograficos, tildes, mayusculas
- gramatica: concordancia, regimen verbal, leismo/laismo, tiempos verbales
- puntuacion: comas, puntos, punto y coma, dos puntos, signos de interrogacion/exclamacion
- tipografia: comillas, guiones vs rayas, espaciado, numeros, abreviaturas

NORMAS ORTOTIPOGRAFICAS (ESPANOL):
- Comillas angulares como primera opcion, inglesas como segunda.
- Raya para dialogos e incisos, NO guion.
- Tildes diacriticas vigentes segun RAE.
- Coma vocativa obligatoria.

IMPORTANTE:
- Devuelve EXCLUSIVAMENTE un JSON valido que siga el esquema solicitado.
- No incluyas texto fuera del JSON.
- Limita tus correcciones a las 30 mas importantes.`;

const COPYEDITING_USER_PROMPT = `Realiza una correccion ortotipografica exhaustiva del siguiente manuscrito.

Para cada error encontrado, incluye:
- id: identificador unico (ej: "ce_001")
- kind: tipo de error (ortografia, gramatica, puntuacion, tipografia)
- severity: gravedad del error (baja, media, alta)
- confidence: confianza en la correccion (0.0 a 1.0)
- location: ubicacion aproximada en el texto
- original_text: texto exacto con el error
- suggested_text: texto corregido
- justification: regla ortografica/gramatical aplicable

Responde con un objeto JSON que contenga:
- summary: resumen del estado ortotipografico del manuscrito (2-3 oraciones)
- total_changes: numero total de correcciones
- changes: array de correcciones

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

function fallbackCopyeditingResult(rawText: string): CopyeditingResult {
  const cleaned = rawText
    .replace(/```json|```/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    summary:
      cleaned.slice(0, 320) ||
      "La IA devolvio una respuesta no estructurada. Conviene reintentar la etapa para obtener correcciones trazables.",
    total_changes: 0,
    changes: [],
  };
}

export async function runCopyeditingAgent(options: {
  projectId: string;
  stageKey: EditorialPipelineStageKey;
  context: EditorialAiJobContext;
}): Promise<CopyeditingResult> {
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

  const userPrompt = COPYEDITING_USER_PROMPT.replace("{{manuscript_text}}", truncatedText);

  const result = await generateText({
    model: openai("gpt-4o"),
    system: COPYEDITING_SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  const rawText = result.text?.trim() ?? "";
  const extractedJson = extractFirstJsonObject(rawText);
  if (!extractedJson) {
    return fallbackCopyeditingResult(rawText);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(sanitizeJsonStringControls(extractedJson));
  } catch {
    return fallbackCopyeditingResult(rawText);
  }

  if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
    return fallbackCopyeditingResult(rawText);
  }

  const normalizedPayload = parsedJson as Record<string, unknown>;
  if (Array.isArray(normalizedPayload.changes)) {
    normalizedPayload.changes = normalizedPayload.changes.map((change: Record<string, unknown>) => ({
      ...change,
      location: normalizeLocation(change.location),
    }));
  }

  const parsed = CopyeditingSchema.safeParse(normalizedPayload);
  if (!parsed.success) {
    return fallbackCopyeditingResult(rawText);
  }

  return {
    summary: parsed.data.summary,
    total_changes: parsed.data.total_changes,
    changes: parsed.data.changes,
  };
}
