/* ------------------------------------------------------------------ */
/*  eBook Production Module — Types                                    */
/*  Supports: print only, ebook only, print + ebook output modes       */
/* ------------------------------------------------------------------ */

/** Output mode for editorial projects */
export type ProjectOutputMode = "print" | "ebook" | "print_and_ebook";

/** eBook type classification */
export type EbookType = "reflowable" | "fixed_layout" | "auto_detect";

/** eBook destination platform */
export type EbookDestination = "amazon_kdp" | "general_epub" | "both";

/** Whether the ebook is new or adapted from print */
export type EbookOrigin = "new_ebook" | "print_adaptation";

/** eBook production stage keys (sequential pipeline) */
export type EbookStageKey =
  | "manuscript_prep"
  | "structural_cleanup"
  | "front_matter"
  | "toc_generation"
  | "reflowable_prep"
  | "validation"
  | "final_export";

/** Status of an individual eBook stage */
export type EbookStageStatus =
  | "pending"
  | "in_progress"
  | "review_required"
  | "approved"
  | "failed"
  | "completed";

/* ------------------------------------------------------------------ */
/*  eBook Project Configuration                                        */
/* ------------------------------------------------------------------ */

export interface EbookProjectConfig {
  /** Output mode for the project */
  outputMode: ProjectOutputMode;
  /** eBook type (reflowable vs fixed layout) */
  ebookType: EbookType;
  /** Destination platform */
  destination: EbookDestination;
  /** Origin of the eBook */
  origin: EbookOrigin;
  /** Language for AI processing */
  language: "es" | "en";
  /** Whether to include dedication */
  includeDedication: boolean;
  /** Whether to include acknowledgments */
  includeAcknowledgments: boolean;
  /** Whether to include author bio */
  includeAuthorBio: boolean;
  /** Whether to include back matter */
  includeBackMatter: boolean;
  /** Custom front matter sections */
  customFrontMatter?: string[];
  /** Custom back matter sections */
  customBackMatter?: string[];
}

/* ------------------------------------------------------------------ */
/*  eBook Stage Definition                                             */
/* ------------------------------------------------------------------ */

export interface EbookStage {
  id: string;
  projectId: string;
  stageKey: EbookStageKey;
  status: EbookStageStatus;
  startedAt: string | null;
  completedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
  validationErrors: string[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  eBook Structural Elements                                          */
/* ------------------------------------------------------------------ */

export interface EbookChapter {
  id: string;
  order: number;
  title: string;
  level: number; // heading level (1=H1, 2=H2, etc.)
  wordCount: number;
  hasImages: boolean;
  requiresFixedLayout: boolean;
}

export interface EbookFrontMatter {
  titlePage: boolean;
  copyrightPage: boolean;
  dedication: string | null;
  acknowledgments: string | null;
  tableOfContents: boolean;
  foreword: string | null;
  preface: string | null;
}

export interface EbookBackMatter {
  authorBio: string | null;
  glossary: boolean;
  bibliography: boolean;
  index: boolean;
  appendices: string[];
  alsoByAuthor: string[];
}

export interface EbookStructure {
  projectId: string;
  chapters: EbookChapter[];
  frontMatter: EbookFrontMatter;
  backMatter: EbookBackMatter;
  totalWordCount: number;
  estimatedReadingTime: number; // minutes
  hasComplexLayout: boolean;
  recommendedType: EbookType;
}

/* ------------------------------------------------------------------ */
/*  eBook Validation                                                   */
/* ------------------------------------------------------------------ */

export type ValidationSeverity = "error" | "warning" | "info";

export interface EbookValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: "structure" | "navigation" | "front_matter" | "formatting" | "compatibility" | "metadata";
  message: string;
  details?: string;
  chapterId?: string;
  autoFixable: boolean;
}

export interface EbookValidationResult {
  projectId: string;
  isValid: boolean;
  issues: EbookValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  validatedAt: string;
  requiresHumanReview: boolean;
}

/* ------------------------------------------------------------------ */
/*  eBook Export                                                        */
/* ------------------------------------------------------------------ */

export type EbookExportFormat = "epub" | "kpf" | "mobi" | "html_preview";

export interface EbookExportFile {
  id: string;
  projectId: string;
  format: EbookExportFormat;
  fileName: string;
  storagePath: string | null;
  sizeBytes: number | null;
  version: number;
  status: "pending" | "generating" | "ready" | "failed";
  generatedAt: string | null;
  errorMessage: string | null;
}

export interface EbookExportPackage {
  projectId: string;
  files: EbookExportFile[];
  config: EbookProjectConfig;
  validation: EbookValidationResult | null;
  status: "building" | "ready" | "failed";
  createdAt: string;
  completedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Tool Integration                                                   */
/* ------------------------------------------------------------------ */

export type EbookToolProvider =
  | "atticus"
  | "kindle_create"
  | "kindle_previewer"
  | "vellum"
  | "draft2digital"
  | "internal";

export interface EbookToolConfig {
  provider: EbookToolProvider;
  enabled: boolean;
  apiKeyEnvVar?: string;
  endpoint?: string;
  capabilities: EbookToolCapability[];
}

export type EbookToolCapability =
  | "format_epub"
  | "format_kpf"
  | "validate_kindle"
  | "preview"
  | "distribute"
  | "convert";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const EBOOK_STAGE_KEYS: EbookStageKey[] = [
  "manuscript_prep",
  "structural_cleanup",
  "front_matter",
  "toc_generation",
  "reflowable_prep",
  "validation",
  "final_export",
];

export const EBOOK_STAGE_LABELS: Record<EbookStageKey, { es: string; en: string }> = {
  manuscript_prep: { es: "Preparacion del manuscrito", en: "Manuscript Preparation" },
  structural_cleanup: { es: "Limpieza estructural", en: "Structural Cleanup" },
  front_matter: { es: "Generacion de preliminares", en: "Front Matter Generation" },
  toc_generation: { es: "Tabla de contenido", en: "Table of Contents" },
  reflowable_prep: { es: "Preparacion reflowable", en: "Reflowable Preparation" },
  validation: { es: "Validacion", en: "Validation" },
  final_export: { es: "Exportacion final", en: "Final Export" },
};

export const EBOOK_STAGE_PROGRESS: Record<EbookStageKey, number> = {
  manuscript_prep: 10,
  structural_cleanup: 25,
  front_matter: 40,
  toc_generation: 55,
  reflowable_prep: 70,
  validation: 85,
  final_export: 100,
};

export const OUTPUT_MODE_LABELS: Record<ProjectOutputMode, { es: string; en: string }> = {
  print: { es: "Solo impresion", en: "Print only" },
  ebook: { es: "Solo eBook", en: "eBook only" },
  print_and_ebook: { es: "Impresion + eBook", en: "Print + eBook" },
};

export const EBOOK_TYPE_LABELS: Record<EbookType, { es: string; en: string }> = {
  reflowable: { es: "Reflowable (texto fluido)", en: "Reflowable" },
  fixed_layout: { es: "Layout fijo", en: "Fixed Layout" },
  auto_detect: { es: "Auto-detectar", en: "Auto-detect" },
};

export const EBOOK_DESTINATION_LABELS: Record<EbookDestination, { es: string; en: string }> = {
  amazon_kdp: { es: "Amazon KDP", en: "Amazon KDP" },
  general_epub: { es: "EPUB general", en: "General EPUB" },
  both: { es: "Amazon KDP + EPUB general", en: "Amazon KDP + General EPUB" },
};

export const EBOOK_ORIGIN_LABELS: Record<EbookOrigin, { es: string; en: string }> = {
  new_ebook: { es: "eBook nuevo", en: "New eBook" },
  print_adaptation: { es: "Adaptacion de edicion impresa", en: "Print edition adaptation" },
};

export const DEFAULT_EBOOK_CONFIG: EbookProjectConfig = {
  outputMode: "print_and_ebook",
  ebookType: "auto_detect",
  destination: "both",
  origin: "new_ebook",
  language: "es",
  includeDedication: false,
  includeAcknowledgments: false,
  includeAuthorBio: true,
  includeBackMatter: false,
};
