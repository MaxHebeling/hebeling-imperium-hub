// =============================================================================
// Publishing Validation Service
// Editorial Publishing Engine · Phase 7
// =============================================================================
// Pre-export gate. Checks that all prerequisites are met before allowing an
// export to be triggered.
//
// Checks performed:
//   1. stage_is_final      — project is at revision_final or status = completed
//   2. no_open_critical_findings — no unresolved critical/error AI findings
//   3. metadata_complete   — required bibliographic fields are populated
//   4. has_approved_version — at least one publication version in 'ready' status
// =============================================================================

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  EditorialProject,
  EditorialPublicationVersion,
  EditorialPublicationMetadata,
  PublishingReadinessResult,
} from "@/types/editorial";
import { checkMetadataCompleteness } from "./metadata-service";

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
 * Evaluates all publishing readiness checks and returns a structured result.
 * Call this before triggering any export.
 */
export async function validatePublishingReadiness(
  projectId: string,
  latestVersion: EditorialPublicationVersion | null,
  latestMetadata: EditorialPublicationMetadata | null
): Promise<PublishingReadinessResult> {
  const db = getAdminClient();

  // Fetch project for stage + status check
  const { data: project } = await db
    .from("editorial_projects")
    .select("current_stage, status")
    .eq("id", projectId)
    .single();

  const proj = project as Pick<EditorialProject, "current_stage" | "status"> | null;

  // ── Check 1: stage is final ───────────────────────────────────────────────
  const stageIsFinal =
    proj !== null &&
    (proj.current_stage === "revision_final" ||
      proj.status === "completed" ||
      proj.status === "approved");

  // ── Check 2: no open critical/error findings ──────────────────────────────
  const { count: openCriticalCount } = await db
    .from("editorial_ai_findings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("severity", ["critical", "error"])
    .in("status", ["pending", "deferred"]);

  const noOpenCriticals = (openCriticalCount ?? 0) === 0;

  // ── Check 3: metadata completeness ────────────────────────────────────────
  const { complete: metadataComplete, missingFields } =
    checkMetadataCompleteness(latestMetadata);

  // ── Check 4: has a 'ready' publication version ────────────────────────────
  const hasApprovedVersion =
    latestVersion !== null &&
    (latestVersion.status === "ready" || latestVersion.status === "exported");

  // ── Aggregate blockers ────────────────────────────────────────────────────
  const blockers: string[] = [];

  if (!stageIsFinal) {
    blockers.push(
      "El proyecto debe estar en la etapa Revisión Final o tener estado Aprobado para exportar."
    );
  }
  if (!noOpenCriticals) {
    blockers.push(
      `Existen ${openCriticalCount} hallazgo(s) críticos sin resolver. Resuélvelos antes de exportar.`
    );
  }
  if (!metadataComplete) {
    blockers.push(
      `Metadatos incompletos. Campos requeridos faltantes: ${missingFields.join(", ")}.`
    );
  }
  if (!hasApprovedVersion) {
    blockers.push(
      "No existe una versión de publicación en estado 'Lista' (ready). Promueve una versión antes de exportar."
    );
  }

  return {
    ready: blockers.length === 0,
    checks: {
      stage_is_final: stageIsFinal,
      no_open_critical_findings: noOpenCriticals,
      metadata_complete: metadataComplete,
      has_approved_version: hasApprovedVersion,
    },
    blockers,
  };
}
