import { NextRequest, NextResponse } from "next/server";
import {
  getProjectWorkflowDetail,
  initializeProjectWorkflow,
  advanceWorkflow,
  updateWorkflowStageStatus,
} from "@/lib/editorial/workflow/professional";
import type { WorkflowPhaseKey, WorkflowStageKey, WorkflowStageStatus } from "@/lib/editorial/types/workflow";

/**
 * GET /api/editorial/projects/[projectId]/workflow
 * Returns the full workflow detail for a project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    let detail = await getProjectWorkflowDetail(projectId);

    // Auto-initialize if no workflow exists yet
    if (!detail) {
      await initializeProjectWorkflow(projectId);
      detail = await getProjectWorkflowDetail(projectId);
    }

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("[workflow/GET] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/editorial/projects/[projectId]/workflow
 * Actions: initialize, advance, update_stage
 * Body: { action, phaseKey?, stageKey?, status?, approvedBy? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case "initialize": {
        const { startPhase, startStage } = body as {
          startPhase?: WorkflowPhaseKey;
          startStage?: WorkflowStageKey;
        };
        const workflow = await initializeProjectWorkflow(
          projectId,
          startPhase ?? "intake",
          startStage ?? "manuscript_upload"
        );
        return NextResponse.json({ success: true, workflow });
      }

      case "advance": {
        const next = await advanceWorkflow(projectId);
        if (!next) {
          return NextResponse.json({
            success: true,
            message: "Workflow completado o requiere aprobacion",
            completed: true,
          });
        }
        return NextResponse.json({ success: true, next });
      }

      case "update_stage": {
        const { phaseKey, stageKey, status, approvedBy } = body as {
          phaseKey: WorkflowPhaseKey;
          stageKey: WorkflowStageKey;
          status: WorkflowStageStatus;
          approvedBy?: string;
        };
        if (!phaseKey || !stageKey || !status) {
          return NextResponse.json(
            { success: false, error: "phaseKey, stageKey y status son requeridos" },
            { status: 400 }
          );
        }
        await updateWorkflowStageStatus(projectId, phaseKey, stageKey, status, approvedBy);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Accion desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[workflow/POST] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
