import { createHash } from "node:crypto";
import {
  createEditorialPipelineService,
  type EditorialProjectAggregate,
  type ManuscriptAsset,
} from "@/lib/editorial/foundation";
import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import { createEditorialProject, registerManuscriptFile } from "@/lib/editorial/db/mutations";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialIntakeResult } from "./types";
import { parseEditorialIntakeInput } from "./validation";

const foundationPipelineService = createEditorialPipelineService();

function buildChecksum(fileBuffer: Buffer): string {
  return createHash("sha256").update(fileBuffer).digest("hex");
}

function buildUploadedAsset(
  aggregate: EditorialProjectAggregate,
  storagePath: string,
  mimeType: string,
  sizeBytes: number,
  checksum: string
): ManuscriptAsset {
  return {
    ...aggregate.project.manuscript_asset,
    project_id: aggregate.project.id,
    source_label: aggregate.project.manuscript_asset.original_file_name,
    source_uri: storagePath,
    original_file_name: aggregate.project.manuscript_asset.original_file_name,
    mime_type: mimeType,
    checksum,
    size_bytes: sizeBytes,
    uploaded_at: createFoundationTimestamp(),
  };
}

async function persistCanonicalIntake(
  aggregate: EditorialProjectAggregate,
  manuscriptAsset: ManuscriptAsset
): Promise<void> {
  const supabase = getAdminClient();

  const { error: workflowError } = await supabase.from("editorial_workflows").upsert(
    {
      id: aggregate.workflow.id,
      project_id: aggregate.project.id,
      current_state: aggregate.workflow.current_state,
      status: "active",
      context: {
        manuscript_source: aggregate.project.manuscript_source,
        initialized_from: "phase_3_intake",
      },
      metrics: {},
      created_at: aggregate.workflow.created_at,
      updated_at: aggregate.workflow.updated_at,
    },
    { onConflict: "project_id" }
  );

  if (workflowError) {
    throw new Error(`Failed to persist editorial workflow: ${workflowError.message}`);
  }

  const { error: metadataError } = await supabase.from("editorial_metadata").upsert(
    {
      id: aggregate.project.metadata.id,
      project_id: aggregate.project.id,
      author: aggregate.project.metadata.author,
      title: aggregate.project.metadata.title,
      subtitle: aggregate.project.metadata.subtitle,
      language: aggregate.project.metadata.language,
      genre: aggregate.project.metadata.genre,
      synopsis: aggregate.project.metadata.synopsis,
      tags: aggregate.project.metadata.tags,
      extra: {},
      created_at: aggregate.project.metadata.created_at,
      updated_at: aggregate.project.metadata.updated_at,
    },
    { onConflict: "project_id" }
  );

  if (metadataError) {
    throw new Error(`Failed to persist editorial metadata: ${metadataError.message}`);
  }

  const { error: manuscriptAssetError } = await supabase
    .from("manuscript_assets")
    .insert({
      id: manuscriptAsset.id,
      project_id: aggregate.project.id,
      workflow_id: aggregate.workflow.id,
      asset_kind: "manuscript",
      source_type: manuscriptAsset.source_type,
      source_label: manuscriptAsset.source_label,
      source_uri: manuscriptAsset.source_uri,
      original_file_name: manuscriptAsset.original_file_name,
      mime_type: manuscriptAsset.mime_type,
      checksum: manuscriptAsset.checksum,
      size_bytes: manuscriptAsset.size_bytes,
      extracted_text_uri: manuscriptAsset.extracted_text_uri,
      version: manuscriptAsset.version,
      is_current: true,
      details: {
        bucket: EDITORIAL_BUCKETS.manuscripts,
      },
      uploaded_at: manuscriptAsset.uploaded_at,
      created_at: manuscriptAsset.uploaded_at,
      updated_at: manuscriptAsset.uploaded_at,
    });

  if (manuscriptAssetError) {
    throw new Error(`Failed to persist manuscript asset: ${manuscriptAssetError.message}`);
  }

  const logs = [
    ...aggregate.logs,
    {
      id: createFoundationId(),
      project_id: aggregate.project.id,
      workflow_id: aggregate.workflow.id,
      stage_id: null,
      stage_key: "received",
      event_type: "intake.manuscript_uploaded",
      level: "info" as const,
      message: "Manuscript uploaded and linked to project.",
      payload: {
        storagePath: manuscriptAsset.source_uri,
        mimeType: manuscriptAsset.mime_type,
        sizeBytes: manuscriptAsset.size_bytes,
        checksum: manuscriptAsset.checksum,
      },
      created_at: manuscriptAsset.uploaded_at,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist pipeline logs: ${logsError.message}`);
  }

  const { error: projectUpdateError } = await supabase
    .from("editorial_projects")
    .update({
      status: "received",
      current_status: "received",
      manuscript_source: aggregate.project.manuscript_source,
      metadata_id: aggregate.project.metadata.id,
      current_manuscript_asset_id: manuscriptAsset.id,
      workflow_schema_version: 2,
      pipeline_context: {
        intake_completed: true,
      },
      updated_at: manuscriptAsset.uploaded_at,
    })
    .eq("id", aggregate.project.id);

  if (projectUpdateError) {
    throw new Error(`Failed to finalize intake project state: ${projectUpdateError.message}`);
  }
}

async function cleanupUploadedManuscript(storagePath: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .remove([storagePath]);

  if (error) {
    console.error("[editorial/intake] Failed to clean up uploaded manuscript", {
      storagePath,
      error: error.message,
    });
  }
}

export async function executeEditorialIntake(
  input: unknown
): Promise<EditorialIntakeResult> {
  const parsed = parseEditorialIntakeInput(input);
  const fileBuffer = Buffer.from(await parsed.manuscript.arrayBuffer());
  const checksum = buildChecksum(fileBuffer);

  const legacyProject = await createEditorialProject({
    title: parsed.metadata.title,
    subtitle: parsed.metadata.subtitle ?? undefined,
    author_name: parsed.metadata.author,
    language: parsed.metadata.language ?? "es",
    genre: parsed.metadata.genre,
    created_by: parsed.actorId ?? undefined,
    service_type: parsed.metadata.serviceType ?? "full_pipeline",
  });

  const aggregateSeed = foundationPipelineService.initializeProject({
    author: parsed.metadata.author,
    title: parsed.metadata.title,
    manuscriptSource: "upload",
    originalFileName: parsed.manuscript.name,
    mimeType: parsed.manuscript.type || "application/octet-stream",
    language: parsed.metadata.language ?? "es",
    genre: parsed.metadata.genre,
    sizeBytes: parsed.manuscript.size,
    subtitle: parsed.metadata.subtitle ?? null,
    synopsis: parsed.metadata.synopsis ?? null,
    tags: parsed.metadata.tags ?? [],
    sourceLabel: parsed.manuscript.name,
  });

  const aggregate: EditorialProjectAggregate = {
    project: {
      ...aggregateSeed.project,
      id: legacyProject.id,
      author: parsed.metadata.author,
      title: legacyProject.title,
      language: legacyProject.language,
      genre: legacyProject.genre ?? parsed.metadata.genre,
      current_status: "received",
      created_at: legacyProject.created_at,
      updated_at: legacyProject.updated_at ?? legacyProject.created_at,
    },
    workflow: {
      ...aggregateSeed.workflow,
      project_id: legacyProject.id,
      current_state: "received",
      created_at: legacyProject.created_at,
      updated_at: legacyProject.updated_at ?? legacyProject.created_at,
      transitions: aggregateSeed.workflow.transitions.map((transition) => ({
        ...transition,
        project_id: legacyProject.id,
        to_state: "received",
        transitioned_at: legacyProject.created_at,
      })),
      stages: aggregateSeed.workflow.stages.map((stage) => ({
        ...stage,
        project_id: legacyProject.id,
      })),
    },
    logs: aggregateSeed.logs.map((log) => ({
      ...log,
      project_id: legacyProject.id,
      workflow_id: aggregateSeed.workflow.id,
      created_at: legacyProject.created_at,
    })),
  };

  let uploadedStoragePath: string | null = null;

  try {
    const uploadResult = await uploadManuscript(
      legacyProject.id,
      parsed.manuscript,
      aggregate.project.manuscript_asset.version
    );
    uploadedStoragePath = uploadResult.storagePath;

    const legacyFile = await registerManuscriptFile(
      legacyProject.id,
      uploadResult.storagePath,
      uploadResult.mimeType,
      uploadResult.sizeBytes,
      parsed.actorId ?? undefined,
      aggregate.project.manuscript_asset.version,
      "client"
    );

    const manuscriptAsset = buildUploadedAsset(
      aggregate,
      uploadResult.storagePath,
      uploadResult.mimeType,
      uploadResult.sizeBytes,
      checksum
    );

    await persistCanonicalIntake(aggregate, manuscriptAsset);

    return {
      state: "received",
      project: {
        id: legacyProject.id,
        title: legacyProject.title,
        author: parsed.metadata.author,
        language: legacyProject.language,
        genre: legacyProject.genre ?? parsed.metadata.genre,
        currentState: "received",
        createdAt: legacyProject.created_at,
      },
      workflow: {
        id: aggregate.workflow.id,
        state: "received",
        createdAt: aggregate.workflow.created_at,
      },
      manuscript: {
        bucket: EDITORIAL_BUCKETS.manuscripts,
        storagePath: uploadResult.storagePath,
        originalFileName: parsed.manuscript.name,
        mimeType: uploadResult.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        version: aggregate.project.manuscript_asset.version,
        checksum,
      },
      metadata: {
        id: aggregate.project.metadata.id,
        project_id: legacyProject.id,
        author: aggregate.project.metadata.author,
        title: aggregate.project.metadata.title,
        subtitle: aggregate.project.metadata.subtitle,
        language: aggregate.project.metadata.language,
        genre: aggregate.project.metadata.genre,
      },
      asset: {
        id: manuscriptAsset.id,
        project_id: legacyProject.id,
        source_type: manuscriptAsset.source_type,
        source_label: manuscriptAsset.source_label,
        source_uri: manuscriptAsset.source_uri,
        version: manuscriptAsset.version,
      },
      legacy: {
        fileId: legacyFile.id,
      },
    };
  } catch (error) {
    if (uploadedStoragePath) {
      await cleanupUploadedManuscript(uploadedStoragePath);
    }

    throw error;
  }
}
