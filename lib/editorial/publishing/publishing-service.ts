// =============================================================================
// Publishing Service
// Editorial Publishing Engine · Phase 7
// =============================================================================
// Top-level service: loads the full publishing context for a project.
// Called by the PublishingDashboard Server Component.
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialProject,
  EditorialPublicationVersion,
  EditorialPublicationMetadata,
  EditorialExportRun,
  EditorialDistributionPackage,
  ProjectPublishingContext,
} from "@/types/editorial";
import { validatePublishingReadiness } from "./publishing-validation-service";

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
 * Loads the complete publishing context for a project.
 * Used as the single data-fetching call in the PublishingDashboard page.
 */
export async function getProjectPublishingContext(
  projectId: string
): Promise<ProjectPublishingContext> {
  const db = getAdminClient();

  const [
    projectRes,
    versionsRes,
    exportsRes,
    packagesRes,
  ] = await Promise.all([
    db.from("editorial_projects").select("*").eq("id", projectId).single(),

    db
      .from("editorial_publication_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),

    db
      .from("editorial_export_runs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20),

    db
      .from("editorial_distribution_packages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);

  if (projectRes.error || !projectRes.data) {
    throw new Error(
      `[publishing-service] Project ${projectId} not found: ${projectRes.error?.message ?? "no data"}`
    );
  }

  const publicationVersions = (versionsRes.data ?? []) as EditorialPublicationVersion[];
  const latestVersion = publicationVersions[0] ?? null;

  // Fetch metadata for the latest version only (avoid N+1)
  let latestMetadata: EditorialPublicationMetadata | null = null;
  if (latestVersion) {
    const { data: metaData } = await db
      .from("editorial_publication_metadata")
      .select("*")
      .eq("publication_version_id", latestVersion.id)
      .maybeSingle();
    latestMetadata = (metaData as EditorialPublicationMetadata) ?? null;
  }

  const readinessCheck = await validatePublishingReadiness(projectId, latestVersion, latestMetadata);

  return {
    project: projectRes.data as EditorialProject,
    publicationVersions,
    latestVersion,
    latestMetadata,
    recentExports: (exportsRes.data ?? []) as EditorialExportRun[],
    distributionPackages: (packagesRes.data ?? []) as EditorialDistributionPackage[],
    readinessCheck,
  };
}

/**
 * Lists publication versions for a project (lightweight, no metadata).
 */
export async function listPublicationVersions(
  projectId: string
): Promise<EditorialPublicationVersion[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from("editorial_publication_versions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`[publishing-service] listPublicationVersions: ${error.message}`);
  return (data ?? []) as EditorialPublicationVersion[];
}
