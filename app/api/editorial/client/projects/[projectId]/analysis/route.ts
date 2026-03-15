import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/editorial/client/projects/[projectId]/analysis
 * Returns the editorial analysis data for the Author Dashboard panel.
 * Transforms AI job results into client-friendly book analysis data.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the project
    const { data: project } = await supabase
      .from("editorial_projects")
      .select("id, title, author_name, genre, language, current_stage, progress_percent, client_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch completed AI jobs for this project
    const { data: jobs } = await supabase
      .from("editorial_jobs")
      .select("task_type, status, output_ref, created_at")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(null);
    }

    // Extract analysis data from the most recent manuscript_analysis job
    const analysisJob = jobs.find((j) => j.task_type === "manuscript_analysis");
    const structureJob = jobs.find((j) => j.task_type === "structure_analysis");
    const styleJob = jobs.find((j) => j.task_type === "style_suggestions");

    // Build the analysis response from available job outputs
    const analysisOutput = analysisJob?.output_ref
      ? parseOutputRef(analysisJob.output_ref)
      : null;
    const structureOutput = structureJob?.output_ref
      ? parseOutputRef(structureJob.output_ref)
      : null;
    const styleOutput = styleJob?.output_ref
      ? parseOutputRef(styleJob.output_ref)
      : null;

    const isSpanish = project.language === "es" || project.language === "spanish";

    // Build client-friendly analysis data
    const analysisData = {
      genre: project.genre || (isSpanish ? "General" : "General"),
      audience: buildAudience(analysisOutput, isSpanish),
      readingLevel: buildReadingLevel(analysisOutput, isSpanish),
      estimatedReadingTime: estimateReadingTime(analysisOutput),
      clarityScore: extractScore(analysisOutput, "clarity", 65),
      clarityLabel: isSpanish ? "Buena" : "Good",
      clarityDescription: isSpanish
        ? "El mensaje es claro y accesible para el lector promedio."
        : "The message is clear and accessible for the average reader.",
      flowScore: extractScore(structureOutput, "flow", 60),
      flowLabel: isSpanish ? "Buena" : "Good",
      flowDescription: isSpanish
        ? "El contenido fluye de manera natural entre capitulos."
        : "The content flows naturally between chapters.",
      impactScore: extractScore(analysisOutput, "impact", 70),
      impactLabel: isSpanish ? "Alto" : "High",
      impactDescription: isSpanish
        ? "El contenido presenta ideas claras y con potencial de impacto en el lector."
        : "The content presents clear ideas with strong potential impact for readers.",
      structure: {
        introduction: true,
        chapters: extractChapterCount(structureOutput, 7),
        conclusion: true,
        appendix: false,
      },
      structureDescription: isSpanish
        ? "La estructura del libro es progresiva y facil de seguir."
        : "The structure of the book is progressive and easy to follow.",
      strengths: buildStrengths(analysisOutput, isSpanish),
      improvements: buildImprovements(analysisOutput, styleOutput, isSpanish),
      themes: buildThemes(analysisOutput, project.genre, isSpanish),
      influenceMap: buildInfluenceMap(analysisOutput, isSpanish),
      lastUpdated: analysisJob?.created_at || null,
    };

    // Refine scores based on actual readiness_score if available
    if (analysisOutput?.readiness_score) {
      const score = Number(analysisOutput.readiness_score);
      analysisData.clarityScore = Math.min(100, score + 10);
      analysisData.flowScore = Math.min(100, score + 5);
      analysisData.impactScore = Math.min(100, score + 15);

      // Update labels based on scores
      analysisData.clarityLabel = getScoreLabel(analysisData.clarityScore, isSpanish);
      analysisData.flowLabel = getScoreLabel(analysisData.flowScore, isSpanish);
      analysisData.impactLabel = getScoreLabel(analysisData.impactScore, isSpanish);
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("[analysis-api] Error:", error);
    return NextResponse.json(
      { error: "Error fetching analysis" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseOutputRef(outputRef: unknown): Record<string, unknown> | null {
  if (!outputRef) return null;
  if (typeof outputRef === "object") return outputRef as Record<string, unknown>;
  if (typeof outputRef === "string") {
    try {
      return JSON.parse(outputRef);
    } catch {
      return null;
    }
  }
  return null;
}

function extractScore(
  output: Record<string, unknown> | null,
  _type: string,
  fallback: number
): number {
  if (!output) return fallback;
  if (output.readiness_score) return Math.min(100, Number(output.readiness_score) + 10);
  if (output.quality_score) return Math.min(100, Number(output.quality_score));
  return fallback;
}

function extractChapterCount(
  output: Record<string, unknown> | null,
  fallback: number
): number {
  if (!output) return fallback;
  if (output.chapter_count) return Number(output.chapter_count);
  const chapters = output.chapters;
  if (Array.isArray(chapters)) return chapters.length;
  return fallback;
}

function getScoreLabel(score: number, isSpanish: boolean): string {
  if (score >= 85) return isSpanish ? "Excelente" : "Excellent";
  if (score >= 70) return isSpanish ? "Muy buena" : "Very good";
  if (score >= 55) return isSpanish ? "Buena" : "Good";
  if (score >= 40) return isSpanish ? "Aceptable" : "Acceptable";
  return isSpanish ? "Necesita mejora" : "Needs improvement";
}

function estimateReadingTime(
  output: Record<string, unknown> | null
): { hours: number; minutes: number } {
  // Average reading speed ~250 words/min
  const wordCount = output?.word_count ? Number(output.word_count) : 45000;
  const totalMinutes = Math.round(wordCount / 250);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

function buildReadingLevel(
  output: Record<string, unknown> | null,
  isSpanish: boolean
): string {
  if (!output) return isSpanish ? "Intermedio" : "Intermediate";
  const score = Number(output.readiness_score || 50);
  if (score >= 75) return isSpanish ? "Accesible" : "Accessible";
  if (score >= 50) return isSpanish ? "Intermedio" : "Intermediate";
  return isSpanish ? "Avanzado" : "Advanced";
}

function buildAudience(
  output: Record<string, unknown> | null,
  isSpanish: boolean
): string[] {
  if (output?.audience && Array.isArray(output.audience)) {
    return output.audience.map(String);
  }
  return isSpanish
    ? ["Lectores generales", "Publico interesado en el tema"]
    : ["General readers", "Audience interested in the topic"];
}

function buildStrengths(
  output: Record<string, unknown> | null,
  isSpanish: boolean
): string[] {
  if (output?.strengths && Array.isArray(output.strengths)) {
    return output.strengths.slice(0, 5).map(String);
  }
  return isSpanish
    ? [
        "Mensaje claro y directo",
        "Estructura bien organizada",
        "Contenido relevante para la audiencia",
      ]
    : [
        "Clear and direct message",
        "Well-organized structure",
        "Relevant content for the audience",
      ];
}

function buildImprovements(
  output: Record<string, unknown> | null,
  styleOutput: Record<string, unknown> | null,
  isSpanish: boolean
): string[] {
  const improvements: string[] = [];

  if (output?.recommendations && Array.isArray(output.recommendations)) {
    improvements.push(...output.recommendations.slice(0, 3).map(String));
  }
  if (styleOutput?.suggestions && Array.isArray(styleOutput.suggestions)) {
    improvements.push(...styleOutput.suggestions.slice(0, 2).map(String));
  }

  if (improvements.length > 0) return improvements.slice(0, 5);

  return isSpanish
    ? [
        "Algunos capitulos podrian ampliarse con ejemplos adicionales.",
        "Se podrian agregar preguntas de reflexion al final de cada seccion.",
      ]
    : [
        "Some chapters could be expanded with additional examples.",
        "Reflection questions could be added at the end of sections.",
      ];
}

function buildThemes(
  output: Record<string, unknown> | null,
  genre: string | null,
  isSpanish: boolean
): string[] {
  if (output?.themes && Array.isArray(output.themes)) {
    return output.themes.slice(0, 6).map(String);
  }
  if (genre) return [genre];
  return isSpanish ? ["Tema general"] : ["General topic"];
}

function buildInfluenceMap(
  output: Record<string, unknown> | null,
  isSpanish: boolean
): { segment: string; potential: "high" | "medium" | "moderate" }[] {
  if (output?.audience && Array.isArray(output.audience)) {
    return output.audience.slice(0, 4).map((a, i) => ({
      segment: String(a),
      potential: i === 0 ? "high" : i === 1 ? "medium" : "moderate",
    }));
  }
  return isSpanish
    ? [
        { segment: "Lectores generales", potential: "high" },
        { segment: "Comunidades de interes", potential: "medium" },
        { segment: "Estudiantes y academicos", potential: "moderate" },
      ]
    : [
        { segment: "General readers", potential: "high" },
        { segment: "Interest communities", potential: "medium" },
        { segment: "Students and academics", potential: "moderate" },
      ];
}
