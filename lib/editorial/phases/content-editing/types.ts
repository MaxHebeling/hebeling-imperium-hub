import type { EditorialWorkflowState } from "@/lib/editorial/foundation";
import type { EditingStrategyKey } from "../editing-plan/types";

export interface EditorialContentEditingInput {
  projectId: string;
}

export interface EditorialTrackedChange {
  id: string;
  chapter_id: string;
  change_type: "structure" | "tone" | "clarity" | "language";
  title: string;
  rationale: string;
  before_excerpt: string;
  after_excerpt: string;
  impact: "low" | "medium" | "high";
}

export interface EditorialChapterRevision {
  id: string;
  chapter_id: string;
  chapter_title: string;
  original_text: string;
  edited_text: string;
  summary: string;
  structure_actions: string[];
  tone_alignment_notes: string[];
  preservation_notes: string[];
  tracked_changes: EditorialTrackedChange[];
  metrics: {
    original_word_count: number;
    edited_word_count: number;
    change_ratio: number;
  };
}

export interface EditorialEditedManuscript {
  schema_version: 1;
  project_id: string;
  normalized_asset_id: string;
  analysis_asset_id: string;
  editing_plan_asset_id: string;
  strategy: EditingStrategyKey;
  full_original_text: string;
  full_edited_text: string;
  chapter_revisions: EditorialChapterRevision[];
  global_summary: string;
  change_totals: {
    chapter_count: number;
    tracked_change_count: number;
    average_change_ratio: number;
  };
  generated_at: string;
  model: string;
}

export interface EditorialContentEditingResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  normalizedAssetId: string;
  analysisAssetId: string;
  editingPlanAssetId: string;
  editedAssetId?: string | null;
  editedAssetUri?: string | null;
  chapterCount?: number;
  trackedChangeCount?: number;
  transitioned?: boolean;
  partial?: boolean;
  processedChapterCount?: number;
  remainingChapterCount?: number;
}
