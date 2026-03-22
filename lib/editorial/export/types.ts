export type ExportFormat = "pdf" | "epub" | "mobi" | "docx" | "html";

export type ExportStatus = "queued" | "processing" | "completed" | "failed";

export type ExportQuality = "draft" | "review" | "print" | "digital";

export type BookPageSize =
  | "a4"
  | "a5"
  | "letter"
  | "trade_6x9"
  | "trade_5.5x8.5"
  | "pocket_5x8"
  | "custom";

export interface ExportConfig {
  format: ExportFormat;
  quality: ExportQuality;
  includeMetadata: boolean;
  includeCover: boolean;
  includeTableOfContents: boolean;
  pageSize?: BookPageSize;
  customPageWidth?: number;
  customPageHeight?: number;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  /** First-line paragraph indent in mm */
  paragraphIndent?: number;
  /** Start each chapter on recto (odd) page */
  chapterStartRecto?: boolean;
  /** Include running headers (book title / chapter title) */
  runningHeaders?: boolean;
  /** Paper type for KDP compatibility */
  paperType?: "white" | "cream";
}

export interface EditorialExportJob {
  id: string;
  project_id: string;
  export_type: ExportFormat;
  quality: ExportQuality;
  config: ExportConfig;
  status: ExportStatus;
  version: number;
  storage_path: string | null;
  file_size_bytes: number | null;
  checksum: string | null;
  error_message: string | null;
  requested_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExportPreset {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  format: ExportFormat;
  config: ExportConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  epub: "EPUB",
  mobi: "MOBI (Kindle)",
  docx: "Word (DOCX)",
  html: "HTML",
};

export const EXPORT_QUALITY_LABELS: Record<ExportQuality, string> = {
  draft: "Borrador",
  review: "Revisión",
  print: "Impresión",
  digital: "Digital",
};

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "pdf",
  quality: "digital",
  includeMetadata: true,
  includeCover: true,
  includeTableOfContents: true,
  pageSize: "a5",
  margins: {
    top: 20,
    bottom: 20,
    left: 15,
    right: 15,
  },
  fontFamily: "Georgia",
  fontSize: 11,
  lineHeight: 1.5,
};
