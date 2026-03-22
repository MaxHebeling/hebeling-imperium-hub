import type { EditorialWorkflowState } from "@/lib/editorial/foundation";

export interface EditorialAnalysisInput {
  projectId: string;
}

export interface EditorialAnalysisScore {
  overall: number;
  structure: number;
  clarity: number;
  language: number;
  market_fit: number;
}

export interface EditorialAnalysisReasoning {
  score_summary: string;
  genre_reasoning: string;
  audience_reasoning: string;
}

export interface EditorialAnalysisIssue {
  id: string;
  severity: "critical" | "major" | "minor";
  category: "structure" | "clarity" | "language" | "market_fit" | "voice";
  title: string;
  explanation: string;
}

export interface EditorialAnalysisReport {
  schema_version: 1;
  project_id: string;
  source_asset_id: string;
  normalized_asset_id: string;
  detected_genre: string;
  target_audience: string;
  score: EditorialAnalysisScore;
  executive_summary: string;
  strengths: string[];
  weaknesses: string[];
  issues: EditorialAnalysisIssue[];
  recommendations: string[];
  reasoning: EditorialAnalysisReasoning;
  generated_at: string;
  model: string;
}

export interface EditorialAnalysisResult {
  state: EditorialWorkflowState;
  projectId: string;
  workflowId: string;
  normalizedAssetId: string;
  analysisAssetId: string;
  analysisAssetUri: string;
  report: EditorialAnalysisReport;
  transitioned: boolean;
}
