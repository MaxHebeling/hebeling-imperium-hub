import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "./buckets";
import type { EditorialBucketKey } from "./buckets";

export async function getSignedUrl(
  bucket: EditorialBucketKey,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS[bucket])
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}
