// =============================================================================
// Distribution Package Service
// Editorial Publishing Engine · Phase 7
// =============================================================================
// Manages editorial_distribution_packages — assembled bundles for specific
// retail channels (Amazon KDP, Apple Books, IngramSpark, etc.).
//
// Integration note: actual submission to external APIs is NOT implemented.
// This service tracks the manifest and submission state. A future webhook or
// worker will call `markPackageSubmitted` once the external call is made.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialDistributionPackage,
  CreateDistributionPackageInput,
  DistributionPackageStatus,
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
 * Creates a new distribution package in `pending` status.
 * The manifest and export_run_ids can be provided immediately or updated later.
 */
export async function createDistributionPackage(
  input: CreateDistributionPackageInput
): Promise<EditorialDistributionPackage> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_distribution_packages")
    .insert({
      project_id: input.project_id,
      publication_version_id: input.publication_version_id,
      channel: input.channel,
      status: "pending",
      export_run_ids: input.export_run_ids ?? [],
      manifest: input.manifest ?? {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `[distribution-package-service] createDistributionPackage failed: ${error.message}`
    );
  }
  return data as EditorialDistributionPackage;
}

/**
 * Adds an export run to the package's export_run_ids list and marks it `ready`.
 */
export async function assemblePackage(
  packageId: string,
  exportRunIds: string[],
  manifest: Record<string, unknown>
): Promise<EditorialDistributionPackage> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_distribution_packages")
    .update({
      export_run_ids: exportRunIds,
      manifest,
      status: "ready" as DistributionPackageStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `[distribution-package-service] assemblePackage(${packageId}) failed: ${error.message}`
    );
  }
  return data as EditorialDistributionPackage;
}

/**
 * Records that the package was submitted to a channel (external API call
 * handled outside this service).
 */
export async function markPackageSubmitted(
  packageId: string,
  submissionId: string,
  submittedBy: string
): Promise<EditorialDistributionPackage> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_distribution_packages")
    .update({
      status: "submitted" as DistributionPackageStatus,
      submission_id: submissionId,
      submitted_at: new Date().toISOString(),
      submitted_by: submittedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `[distribution-package-service] markPackageSubmitted(${packageId}) failed: ${error.message}`
    );
  }
  return data as EditorialDistributionPackage;
}

/**
 * Records a channel response (accepted / rejected) after submission.
 */
export async function recordChannelResponse(
  packageId: string,
  accepted: boolean,
  response: Record<string, unknown>
): Promise<EditorialDistributionPackage> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_distribution_packages")
    .update({
      status: (accepted ? "accepted" : "rejected") as DistributionPackageStatus,
      channel_response: response,
      response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `[distribution-package-service] recordChannelResponse(${packageId}) failed: ${error.message}`
    );
  }
  return data as EditorialDistributionPackage;
}

/**
 * Returns all distribution packages for a publication version.
 */
export async function listDistributionPackages(
  publicationVersionId: string
): Promise<EditorialDistributionPackage[]> {
  const db = getAdminClient();

  const { data, error } = await db
    .from("editorial_distribution_packages")
    .select("*")
    .eq("publication_version_id", publicationVersionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[distribution-package-service] listDistributionPackages failed: ${error.message}`
    );
  }
  return (data ?? []) as EditorialDistributionPackage[];
}
