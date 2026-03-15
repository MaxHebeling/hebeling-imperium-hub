/**
 * Artifact storage service — manages versioned editorial outputs in Supabase Storage.
 * Bucket: editorial-working (already exists in the system)
 * Path pattern: {projectId}/{stageKey}/v{version}/{fileName}.{ext}
 */

import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialStageKey } from "@/lib/editorial/types/editorial";
import {
  buildArtifactStoragePath,
  buildArtifactFileName,
  type PipelineArtifact,
  type ArtifactFileType,
  type ArtifactGeneratedBy,
  type ArtifactStatus,
} from "./types";

const ARTIFACT_BUCKET = "editorial-working";

// ─── Get next version for a stage artifact ─────────────────────────────

export async function getNextArtifactVersion(
  projectId: string,
  stageKey: EditorialStageKey,
  fileNameTemplate: string
): Promise<number> {
  const supabase = getAdminClient();

  const { data } = await supabase
    .from("editorial_pipeline_artifacts")
    .select("version")
    .eq("project_id", projectId)
    .eq("stage_key", stageKey)
    .ilike("file_name", `${fileNameTemplate}%`)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.version ?? 0) + 1;
}

// ─── Save artifact to storage + DB ─────────────────────────────────────

interface SaveArtifactInput {
  projectId: string;
  stageKey: EditorialStageKey;
  fileNameTemplate: string;
  fileType: ArtifactFileType;
  mimeType: string;
  content: Buffer | Uint8Array | string;
  generatedBy: ArtifactGeneratedBy;
  metadata?: Record<string, string>;
}

export async function saveArtifact(input: SaveArtifactInput): Promise<PipelineArtifact> {
  const supabase = getAdminClient();

  // Get next version
  const version = await getNextArtifactVersion(
    input.projectId,
    input.stageKey,
    input.fileNameTemplate
  );

  const storagePath = buildArtifactStoragePath(
    input.projectId,
    input.stageKey,
    version,
    input.fileNameTemplate,
    input.fileType
  );

  const displayName = buildArtifactFileName(
    input.fileNameTemplate,
    version,
    input.fileType
  );

  // Upload to storage
  const contentBuffer = typeof input.content === "string"
    ? Buffer.from(input.content)
    : input.content;

  const { error: uploadError } = await supabase.storage
    .from(ARTIFACT_BUCKET)
    .upload(storagePath, contentBuffer, {
      contentType: input.mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload artifact: ${uploadError.message}`);
  }

  const sizeBytes = contentBuffer instanceof Buffer
    ? contentBuffer.length
    : (contentBuffer as Uint8Array).length;

  // Mark previous versions as superseded
  await supabase
    .from("editorial_pipeline_artifacts")
    .update({ status: "superseded" as ArtifactStatus, updated_at: new Date().toISOString() })
    .eq("project_id", input.projectId)
    .eq("stage_key", input.stageKey)
    .ilike("file_name", `${input.fileNameTemplate}%`)
    .eq("status", "ready");

  // Insert new artifact record
  const { data, error } = await supabase
    .from("editorial_pipeline_artifacts")
    .insert({
      project_id: input.projectId,
      stage_key: input.stageKey,
      file_name: displayName,
      file_type: input.fileType,
      version,
      storage_path: storagePath,
      size_bytes: sizeBytes,
      generated_by: input.generatedBy,
      status: "ready" as ArtifactStatus,
      mime_type: input.mimeType,
      metadata: input.metadata ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to save artifact record: ${error?.message}`);
  }

  return data as PipelineArtifact;
}

// ─── List artifacts for a project/stage ─────────────────────────────────

export async function listArtifacts(
  projectId: string,
  stageKey?: EditorialStageKey
): Promise<PipelineArtifact[]> {
  const supabase = getAdminClient();

  let query = supabase
    .from("editorial_pipeline_artifacts")
    .select("*")
    .eq("project_id", projectId)
    .order("stage_key", { ascending: true })
    .order("version", { ascending: false });

  if (stageKey) {
    query = query.eq("stage_key", stageKey);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[artifacts] List error:", error.message);
    return [];
  }

  return (data ?? []) as PipelineArtifact[];
}

// ─── Get download URL for an artifact ───────────────────────────────────

export async function getArtifactDownloadUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const supabase = getAdminClient();

  const { data, error } = await supabase.storage
    .from(ARTIFACT_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create download URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// ─── Delete an artifact ─────────────────────────────────────────────────

export async function deleteArtifact(artifactId: string): Promise<void> {
  const supabase = getAdminClient();

  const { data: artifact } = await supabase
    .from("editorial_pipeline_artifacts")
    .select("storage_path")
    .eq("id", artifactId)
    .single();

  if (artifact?.storage_path) {
    await supabase.storage.from(ARTIFACT_BUCKET).remove([artifact.storage_path]);
  }

  await supabase
    .from("editorial_pipeline_artifacts")
    .delete()
    .eq("id", artifactId);
}
