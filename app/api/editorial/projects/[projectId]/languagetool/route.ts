/**
 * LanguageTool Professional Correction API
 *
 * POST /api/editorial/projects/[projectId]/languagetool
 * Body: { language?: "es" | "en-US" | "auto", autoApply?: boolean }
 *
 * Runs LanguageTool correction on the project's latest manuscript.
 * Returns detailed corrections grouped by category and type.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { fetchManuscriptContent } from "@/lib/editorial/ai/processor";
import {
  runLanguageToolCorrection,
  applyAutoCorrections,
  isLanguageToolAvailable,
} from "@/lib/editorial/ai/languagetool";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if LanguageTool is available
    if (!isLanguageToolAvailable()) {
      return NextResponse.json(
        {
          error:
            "LanguageTool no está configurado. Agrega LANGUAGETOOL_API_KEY en las variables de entorno.",
          fallback: "openai",
          message:
            "Se usará OpenAI GPT-4o como motor de corrección alternativo.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const language = body.language || "auto";
    const autoApply = body.autoApply || false;

    // Fetch manuscript text
    const manuscriptText = await fetchManuscriptContent(projectId);

    if (!manuscriptText || manuscriptText.length < 10) {
      return NextResponse.json(
        { error: "No se encontró texto del manuscrito para corregir." },
        { status: 400 }
      );
    }

    // Run LanguageTool correction
    const result = await runLanguageToolCorrection(manuscriptText, language);

    // Optionally auto-apply high-confidence corrections
    let correctedText: string | null = null;
    let appliedCount = 0;
    let skippedCount = 0;

    if (autoApply && result.corrections.length > 0) {
      const applied = applyAutoCorrections(manuscriptText, result.corrections, {
        onlyHighConfidence: true,
      });
      correctedText = applied.correctedText;
      appliedCount = applied.appliedCount;
      skippedCount = applied.skippedCount;
    }

    // Log the correction job
    const adminClient = getAdminClient();
    await adminClient.from("editorial_activity_log").insert({
      project_id: projectId,
      event_type: "languagetool_correction",
      actor_id: user.id,
      payload: {
        totalIssues: result.totalIssues,
        byCategory: result.byCategory,
        byType: result.byType,
        detectedLanguage: result.detectedLanguage,
        processingTimeMs: result.processingTimeMs,
        autoApplied: autoApply,
        appliedCount,
        skippedCount,
      },
    });

    return NextResponse.json({
      success: true,
      provider: "languagetool",
      result: {
        totalIssues: result.totalIssues,
        byCategory: result.byCategory,
        byType: result.byType,
        detectedLanguage: result.detectedLanguage,
        processingTimeMs: result.processingTimeMs,
        corrections: result.corrections,
      },
      autoApply: autoApply
        ? { appliedCount, skippedCount, correctedText: correctedText ? "[texto disponible]" : null }
        : null,
    });
  } catch (error) {
    console.error("[languagetool-route] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editorial/projects/[projectId]/languagetool
 * Returns the availability status of LanguageTool.
 */
export async function GET() {
  return NextResponse.json({
    available: isLanguageToolAvailable(),
    provider: "languagetool",
    description: "Corrección ortotipográfica profesional con LanguageTool",
    apiUrl: "https://languagetool.org",
    features: [
      "Corrección ortográfica",
      "Corrección gramatical",
      "Corrección de puntuación",
      "Corrección tipográfica",
      "Sugerencias de estilo",
      "Soporte español e inglés",
    ],
  });
}
