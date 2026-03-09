import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "./buckets";

export interface UploadManuscriptResult {
  storagePath: string;
  publicUrl: string | null;
  sizeBytes: number;
  mimeType: string;
  version: number;
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
