import type { EditorialServiceType } from "@/lib/editorial/types/editorial";
import type {
  EditorialMetadata,
  EditorialWorkflowState,
  ManuscriptAsset,
} from "@/lib/editorial/foundation";

export type IntakeSupportedExtension = "docx" | "pdf" | "txt";

export interface EditorialIntakeMetadataInput {
  author: string;
  title: string;
  subtitle?: string | null;
  language?: string;
  genre: string;
  synopsis?: string | null;
  tags?: string[];
  serviceType?: EditorialServiceType | null;
}

export interface EditorialIntakeInput {
  metadata: EditorialIntakeMetadataInput;
  manuscript: File;
  actorId?: string | null;
}

export interface EditorialIntakeProjectSnapshot {
  id: string;
  title: string;
  author: string;
  language: string;
  genre: string;
  currentState: EditorialWorkflowState;
  createdAt: string;
}

export interface EditorialIntakeUploadSnapshot {
  bucket: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  checksum: string;
}

export interface EditorialIntakeResult {
  state: EditorialWorkflowState;
  project: EditorialIntakeProjectSnapshot;
  workflow: {
    id: string;
    state: EditorialWorkflowState;
    createdAt: string;
  };
  manuscript: EditorialIntakeUploadSnapshot;
  metadata: Pick<
    EditorialMetadata,
    "id" | "project_id" | "author" | "title" | "subtitle" | "language" | "genre"
  >;
  asset: Pick<
    ManuscriptAsset,
    "id" | "project_id" | "source_type" | "source_label" | "source_uri" | "version"
  >;
  legacy: {
    fileId: string;
  };
}
