/**
 * AI Publishing Engine — 9-Phase Pipeline Definitions
 *
 * Each phase maps to an existing editorial_stages row for DB compatibility.
 * AI providers are configurable via environment variables.
 */

import type { PublishingPhaseDefinition, AuthorTimelineDay } from "./types";

// ─── 9 Publishing Phases ─────────────────────────────────────────────

export const PUBLISHING_PHASES: PublishingPhaseDefinition[] = [
  {
    key: "manuscript_intake",
    order: 1,
    label: "Ingreso del Manuscrito",
    shortLabel: "Ingreso",
    description:
      "Subida del manuscrito, captura automática de metadatos (autor, idioma, tipo, palabras, páginas), selección de formato Amazon.",
    aiProvider: "internal",
    aiProviderLabel: "Sistema interno",
    legacyStageKey: "ingesta",
    aiTaskKey: null,
    requiresHumanReview: false,
    isAiAutomated: false,
    outputs: [
      { key: "original_manuscript", label: "Manuscrito original", fileType: "docx", description: "Archivo original subido" },
      { key: "intake_summary", label: "Resumen de ingreso", fileType: "pdf", description: "Reporte automático de metadatos capturados" },
    ],
    completionMessageTemplate: "El manuscrito ha sido recibido y registrado correctamente en el sistema editorial.",
  },
  {
    key: "ai_analysis",
    order: 2,
    label: "Análisis Inicial con IA",
    shortLabel: "Análisis IA",
    description:
      "La IA analiza idioma, género, estructura, capítulos, longitud, problemas graves de redacción y nivel de lectura. Genera reporte editorial automático.",
    aiProvider: "openai",
    aiProviderLabel: "OpenAI GPT-4o",
    legacyStageKey: "estructura",
    aiTaskKey: "manuscript_analysis",
    requiresHumanReview: false,
    isAiAutomated: true,
    outputs: [
      { key: "ai_analysis_report", label: "Reporte de análisis IA", fileType: "pdf", description: "Análisis completo del manuscrito" },
      { key: "editorial_summary", label: "Resumen editorial", fileType: "pdf", description: "Resumen ejecutivo del análisis" },
      { key: "issue_report", label: "Reporte de problemas", fileType: "pdf", description: "Problemas detectados con ubicación" },
    ],
    completionMessageTemplate: "Se completó el análisis editorial inicial del manuscrito con inteligencia artificial.",
  },
  {
    key: "orthotypographic_correction",
    order: 3,
    label: "Corrección Ortotipográfica",
    shortLabel: "Corrección",
    description:
      "Corrección de ortografía, gramática, puntuación y errores tipográficos. Genera documento corregido descargable.",
    aiProvider: "openai",
    aiProviderLabel: "OpenAI GPT-4o",
    legacyStageKey: "ortotipografia",
    aiTaskKey: "orthotypography_review",
    requiresHumanReview: true,
    isAiAutomated: true,
    outputs: [
      { key: "corrected_docx", label: "Manuscrito corregido (.docx)", fileType: "docx", description: "Documento con correcciones aplicadas" },
      { key: "corrected_pdf", label: "Manuscrito corregido (.pdf)", fileType: "pdf", description: "PDF con correcciones aplicadas" },
      { key: "original_version", label: "Versión original", fileType: "docx", description: "Manuscrito sin modificaciones para comparación" },
    ],
    completionMessageTemplate: "Se completó la corrección ortotipográfica. El staff debe revisar antes de continuar.",
  },
  {
    key: "style_editing",
    order: 4,
    label: "Edición de Estilo",
    shortLabel: "Estilo",
    description:
      "La IA mejora claridad, coherencia, fluidez y estilo. Soporta modos: académico, pastoral, devocional, narrativo, ensayo.",
    aiProvider: "openai",
    aiProviderLabel: "OpenAI GPT-4o",
    legacyStageKey: "estilo",
    aiTaskKey: "style_suggestions",
    requiresHumanReview: true,
    isAiAutomated: true,
    outputs: [
      { key: "styled_docx", label: "Manuscrito con estilo mejorado (.docx)", fileType: "docx", description: "Documento con mejoras de estilo" },
      { key: "style_report", label: "Reporte de cambios de estilo", fileType: "pdf", description: "Detalle de mejoras aplicadas" },
    ],
    completionMessageTemplate: "Se completó la edición de estilo. El manuscrito ha sido mejorado en claridad y fluidez.",
  },
  {
    key: "auto_layout",
    order: 5,
    label: "Maquetación Automática",
    shortLabel: "Maquetación",
    description:
      "Cálculo de páginas finales, páginas preliminares, capítulos. Cálculo de parámetros Amazon: ancho del lomo, tamaño del cover, bleed, márgenes.",
    aiProvider: "internal",
    aiProviderLabel: "Motor de maquetación",
    legacyStageKey: "maquetacion",
    aiTaskKey: "layout_analysis",
    requiresHumanReview: false,
    isAiAutomated: true,
    outputs: [
      { key: "layout_pdf", label: "Interior maquetado (.pdf)", fileType: "pdf", description: "PDF interior con maquetación profesional" },
      { key: "layout_specs", label: "Especificaciones de maquetación", fileType: "pdf", description: "Parámetros técnicos del layout" },
    ],
    completionMessageTemplate: "Se completó la maquetación automática. El interior del libro está listo.",
  },
  {
    key: "interior_design",
    order: 6,
    label: "Diseño Interior Editorial",
    shortLabel: "Interior",
    description:
      "Configuración de página de título, copyright, dedicatoria, índice, encabezados, pie de página, biografía del autor, agradecimientos. La IA sugiere layouts.",
    aiProvider: "openai",
    aiProviderLabel: "OpenAI GPT-4o",
    legacyStageKey: "maquetacion",
    aiTaskKey: "layout_analysis",
    requiresHumanReview: true,
    isAiAutomated: true,
    outputs: [
      { key: "interior_pdf", label: "Interior diseñado (.pdf)", fileType: "pdf", description: "PDF con diseño interior completo" },
      { key: "interior_preview", label: "Vista previa del interior", fileType: "pdf", description: "Muestra de páginas clave del diseño" },
    ],
    completionMessageTemplate: "Se completó el diseño interior editorial del libro.",
  },
  {
    key: "cover_design",
    order: 7,
    label: "Diseño de Portada",
    shortLabel: "Portada",
    description:
      "La IA analiza concepto del libro, mensaje central, género y público objetivo. Genera portada completa (front, back, spine) respetando trim size y 300 DPI.",
    aiProvider: "openai",
    aiProviderLabel: "DALL-E 3",
    legacyStageKey: "revision_final",
    aiTaskKey: null,
    requiresHumanReview: true,
    isAiAutomated: false,
    outputs: [
      { key: "cover_front", label: "Portada frontal", fileType: "png", description: "Diseño de portada frontal a 300 DPI" },
      { key: "cover_back", label: "Contraportada", fileType: "png", description: "Diseño de contraportada" },
      { key: "cover_full", label: "Portada completa (wrap)", fileType: "pdf", description: "PDF con portada completa para Amazon" },
    ],
    completionMessageTemplate: "Se completó el diseño de portada. El staff debe revisar y aprobar.",
  },
  {
    key: "final_review",
    order: 8,
    label: "Revisión Final Editorial",
    shortLabel: "Revisión",
    description:
      "El staff puede ver el libro completo, descargar PDF, revisar portada, volver a fases anteriores. Cada fase permite modificación por prompt.",
    aiProvider: "internal",
    aiProviderLabel: "Revisión humana",
    legacyStageKey: "revision_final",
    aiTaskKey: "redline_diff",
    requiresHumanReview: true,
    isAiAutomated: false,
    outputs: [
      { key: "review_report", label: "Reporte de revisión final", fileType: "pdf", description: "Checklist de revisión completado" },
      { key: "final_manuscript", label: "Manuscrito final aprobado", fileType: "pdf", description: "Versión final aprobada para exportación" },
    ],
    completionMessageTemplate: "Se completó la revisión final editorial. El libro está listo para exportación.",
  },
  {
    key: "final_export",
    order: 9,
    label: "Exportación Final",
    shortLabel: "Exportación",
    description:
      "Exportación de archivos finales: PDF para imprenta, EPUB, Kindle, eBook.",
    aiProvider: "internal",
    aiProviderLabel: "Motor de exportación",
    legacyStageKey: "export",
    aiTaskKey: "export_validation",
    requiresHumanReview: false,
    isAiAutomated: true,
    outputs: [
      { key: "print_pdf", label: "PDF para imprenta", fileType: "pdf", description: "PDF listo para impresión profesional" },
      { key: "epub", label: "EPUB", fileType: "epub", description: "Archivo EPUB para distribución digital" },
      { key: "kindle", label: "Kindle (MOBI)", fileType: "kindle", description: "Archivo para Amazon Kindle" },
    ],
    completionMessageTemplate: "¡Exportación completada! Tu libro está listo para ser entregado, vendido y distribuido.",
  },
];

// ─── Helper: get phase by key ────────────────────────────────────────

export function getPhaseDefinition(key: string): PublishingPhaseDefinition | undefined {
  return PUBLISHING_PHASES.find((p) => p.key === key);
}

export function getPhaseByOrder(order: number): PublishingPhaseDefinition | undefined {
  return PUBLISHING_PHASES.find((p) => p.order === order);
}

export function getNextPhase(currentKey: string): PublishingPhaseDefinition | undefined {
  const current = PUBLISHING_PHASES.find((p) => p.key === currentKey);
  if (!current) return undefined;
  return PUBLISHING_PHASES.find((p) => p.order === current.order + 1);
}

// ─── 12-Day Author Timeline ─────────────────────────────────────────

export const AUTHOR_TIMELINE_12_DAYS: Omit<AuthorTimelineDay, "status">[] = [
  {
    day: 1,
    dayRange: "Día 1",
    label: "Recepción del manuscrito",
    labelEn: "Manuscript reception",
    description: "Tu manuscrito ha sido recibido y está siendo preparado para el proceso editorial.",
    descriptionEn: "Your manuscript has been received and is being prepared for the editorial process.",
    phaseKeys: ["manuscript_intake"],
  },
  {
    day: 2,
    dayRange: "Día 2-3",
    label: "Análisis editorial",
    labelEn: "Editorial analysis",
    description: "Nuestro equipo está analizando la estructura, el estilo y la calidad general de tu manuscrito.",
    descriptionEn: "Our team is analyzing the structure, style, and overall quality of your manuscript.",
    phaseKeys: ["ai_analysis"],
  },
  {
    day: 4,
    dayRange: "Día 4-5",
    label: "Corrección ortográfica y gramatical",
    labelEn: "Spelling and grammar correction",
    description: "Estamos perfeccionando la ortografía, gramática y puntuación de tu texto.",
    descriptionEn: "We are perfecting the spelling, grammar, and punctuation of your text.",
    phaseKeys: ["orthotypographic_correction"],
  },
  {
    day: 6,
    dayRange: "Día 6-7",
    label: "Edición de estilo",
    labelEn: "Style editing",
    description: "Estamos mejorando la claridad, coherencia y fluidez de tu escritura.",
    descriptionEn: "We are improving the clarity, coherence, and fluency of your writing.",
    phaseKeys: ["style_editing"],
  },
  {
    day: 8,
    dayRange: "Día 8",
    label: "Especificaciones del libro",
    labelEn: "Book specifications",
    description: "Se están calculando las especificaciones técnicas del libro para su formato final.",
    descriptionEn: "Technical book specifications are being calculated for the final format.",
    phaseKeys: ["auto_layout"],
  },
  {
    day: 9,
    dayRange: "Día 9-10",
    label: "Maquetación y diseño interior",
    labelEn: "Layout and interior design",
    description: "Estamos preparando el diseño interior profesional de tu libro.",
    descriptionEn: "We are preparing the professional interior design of your book.",
    phaseKeys: ["interior_design"],
  },
  {
    day: 10,
    dayRange: "Día 10",
    label: "Diseño de portada",
    labelEn: "Cover design",
    description: "Nuestro equipo creativo está diseñando la portada de tu libro.",
    descriptionEn: "Our creative team is designing the cover of your book.",
    phaseKeys: ["cover_design"],
  },
  {
    day: 11,
    dayRange: "Día 11",
    label: "Revisión final",
    labelEn: "Final review",
    description: "Se está realizando la revisión final exhaustiva antes de la exportación.",
    descriptionEn: "A thorough final review is being conducted before export.",
    phaseKeys: ["final_review"],
  },
  {
    day: 12,
    dayRange: "Día 12",
    label: "Libro listo para publicación",
    labelEn: "Book ready for publication",
    description: "¡Tu libro ha completado el proceso editorial y está listo para ser publicado!",
    descriptionEn: "Your book has completed the editorial process and is ready for publication!",
    phaseKeys: ["final_export"],
  },
];

// ─── Editorial Style Modes ───────────────────────────────────────────

export const EDITORIAL_STYLE_MODES = [
  { key: "academic", label: "Académico", labelEn: "Academic" },
  { key: "pastoral", label: "Pastoral", labelEn: "Pastoral" },
  { key: "devotional", label: "Devocional", labelEn: "Devotional" },
  { key: "narrative", label: "Narrativo", labelEn: "Narrative" },
  { key: "essay", label: "Ensayo", labelEn: "Essay" },
] as const;

// ─── Amazon Trim Sizes ──────────────────────────────────────────────

export const AMAZON_TRIM_SIZES = [
  { key: "5x8", label: '5" × 8"', widthIn: 5, heightIn: 8 },
  { key: "5.5x8.5", label: '5.5" × 8.5"', widthIn: 5.5, heightIn: 8.5 },
  { key: "6x9", label: '6" × 9"', widthIn: 6, heightIn: 9 },
  { key: "7x10", label: '7" × 10"', widthIn: 7, heightIn: 10 },
  { key: "8.5x11", label: '8.5" × 11"', widthIn: 8.5, heightIn: 11 },
] as const;
