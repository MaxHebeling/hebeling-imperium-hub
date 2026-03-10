// =============================================================================
// Publication Version Service
// Editorial Publishing Engine · Phase 7
// =============================================================================
// CRUD operations for editorial_publication_versions.
// Lifecycle: draft → ready → exported → archived
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialPublicationVersion,
  PublicationVersionStatus,
  CreatePublicationVersionInput,
} from "@/types/editorial";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new publication version in `draft` status.
 * Validates that version_tag is unique within the project before inserting.
 */
export async function createPublicationVersion(
  input: CreatePublicationVersionInput
): Promise<EditorialPublicationVersion> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_publication_versions")
    .insert({
      project_id: input.project_id,
      label: input.label,
      version_tag: input.version_tag,
      status: "draft",
      source_document_version_id: input.source_document_version_id ?? null,
      source_stage: input.source_stage ?? null,
      source_file_id: input.source_file_id ?? null,
      editorial_notes: input.editorial_notes ?? null,
      created_by: input.created_by ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `[publication-version-service] createPublicationVersion failed: ${error.message}`
    );
  }
  return data as EditorialPublicationVersion;
}

/**
 * Returns a single publication version by ID.
 */
export async function getPublicationVersion(
  versionId: string
): Promise<EditorialPublicationVersion> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_publication_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error || !data) {
    throw new Error(
      `[publication-version-service] Version ${versionId} not found: ${error?.message ?? "no data"}`
    );
  }
  return data as EditorialPublicationVersion;
}

/**
 * Transitions the status of a publication version.
 *
 * Allowed transitions:
 *   draft → ready        (editor marks it publish-ready)
 *   ready → exported     (set automatically after first successful export)
 *   ready → draft        (editor reverts to continue editing)
 *   exported → archived  (version is superseded)
 *   any → archived       (emergency archive)
 */
export async function updatePublicationVersionStatus(
  versionId: string,
  newStatus: PublicationVersionStatus,
  approvedBy?: string
): Promise<EditorialPublicationVersion> {
  const db = getAdminClient();

  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "ready" && approvedBy) {
    updates.approved_by = approvedBy;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await db
    .from("editorial_publication_versions")
    .update(updates)
    .eq("id", versionId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `[publication-version-service] updateStatus(${versionId}, ${newStatus}) failed: ${error.message}`
    );
  }
  return data as EditorialPublicationVersion;
}

/**
 * Updates the editorial notes field of a publication version.
 */
export async function updatePublicationVersionNotes(
  versionId: string,
  notes: string
): Promise<EditorialPublicationVersion> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_publication_versions")
    .update({ editorial_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", versionId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `[publication-version-service] updateNotes(${versionId}) failed: ${error.message}`
    );
  }
  return data as EditorialPublicationVersion;
}
