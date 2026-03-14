import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/leads/helpers";
import {
  generateCorrectionReportBuffer,
  type CorrectionEntry,
} from "@/lib/editorial/reports/correction-report-docx";

/**
 * GET /api/editorial/projects/[projectId]/correction-report
 *
 * Generates a Word (.docx) document with all spelling and grammar corrections
 * found during the copyediting / line-editing stages.
 *
 * The document is returned as a download (Content-Disposition: attachment).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = getAdminClient();

    // 1. Get project info
    const { data: project, error: projectError } = await supabase
      .from("editorial_projects")
      .select("id, title, org_id, client_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // 2. Get author name if client is linked
    let authorName: string | null = null;
    if (project.client_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", project.client_id)
        .single();
      if (profile?.full_name) {
        authorName = profile.full_name;
      }
    }

    // 3. Collect corrections from all available sources
    let corrections: CorrectionEntry[] = [];

    // 3a. Try editorial_ai_suggestions table (may not exist yet)
    try {
      const { data: suggestions } = await supabase
        .from("editorial_ai_suggestions")
        .select("*")
        .eq("project_id", projectId)
        .order("severity", { ascending: true })
        .order("created_at", { ascending: true });

      if (suggestions && suggestions.length > 0) {
        corrections = suggestions.map((s) => ({
          id: s.id as string,
          kind: (s.kind as string) || "gramatica",
          severity: s.severity as "baja" | "media" | "alta",
          confidence: (s.confidence as number) ?? 0.8,
          original_text: (s.original_text as string) || "",
          suggested_text: (s.suggested_text as string) || "",
          justification: (s.justification as string) || "",
          location: s.location as CorrectionEntry["location"],
        }));
      }
    } catch {
      // Table may not exist yet — continue to fallback sources
      console.log("[correction-report] editorial_ai_suggestions table not available, using fallback");
    }

    // 3b. Also check all completed AI jobs for issues (works with all task types)
    if (corrections.length === 0) {
      const { data: jobs } = await supabase
        .from("editorial_jobs")
        .select("id, job_type, output_ref")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("finished_at", { ascending: false });

      if (jobs && jobs.length > 0) {
        for (const job of jobs) {
          const output = typeof job.output_ref === "string"
            ? safeJsonParse(job.output_ref)
            : (job.output_ref as Record<string, unknown> | null);

          if (!output) continue;

          // Handle copyediting/line_editing format (has .changes array)
          if (Array.isArray(output.changes)) {
            for (const change of output.changes as Record<string, unknown>[]) {
              corrections.push({
                id: (change.id as string) || crypto.randomUUID(),
                kind: (change.kind as string) || "gramatica",
                severity: (change.severity as "baja" | "media" | "alta") || "media",
                confidence: (change.confidence as number) ?? 0.8,
                original_text: (change.original_text as string) || "",
                suggested_text: (change.suggested_text as string) || "",
                justification: (change.justification as string) || "",
                location: change.location as CorrectionEntry["location"],
              });
            }
          }

          // Handle standard AnalysisResult format (has .issues array)
          if (Array.isArray(output.issues)) {
            const taskLabel = (job.job_type as string) || "otro";
            for (const issue of output.issues as Record<string, unknown>[]) {
              const issueType = issue.type as string;
              const severity: "baja" | "media" | "alta" =
                issueType === "error" ? "alta" : issueType === "warning" ? "media" : "baja";
              const kind = mapTaskToKind(taskLabel);

              corrections.push({
                id: crypto.randomUUID(),
                kind,
                severity,
                confidence: 0.8,
                original_text: (issue.description as string) || "",
                suggested_text: (issue.suggestion as string) || "",
                justification: (issue.location as string) || "",
                location: null,
              });
            }
          }
        }
      }
    }

    if (corrections.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se encontraron correcciones para este proyecto. Ejecuta primero el análisis de corrección.",
        },
        { status: 404 }
      );
    }

    // 4. Get summary from the latest completed job (any AI task)
    let summary: string | undefined;
    const { data: latestJob } = await supabase
      .from("editorial_jobs")
      .select("output_ref")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("finished_at", { ascending: false })
      .limit(1)
      .single();

    if (latestJob?.output_ref) {
      const output = typeof latestJob.output_ref === "string"
        ? safeJsonParse(latestJob.output_ref)
        : (latestJob.output_ref as Record<string, unknown> | null);
      if (output?.summary) {
        summary = output.summary as string;
      }
    }

    // 5. Generate the Word document
    const buffer = await generateCorrectionReportBuffer({
      projectTitle: (project.title as string) || "Sin título",
      authorName,
      summary,
      corrections,
    });

    // 6. Return as downloadable .docx
    const safeTitle = ((project.title as string) || "reporte")
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 50);

    const fileName = `Correcciones_${safeTitle}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("[correction-report] unexpected error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function mapTaskToKind(taskKey: string): string {
  const map: Record<string, string> = {
    orthotypography_review: "ortografia",
    style_suggestions: "estilo",
    structure_analysis: "estructura",
    manuscript_analysis: "estructura",
    copyediting: "gramatica",
    line_editing: "gramatica",
    layout_analysis: "formato",
    redline_diff: "formato",
    export_validation: "formato",
    metadata_generation: "otro",
  };
  return map[taskKey] ?? "otro";
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}
