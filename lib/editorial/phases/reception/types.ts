import type {
  CreativeMode,
  EditorialProject,
  EditorialServiceType,
} from "@/lib/editorial/types/editorial";

export type EditorialWorkflowState =
  | "received"
  | "normalized"
  | "analyzed"
  | "editing_planned"
  | "content_edited"
  | "proofread"
  | "validated"
  | "metadata_ready"
  | "cover_ready"
  | "layout_ready"
  | "qa_passed"
  | "packaged"
  | "published"
  | "marketed";

export type ReceptionTransitionState =
  | "initialized"
  | "project_created"
  | "upload_prepared"
  | "received";

export interface ReceptionMetadataInput {
  title: string;
  authorName: string;
  genre: string;
  language: string;
  subtitle?: string;
  targetAudience?: string;
  serviceType?: EditorialServiceType;
  creativeMode?: CreativeMode;
  coverPrompt?: string;
  coverNotes?: string;
  bookSize?: string;
  observations?: string;
}

export interface ReceptionManuscriptInput {
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
}

export interface ReceptionStartInput {
  metadata: ReceptionMetadataInput;
  manuscript: ReceptionManuscriptInput;
  actorId: string;
}

export interface ReceptionCompleteInput {
  projectId: string;
  fileId: string;
  actorId: string;
}

export interface ReceptionProjectSnapshot {
  id: string;
  title: string;
  authorName: string | null;
  genre: string | null;
  language: string;
  serviceType: EditorialServiceType | null;
  currentStage: EditorialProject["current_stage"];
  status: string;
  progressPercent: number;
}

export interface ReceptionManuscriptSnapshot {
  fileId: string;
  fileName: string;
  storagePath: string;
  version: number;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface ReceptionTransition {
  from: ReceptionTransitionState;
  to: ReceptionTransitionState;
  workflowState: EditorialWorkflowState | null;
  occurredAt: string;
}

export interface ReceptionStartValidation {
  metadataAccepted: true;
  manuscriptAccepted: true;
}

export interface ReceptionCompleteValidation {
  projectExists: true;
  manuscriptRegistered: true;
  storageVerified: true;
}

export interface ReceptionUploadInstruction {
  bucket: string;
  signedUrl: string;
  token: string;
  expiresInSeconds: number;
}

export interface ReceptionStartResult {
  phase: "reception";
  workflowState: null;
  transition: ReceptionTransition;
  project: ReceptionProjectSnapshot;
  manuscript: ReceptionManuscriptSnapshot;
  upload: ReceptionUploadInstruction;
  validation: ReceptionStartValidation;
}

export interface ReceptionCompleteResult {
  phase: "reception";
  workflowState: "received";
  transition: ReceptionTransition;
  project: ReceptionProjectSnapshot;
  manuscript: ReceptionManuscriptSnapshot;
  validation: ReceptionCompleteValidation;
}
