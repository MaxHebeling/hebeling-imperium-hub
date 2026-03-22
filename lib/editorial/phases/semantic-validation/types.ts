import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export type EditorialValidationEntityKind =
  | "person"
  | "location"
  | "date"
  | "term"
  | "organization"
  | "unknown";

export type EditorialSemanticIssueCategory =
  | "consistency"
  | "contradiction"
  | "entity"
  | "timeline";

export interface EditorialSemanticValidationInput {
  projectId: string;
}

export interface EditorialValidationEntity {
  id: string;
  entity: string;
  kind: EditorialValidationEntityKind;
  canonical_form: string;
  observed_forms: string[];
  chapter_ids: string[];
}

export interface EditorialSemanticIssue {
  id: string;
  category: EditorialSemanticIssueCategory;
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
  chapter_ids: string[];
  auto_fixable: boolean;
  suggested_fix: string | null;
}

export interface EditorialValidationFix {
  id: string;
  category: EditorialSemanticIssueCategory;
  title: string;
  rationale: string;
  original_excerpt: string;
  revised_excerpt: string;
  severity: "low" | "medium" | "high";
  applied: boolean;
}

export interface EditorialValidatedChapter {
  id: string;
  chapter_id: string;
  chapter_title: string;
  original_text: string;
  validated_text: string;
  summary: string;
  applied_fixes: EditorialValidationFix[];
  skipped_fixes: EditorialValidationFix[];
  metrics: {
    original_word_count: number;
    validated_word_count: number;
    change_ratio: number;
  };
}

export interface EditorialValidatedManuscript {
  schema_version: 1;
  project_id: string;
  proofread_asset_id: string;
  full_proofread_text: string;
  full_validated_text: string;
  entity_registry: EditorialValidationEntity[];
  issues: EditorialSemanticIssue[];
  chapter_revisions: EditorialValidatedChapter[];
  global_summary: string;
  validation_totals: {
    chapter_count: number;
    issue_count: number;
    auto_fixable_issue_count: number;
    applied_fix_count: number;
    skipped_fix_count: number;
    average_change_ratio: number;
  };
  generated_at: string;
  model: string;
}

export interface EditorialSemanticValidationResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  proofreadAssetId: string;
  validatedAssetId: string;
  validatedAssetUri: string;
  issueCount: number;
  appliedFixCount: number;
  transitioned: boolean;
}
