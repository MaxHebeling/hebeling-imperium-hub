import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type {
  ChapterOpenerConfig,
  LayoutStyle,
} from "@/lib/editorial/layout/layout-director";

export interface EditorialLayoutEngineInput {
  projectId: string;
}

export type EditorialLayoutOutputFormat = "pdf" | "epub";

export type EditorialLayoutTemplateId = "trade_print" | "reflowable_epub";

export interface EditorialLayoutTemplate {
  id: EditorialLayoutTemplateId;
  label: string;
  description: string;
  output_format: EditorialLayoutOutputFormat;
  page_preset_id: string | null;
  include_front_matter: boolean;
  include_table_of_contents: boolean;
  include_running_headers: boolean;
  reflowable: boolean;
}

export interface EditorialTypographySystem {
  layout_style: LayoutStyle;
  font_combination_id: string;
  body_font: string;
  body_size: number;
  body_line_height: number;
  chapter_title_font: string;
  chapter_title_size: number;
  subtitle_font: string;
  subtitle_size: number;
  header_font: string;
  header_size: number;
  page_number_font: string;
  page_number_size: number;
  paragraph_indent: number;
  chapter_opener: ChapterOpenerConfig;
}

export interface EditorialLayoutChapter {
  id: string;
  order: number;
  title: string;
  anchor: string;
  text: string;
  word_count: number;
}

export interface EditorialLayoutExportArtifact {
  format: EditorialLayoutOutputFormat;
  storage_path: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  page_count: number | null;
  chapter_count: number;
}

export interface EditorialLayoutPackage {
  schema_version: 1;
  project_id: string;
  validated_asset_id: string;
  metadata_asset_id: string;
  cover_asset_id: string | null;
  layout_style: LayoutStyle;
  print_template: EditorialLayoutTemplate;
  digital_template: EditorialLayoutTemplate;
  typography: EditorialTypographySystem;
  chapters: Array<{
    id: string;
    order: number;
    title: string;
    anchor: string;
    word_count: number;
  }>;
  selected_cover_variation_key: string | null;
  exports: EditorialLayoutExportArtifact[];
  generated_at: string;
}

export interface EditorialLayoutEngineResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  validatedAssetId: string;
  metadataAssetId: string;
  coverAssetId: string | null;
  layoutAssetId: string;
  layoutAssetUri: string;
  pdfStoragePath: string;
  epubStoragePath: string;
  transitioned: boolean;
}
