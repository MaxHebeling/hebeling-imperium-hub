import { getAdminClient } from "@/lib/leads/helpers";

export const EDITORIAL_BUCKETS = {
  manuscripts: "editorial-manuscripts",
  working: "editorial-working",
  exports: "editorial-exports",
  assets: "editorial-assets",
  covers: "editorial-covers",
} as const;

export type EditorialBucketKey = keyof typeof EDITORIAL_BUCKETS;

/** In-process cache of bucket names that are confirmed to exist. */
const verifiedBuckets = new Set<string>();

/** Extracts the HTTP status code from a Supabase StorageError if available. */
function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === "number" ? s : null;
  }
  return null;
}

/**
 * Ensures a Supabase Storage bucket exists, creating it (private) if it does not.
 * Results are cached in-process so subsequent calls within the same runtime are no-ops.
 */
export async function ensureBucket(bucketName: string): Promise<void> {
  if (verifiedBuckets.has(bucketName)) return;

  const supabase = getAdminClient();

  const { data: existing, error: getError } = await supabase.storage.getBucket(bucketName);

  if (existing) {
    verifiedBuckets.add(bucketName);
    return;
  }

  // Only proceed to create when the bucket genuinely does not exist (404/400).
  // For any other error (permissions, network) surface it immediately.
  const getStatus = getErrorStatus(getError);
  if (getError && getStatus !== 404 && getStatus !== 400) {
    throw new Error(`Storage error checking bucket "${bucketName}": ${getError.message}`);
  }

  // Bucket doesn't exist — attempt to create it.
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
  });

  if (createError) {
    // status 409 means a concurrent request already created it — treat as success.
    if (getErrorStatus(createError) !== 409) {
      throw new Error(`Failed to create storage bucket "${bucketName}": ${createError.message}`);
    }
  }

  verifiedBuckets.add(bucketName);
}
