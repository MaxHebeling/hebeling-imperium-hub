import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "./buckets";

const ensuredBuckets = new Set<string>();

const BUCKET_VISIBILITY: Record<string, boolean> = {
  [EDITORIAL_BUCKETS.manuscripts]: false,
  [EDITORIAL_BUCKETS.working]: false,
  [EDITORIAL_BUCKETS.exports]: true,
  [EDITORIAL_BUCKETS.assets]: false,
  [EDITORIAL_BUCKETS.covers]: true,
};

type StorageErrorLike = {
  message?: string;
  name?: string;
  statusCode?: string | number;
};

function normalizeStorageError(error: unknown): StorageErrorLike {
  if (typeof error === "object" && error !== null) {
    return error as StorageErrorLike;
  }
  return {};
}

function isBucketAlreadyPresent(error: unknown): boolean {
  const details = normalizeStorageError(error);
  const message = (details.message ?? "").toLowerCase();

  return (
    message.includes("already exists") ||
    message.includes("duplicate") ||
    message.includes("conflict")
  );
}

export async function ensureEditorialBucket(bucketName: string): Promise<void> {
  if (!bucketName || ensuredBuckets.has(bucketName)) {
    return;
  }

  const supabase = getAdminClient();
  const { error } = await supabase.storage.createBucket(bucketName, {
    public: BUCKET_VISIBILITY[bucketName] ?? false,
  });

  if (error && !isBucketAlreadyPresent(error)) {
    throw new Error(`Failed to ensure storage bucket ${bucketName}: ${error.message}`);
  }

  ensuredBuckets.add(bucketName);
}

export async function ensureEditorialBuckets(bucketNames?: string[]): Promise<void> {
  const names = bucketNames ?? Object.values(EDITORIAL_BUCKETS);

  for (const bucketName of new Set(names)) {
    await ensureEditorialBucket(bucketName);
  }
}
