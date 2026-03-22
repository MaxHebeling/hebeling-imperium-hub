import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export type EditorialProofreadingCategory =
  | "grammar"
  | "spelling"
  | "punctuation"
  | "style"
  | "consistency";

export interface EditorialProofreadingInput {
  projectId: string;
}

export interface EditorialStyleRule {
  id: string;
  category: EditorialProofreadingCategory;
  label: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface EditorialStyleProfile {
  version: 1;
  language: string;
  genre: string;
  tone_target: string;
  style_notes: string[];
  rules: EditorialStyleRule[];
}

export interface EditorialProofreadChange {
  id: string;
  chapter_id: string;
  category: EditorialProofreadingCategory;
  title: string;
  rationale: string;
  before_excerpt: string;
  after_excerpt: string;
  severity: "low" | "medium" | "high";
}

export interface EditorialProofreadChapter {
  id: string;
  chapter_id: string;
  chapter_title: string;
  original_text: string;
  proofread_text: string;
  summary: string;
  applied_rules: string[];
  editorial_flags: string[];
  changes: EditorialProofreadChange[];
  metrics: {
    original_word_count: number;
    proofread_word_count: number;
    change_ratio: number;
  };
}

export interface EditorialProofreadManuscript {
  schema_version: 1;
  project_id: string;
  edited_asset_id: string;
  style_profile: EditorialStyleProfile;
  full_edited_text: string;
  full_proofread_text: string;
  chapter_revisions: EditorialProofreadChapter[];
  global_summary: string;
  change_totals: {
    chapter_count: number;
    correction_count: number;
    average_change_ratio: number;
  };
  generated_at: string;
  model: string;
  rules_version: 1;
}

export interface EditorialProofreadingResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  editedAssetId: string;
  proofreadAssetId?: string | null;
  proofreadAssetUri?: string | null;
  chapterCount?: number;
  correctionCount?: number;
  transitioned?: boolean;
  partial?: boolean;
  processedChapterCount?: number;
  remainingChapterCount?: number;
}
