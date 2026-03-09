import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "./buckets";

export interface UploadManuscriptResult {
  storagePath: string;
  publicUrl: string | null;
  sizeBytes: number;
  mimeType: string;
}

export async function uploadManuscript(
  projectId: string,
  file: File,
  // uploadedBy is accepted for API symmetry; callers should record it via registerManuscriptFile
  _uploadedBy?: string
): Promise<UploadManuscriptResult> {
  const supabase = getAdminClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${projectId}/manuscript_original_v1.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return {
    storagePath,
    publicUrl: null,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}
