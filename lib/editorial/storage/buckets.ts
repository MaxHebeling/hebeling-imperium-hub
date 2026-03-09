export const EDITORIAL_BUCKETS = {
  manuscripts: "editorial-manuscripts",
  working: "editorial-working",
  exports: "editorial-exports",
  assets: "editorial-assets",
  covers: "editorial-covers",
} as const;

export type EditorialBucketKey = keyof typeof EDITORIAL_BUCKETS;
