import type { EditorialMetadataPackage } from "./types";

type ParsedMetadataPayload = {
  optimized_title: string;
  subtitle: string;
  book_description: string;
  keywords: string[];
  categories: string[];
  target_audience: string;
  positioning_statement: string;
  seo_notes: string[];
};

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

function normalizeStringArray(
  value: unknown,
  maxItems: number,
  fallback: string[] = []
): string[] {
  if (!Array.isArray(value)) return fallback;

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

export function buildFallbackMetadataPackage(input: {
  projectId: string;
  validatedAssetId: string;
  title: string;
  genre: string;
  language: string;
  synopsis: string | null;
  generatedAt: string;
  model: string;
}): EditorialMetadataPackage {
  const fallbackDescription =
    input.synopsis?.trim() ||
    `Obra del género ${input.genre} dirigida a lectores interesados en ${input.genre.toLowerCase()}.`;

  return {
    schema_version: 1,
    project_id: input.projectId,
    validated_asset_id: input.validatedAssetId,
    optimized_title: input.title.trim(),
    subtitle: `Una propuesta de ${input.genre.toLowerCase()} para lectores contemporáneos`,
    book_description: fallbackDescription,
    keywords: [input.genre, input.language, input.title]
      .map((item) => item.trim())
      .filter(Boolean),
    categories: [input.genre].filter(Boolean),
    target_audience: "Lectores afines al género y la temática central de la obra.",
    positioning_statement:
      "Propuesta editorial con potencial comercial y una identidad temática clara.",
    seo_notes: [
      "Usar el género principal en la descripción comercial.",
      "Mantener consistencia entre título, subtítulo y palabras clave.",
    ],
    generated_at: input.generatedAt,
    model: input.model,
  };
}

export function parseMetadataPackage(input: {
  rawText: string;
  projectId: string;
  validatedAssetId: string;
  title: string;
  genre: string;
  language: string;
  synopsis: string | null;
  generatedAt: string;
  model: string;
}): EditorialMetadataPackage {
  const extractedJson = extractFirstJsonObject(input.rawText);
  if (!extractedJson) {
    return buildFallbackMetadataPackage(input);
  }

  try {
    const parsed = JSON.parse(
      sanitizeJsonStringControls(extractedJson)
    ) as Partial<ParsedMetadataPayload>;

    if (
      typeof parsed.optimized_title !== "string" ||
      typeof parsed.subtitle !== "string" ||
      typeof parsed.book_description !== "string" ||
      typeof parsed.target_audience !== "string" ||
      typeof parsed.positioning_statement !== "string"
    ) {
      return buildFallbackMetadataPackage(input);
    }

    return {
      schema_version: 1,
      project_id: input.projectId,
      validated_asset_id: input.validatedAssetId,
      optimized_title: parsed.optimized_title.trim() || input.title.trim(),
      subtitle: parsed.subtitle.trim(),
      book_description: parsed.book_description.trim(),
      keywords: normalizeStringArray(parsed.keywords, 12, [input.genre]),
      categories: normalizeStringArray(parsed.categories, 6, [input.genre]),
      target_audience: parsed.target_audience.trim(),
      positioning_statement: parsed.positioning_statement.trim(),
      seo_notes: normalizeStringArray(parsed.seo_notes, 8),
      generated_at: input.generatedAt,
      model: input.model,
    };
  } catch {
    return buildFallbackMetadataPackage(input);
  }
}
