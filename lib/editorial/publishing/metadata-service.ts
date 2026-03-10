// =============================================================================
// Metadata Service
// Editorial Publishing Engine · Phase 7
// =============================================================================
// Manages editorial_publication_metadata rows.
// Uses upsert semantics: one row per publication_version_id.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialPublicationMetadata,
  UpsertPublicationMetadataInput,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimum required fields for a metadata record to be considered "complete"
// (used by the publishing validation service).
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_METADATA_FIELDS: Array<keyof EditorialPublicationMetadata> = [
  "title",
  "author_name",
  "language",
  "description",
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the metadata for a publication version, or null if not yet created.
 */
export async function getPublicationMetadata(
  publicationVersionId: string
): Promise<EditorialPublicationMetadata | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_publication_metadata")
    .select("*")
    .eq("publication_version_id", publicationVersionId)
    .maybeSingle();

  if (error) {
    throw new Error(`[metadata-service] getPublicationMetadata failed: ${error.message}`);
  }
  return (data as EditorialPublicationMetadata) ?? null;
}

/**
 * Creates or fully updates the metadata for a publication version.
 * Uses Supabase upsert with the unique constraint on publication_version_id.
 */
export async function upsertPublicationMetadata(
  input: UpsertPublicationMetadataInput
): Promise<EditorialPublicationMetadata> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_publication_metadata")
    .upsert(
      {
        publication_version_id: input.publication_version_id,
        project_id: input.project_id,
        title: input.title,
        subtitle: input.subtitle ?? null,
        author_name: input.author_name ?? null,
        contributors: input.contributors ?? [],
        publisher_name: input.publisher_name ?? null,
        imprint: input.imprint ?? null,
        publication_date: input.publication_date ?? null,
        edition_number: input.edition_number ?? 1,
        isbn_13: input.isbn_13 ?? null,
        isbn_10: input.isbn_10 ?? null,
        asin: input.asin ?? null,
        doi: input.doi ?? null,
        language: input.language ?? "es",
        description: input.description ?? null,
        keywords: input.keywords ?? null,
        bisac_codes: input.bisac_codes ?? null,
        thema_codes: input.thema_codes ?? null,
        rights: input.rights ?? null,
        territories: input.territories ?? null,
        cover_image_url: input.cover_image_url ?? null,
        cover_storage_path: input.cover_storage_path ?? null,
        extra_metadata: input.extra_metadata ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "publication_version_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`[metadata-service] upsertPublicationMetadata failed: ${error.message}`);
  }
  return data as EditorialPublicationMetadata;
}

/**
 * Checks whether a metadata record meets the minimum completeness threshold
 * required to allow export.
 *
 * Returns an object with `complete: boolean` and a list of missing fields.
 */
export function checkMetadataCompleteness(
  metadata: EditorialPublicationMetadata | null
): { complete: boolean; missingFields: string[] } {
  if (!metadata) {
    return {
      complete: false,
      missingFields: REQUIRED_METADATA_FIELDS as string[],
    };
  }

  const missingFields = REQUIRED_METADATA_FIELDS.filter((field) => {
    const value = metadata[field];
    return value === null || value === undefined || value === "";
  });

  return { complete: missingFields.length === 0, missingFields };
}
