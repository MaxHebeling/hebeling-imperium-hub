import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { logEditorialActivity, updateStageStatus } from "@/lib/editorial/db/mutations";
import { processAiJob } from "@/lib/editorial/ai/processor";
import { requestAiTask } from "@/lib/editorial/ai/jobs";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import type {
  EditorialPipelineStageKey,
  EditorialStageKey,
} from "@/lib/editorial/types/editorial";
import {
  ensureFileVersionFromEditorialFile,
  ensureStageRun,
  getLatestEditorialFile,
  mapLegacyStageToWorkflowStage,
  replaceFindingsForStageRun,
  updateStageRunStatus,
  WORKFLOW_STAGE_AI_CONFIG,
} from "@/lib/editorial/stage-engine/service";
import type { AnalysisResult } from "@/lib/editorial/ai/processor";

function isProcessableSourceFile(file: { file_type: string; storage_path: string; mime_type?: string | null } | null | undefined) {
  if (!file) return false;
  if (file.file_type === "working_file" || file.file_type.startsWith("manuscript")) return true;
  const lowerPath = file.storage_path.toLowerCase();
  return [".docx", ".doc", ".pdf", ".txt", ".md"].some((extension) => lowerPath.endsWith(extension));
}

function mapIssueTypeToFindingType(type: AnalysisResult["issues"][number]["type"]) {
  if (type === "error") return "editorial" as const;
  if (type === "warning") return "style" as const;
  return "editorial" as const;
}

function mapIssueSeverity(type: AnalysisResult["issues"][number]["type"]) {
  if (type === "error") return "critical" as const;
  if (type === "warning") return "warning" as const;
  return "info" as const;
}

/**
 * POST /api/staff/projects/[projectId]/pipeline/run
 *
 * Runs AI for the CURRENT editorial stage only.
 * It creates or reuses a stage run, attaches evidence, stores findings,
 * and leaves the project waiting for human review.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Proyecto no encontrado" }, { status: 404 });
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:run",
    });
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const workflowStageKey = mapLegacyStageToWorkflowStage(project.current_stage);
    const stageAiConfig = WORKFLOW_STAGE_AI_CONFIG[workflowStageKey];

    const latestManuscript = await getLatestManuscriptForProject(projectId);
    const latestEditorialFile = await getLatestEditorialFile(projectId);
    const sourceFile =
      (isProcessableSourceFile(latestEditorialFile) ? latestEditorialFile : null) ??
      latestManuscript?.file ??
      null;

    const manuscriptFileId = sourceFile?.id ?? null;
    const manuscriptFileVersion = sourceFile?.version ?? null;
    if (!sourceFile) {
      return NextResponse.json(
        { success: false, error: "No hay archivos del proyecto para iniciar la etapa actual." },
        { status: 400 }
      );
    }

    const inputVersion = await ensureFileVersionFromEditorialFile({
      projectId,
      file: sourceFile,
      createdBy: staff.userId,
    });

    const stageRun = await ensureStageRun({
      projectId,
      stageKey: workflowStageKey,
      ownerUserId: staff.userId,
      inputVersionId: inputVersion?.id ?? null,
    });

    await updateStageStatus(projectId, project.current_stage, "processing");
    if (stageRun?.id) {
      await updateStageRunStatus({
        stageRunId: stageRun.id,
        status: "ai_processing",
      });
    }

    if (!stageAiConfig.aiTaskKey || !stageAiConfig.aiStageKey) {
      if (stageRun?.id) {
        await updateStageRunStatus({
          stageRunId: stageRun.id,
          status: "human_review",
          aiSummary: "Etapa preparada para revision humana. No tiene automatizacion AI configurada.",
        });
      }

      await logWorkflowEvent({
        orgId: project.org_id,
        projectId,
        stageKey: project.current_stage,
        eventType: "stage_started",
        actorId: staff.userId,
        actorRole: staff.role,
        payload: {
          via: "stage_engine",
          workflowStageKey,
          stageRunId: stageRun?.id ?? null,
          aiEnabled: false,
        },
      });

      await logEditorialActivity(projectId, "editorial_stage_run_prepared", {
        stageKey: project.current_stage,
        actorId: staff.userId,
        actorType: "staff",
        payload: { workflowStageKey, stageRunId: stageRun?.id ?? null, aiEnabled: false },
      });

      return NextResponse.json({
        success: true,
        completed: false,
        stagesProcessed: 1,
        stageRunId: stageRun?.id ?? null,
        workflowStageKey,
        message: `Etapa ${workflowStageKey} preparada para revision humana.`,
      });
    }

    if (!manuscriptFileId) {
      return NextResponse.json(
        { success: false, error: "No hay manuscrito disponible para ejecutar AI en la etapa actual." },
        { status: 400 }
      );
    }

    const aiStageKey = stageAiConfig.aiStageKey as EditorialPipelineStageKey;
    const { jobId } = await requestAiTask({
      orgId: project.org_id,
      projectId,
      stageKey: aiStageKey,
      taskKey: stageAiConfig.aiTaskKey,
      requestedBy: staff.userId,
      sourceFileId: manuscriptFileId,
      sourceFileVersion: manuscriptFileVersion ?? undefined,
    });

    const result = await processAiJob({
      jobId,
      projectId,
      stageKey: aiStageKey,
      taskKey: stageAiConfig.aiTaskKey,
      context: {
        project_id: projectId,
        stage_key: aiStageKey,
        source_file_id: manuscriptFileId,
        source_file_version: manuscriptFileVersion,
        requested_by: staff.userId,
      },
      skipAutoAdvance: true,
    });

    const findings = result?.issues?.map((issue, index) => ({
      findingType: mapIssueTypeToFindingType(issue.type),
      severity: mapIssueSeverity(issue.type),
      title: `Hallazgo ${index + 1}: ${issue.type}`,
      description: issue.description,
      suggestion: issue.suggestion,
      locationRef: issue.location ? { location: issue.location } : null,
      evidenceRef: { jobId, workflowStageKey },
    })) ?? [];

    if (stageRun?.id) {
      await replaceFindingsForStageRun({
        projectId,
        stageRunId: stageRun.id,
        jobId,
        fileVersionId: inputVersion?.id ?? null,
        findings,
      });

      await updateStageRunStatus({
        stageRunId: stageRun.id,
        status: "human_review",
        aiSummary: result?.summary ?? "Analisis AI completado para revision humana.",
        qualityScore: result?.score ?? null,
      });
    }

    await updateStageStatus(projectId, project.current_stage, "review_required");

    return NextResponse.json({
      success: true,
      completed: false,
      stagesProcessed: 1,
      stageRunId: stageRun?.id ?? null,
      workflowStageKey,
      aiJobId: jobId,
      findingsCount: findings.length,
      message: `Analisis AI completado para ${workflowStageKey}. La etapa queda lista para revision humana.`,
    });
  } catch (error) {
    console.error("[pipeline/run] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
