import type { EditorialStageKey } from "../types/editorial";

/** Status of a timeline entry from the client's perspective. */
export type TimelineEntryStatus = "locked" | "upcoming" | "active" | "completed";

/** A single entry in the client-visible editorial timeline. */
export interface ClientTimelineEntry {
  id: string;
  projectId: string;
  stageKey: EditorialStageKey;
  visibleDay: number;
  status: TimelineEntryStatus;
  title: string;
  message: string | null;
  previewAsset: string | null;
  scheduledAt: string | null;
  revealedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Artifact types that can be attached to stages. */
export type ArtifactType =
  | "report_preview"
  | "annotated_page"
  | "text_comparison"
  | "formatted_page"
  | "cover_concept"
  | "pdf_preview"
  | "book_mockup"
  | "chart"
  | "summary_card"
  | "custom";

/** A preview artifact attached to a stage. */
export interface StageArtifact {
  id: string;
  projectId: string;
  stageKey: EditorialStageKey;
  artifactType: ArtifactType;
  title: string;
  description: string | null;
  storagePath: string | null;
  thumbnailPath: string | null;
  metadata: Record<string, unknown> | null;
  isVisibleToClient: boolean;
  createdBy: string | null;
  createdAt: string;
}

/** Override types that staff can apply to the timeline. */
export type TimelineOverrideType =
  | "reveal_early"
  | "pause"
  | "resume"
  | "skip"
  | "set_day"
  | "complete_stage"
  | "send_message";

/** A staff override record. */
export interface TimelineOverride {
  id: string;
  projectId: string;
  overrideType: TimelineOverrideType;
  stageKey: EditorialStageKey | null;
  payload: Record<string, unknown> | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** The 12-day editorial journey stage configuration. */
export interface JourneyStageConfig {
  stageKey: EditorialStageKey;
  day: number;
  title: string;
  clientTitle: string;
  description: string;
  activeMessage: string;
  completedMessage: string;
  artifactHint: string;
  icon: string;
}

/** Full timeline state for a project (returned to client portal). */
export interface ClientTimelineState {
  projectId: string;
  projectTitle: string;
  authorName: string | null;
  startDate: string;
  currentDay: number;
  totalDays: number;
  overallProgress: number;
  isPaused: boolean;
  stages: ClientTimelineStageView[];
}

/** A single stage as seen by the client. */
export interface ClientTimelineStageView {
  stageKey: EditorialStageKey;
  day: number;
  title: string;
  message: string;
  status: TimelineEntryStatus;
  progress: number;
  artifacts: ClientArtifactView[];
  icon: string;
}

/** An artifact as seen by the client. */
export interface ClientArtifactView {
  id: string;
  type: ArtifactType;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
}
