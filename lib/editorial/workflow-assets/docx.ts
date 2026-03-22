import { generateDocxFromText } from "@/lib/editorial/docx";
import type { EditorialAnalysisReport } from "@/lib/editorial/phases/analysis/types";
import type { EditorialCoverConceptPackage } from "@/lib/editorial/phases/cover-generation/types";
import type { EditorialEditedManuscript } from "@/lib/editorial/phases/content-editing/types";
import type { EditorialEditingPlan } from "@/lib/editorial/phases/editing-plan/types";
import type { EditorialLayoutPackage } from "@/lib/editorial/phases/layout-engine/types";
import type { EditorialMetadataPackage } from "@/lib/editorial/phases/metadata-generation/types";
import type { NormalizedManuscriptDocument } from "@/lib/editorial/phases/preprocessing/types";
import type { EditorialProofreadManuscript } from "@/lib/editorial/phases/proofreading/types";
import type { EditorialApprovedPackage } from "@/lib/editorial/phases/quality-assurance/types";
import type { EditorialValidatedManuscript } from "@/lib/editorial/phases/semantic-validation/types";

type SupportedWorkflowAssetKind =
  | "manuscript"
  | "normalized_text"
  | "analysis_output"
  | "editing_plan"
  | "edited_manuscript"
  | "proofread_manuscript"
  | "validated_manuscript"
  | "metadata_asset"
  | "cover_asset"
  | "layout_asset"
  | "qa_asset";

const DOCX_EXPORTABLE_ASSET_KINDS: SupportedWorkflowAssetKind[] = [
  "manuscript",
  "normalized_text",
  "analysis_output",
  "editing_plan",
  "edited_manuscript",
  "proofread_manuscript",
  "validated_manuscript",
  "metadata_asset",
  "cover_asset",
  "layout_asset",
  "qa_asset",
];

function isDocxExportableAssetKind(value: string): value is SupportedWorkflowAssetKind {
  return DOCX_EXPORTABLE_ASSET_KINDS.includes(value as SupportedWorkflowAssetKind);
}

function toBulletList(items: Array<string | null | undefined>): string[] {
  return items
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .map((item) => `• ${item}`);
}

function toNumberedList(items: Array<string | null | undefined>): string[] {
  return items
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .map((item, index) => `${index + 1}. ${item}`);
}

function addSection(
  sections: string[],
  title: string,
  lines: Array<string | null | undefined>
) {
  const normalizedLines = lines.filter(
    (line): line is string => typeof line === "string" && line.trim().length > 0
  );

  if (normalizedLines.length === 0) {
    return;
  }

  sections.push([title, ...normalizedLines].join("\n"));
}

function stringifyUnknown(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function replaceExtensionWithDocx(fileName: string): string {
  return /\.[^.]+$/.test(fileName)
    ? fileName.replace(/\.[^.]+$/, ".docx")
    : `${fileName}.docx`;
}

function createDocxFileName(options: {
  originalFileName?: string | null;
  assetKind: string;
  version?: number | null;
}): string {
  const originalFileName = options.originalFileName?.trim();
  if (originalFileName) {
    return originalFileName.toLowerCase().endsWith(".docx")
      ? originalFileName
      : replaceExtensionWithDocx(originalFileName);
  }

  const suffix =
    typeof options.version === "number" && options.version > 0
      ? `_v${options.version}`
      : "";
  return `${options.assetKind}${suffix}.docx`;
}

function buildNormalizedTextExport(document: NormalizedManuscriptDocument): string {
  const sections: string[] = [];

  addSection(sections, "Documento normalizado", [
    `Archivo fuente: ${document.source_file_name}`,
    `Idioma declarado: ${document.declared_language}`,
    `Idioma detectado: ${document.detected_language.code}`,
    `Palabras: ${document.stats.word_count}`,
    `Párrafos: ${document.stats.paragraph_count}`,
    `Capítulos detectados: ${document.stats.chapter_count}`,
  ]);

  addSection(sections, "Capítulos detectados", toNumberedList(
    document.chapters.map((chapter) => chapter.title || "Sin título")
  ));

  addSection(sections, "Texto normalizado", [document.normalized_text]);

  return sections.join("\n\n");
}

function buildAnalysisExport(report: EditorialAnalysisReport): string {
  const sections: string[] = [];

  addSection(sections, "Análisis editorial", [
    `Género detectado: ${report.detected_genre}`,
    `Audiencia objetivo: ${report.target_audience}`,
    `Puntaje general: ${report.score.overall}`,
    `Estructura: ${report.score.structure}`,
    `Claridad: ${report.score.clarity}`,
    `Lenguaje: ${report.score.language}`,
    `Market fit: ${report.score.market_fit}`,
  ]);

  addSection(sections, "Resumen ejecutivo", [report.executive_summary]);
  addSection(sections, "Fortalezas", toBulletList(report.strengths));
  addSection(sections, "Debilidades", toBulletList(report.weaknesses));
  addSection(
    sections,
    "Hallazgos",
    report.issues.flatMap((issue, index) => [
      `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`,
      issue.explanation,
    ])
  );
  addSection(sections, "Recomendaciones", toNumberedList(report.recommendations));
  addSection(sections, "Razonamiento", [
    report.reasoning.score_summary,
    report.reasoning.genre_reasoning,
    report.reasoning.audience_reasoning,
  ]);

  return sections.join("\n\n");
}

function buildEditingPlanExport(plan: EditorialEditingPlan): string {
  const sections: string[] = [];

  addSection(sections, "Plan de edición", [
    `Estrategia: ${plan.strategy}`,
    `Objetivo global: ${plan.global_objective}`,
  ]);
  addSection(sections, "Fundamento de la estrategia", toBulletList(plan.strategy_reasoning));
  addSection(
    sections,
    "Instrucciones globales",
    plan.instructions.flatMap((instruction, index) => [
      `${index + 1}. [${instruction.priority.toUpperCase()}] ${instruction.category}`,
      instruction.instruction,
      `Razón: ${instruction.rationale}`,
    ])
  );
  addSection(
    sections,
    "Plan por capítulo",
    plan.chapter_plan.flatMap((chapter, index) => [
      `${index + 1}. ${chapter.chapter_title}`,
      `Prioridad: ${chapter.priority}`,
      `Objetivo: ${chapter.objective}`,
      ...toBulletList(chapter.focus_areas),
      ...toNumberedList(chapter.instructions),
    ])
  );

  return sections.join("\n\n");
}

function buildEditedManuscriptExport(manuscript: EditorialEditedManuscript): string {
  const sections: string[] = [];

  addSection(sections, "Edición de contenido", [
    `Estrategia: ${manuscript.strategy}`,
    `Capítulos: ${manuscript.change_totals.chapter_count}`,
    `Cambios trazados: ${manuscript.change_totals.tracked_change_count}`,
    `Promedio de cambio: ${Math.round(manuscript.change_totals.average_change_ratio * 100)}%`,
  ]);
  addSection(sections, "Resumen global", [manuscript.global_summary]);
  addSection(
    sections,
    "Resumen por capítulo",
    manuscript.chapter_revisions.flatMap((chapter, index) => [
      `${index + 1}. ${chapter.chapter_title}`,
      chapter.summary,
      ...toBulletList(chapter.structure_actions),
      ...toBulletList(chapter.preservation_notes),
    ])
  );
  addSection(sections, "Manuscrito editado", [manuscript.full_edited_text]);

  return sections.join("\n\n");
}

function buildProofreadExport(manuscript: EditorialProofreadManuscript): string {
  const sections: string[] = [];

  addSection(sections, "Corrección lingüística", [
    `Capítulos: ${manuscript.change_totals.chapter_count}`,
    `Correcciones aplicadas: ${manuscript.change_totals.correction_count}`,
    `Promedio de cambio: ${Math.round(manuscript.change_totals.average_change_ratio * 100)}%`,
  ]);
  addSection(sections, "Resumen global", [manuscript.global_summary]);
  addSection(sections, "Notas de estilo", toBulletList(manuscript.style_profile.style_notes));
  addSection(
    sections,
    "Resumen por capítulo",
    manuscript.chapter_revisions.flatMap((chapter, index) => [
      `${index + 1}. ${chapter.chapter_title}`,
      chapter.summary,
      ...toBulletList(chapter.applied_rules),
      ...toBulletList(chapter.editorial_flags),
    ])
  );
  addSection(sections, "Manuscrito corregido", [manuscript.full_proofread_text]);

  return sections.join("\n\n");
}

function buildValidatedExport(manuscript: EditorialValidatedManuscript): string {
  const sections: string[] = [];

  addSection(sections, "Validación semántica", [
    `Capítulos: ${manuscript.validation_totals.chapter_count}`,
    `Issues detectados: ${manuscript.validation_totals.issue_count}`,
    `Fixes aplicados: ${manuscript.validation_totals.applied_fix_count}`,
    `Fixes omitidos: ${manuscript.validation_totals.skipped_fix_count}`,
  ]);
  addSection(sections, "Resumen global", [manuscript.global_summary]);
  addSection(
    sections,
    "Issues",
    manuscript.issues.flatMap((issue, index) => [
      `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`,
      issue.explanation,
      issue.suggested_fix ? `Sugerencia: ${issue.suggested_fix}` : null,
    ])
  );
  addSection(
    sections,
    "Registro de entidades",
    manuscript.entity_registry.map(
      (entity) =>
        `${entity.entity} (${entity.kind}) -> ${entity.canonical_form}; variantes: ${entity.observed_forms.join(", ")}`
    )
  );
  addSection(sections, "Manuscrito validado", [manuscript.full_validated_text]);

  return sections.join("\n\n");
}

function buildMetadataExport(metadata: EditorialMetadataPackage): string {
  const sections: string[] = [];

  addSection(sections, "Metadata editorial y comercial", [
    `Título optimizado: ${metadata.optimized_title}`,
    metadata.subtitle ? `Subtítulo: ${metadata.subtitle}` : null,
    `Audiencia: ${metadata.target_audience}`,
    `Posicionamiento: ${metadata.positioning_statement}`,
  ]);
  addSection(sections, "Descripción comercial", [metadata.book_description]);
  addSection(sections, "Categorías", toBulletList(metadata.categories));
  addSection(sections, "Keywords", toBulletList(metadata.keywords));
  addSection(sections, "Notas SEO", toBulletList(metadata.seo_notes));

  return sections.join("\n\n");
}

function buildCoverExport(coverPackage: EditorialCoverConceptPackage): string {
  const sections: string[] = [];

  addSection(sections, "Portadas", [
    `Proyecto: ${coverPackage.project_id}`,
    `Metadata asset: ${coverPackage.metadata_asset_id}`,
    `Validated asset: ${coverPackage.validated_asset_id}`,
    `Modelo: ${coverPackage.model}`,
  ]);
  addSection(sections, "Dirección creativa", [
    `Género: ${coverPackage.creative_direction.genre}`,
    `Audiencia: ${coverPackage.creative_direction.target_audience}`,
    `Mood: ${coverPackage.creative_direction.mood}`,
    `Posicionamiento: ${coverPackage.creative_direction.positioning_statement}`,
    `Paleta: ${coverPackage.creative_direction.palette.join(", ")}`,
    `Símbolos: ${coverPackage.creative_direction.visual_symbols.join(", ")}`,
    `Tipografía: ${coverPackage.creative_direction.typography_direction}`,
  ]);
  addSection(
    sections,
    "Variaciones",
    coverPackage.variations.flatMap((variation, index) => [
      `${index + 1}. ${variation.title}`,
      `Ángulo comercial: ${variation.market_angle}`,
      variation.rationale,
      `Prompt: ${variation.prompt}`,
      variation.revised_prompt ? `Prompt revisado: ${variation.revised_prompt}` : null,
      variation.public_url ? `URL: ${variation.public_url}` : null,
    ])
  );

  return sections.join("\n\n");
}

function buildLayoutExport(layoutPackage: EditorialLayoutPackage): string {
  const sections: string[] = [];

  addSection(sections, "Maquetación", [
    `Preset impresión: ${layoutPackage.print_template.page_preset_id ?? "N/A"}`,
    `Formato impresión: ${layoutPackage.print_template.output_format}`,
    `Formato digital: ${layoutPackage.digital_template.output_format}`,
    `Estilo: ${layoutPackage.layout_style}`,
    `Plantilla impresión: ${layoutPackage.print_template.label}`,
    `Plantilla digital: ${layoutPackage.digital_template.label}`,
  ]);
  addSection(sections, "Tipografía", [
    `Fuente cuerpo: ${layoutPackage.typography.body_font}`,
    `Tamaño cuerpo: ${layoutPackage.typography.body_size}`,
    `Interlineado: ${layoutPackage.typography.body_line_height}`,
    `Fuente capítulos: ${layoutPackage.typography.chapter_title_font}`,
  ]);
  addSection(
    sections,
    "Capítulos incluidos",
    layoutPackage.chapters.map(
      (chapter) =>
        `${chapter.order}. ${chapter.title} (${chapter.word_count} palabras)`
    )
  );
  addSection(
    sections,
    "Exports generados",
    layoutPackage.exports.map((asset) => {
      const pageCount =
        typeof asset.page_count === "number" ? `, páginas: ${asset.page_count}` : "";
      return `${asset.format.toUpperCase()}: ${asset.public_url}${pageCount}`;
    })
  );

  return sections.join("\n\n");
}

function buildQaExport(qaPackage: EditorialApprovedPackage): string {
  const sections: string[] = [];

  addSection(sections, "Control de calidad", [
    qaPackage.approved ? "Resultado: aprobado" : "Resultado: requiere atención",
    qaPackage.summary,
    `PDF: ${qaPackage.pdf_storage_path}`,
    `EPUB: ${qaPackage.epub_storage_path}`,
  ]);
  addSection(
    sections,
    "Checks",
    qaPackage.checks.map(
      (check) =>
        `[${check.status.toUpperCase()}] ${check.label} (${check.file_format}) - ${check.details}`
    )
  );
  addSection(
    sections,
    "Issues",
    qaPackage.issues.map(
      (issue) =>
        `[${issue.severity.toUpperCase()}] ${issue.title} (${issue.file_format}) - ${issue.message}`
    )
  );

  return sections.join("\n\n");
}

function buildGenericExport(assetKind: string, payload: unknown): string {
  return [
    `Entregable del workflow: ${assetKind}`,
    "Contenido serializado:",
    stringifyUnknown(payload),
  ].join("\n\n");
}

function buildWorkflowAssetExportText(assetKind: SupportedWorkflowAssetKind, payload: unknown): string {
  switch (assetKind) {
    case "manuscript":
      return typeof payload === "string" ? payload : buildGenericExport(assetKind, payload);
    case "normalized_text":
      return buildNormalizedTextExport(payload as NormalizedManuscriptDocument);
    case "analysis_output":
      return buildAnalysisExport(payload as EditorialAnalysisReport);
    case "editing_plan":
      return buildEditingPlanExport(payload as EditorialEditingPlan);
    case "edited_manuscript":
      return buildEditedManuscriptExport(payload as EditorialEditedManuscript);
    case "proofread_manuscript":
      return buildProofreadExport(payload as EditorialProofreadManuscript);
    case "validated_manuscript":
      return buildValidatedExport(payload as EditorialValidatedManuscript);
    case "metadata_asset":
      return buildMetadataExport(payload as EditorialMetadataPackage);
    case "cover_asset":
      return buildCoverExport(payload as EditorialCoverConceptPackage);
    case "layout_asset":
      return buildLayoutExport(payload as EditorialLayoutPackage);
    case "qa_asset":
      return buildQaExport(payload as EditorialApprovedPackage);
    default:
      return buildGenericExport(assetKind, payload);
  }
}

export async function generateWorkflowAssetDocx(input: {
  assetKind: string;
  payload: unknown;
  originalFileName?: string | null;
  version?: number | null;
}): Promise<{ buffer: Buffer; fileName: string } | null> {
  if (!isDocxExportableAssetKind(input.assetKind)) {
    return null;
  }

  const text = buildWorkflowAssetExportText(input.assetKind, input.payload);
  const buffer = await generateDocxFromText(text);

  return {
    buffer,
    fileName: createDocxFileName({
      originalFileName: input.originalFileName,
      assetKind: input.assetKind,
      version: input.version,
    }),
  };
}
