/**
 * AI Publishing Director — Amazon KDP & Commercial Distribution Preparation
 *
 * Prepares books for professional publishing on Amazon KDP and other
 * distribution channels. Handles interior layout export, cover dimensions,
 * spine calculation, metadata preparation, and final publishing package.
 *
 * Integrates with:
 * - KDP constants (trim sizes, paper specs, cover calculations)
 * - Distribution system (channels, metadata)
 * - Layout Director (interior design)
 * - Cover Art Director (cover design)
 * - Editorial Orchestrator (quality validation)
 */

import type { KdpPaperType, KdpBindingType, KdpBleedOption } from "../kdp/types";
import type { EditorialStageKey } from "../types/editorial";

// ─── Publishing Configuration ───────────────────────────────────────

export interface PublishingConfig {
  /** Amazon KDP trim size ID */
  trimSizeId: string;
  /** Paper type */
  paperType: KdpPaperType;
  /** Binding type */
  binding: KdpBindingType;
  /** Bleed option */
  bleed: KdpBleedOption;
  /** Estimated page count */
  pageCount: number;
  /** ISBN (optional) */
  isbn?: string;
  /** Target platform */
  platform: PublishingPlatform;
  /** Interior layout preset ID */
  layoutPresetId?: string;
  /** Cover concept ID */
  coverConceptId?: string;
}

export type PublishingPlatform =
  | "amazon_kdp"
  | "ingram_spark"
  | "apple_books"
  | "google_play"
  | "direct";

export const PUBLISHING_PLATFORM_LABELS: Record<PublishingPlatform, string> = {
  amazon_kdp: "Amazon KDP",
  ingram_spark: "IngramSpark",
  apple_books: "Apple Books",
  google_play: "Google Play Libros",
  direct: "Distribucion Directa",
};

// ─── Book Metadata ──────────────────────────────────────────────────

export interface BookMetadata {
  /** Book title */
  title: string;
  /** Book subtitle */
  subtitle?: string;
  /** Author name(s) */
  authors: string[];
  /** Publisher name */
  publisher: string;
  /** ISBN-13 */
  isbn13?: string;
  /** ISBN-10 */
  isbn10?: string;
  /** ASIN (Amazon) */
  asin?: string;
  /** Language code (es, en) */
  language: string;
  /** Primary genre/category */
  primaryCategory: string;
  /** Secondary categories */
  secondaryCategories: string[];
  /** Keywords for discoverability (max 7 for KDP) */
  keywords: string[];
  /** Book description / synopsis */
  description: string;
  /** Author bio */
  authorBio?: string;
  /** Publication date */
  publicationDate?: string;
  /** Edition */
  edition?: string;
  /** Copyright year */
  copyrightYear: number;
  /** Copyright holder */
  copyrightHolder: string;
  /** Country of publication */
  countryOfPublication: string;
  /** Series information */
  series?: {
    name: string;
    number: number;
  };
  /** Page count */
  pageCount: number;
  /** Word count */
  wordCount?: number;
  /** Trim size */
  trimSize: string;
  /** Paper type */
  paperType: string;
  /** Binding type */
  binding: string;
  /** Price */
  listPrice?: {
    amount: number;
    currency: string;
  };
}

// ─── Publishing Checklist ───────────────────────────────────────────

export interface PublishingChecklistItem {
  id: string;
  category: ChecklistCategory;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  autoVerifiable: boolean;
}

export type ChecklistCategory =
  | "editorial"
  | "interior"
  | "cover"
  | "metadata"
  | "technical"
  | "legal";

/**
 * Generate the publishing checklist for a project.
 * All items must be completed before final export.
 */
export function generatePublishingChecklist(
  config: PublishingConfig,
  metadata: Partial<BookMetadata>
): PublishingChecklistItem[] {
  const items: PublishingChecklistItem[] = [];
  const now = new Date().toISOString();

  // Editorial checks
  items.push(
    {
      id: "ed_spelling",
      category: "editorial",
      label: "Correccion ortografica completada",
      description: "Todas las correcciones ortograficas han sido procesadas y aprobadas.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "ed_grammar",
      category: "editorial",
      label: "Correccion gramatical completada",
      description: "Todas las correcciones gramaticales han sido procesadas y aprobadas.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "ed_ortotypography",
      category: "editorial",
      label: "Normalizacion ortotipografica completada",
      description: "Ortotipografia normalizada segun estandares editoriales.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "ed_style",
      category: "editorial",
      label: "Revision de estilo completada",
      description: "Mejoras de estilo revisadas y aprobadas.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "ed_reports",
      category: "editorial",
      label: "Reportes editoriales generados",
      description: "Todos los reportes de correccion han sido generados.",
      required: true,
      completed: false,
      autoVerifiable: true,
    }
  );

  // Interior checks
  items.push(
    {
      id: "int_layout",
      category: "interior",
      label: "Layout interior generado",
      description: "El diseno interior del libro ha sido generado.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "int_typography",
      category: "interior",
      label: "Tipografia consistente",
      description: "La tipografia es consistente en todo el libro.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "int_margins",
      category: "interior",
      label: "Margenes compatibles con KDP",
      description: "Los margenes cumplen con los requisitos minimos de Amazon KDP.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "int_pagination",
      category: "interior",
      label: "Paginacion correcta",
      description: "La paginacion es correcta y consistente.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "int_toc",
      category: "interior",
      label: "Tabla de contenido",
      description: "La tabla de contenido esta generada y es correcta.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "int_front_matter",
      category: "interior",
      label: "Front matter completo",
      description: "Portadilla, portada, copyright, dedicatoria incluidos.",
      required: true,
      completed: false,
      autoVerifiable: false,
    }
  );

  // Cover checks
  items.push(
    {
      id: "cov_front",
      category: "cover",
      label: "Portada frontal aprobada",
      description: "El diseno de la portada frontal ha sido aprobado.",
      required: true,
      completed: false,
      autoVerifiable: false,
    },
    {
      id: "cov_spine",
      category: "cover",
      label: "Lomo calculado y verificado",
      description: "El ancho del lomo ha sido calculado segun el numero de paginas.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "cov_back",
      category: "cover",
      label: "Contraportada completa",
      description: "La contraportada incluye sinopsis, ISBN y elementos requeridos.",
      required: true,
      completed: false,
      autoVerifiable: false,
    },
    {
      id: "cov_dimensions",
      category: "cover",
      label: "Dimensiones de portada correctas",
      description: "Las dimensiones de la portada coinciden con las especificaciones KDP.",
      required: true,
      completed: false,
      autoVerifiable: true,
    }
  );

  // Metadata checks
  items.push(
    {
      id: "meta_title",
      category: "metadata",
      label: "Titulo del libro",
      description: "El titulo del libro esta definido.",
      required: true,
      completed: Boolean(metadata.title),
      completedAt: metadata.title ? now : undefined,
      autoVerifiable: true,
    },
    {
      id: "meta_author",
      category: "metadata",
      label: "Nombre del autor",
      description: "El nombre del autor esta definido.",
      required: true,
      completed: Boolean(metadata.authors?.length),
      completedAt: metadata.authors?.length ? now : undefined,
      autoVerifiable: true,
    },
    {
      id: "meta_description",
      category: "metadata",
      label: "Descripcion del libro",
      description: "La sinopsis/descripcion del libro esta completa.",
      required: true,
      completed: Boolean(metadata.description),
      completedAt: metadata.description ? now : undefined,
      autoVerifiable: true,
    },
    {
      id: "meta_categories",
      category: "metadata",
      label: "Categorias seleccionadas",
      description: "Las categorias de Amazon han sido seleccionadas.",
      required: true,
      completed: Boolean(metadata.primaryCategory),
      completedAt: metadata.primaryCategory ? now : undefined,
      autoVerifiable: true,
    },
    {
      id: "meta_keywords",
      category: "metadata",
      label: "Keywords definidos",
      description: "Los keywords para discoverability han sido definidos (max 7).",
      required: true,
      completed: Boolean(metadata.keywords?.length),
      completedAt: metadata.keywords?.length ? now : undefined,
      autoVerifiable: true,
    },
    {
      id: "meta_isbn",
      category: "metadata",
      label: "ISBN asignado",
      description: "Un ISBN-13 ha sido asignado al libro.",
      required: false,
      completed: Boolean(config.isbn || metadata.isbn13),
      completedAt: config.isbn || metadata.isbn13 ? now : undefined,
      autoVerifiable: true,
    }
  );

  // Technical checks
  items.push(
    {
      id: "tech_pdf_interior",
      category: "technical",
      label: "PDF interior generado",
      description: "El PDF print-ready del interior ha sido generado.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "tech_pdf_cover",
      category: "technical",
      label: "PDF de portada generado",
      description: "El PDF full-wrap de la portada ha sido generado.",
      required: true,
      completed: false,
      autoVerifiable: true,
    },
    {
      id: "tech_page_count",
      category: "technical",
      label: "Conteo de paginas valido",
      description: `El libro tiene ${config.pageCount} paginas (minimo 24 para KDP).`,
      required: true,
      completed: config.pageCount >= 24,
      completedAt: config.pageCount >= 24 ? now : undefined,
      autoVerifiable: true,
    },
    {
      id: "tech_resolution",
      category: "technical",
      label: "Resolucion 300 DPI",
      description: "Todos los archivos cumplen con la resolucion minima de 300 DPI.",
      required: true,
      completed: false,
      autoVerifiable: true,
    }
  );

  // Legal checks
  items.push(
    {
      id: "legal_copyright",
      category: "legal",
      label: "Pagina de copyright",
      description: "La pagina de copyright esta incluida en el interior.",
      required: true,
      completed: false,
      autoVerifiable: false,
    },
    {
      id: "legal_rights",
      category: "legal",
      label: "Derechos de publicacion",
      description: "Los derechos de publicacion han sido verificados.",
      required: true,
      completed: false,
      autoVerifiable: false,
    }
  );

  return items;
}

// ─── Publishing Package ─────────────────────────────────────────────

export interface PublishingPackageFile {
  id: string;
  fileType: PackageFileType;
  fileName: string;
  description: string;
  storagePath: string | null;
  mimeType: string;
  sizeBytes: number | null;
  generatedAt: string | null;
  status: "pending" | "generating" | "ready" | "failed";
}

export type PackageFileType =
  | "interior_pdf"
  | "cover_pdf"
  | "front_cover_image"
  | "marketing_preview"
  | "ebook_epub"
  | "metadata_json"
  | "editorial_reports"
  | "manuscript_source"
  | "publishing_checklist";

export interface PublishingPackage {
  id: string;
  projectId: string;
  /** All files in the package */
  files: PublishingPackageFile[];
  /** Publishing checklist */
  checklist: PublishingChecklistItem[];
  /** Book metadata */
  metadata: BookMetadata;
  /** KDP configuration */
  config: PublishingConfig;
  /** Package status */
  status: "building" | "ready" | "submitted" | "failed";
  /** Creation timestamp */
  createdAt: string;
  /** Completion timestamp */
  completedAt: string | null;
}

/**
 * Generate the expected file list for a publishing package.
 */
export function generatePackageFileList(
  projectId: string,
  config: PublishingConfig
): PublishingPackageFile[] {
  const files: PublishingPackageFile[] = [
    {
      id: `${projectId}_interior_pdf`,
      fileType: "interior_pdf",
      fileName: "interior-print-ready.pdf",
      description: "PDF del interior listo para impresion (300 DPI, margenes KDP).",
      storagePath: null,
      mimeType: "application/pdf",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_cover_pdf`,
      fileType: "cover_pdf",
      fileName: "cover-full-wrap.pdf",
      description: "PDF de portada completa (frontal + lomo + contraportada).",
      storagePath: null,
      mimeType: "application/pdf",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_front_cover`,
      fileType: "front_cover_image",
      fileName: "front-cover.png",
      description: "Imagen de portada frontal (para ebook y marketing).",
      storagePath: null,
      mimeType: "image/png",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_marketing`,
      fileType: "marketing_preview",
      fileName: "marketing-preview.jpg",
      description: "Vista previa de marketing (mockup 3D o presentacion).",
      storagePath: null,
      mimeType: "image/jpeg",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_metadata`,
      fileType: "metadata_json",
      fileName: "metadata-summary.json",
      description: "Resumen de metadatos del libro en formato JSON.",
      storagePath: null,
      mimeType: "application/json",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_reports`,
      fileType: "editorial_reports",
      fileName: "editorial-reports.zip",
      description: "Paquete de reportes editoriales (ortografia, gramatica, estilo).",
      storagePath: null,
      mimeType: "application/zip",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_manuscript`,
      fileType: "manuscript_source",
      fileName: "manuscript-source.docx",
      description: "Manuscrito fuente original.",
      storagePath: null,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
    {
      id: `${projectId}_checklist`,
      fileType: "publishing_checklist",
      fileName: "publishing-checklist.pdf",
      description: "Checklist de publicacion con estado de verificacion.",
      storagePath: null,
      mimeType: "application/pdf",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    },
  ];

  // Add ebook if platform supports it
  if (config.platform === "amazon_kdp" || config.platform === "apple_books") {
    files.push({
      id: `${projectId}_ebook`,
      fileType: "ebook_epub",
      fileName: "ebook.epub",
      description: "Archivo ebook en formato EPUB.",
      storagePath: null,
      mimeType: "application/epub+zip",
      sizeBytes: null,
      generatedAt: null,
      status: "pending",
    });
  }

  return files;
}

// ─── Metadata Validation ────────────────────────────────────────────

export interface MetadataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate book metadata for publishing readiness.
 */
export function validateBookMetadata(
  metadata: Partial<BookMetadata>,
  platform: PublishingPlatform
): MetadataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!metadata.title?.trim()) {
    errors.push("El titulo del libro es obligatorio.");
  }
  if (!metadata.authors?.length) {
    errors.push("Al menos un autor es obligatorio.");
  }
  if (!metadata.language) {
    errors.push("El idioma del libro es obligatorio.");
  }
  if (!metadata.description?.trim()) {
    errors.push("La descripcion del libro es obligatoria.");
  }
  if (!metadata.primaryCategory) {
    errors.push("La categoria principal es obligatoria.");
  }
  if (!metadata.copyrightYear) {
    errors.push("El ano de copyright es obligatorio.");
  }
  if (!metadata.copyrightHolder?.trim()) {
    errors.push("El titular del copyright es obligatorio.");
  }

  // Platform-specific validations
  if (platform === "amazon_kdp") {
    // KDP requires keywords (max 7)
    if (!metadata.keywords?.length) {
      warnings.push("Se recomiendan keywords para mejorar la discoverability en Amazon.");
    } else if (metadata.keywords.length > 7) {
      errors.push("Amazon KDP permite maximo 7 keywords.");
    }

    // Description length
    if (metadata.description && metadata.description.length > 4000) {
      errors.push("La descripcion excede el limite de 4000 caracteres de Amazon KDP.");
    }

    // Title length
    if (metadata.title && metadata.title.length > 200) {
      errors.push("El titulo excede el limite de 200 caracteres de Amazon KDP.");
    }
  }

  // General warnings
  if (!metadata.isbn13) {
    warnings.push("No se ha asignado un ISBN-13. Recomendado para distribucion comercial.");
  }
  if (!metadata.authorBio) {
    warnings.push("No hay biografia del autor. Recomendado para la contraportada.");
  }
  if (!metadata.series) {
    // Not a warning, just noting
  }
  if (metadata.pageCount && metadata.pageCount < 24) {
    errors.push("Amazon KDP requiere un minimo de 24 paginas.");
  }
  if (metadata.pageCount && metadata.pageCount > 828) {
    errors.push("Amazon KDP permite un maximo de 828 paginas para papel blanco/crema.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Stage-Specific Report Types ────────────────────────────────────

export type EditorialReportType =
  | "orthography"
  | "grammar"
  | "ortotypography"
  | "style"
  | "structure"
  | "translation"
  | "final_review";

export interface EditorialStageReport {
  id: string;
  projectId: string;
  stageKey: EditorialStageKey;
  reportType: EditorialReportType;
  title: string;
  /** Total issues found */
  totalIssues: number;
  /** Issues by severity */
  bySeverity: { alta: number; media: number; baja: number };
  /** Issues by kind */
  byKind: Record<string, number>;
  /** Whether the report has been reviewed by staff */
  reviewed: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Storage path for full DOCX report */
  reportPath: string | null;
  /** Generated timestamp */
  generatedAt: string;
}

/** Map editorial stages to their report types */
export const STAGE_REPORT_MAP: Record<string, EditorialReportType> = {
  estructura: "structure",
  estilo: "style",
  ortotipografia: "ortotypography",
  revision_final: "final_review",
};

/**
 * Generate a stage report summary from correction data.
 */
export function generateStageReportSummary(
  projectId: string,
  stageKey: EditorialStageKey,
  corrections: { severity: string; kind: string }[]
): EditorialStageReport {
  const reportType = STAGE_REPORT_MAP[stageKey] ?? "orthography";

  const bySeverity = { alta: 0, media: 0, baja: 0 };
  const byKind: Record<string, number> = {};

  for (const c of corrections) {
    if (c.severity === "alta") bySeverity.alta++;
    else if (c.severity === "media") bySeverity.media++;
    else bySeverity.baja++;

    const kind = c.kind || "otro";
    byKind[kind] = (byKind[kind] ?? 0) + 1;
  }

  return {
    id: `report_${stageKey}_${Date.now()}`,
    projectId,
    stageKey,
    reportType,
    title: `Reporte de ${reportType} - Etapa ${stageKey}`,
    totalIssues: corrections.length,
    bySeverity,
    byKind,
    reviewed: false,
    reviewedBy: null,
    reviewedAt: null,
    reportPath: null,
    generatedAt: new Date().toISOString(),
  };
}

// ─── System Prompt ──────────────────────────────────────────────────

export function getPublishingDirectorSystemPrompt(): string {
  return `Eres el Director de Publicacion de una editorial profesional premium.

RESPONSABILIDAD:
Preparar libros para publicacion comercial en Amazon KDP y otras plataformas
de distribucion. Asegurar que cada libro cumple con todos los requisitos
tecnicos, editoriales y de calidad para publicacion profesional.

VERIFICACIONES ANTES DE PUBLICAR:
1. Interior completo y con layout profesional
2. Portada completa (frontal + lomo + contraportada)
3. Margenes compatibles con la plataforma de destino
4. Paginacion correcta
5. Tipografia consistente
6. Metadatos completos (titulo, autor, ISBN, descripcion, categorias, keywords)
7. Reportes editoriales generados y revisados
8. Archivos en formato correcto (PDF 300 DPI para impresion)

PAQUETE DE PUBLICACION:
- Interior Print PDF
- Full Cover PDF
- Metadata Summary
- Editorial Reports
- Manuscript Source
- Publishing Checklist
- Ebook (si aplica)

ESTANDARES AMAZON KDP:
- Trim sizes soportados
- Margenes minimos segun numero de paginas
- Spine width calculado segun tipo de papel y paginas
- Bleed de 0.125" cuando aplica
- Resolucion minima 300 DPI
- Formato PDF/X compatible

RESPONDE SIEMPRE EN ESPANOL.`;
}
