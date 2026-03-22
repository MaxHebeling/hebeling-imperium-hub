import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialAnalysisReport } from "../analysis/types";
import type { NormalizedManuscriptDocument } from "../preprocessing/types";
import type {
  EditingPriority,
  EditingStrategyKey,
  EditorialChapterPlan,
  EditorialEditingInstruction,
  EditorialEditingPlan,
} from "./types";

function getIssueCount(
  report: EditorialAnalysisReport,
  predicate: (issue: EditorialAnalysisReport["issues"][number]) => boolean
): number {
  return report.issues.filter(predicate).length;
}

function getPriorityForChapter(
  strategy: EditingStrategyKey,
  index: number,
  total: number
): EditingPriority {
  const isOpening = index === 0;
  const isClosing = index === total - 1;

  if (strategy === "restructure") {
    return isOpening || isClosing ? "high" : "medium";
  }

  if (strategy === "deep_edit") {
    return isOpening || isClosing ? "high" : "medium";
  }

  return isOpening ? "medium" : "low";
}

export function selectEditingStrategy(
  report: EditorialAnalysisReport,
  document: NormalizedManuscriptDocument
): { strategy: EditingStrategyKey; reasoning: string[] } {
  const criticalStructureIssues = getIssueCount(
    report,
    (issue) => issue.category === "structure" && issue.severity === "critical"
  );
  const majorIssues = getIssueCount(
    report,
    (issue) => issue.severity === "major" || issue.severity === "critical"
  );

  if (
    report.score.structure < 55 ||
    criticalStructureIssues > 0 ||
    (document.chapters.length <= 1 && report.score.structure < 65)
  ) {
    return {
      strategy: "restructure",
      reasoning: [
        "La estructura del manuscrito requiere intervención fuerte antes de pasar a edición fina.",
        "Se detectaron problemas estructurales críticos o un puntaje estructural insuficiente.",
      ],
    };
  }

  if (
    report.score.overall < 75 ||
    report.score.clarity < 72 ||
    report.score.language < 72 ||
    majorIssues >= 3
  ) {
    return {
      strategy: "deep_edit",
      reasoning: [
        "El manuscrito necesita una edición sustantiva para claridad, ritmo y solidez argumental.",
        "Los puntajes y hallazgos indican trabajo editorial profundo, pero no reestructuración total.",
      ],
    };
  }

  return {
    strategy: "light_edit",
    reasoning: [
      "El manuscrito tiene una base sólida y necesita intervención editorial ligera y precisa.",
      "Los problemas detectados son acotados y pueden resolverse sin reestructuración mayor.",
    ],
  };
}

function buildGlobalObjective(strategy: EditingStrategyKey): string {
  switch (strategy) {
    case "restructure":
      return "Reordenar y clarificar la arquitectura del manuscrito para reforzar coherencia, progresión y función de cada capítulo.";
    case "deep_edit":
      return "Elevar claridad, ritmo y consistencia del manuscrito mediante una edición editorial profunda guiada por hallazgos del análisis.";
    case "light_edit":
      return "Pulir el manuscrito con ajustes ligeros de claridad, tono y continuidad sin alterar su estructura central.";
  }
}

function buildGlobalInstructions(
  strategy: EditingStrategyKey,
  report: EditorialAnalysisReport
): EditorialEditingInstruction[] {
  const instructions: EditorialEditingInstruction[] = [];

  instructions.push({
    id: createFoundationId(),
    category: "structure",
    priority: strategy === "restructure" ? "high" : "medium",
    instruction:
      strategy === "restructure"
        ? "Redefinir la función de cada bloque narrativo o argumental antes de tocar el estilo fino."
        : "Revisar la secuencia lógica de capítulos y asegurar que cada uno tenga una función clara.",
    rationale: report.reasoning.score_summary,
  });

  instructions.push({
    id: createFoundationId(),
    category: "clarity",
    priority: strategy === "light_edit" ? "medium" : "high",
    instruction:
      "Reducir redundancias, reforzar transiciones y simplificar pasajes que entorpezcan la comprensión.",
    rationale: "La claridad editorial debe mejorar antes de la corrección final.",
  });

  instructions.push({
    id: createFoundationId(),
    category: "voice",
    priority: strategy === "light_edit" ? "low" : "medium",
    instruction:
      "Conservar la voz del autor mientras se corrige densidad, tono errático o énfasis inconsistentes.",
    rationale: "La intervención editorial debe ser visible en calidad, no en pérdida de identidad autoral.",
  });

  if (report.score.language < 75) {
    instructions.push({
      id: createFoundationId(),
      category: "language",
      priority: "medium",
      instruction:
        "Preparar el texto para corrección final eliminando construcciones torpes y ambigüedades recurrentes.",
      rationale: "La corrección final funcionará mejor si el texto llega más limpio desde la edición.",
    });
  }

  return instructions;
}

function buildChapterFocusAreas(
  strategy: EditingStrategyKey,
  report: EditorialAnalysisReport
): string[] {
  const issueCategories = new Set(report.issues.map((issue) => issue.category));

  if (strategy === "restructure") {
    return [
      "función narrativa o argumental",
      "orden interno",
      issueCategories.has("structure") ? "cohesión estructural" : "progresión",
    ];
  }

  if (strategy === "deep_edit") {
    return [
      "claridad",
      issueCategories.has("voice") ? "voz" : "ritmo",
      issueCategories.has("language") ? "precisión verbal" : "fluidez",
    ];
  }

  return ["pulido", "consistencia", "microclaridad"];
}

function buildChapterInstructions(
  strategy: EditingStrategyKey,
  chapterTitle: string
): string[] {
  switch (strategy) {
    case "restructure":
      return [
        `Definir con claridad qué aporta "${chapterTitle}" al recorrido global del libro.`,
        "Revisar si el orden del contenido dentro del capítulo favorece la comprensión.",
        "Eliminar o reubicar repeticiones que no aporten progreso real.",
      ];
    case "deep_edit":
      return [
        `Reescribir los pasajes menos claros de "${chapterTitle}" para mejorar ritmo y comprensión.`,
        "Ajustar transiciones internas y reducir densidad innecesaria.",
        "Fortalecer la intención del capítulo para que cierre con mayor claridad.",
      ];
    case "light_edit":
      return [
        `Pulir frases imprecisas o redundantes en "${chapterTitle}".`,
        "Mantener estructura y tono, corrigiendo solo fricciones de lectura.",
        "Preparar el capítulo para la corrección final sin rehacerlo por completo.",
      ];
  }
}

export function buildEditorialEditingPlan(input: {
  projectId: string;
  normalizedAssetId: string;
  analysisAssetId: string;
  report: EditorialAnalysisReport;
  document: NormalizedManuscriptDocument;
  generatedAt: string;
}): EditorialEditingPlan {
  const { strategy, reasoning } = selectEditingStrategy(input.report, input.document);
  const instructions = buildGlobalInstructions(strategy, input.report);
  const fallbackChapters =
    input.document.chapters.length > 0
      ? input.document.chapters
      : [
          {
            id: createFoundationId(),
            title: "Documento completo",
            heading_block_id: null,
            start_block_index: 0,
            end_block_index: Math.max(input.document.blocks.length - 1, 0),
            start_line: 1,
            end_line: input.document.stats.line_count,
          },
        ];

  const chapter_plan: EditorialChapterPlan[] = fallbackChapters.map((chapter, index) => ({
    id: createFoundationId(),
    chapter_id: chapter.id,
    chapter_title: chapter.title,
    priority: getPriorityForChapter(strategy, index, fallbackChapters.length),
    objective:
      strategy === "restructure"
        ? "Reestructurar el capítulo para que tenga función y progresión claras."
        : strategy === "deep_edit"
          ? "Mejorar claridad, ritmo y densidad editorial del capítulo."
          : "Pulir el capítulo y dejarlo listo para corrección final.",
    focus_areas: buildChapterFocusAreas(strategy, input.report),
    instructions: buildChapterInstructions(strategy, chapter.title),
  }));

  return {
    schema_version: 1,
    project_id: input.projectId,
    normalized_asset_id: input.normalizedAssetId,
    analysis_asset_id: input.analysisAssetId,
    strategy,
    strategy_reasoning: reasoning,
    global_objective: buildGlobalObjective(strategy),
    instructions,
    chapter_plan,
    generated_at: input.generatedAt,
    rules_version: 1,
  };
}
