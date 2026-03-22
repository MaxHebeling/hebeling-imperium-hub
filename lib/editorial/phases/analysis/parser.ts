import { z } from "zod";
import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialAnalysisReport } from "./types";

const editorialAnalysisReportSchema = z.object({
  detected_genre: z.string().trim().min(1),
  target_audience: z.string().trim().min(1),
  score: z.object({
    overall: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    clarity: z.number().int().min(0).max(100),
    language: z.number().int().min(0).max(100),
    market_fit: z.number().int().min(0).max(100),
  }),
  executive_summary: z.string().trim().min(1),
  strengths: z.array(z.string().trim().min(1)).min(1).max(8),
  weaknesses: z.array(z.string().trim().min(1)).min(1).max(8),
  issues: z
    .array(
      z.object({
        severity: z.enum(["critical", "major", "minor"]),
        category: z.enum([
          "structure",
          "clarity",
          "language",
          "market_fit",
          "voice",
        ]),
        title: z.string().trim().min(1),
        explanation: z.string().trim().min(1),
      })
    )
    .min(1)
    .max(12),
  recommendations: z.array(z.string().trim().min(1)).min(1).max(10),
  reasoning: z.object({
    score_summary: z.string().trim().min(1),
    genre_reasoning: z.string().trim().min(1),
    audience_reasoning: z.string().trim().min(1),
  }),
});

function extractFirstJsonObject(rawText: string): string | null {
  const fencedMatch =
    rawText.match(/```json\s*([\s\S]*?)```/i) ??
    rawText.match(/```\s*([\s\S]*?)```/);

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

function buildFallbackIssues(weaknesses: string[]): EditorialAnalysisReport["issues"] {
  return weaknesses.slice(0, 3).map((weakness, index) => ({
    id: createFoundationId(),
    severity: index === 0 ? "major" : "minor",
    category: "clarity",
    title: `Fallback issue ${index + 1}`,
    explanation: weakness,
  }));
}

export function buildFallbackAnalysisReport(options: {
  projectId: string;
  sourceAssetId: string;
  normalizedAssetId: string;
  generatedAt: string;
  model: string;
  rawText: string;
  detectedGenre: string;
  targetAudience: string;
}): EditorialAnalysisReport {
  const summary = options.rawText.replace(/\s+/g, " ").trim().slice(0, 700);
  const weaknesses = [
    "La salida del modelo no pudo validarse por completo y requiere una segunda corrida.",
  ];

  return {
    schema_version: 1,
    project_id: options.projectId,
    source_asset_id: options.sourceAssetId,
    normalized_asset_id: options.normalizedAssetId,
    detected_genre: options.detectedGenre,
    target_audience: options.targetAudience,
    score: {
      overall: 60,
      structure: 60,
      clarity: 60,
      language: 60,
      market_fit: 60,
    },
    executive_summary:
      summary || "Se generó un reporte mínimo porque la salida estructurada del modelo no fue completamente válida.",
    strengths: [
      "El manuscrito fue procesado y quedó disponible para revisión editorial.",
    ],
    weaknesses,
    issues: buildFallbackIssues(weaknesses),
    recommendations: [
      "Revisar el informe y, si hace falta más precisión, volver a ejecutar la fase de análisis.",
    ],
    reasoning: {
      score_summary:
        "Se asignó un puntaje conservador de respaldo para no bloquear el pipeline.",
      genre_reasoning:
        "El género se mantuvo con base en el contexto disponible del manuscrito normalizado.",
      audience_reasoning:
        "La audiencia se estimó de forma genérica al no contar con una salida válida completa.",
    },
    generated_at: options.generatedAt,
    model: options.model,
  };
}

export function parseEditorialAnalysisReport(options: {
  rawText: string;
  projectId: string;
  sourceAssetId: string;
  normalizedAssetId: string;
  generatedAt: string;
  model: string;
  fallbackGenre: string;
  fallbackAudience: string;
}): EditorialAnalysisReport {
  const extractedJson = extractFirstJsonObject(options.rawText);

  if (!extractedJson) {
    return buildFallbackAnalysisReport({
      projectId: options.projectId,
      sourceAssetId: options.sourceAssetId,
      normalizedAssetId: options.normalizedAssetId,
      generatedAt: options.generatedAt,
      model: options.model,
      rawText: options.rawText,
      detectedGenre: options.fallbackGenre,
      targetAudience: options.fallbackAudience,
    });
  }

  try {
    const parsed = editorialAnalysisReportSchema.safeParse(
      JSON.parse(sanitizeJsonStringControls(extractedJson))
    );

    if (parsed.success) {
      return {
        schema_version: 1,
        project_id: options.projectId,
        source_asset_id: options.sourceAssetId,
        normalized_asset_id: options.normalizedAssetId,
        detected_genre: parsed.data.detected_genre,
        target_audience: parsed.data.target_audience,
        score: parsed.data.score,
        executive_summary: parsed.data.executive_summary,
        strengths: parsed.data.strengths,
        weaknesses: parsed.data.weaknesses,
        issues: parsed.data.issues.map((issue) => ({
          id: createFoundationId(),
          ...issue,
        })),
        recommendations: parsed.data.recommendations,
        reasoning: parsed.data.reasoning,
        generated_at: options.generatedAt,
        model: options.model,
      };
    }
  } catch {
    // fall through
  }

  return buildFallbackAnalysisReport({
    projectId: options.projectId,
    sourceAssetId: options.sourceAssetId,
    normalizedAssetId: options.normalizedAssetId,
    generatedAt: options.generatedAt,
    model: options.model,
    rawText: options.rawText,
    detectedGenre: options.fallbackGenre,
    targetAudience: options.fallbackAudience,
  });
}
