import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "./buckets";
import type { EditorialBucketKey } from "./buckets";
import { ensureEditorialBucket } from "./provision";

export interface UploadManuscriptResult {
  storagePath: string;
  publicUrl: string | null;
  sizeBytes: number;
  mimeType: string;
  version: number;
}

export interface UploadEditorialFileResult {
  storagePath: string;
  publicUrl: string | null;
  sizeBytes: number;
  mimeType: string;
  version: number;
  bucket: string;
}

/**
 * Upload a manuscript file to Supabase Storage.
 * Each version is stored under its own path so previous versions are preserved.
 *
 * @param projectId  UUID of the editorial project.
 * @param file       The file to upload.
 * @param version    The version number to use in the storage path (default 1).
 */
export async function uploadManuscript(
  projectId: string,
  file: File,
  version = 1
): Promise<UploadManuscriptResult> {
  const supabase = getAdminClient();
  await ensureEditorialBucket(EDITORIAL_BUCKETS.manuscripts);
  const ext = file.name.split(".").pop() ?? "bin";
  // Each version lives at its own path – no upsert/overwrite needed.
  const storagePath = `${projectId}/manuscripts/v${version}.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false, // never overwrite – each version has a unique path
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return {
    storagePath,
    publicUrl: null,
    sizeBytes: file.size,
    mimeType: file.type,
    version,
  };
}

function bucketForFileType(fileType: string): string {
  if (fileType.startsWith("manuscript")) return EDITORIAL_BUCKETS.manuscripts;
  if (fileType.startsWith("export")) return EDITORIAL_BUCKETS.exports;
  if (fileType.startsWith("cover")) return EDITORIAL_BUCKETS.covers;
  if (fileType.startsWith("asset")) return EDITORIAL_BUCKETS.assets;
  return EDITORIAL_BUCKETS.working;
}

export function bucketKeyForFileType(fileType: string): EditorialBucketKey {
  if (fileType.startsWith("manuscript")) return "manuscripts";
  if (fileType.startsWith("export")) return "exports";
  if (fileType.startsWith("cover")) return "covers";
  if (fileType.startsWith("asset")) return "assets";
  return "working";
}

/**
 * Upload an editorial file (generic) to Supabase Storage.
 * Bucket is inferred from fileType. Each version uses a unique path (no overwrite).
 */
export async function uploadEditorialFile(
  projectId: string,
  file: File,
  options: {
    fileType: string;
    stageKey?: string | null;
    version: number;
  }
): Promise<UploadEditorialFileResult> {
  const supabase = getAdminClient();
  const bucket = bucketForFileType(options.fileType);
  await ensureEditorialBucket(bucket);
  const ext = file.name.split(".").pop() ?? "bin";
  const stageSegment = options.stageKey ? `/${options.stageKey}` : "";
  const storagePath = `${projectId}${stageSegment}/${options.fileType}/v${options.version}.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  return {
    storagePath,
    publicUrl: null,
    sizeBytes: file.size,
    mimeType: file.type,
    version: options.version,
    bucket,
  };
}
