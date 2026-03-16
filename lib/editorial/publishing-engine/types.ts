/**
 * Reino Editorial AI Publishing Engine — Types
 *
 * 13-phase editorial pipeline with specialized AI agents.
 * Compatible with existing editorial_stages + editorial_jobs tables.
 */

// ─── Phase Keys (13 phases) ─────────────────────────────────────────

export type PublishingPhaseKey =
  | "manuscript_received"
  | "ai_diagnosis"
  | "spelling_correction"
  | "grammar_correction"
  | "style_editing"
  | "structural_review"
  | "theological_review"
  | "editorial_approval"
  | "interior_layout"
  | "cover_design"
  | "final_review"
  | "export"
  | "publication";

// ─── Phase Status ───────────────────────────────────────────────────

export type PhaseStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review"
  | "approved";

// ─── AI Provider ────────────────────────────────────────────────────

export type AiProvider =
  | "openai"
  | "claude"
  | "languagetool"
  | "stability"
  | "internal"
  | "human";

// ─── AI Agent Type ──────────────────────────────────────────────────

export type AiAgentType =
  | "ingestion"
  | "corrector"
  | "grammar"
  | "style_editor"
  | "structural"
  | "theological"
  | "layout"
  | "cover"
  | "exporter";

// ─── Phase Definition ───────────────────────────────────────────────

export interface PublishingPhaseDefinition {
  key: PublishingPhaseKey;
  order: number;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  aiAgent: AiAgentType | null;
  aiProvider: AiProvider;
  legacyStageKey: string;
  aiTaskKey: string | null;
  requiresHumanReview: boolean;
  isAiAutomated: boolean;
  outputs: PhaseOutput[];
  icon: string;
}

// ─── Phase Output ───────────────────────────────────────────────────

export interface PhaseOutput {
  key: string;
  label: string;
  fileType: "docx" | "pdf" | "epub" | "kindle" | "png" | "txt";
  description: string;
}

// ─── Pipeline State ─────────────────────────────────────────────────

export interface PipelineState {
  projectId: string;
  status: "idle" | "running" | "completed" | "failed" | "paused";
  currentPhaseKey: PublishingPhaseKey | null;
  currentPhaseIndex: number;
  totalPhases: number;
  completedPhases: number;
  progressPercent: number;
  phases: PhaseState[];
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

export interface PhaseState {
  key: PublishingPhaseKey;
  status: PhaseStatus;
  order: number;
  label: string;
  summary: string | null;
  score: number | null;
  findings: PhaseFinding[];
  aiProvider: AiProvider;
  processingTimeMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  jobId: string | null;
}

// ─── Phase Finding ──────────────────────────────────────────────────

export interface PhaseFinding {
  type: "error" | "warning" | "suggestion" | "info";
  description: string;
  location: string | null;
  correction: string | null;
  confidence: number | null;
}

// ─── Phase Output File ──────────────────────────────────────────────

export interface PhaseOutputFile {
  key: string;
  label: string;
  fileType: string;
  storagePath: string;
  version: number;
  generatedBy: "ai" | "human";
  createdAt: string;
}

// ─── Prompt Override ────────────────────────────────────────────────

export interface PhasePromptOverride {
  id: string;
  projectId: string;
  phaseKey: PublishingPhaseKey;
  promptType: "system" | "user" | "override";
  prompt: string;
  createdAt: string;
  createdBy: string | null;
}

// ─── Amazon Format Config ───────────────────────────────────────────

export interface AmazonFormatConfig {
  trimSize: "5x8" | "5.25x8" | "5.5x8.5" | "6x9" | "7x10" | "8.5x11";
  bookType: "paperback" | "hardcover" | "ebook";
  paperType: "cream" | "white";
  bleed: boolean;
}

// ─── AI Cost Tracking ───────────────────────────────────────────────

export interface AiRunRecord {
  id: string;
  projectId: string;
  phaseKey: PublishingPhaseKey;
  agentType: AiAgentType;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  durationMs: number;
  createdAt: string;
}

// ─── 12-Day Author Timeline ────────────────────────────────────────

export interface AuthorTimelineDay {
  day: number;
  dayRange: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  status: "completed" | "in_progress" | "upcoming" | "pending";
  phaseKeys: PublishingPhaseKey[];
}

// ─── Project Card (Dashboard) ───────────────────────────────────────

export interface EditorialProjectCard {
  id: string;
  title: string;
  author: string;
  status: string;
  currentPhase: string;
  progressPercent: number;
  trimSize: string | null;
  wordCount: number | null;
  alertCount: number;
  estimatedDate: string | null;
  createdAt: string;
}
