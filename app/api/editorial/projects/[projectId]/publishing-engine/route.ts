/**
 * AI Publishing Engine API
 *
 * GET  — Returns pipeline status + phase results
 * POST — Actions: advance, run-ai, save-prompt, save-amazon-config
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getPipelineState,
  advanceToPhase,
  executePhaseAi,
  runFullAiPipeline,
  savePhasePrompt,
  getPhasePromptHistory,
  saveAmazonConfig,
  getAuthorTimeline,
  PUBLISHING_PHASES,
} from "@/lib/editorial/publishing-engine";
import type { PublishingPhaseKey, AmazonFormatConfig } from "@/lib/editorial/publishing-engine";

// ─── GET: Pipeline state (phases, progress, results) ─────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const state = await getPipelineState(projectId);

    return NextResponse.json({
      state,
      phases: PUBLISHING_PHASES.map((p) => ({
        key: p.key,
        order: p.order,
        label: p.label,
        labelEn: p.labelEn,
        description: p.description,
        aiAgent: p.aiAgent,
        aiProvider: p.aiProvider,
        aiTaskKey: p.aiTaskKey,
        requiresHumanReview: p.requiresHumanReview,
        isAiAutomated: p.isAiAutomated,
        outputs: p.outputs,
        icon: p.icon,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST: Pipeline actions ──────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const body = await req.json();
    const action = body.action as string;

    switch (action) {
      case "advance": 
      case "approve": {
        const targetPhase = body.targetPhase as PublishingPhaseKey;
        console.log("[v0] API approve/advance - projectId:", projectId, "targetPhase:", targetPhase);
        if (!targetPhase) {
          console.log("[v0] API ERROR - targetPhase missing");
          return NextResponse.json({ error: "targetPhase requerido" }, { status: 400 });
        }
        const result = await advanceToPhase(projectId, targetPhase);
        console.log("[v0] API advanceToPhase result:", result);
        return NextResponse.json(result);
      }

      case "save-prompt": {
        const phaseKey = body.phaseKey as PublishingPhaseKey;
        const prompt = body.prompt as string;
        if (!phaseKey || !prompt) {
          return NextResponse.json({ error: "phaseKey y prompt requeridos" }, { status: 400 });
        }
        const edit = await savePhasePrompt(projectId, phaseKey, prompt, body.userId ?? null);
        return NextResponse.json(edit);
      }

      case "get-prompt-history": {
        const phaseKey = body.phaseKey as PublishingPhaseKey;
        if (!phaseKey) {
          return NextResponse.json({ error: "phaseKey requerido" }, { status: 400 });
        }
        const history = await getPhasePromptHistory(projectId, phaseKey);
        return NextResponse.json({ history });
      }

      case "save-amazon-config": {
        const config = body.config as AmazonFormatConfig;
        if (!config) {
          return NextResponse.json({ error: "config requerido" }, { status: 400 });
        }
        const result = await saveAmazonConfig(projectId, config);
        return NextResponse.json(result);
      }

      case "run-ai": {
        const phaseKey = body.phaseKey as PublishingPhaseKey;
        if (!phaseKey) {
          return NextResponse.json({ error: "phaseKey requerido" }, { status: 400 });
        }
        const result = await executePhaseAi(projectId, phaseKey);
        return NextResponse.json(result);
      }

      case "run-full-pipeline": {
        const result = await runFullAiPipeline(projectId);
        return NextResponse.json(result);
      }

      case "get-timeline": {
        const timeline = await getAuthorTimeline(projectId);
        return NextResponse.json({ timeline });
      }

      default:
        return NextResponse.json({ error: `Acción no reconocida: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
