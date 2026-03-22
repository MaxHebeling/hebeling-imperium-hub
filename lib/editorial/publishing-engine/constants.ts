/**
 * Reino Editorial AI Publishing Engine — Constants
 *
 * 13-phase editorial pipeline definitions.
 */

import type { PublishingPhaseDefinition, PublishingPhaseKey, AuthorTimelineDay } from "./types";

// ─── 13 Editorial Phases ────────────────────────────────────────────

export const PUBLISHING_PHASES: PublishingPhaseDefinition[] = [
  {
    key: "manuscript_received",
    order: 1,
    label: "Manuscrito recibido",
    labelEn: "Manuscript Received",
    description: "Subida y validación del manuscrito. Detección de capítulos, conteo de palabras, formato.",
    descriptionEn: "Upload and validation. Chapter detection, word count, format analysis.",
    aiAgent: "ingestion",
    aiProvider: "internal",
    legacyStageKey: "ingesta",
    aiTaskKey: null,
    requiresHumanReview: false,
    isAiAutomated: true,
    icon: "FileText",
    outputs: [
      { key: "clean_manuscript", label: "Manuscrito limpio", fileType: "docx", description: "Manuscrito normalizado" },
      { key: "intake_report", label: "Reporte de ingesta", fileType: "pdf", description: "Reporte del análisis inicial" },
    ],
  },
  {
    key: "ai_diagnosis",
    order: 2,
    label: "Diagnóstico IA",
    labelEn: "AI Diagnosis",
    description: "Análisis completo del manuscrito: idioma, género, estructura, nivel de lectura, problemas.",
    descriptionEn: "Full manuscript analysis: language, genre, structure, reading level, issues.",
    aiAgent: "ingestion",
    aiProvider: "openai",
    legacyStageKey: "ingesta",
    aiTaskKey: "manuscript_analysis",
    requiresHumanReview: false,
    isAiAutomated: true,
    icon: "Brain",
    outputs: [
      { key: "ai_report", label: "Reporte IA", fileType: "pdf", description: "Análisis completo del manuscrito" },
      { key: "issue_report", label: "Reporte de problemas", fileType: "pdf", description: "Problemas detectados" },
    ],
  },
  {
    key: "spelling_correction",
    order: 3,
    label: "Corrección ortográfica",
    labelEn: "Spelling Correction",
    description: "Corrección de ortografía, puntuación y errores tipográficos.",
    descriptionEn: "Spelling, punctuation and typographical error correction.",
    aiAgent: "corrector",
    aiProvider: "openai",
    legacyStageKey: "ortotipografia",
    aiTaskKey: "orthotypography_review",
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "SpellCheck",
    outputs: [
      { key: "corrected_docx", label: "DOCX corregido", fileType: "docx", description: "Manuscrito con correcciones ortográficas" },
      { key: "correction_report", label: "Reporte de correcciones", fileType: "pdf", description: "Detalle de correcciones" },
    ],
  },
  {
    key: "grammar_correction",
    order: 4,
    label: "Corrección gramatical",
    labelEn: "Grammar Correction",
    description: "Corrección de sintaxis, concordancia y estructura de frases.",
    descriptionEn: "Syntax, agreement and sentence structure correction.",
    aiAgent: "grammar",
    aiProvider: "openai",
    legacyStageKey: "ortotipografia",
    aiTaskKey: "orthotypography_review",
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "FileCheck",
    outputs: [
      { key: "grammar_docx", label: "DOCX revisado", fileType: "docx", description: "Manuscrito con correcciones gramaticales" },
      { key: "grammar_report", label: "Reporte gramatical", fileType: "pdf", description: "Detalle de correcciones gramaticales" },
    ],
  },
  {
    key: "style_editing",
    order: 5,
    label: "Edición de estilo",
    labelEn: "Style Editing",
    description: "Ajuste de tono editorial: pastoral, académico, devocional, corporativo, narrativo.",
    descriptionEn: "Editorial tone adjustment: pastoral, academic, devotional, corporate, narrative.",
    aiAgent: "style_editor",
    aiProvider: "openai",
    legacyStageKey: "estilo",
    aiTaskKey: "style_suggestions",
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "Palette",
    outputs: [
      { key: "styled_docx", label: "DOCX editado", fileType: "docx", description: "Manuscrito con edición de estilo" },
      { key: "style_report", label: "Reporte de estilo", fileType: "pdf", description: "Cambios de estilo realizados" },
    ],
  },
  {
    key: "structural_review",
    order: 6,
    label: "Revisión estructural",
    labelEn: "Structural Review",
    description: "Análisis de longitud de capítulos, orden narrativo, redundancias. Propuesta de reorganización.",
    descriptionEn: "Chapter length analysis, narrative order, redundancies. Reorganization proposal.",
    aiAgent: "structural",
    aiProvider: "openai",
    legacyStageKey: "estructura",
    aiTaskKey: "structure_analysis",
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "LayoutList",
    outputs: [
      { key: "structure_report", label: "Reporte estructural", fileType: "pdf", description: "Análisis de estructura" },
    ],
  },
  {
    key: "theological_review",
    order: 7,
    label: "Revisión teológica",
    labelEn: "Theological Review",
    description: "Verificación de citas bíblicas, referencias, consistencia doctrinal.",
    descriptionEn: "Bible citation verification, references, doctrinal consistency.",
    aiAgent: "theological",
    aiProvider: "openai",
    legacyStageKey: "revision_final",
    aiTaskKey: "redline_diff",
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "BookOpen",
    outputs: [
      { key: "theological_report", label: "Reporte teológico", fileType: "pdf", description: "Revisión de citas y doctrina" },
    ],
  },
  {
    key: "editorial_approval",
    order: 8,
    label: "Aprobación editorial",
    labelEn: "Editorial Approval",
    description: "Revisión y aprobación humana antes de producción.",
    descriptionEn: "Human review and approval before production.",
    aiAgent: null,
    aiProvider: "human",
    legacyStageKey: "revision_final",
    aiTaskKey: null,
    requiresHumanReview: true,
    isAiAutomated: false,
    icon: "CheckCircle",
    outputs: [],
  },
  {
    key: "interior_layout",
    order: 9,
    label: "Maquetación interior",
    labelEn: "Interior Layout",
    description: "Conversión del manuscrito en libro maquetado. Formato Amazon KDP.",
    descriptionEn: "Convert manuscript to laid-out book. Amazon KDP format.",
    aiAgent: "layout",
    aiProvider: "openai",
    legacyStageKey: "maquetacion",
    aiTaskKey: "layout_analysis",
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "BookText",
    outputs: [
      { key: "interior_pdf", label: "PDF interior", fileType: "pdf", description: "Interior maquetado para imprenta" },
      { key: "review_pdf", label: "PDF revisión", fileType: "pdf", description: "PDF para revisión" },
      { key: "epub", label: "EPUB", fileType: "epub", description: "Versión digital" },
    ],
  },
  {
    key: "cover_design",
    order: 10,
    label: "Diseño de portada",
    labelEn: "Cover Design",
    description: "Concepto, dirección visual y workflow de portada con HEBELING AI y acabado manual/Midjourney.",
    descriptionEn: "Cover concept, visual direction and cover workflow with HEBELING AI and manual/Midjourney finishing.",
    aiAgent: "cover",
    aiProvider: "openai",
    legacyStageKey: "maquetacion",
    aiTaskKey: null,
    requiresHumanReview: true,
    isAiAutomated: true,
    icon: "Image",
    outputs: [
      { key: "cover_front", label: "Portada", fileType: "png", description: "Diseño de portada" },
      { key: "cover_full", label: "Cover completo", fileType: "pdf", description: "Portada + lomo + contraportada" },
    ],
  },
  {
    key: "final_review",
    order: 11,
    label: "Revisión final",
    labelEn: "Final Review",
    description: "Última revisión del libro completo antes de exportar.",
    descriptionEn: "Final review of the complete book before export.",
    aiAgent: null,
    aiProvider: "human",
    legacyStageKey: "revision_final",
    aiTaskKey: null,
    requiresHumanReview: true,
    isAiAutomated: false,
    icon: "Eye",
    outputs: [],
  },
  {
    key: "export",
    order: 12,
    label: "Exportación",
    labelEn: "Export",
    description: "Generación de archivos finales: PDF imprenta, EPUB, Kindle, metadatos.",
    descriptionEn: "Final file generation: print PDF, EPUB, Kindle, metadata.",
    aiAgent: "exporter",
    aiProvider: "internal",
    legacyStageKey: "export",
    aiTaskKey: "export_validation",
    requiresHumanReview: false,
    isAiAutomated: true,
    icon: "Download",
    outputs: [
      { key: "print_pdf", label: "PDF imprenta", fileType: "pdf", description: "PDF listo para imprenta" },
      { key: "epub_final", label: "EPUB final", fileType: "epub", description: "Libro digital EPUB" },
      { key: "kindle", label: "Kindle", fileType: "kindle", description: "Formato Kindle" },
    ],
  },
  {
    key: "publication",
    order: 13,
    label: "Publicación",
    labelEn: "Publication",
    description: "Libro listo para distribución y venta.",
    descriptionEn: "Book ready for distribution and sale.",
    aiAgent: null,
    aiProvider: "human",
    legacyStageKey: "distribution",
    aiTaskKey: "metadata_generation",
    requiresHumanReview: false,
    isAiAutomated: false,
    icon: "Rocket",
    outputs: [],
  },
];

// ─── Helper: Get phase by key ───────────────────────────────────────

export function getPhaseDefinition(key: PublishingPhaseKey): PublishingPhaseDefinition | undefined {
  return PUBLISHING_PHASES.find((p) => p.key === key);
}

export function getPhaseByOrder(order: number): PublishingPhaseDefinition | undefined {
  return PUBLISHING_PHASES.find((p) => p.order === order);
}

export function getNextPhase(currentKey: PublishingPhaseKey): PublishingPhaseDefinition | undefined {
  const current = getPhaseDefinition(currentKey);
  if (!current) return undefined;
  return getPhaseByOrder(current.order + 1);
}

export function getPreviousPhase(currentKey: PublishingPhaseKey): PublishingPhaseDefinition | undefined {
  const current = getPhaseDefinition(currentKey);
  if (!current || current.order <= 1) return undefined;
  return getPhaseByOrder(current.order - 1);
}

// ─── Legacy stage key → Phase key mapping ───────────────────────────

const LEGACY_TO_PHASE: Record<string, PublishingPhaseKey> = {
  ingesta: "manuscript_received",
  estructura: "structural_review",
  estilo: "style_editing",
  ortotipografia: "spelling_correction",
  maquetacion: "interior_layout",
  revision_final: "final_review",
  export: "export",
  distribution: "publication",
};

export function legacyStageToPhaseKey(legacyKey: string): PublishingPhaseKey {
  return LEGACY_TO_PHASE[legacyKey] ?? "manuscript_received";
}

// ─── Progress calculation ───────────────────────────────────────────

export function calculateProgressPercent(currentPhaseKey: PublishingPhaseKey): number {
  const phase = getPhaseDefinition(currentPhaseKey);
  if (!phase) return 0;
  return Math.round((phase.order / PUBLISHING_PHASES.length) * 100);
}

// ─── 12-Day Author Timeline ────────────────────────────────────────

export const AUTHOR_TIMELINE_12_DAYS: AuthorTimelineDay[] = [
  {
    day: 1,
    dayRange: "Día 1",
    label: "Recepción del manuscrito",
    labelEn: "Manuscript Reception",
    description: "Tu manuscrito ha sido recibido y registrado en nuestro sistema editorial.",
    descriptionEn: "Your manuscript has been received and registered in our editorial system.",
    status: "pending",
    phaseKeys: ["manuscript_received"],
  },
  {
    day: 2,
    dayRange: "Día 2–3",
    label: "Análisis editorial",
    labelEn: "Editorial Analysis",
    description: "Nuestro equipo está realizando un análisis profundo de tu manuscrito.",
    descriptionEn: "Our team is performing a thorough analysis of your manuscript.",
    status: "pending",
    phaseKeys: ["ai_diagnosis"],
  },
  {
    day: 4,
    dayRange: "Día 4–5",
    label: "Corrección y edición",
    labelEn: "Correction & Editing",
    description: "Tu manuscrito está siendo corregido y editado profesionalmente.",
    descriptionEn: "Your manuscript is being professionally corrected and edited.",
    status: "pending",
    phaseKeys: ["spelling_correction", "grammar_correction", "style_editing"],
  },
  {
    day: 6,
    dayRange: "Día 6–7",
    label: "Revisión editorial",
    labelEn: "Editorial Review",
    description: "Estamos revisando la estructura y contenido teológico de tu obra.",
    descriptionEn: "We are reviewing the structure and theological content of your work.",
    status: "pending",
    phaseKeys: ["structural_review", "theological_review"],
  },
  {
    day: 8,
    dayRange: "Día 8",
    label: "Aprobación editorial",
    labelEn: "Editorial Approval",
    description: "Tu manuscrito está siendo aprobado por el equipo editorial.",
    descriptionEn: "Your manuscript is being approved by the editorial team.",
    status: "pending",
    phaseKeys: ["editorial_approval"],
  },
  {
    day: 9,
    dayRange: "Día 9–10",
    label: "Maquetación y diseño",
    labelEn: "Layout & Design",
    description: "Estamos preparando el diseño interior y la portada de tu libro.",
    descriptionEn: "We are preparing the interior design and cover of your book.",
    status: "pending",
    phaseKeys: ["interior_layout", "cover_design"],
  },
  {
    day: 11,
    dayRange: "Día 11",
    label: "Revisión final",
    labelEn: "Final Review",
    description: "Última revisión completa antes de la producción final.",
    descriptionEn: "Final complete review before final production.",
    status: "pending",
    phaseKeys: ["final_review"],
  },
  {
    day: 12,
    dayRange: "Día 12",
    label: "Libro listo",
    labelEn: "Book Ready",
    description: "Tu libro ha completado el proceso editorial y está listo para publicación.",
    descriptionEn: "Your book has completed the editorial process and is ready for publication.",
    status: "pending",
    phaseKeys: ["export", "publication"],
  },
];
