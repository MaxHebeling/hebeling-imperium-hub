/**
 * Types for the Editorial Pipeline Artifact system.
 * Manages versioned, downloadable outputs per pipeline stage.
 */

import type { EditorialStageKey } from "@/lib/editorial/types/editorial";

// ─── Artifact types ────────────────────────────────────────────────────

export type ArtifactFileType = "pdf" | "docx" | "epub" | "png" | "jpg" | "json";

export type ArtifactGeneratedBy = "ai" | "human" | "system";

export type ArtifactStatus = "generating" | "ready" | "failed" | "superseded";

export interface PipelineArtifact {
  id: string;
  project_id: string;
  stage_key: EditorialStageKey;
  file_name: string;
  file_type: ArtifactFileType;
  version: number;
  storage_path: string;
  size_bytes: number | null;
  generated_by: ArtifactGeneratedBy;
  status: ArtifactStatus;
  mime_type: string;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string | null;
}

// ─── Stage output definitions ──────────────────────────────────────────

export interface StageOutputDefinition {
  fileNameTemplate: string;
  fileType: ArtifactFileType;
  mimeType: string;
  description: string;
}

/**
 * Defines what outputs each pipeline stage should produce.
 */
export const STAGE_OUTPUT_DEFINITIONS: Record<string, StageOutputDefinition[]> = {
  ingesta: [
    { fileNameTemplate: "intake_summary", fileType: "pdf", mimeType: "application/pdf", description: "Intake summary report" },
  ],
  estructura: [
    { fileNameTemplate: "structural_analysis", fileType: "pdf", mimeType: "application/pdf", description: "Structural analysis report" },
    { fileNameTemplate: "structural_edit", fileType: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", description: "Structural edit manuscript" },
  ],
  estilo: [
    { fileNameTemplate: "line_edit", fileType: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", description: "Line-edited manuscript" },
    { fileNameTemplate: "style_report", fileType: "pdf", mimeType: "application/pdf", description: "Style analysis report" },
  ],
  ortotipografia: [
    { fileNameTemplate: "copyedit", fileType: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", description: "Copyedited manuscript" },
    { fileNameTemplate: "grammar_report", fileType: "pdf", mimeType: "application/pdf", description: "Grammar & style report" },
  ],
  maquetacion: [
    { fileNameTemplate: "layout_review", fileType: "pdf", mimeType: "application/pdf", description: "Layout review PDF" },
    { fileNameTemplate: "interior_print", fileType: "pdf", mimeType: "application/pdf", description: "Print-ready interior PDF" },
  ],
  revision_final: [
    { fileNameTemplate: "proof_report", fileType: "pdf", mimeType: "application/pdf", description: "Final proof report" },
    { fileNameTemplate: "corrected_manuscript", fileType: "pdf", mimeType: "application/pdf", description: "Corrected manuscript PDF" },
  ],
  export: [
    { fileNameTemplate: "publishing_metadata", fileType: "pdf", mimeType: "application/pdf", description: "Publishing metadata sheet" },
  ],
  distribution: [
    { fileNameTemplate: "marketplace_summary", fileType: "pdf", mimeType: "application/pdf", description: "Marketplace export summary" },
  ],
};

// ─── AI Pipeline Runner types ──────────────────────────────────────────

export type PipelineRunStatus = "idle" | "running" | "completed" | "failed";

export interface PipelineStageProgress {
  stageKey: EditorialStageKey;
  status: "pending" | "processing" | "needs_review" | "completed" | "failed";
  aiSummary: string | null;
  score: number | null;
  issueCount: number;
  suggestionCount: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface PipelineRunProgress {
  status: PipelineRunStatus;
  totalStages: number;
  completedStages: number;
  currentStageKey: EditorialStageKey | null;
  stages: PipelineStageProgress[];
  startedAt: string | null;
  estimatedSecondsRemaining: number | null;
}

// ─── Storage path helpers ──────────────────────────────────────────────

/**
 * Build the storage path for an artifact.
 * Pattern: editorial-projects/{projectId}/{stageKey}/v{version}/{fileName}.{ext}
 */
export function buildArtifactStoragePath(
  projectId: string,
  stageKey: string,
  version: number,
  fileName: string,
  fileType: string
): string {
  return `${projectId}/${stageKey}/v${version}/${fileName}.${fileType}`;
}

/**
 * Build a display-friendly file name with version.
 * Example: ai_analysis_v1.pdf
 */
export function buildArtifactFileName(
  fileNameTemplate: string,
  version: number,
  fileType: string
): string {
  return `${fileNameTemplate}_v${version}.${fileType}`;
}
