import { getAdminClient } from "@/lib/leads/helpers";
import {
  createEditorialProject,
  registerManuscriptFile,
} from "@/lib/editorial/db/mutations";
import {
  getEditorialFile,
  getEditorialProject,
} from "@/lib/editorial/db/queries";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import {
  logReceptionCompleted,
  logReceptionProjectCreated,
  logReceptionStarted,
  logReceptionUploadPrepared,
} from "./logs";
import { createReceptionTransition } from "./transitions";
import type {
  ReceptionCompleteResult,
  ReceptionManuscriptSnapshot,
  ReceptionProjectSnapshot,
  ReceptionStartResult,
} from "./types";
import {
  extractManuscriptExtension,
  parseReceptionCompleteInput,
  parseReceptionStartInput,
} from "./validation";

function buildProjectSnapshot(project: Awaited<ReturnType<typeof getEditorialProject>>): ReceptionProjectSnapshot {
  if (!project) {
    throw new Error("Editorial project snapshot requires a project.");
  }

  return {
    id: project.id,
    title: project.title,
    authorName: project.author_name,
    genre: project.genre,
    language: project.language,
    serviceType: project.service_type ?? null,
    currentStage: project.current_stage,
    status: project.status,
    progressPercent: project.progress_percent,
  };
}

function buildManuscriptSnapshot(file: NonNullable<Awaited<ReturnType<typeof getEditorialFile>>>): ReceptionManuscriptSnapshot {
  return {
    fileId: file.id,
    fileName: file.storage_path.split("/").pop() ?? file.storage_path,
    storagePath: file.storage_path,
    version: file.version,
    mimeType: file.mime_type,
    sizeBytes: file.size_bytes,
  };
}

async function createSignedManuscriptUpload(projectId: string, fileName: string) {
  const supabase = getAdminClient();
  const extension = extractManuscriptExtension(fileName);
  const storagePath = `${projectId}/manuscripts/v1${extension}`;

  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Failed to create manuscript upload URL: ${error?.message ?? "Unknown error"}`);
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
  };
}

async function verifyManuscriptObjectExists(storagePath: string): Promise<boolean> {
  const supabase = getAdminClient();
  const pathSegments = storagePath.split("/");
  const fileName = pathSegments.pop();
  const directory = pathSegments.join("/");

  if (!fileName) {
    return false;
  }

  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .list(directory, {
      limit: 100,
      search: fileName,
    });

  if (error) {
    console.error("[editorial][reception] Failed to verify manuscript object", {
      storagePath,
      error: error.message,
    });
    return false;
  }

  return (data ?? []).some((entry) => entry.name === fileName);
}

export async function startReceptionPhase(input: unknown): Promise<ReceptionStartResult> {
  const parsed = parseReceptionStartInput(input);
  const uploadPreparedAt = new Date().toISOString();

  const project = await createEditorialProject({
    title: parsed.metadata.title,
    subtitle: parsed.metadata.subtitle,
    author_name: parsed.metadata.authorName,
    language: parsed.metadata.language,
    genre: parsed.metadata.genre,
    target_audience: parsed.metadata.targetAudience,
    created_by: parsed.actorId,
    service_type: parsed.metadata.serviceType,
    creative_mode: parsed.metadata.creativeMode,
    cover_prompt: parsed.metadata.coverPrompt,
    cover_notes: parsed.metadata.coverNotes,
    book_size: parsed.metadata.bookSize,
    observations: parsed.metadata.observations,
  });

  await logReceptionStarted({
    projectId: project.id,
    actorId: parsed.actorId,
    payload: {
      workflowState: null,
      title: project.title,
      language: project.language,
    },
  });

  await logReceptionProjectCreated({
    projectId: project.id,
    actorId: parsed.actorId,
    payload: {
      serviceType: project.service_type ?? parsed.metadata.serviceType ?? "full_pipeline",
      currentStage: project.current_stage,
      status: project.status,
    },
  });

  const upload = await createSignedManuscriptUpload(project.id, parsed.manuscript.fileName);

  const fileRecord = await registerManuscriptFile(
    project.id,
    upload.storagePath,
    parsed.manuscript.mimeType ?? "application/octet-stream",
    parsed.manuscript.sizeBytes,
    parsed.actorId,
    1,
    "client"
  );

  await logReceptionUploadPrepared({
    projectId: project.id,
    actorId: parsed.actorId,
    payload: {
      fileId: fileRecord.id,
      storagePath: upload.storagePath,
      bucket: EDITORIAL_BUCKETS.manuscripts,
      version: 1,
    },
  });

  return {
    phase: "reception",
    workflowState: null,
    transition: createReceptionTransition("project_created", "upload_prepared", uploadPreparedAt),
    project: buildProjectSnapshot(project),
    manuscript: {
      fileId: fileRecord.id,
      fileName: parsed.manuscript.fileName,
      storagePath: upload.storagePath,
      version: fileRecord.version,
      mimeType: fileRecord.mime_type,
      sizeBytes: fileRecord.size_bytes,
    },
    upload: {
      bucket: EDITORIAL_BUCKETS.manuscripts,
      signedUrl: upload.signedUrl,
      token: upload.token,
      expiresInSeconds: 600,
    },
    validation: {
      metadataAccepted: true,
      manuscriptAccepted: true,
    },
  };
}

export async function completeReceptionPhase(input: unknown): Promise<ReceptionCompleteResult> {
  const parsed = parseReceptionCompleteInput(input);
  const completedAt = new Date().toISOString();

  const [project, manuscriptFile] = await Promise.all([
    getEditorialProject(parsed.projectId),
    getEditorialFile(parsed.fileId),
  ]);

  if (!project) {
    throw new Error("Project not found for reception completion.");
  }

  if (!manuscriptFile || manuscriptFile.project_id !== parsed.projectId) {
    throw new Error("Manuscript file not found for reception completion.");
  }

  const storageVerified = await verifyManuscriptObjectExists(manuscriptFile.storage_path);
  if (!storageVerified) {
    throw new Error("Uploaded manuscript could not be verified in storage.");
  }

  const supabase = getAdminClient();
  const { data: updatedProject, error: updateError } = await supabase
    .from("editorial_projects")
    .update({
      status: "received",
      updated_at: completedAt,
    })
    .eq("id", parsed.projectId)
    .select("*")
    .single();

  if (updateError || !updatedProject) {
    throw new Error(`Failed to finalize reception phase: ${updateError?.message ?? "Unknown error"}`);
  }

  await logReceptionCompleted({
    projectId: parsed.projectId,
    actorId: parsed.actorId,
    payload: {
      workflowState: "received",
      fileId: manuscriptFile.id,
      storagePath: manuscriptFile.storage_path,
      version: manuscriptFile.version,
    },
  });

  return {
    phase: "reception",
    workflowState: "received",
    transition: createReceptionTransition("upload_prepared", "received", completedAt),
    project: buildProjectSnapshot(updatedProject),
    manuscript: buildManuscriptSnapshot(manuscriptFile),
    validation: {
      projectExists: true,
      manuscriptRegistered: true,
      storageVerified: true,
    },
  };
}
