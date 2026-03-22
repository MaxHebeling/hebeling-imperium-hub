import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialStyleProfile, EditorialStyleRule } from "./types";

function createRule(
  category: EditorialStyleRule["category"],
  label: string,
  description: string,
  priority: EditorialStyleRule["priority"]
): EditorialStyleRule {
  return {
    id: createFoundationId(),
    category,
    label,
    description,
    priority,
  };
}

function getBaseSpanishRules(): EditorialStyleRule[] {
  return [
    createRule(
      "grammar",
      "Concordancia gramatical",
      "Corregir concordancia de género, número y tiempos verbales sin alterar el sentido.",
      "high"
    ),
    createRule(
      "spelling",
      "Ortografía normativa",
      "Corregir tildes, mayúsculas y errores ortográficos evidentes según normativa actual.",
      "high"
    ),
    createRule(
      "punctuation",
      "Puntuación clara",
      "Ajustar comas, puntos, dos puntos y signos para mejorar claridad y ritmo de lectura.",
      "high"
    ),
    createRule(
      "style",
      "Estilo consistente",
      "Reducir repeticiones innecesarias y mantener un tono uniforme en todo el texto.",
      "medium"
    ),
    createRule(
      "consistency",
      "Consistencia léxica",
      "Mantener nombres, conceptos y elecciones estilísticas de forma consistente.",
      "medium"
    ),
  ];
}

function getBaseEnglishRules(): EditorialStyleRule[] {
  return [
    createRule(
      "grammar",
      "Grammar agreement",
      "Correct verb tense, subject-verb agreement, and sentence-level grammar without changing meaning.",
      "high"
    ),
    createRule(
      "spelling",
      "Spelling normalization",
      "Correct spelling and capitalization while preserving intended names and terminology.",
      "high"
    ),
    createRule(
      "punctuation",
      "Punctuation control",
      "Normalize punctuation for readability and cadence.",
      "high"
    ),
    createRule(
      "style",
      "Style continuity",
      "Keep prose style coherent and reduce distracting repetition.",
      "medium"
    ),
    createRule(
      "consistency",
      "Terminology consistency",
      "Keep terminology, names, and referential choices stable.",
      "medium"
    ),
  ];
}

function getGenreNotes(genre: string): { toneTarget: string; notes: string[] } {
  const normalizedGenre = genre.toLowerCase();

  if (normalizedGenre.includes("ensayo")) {
    return {
      toneTarget: "formal and precise",
      notes: [
        "Priorizar claridad argumentativa y precisión terminológica.",
        "Evitar adornos innecesarios que opaquen la tesis.",
      ],
    };
  }

  if (normalizedGenre.includes("fantas") || normalizedGenre.includes("novela")) {
    return {
      toneTarget: "immersive and narratively clear",
      notes: [
        "Preservar voz narrativa y ritmo de lectura.",
        "Corregir sin aplanar la personalidad del texto.",
      ],
    };
  }

  return {
    toneTarget: "clear, readable, and consistent",
    notes: [
      "Corregir para máxima legibilidad.",
      "Evitar cambios que alteren intención o registro sin necesidad.",
    ],
  };
}

export function buildEditorialStyleProfile(input: {
  language: string | null | undefined;
  genre: string | null | undefined;
}): EditorialStyleProfile {
  const language = (input.language ?? "es").trim().toLowerCase() || "es";
  const genre = (input.genre ?? "general").trim() || "general";
  const { toneTarget, notes } = getGenreNotes(genre);

  return {
    version: 1,
    language,
    genre,
    tone_target: toneTarget,
    style_notes: notes,
    rules: language.startsWith("en")
      ? getBaseEnglishRules()
      : getBaseSpanishRules(),
  };
}
