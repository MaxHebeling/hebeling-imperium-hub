import { NextRequest, NextResponse } from "next/server";
import { generateDocxFromText } from "@/lib/editorial/docx";
import {
  FINAL_MANUSCRIPT_PRIORITY,
  getCurrentEditorialTextAsset,
} from "@/lib/editorial/files/final-manuscript";
import { getAdminClient } from "@/lib/leads/helpers";

function createSafeTitleSegment(value: string | null | undefined, fallback: string): string {
  return (value || fallback)
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = getAdminClient();

    const { data: project, error: projectError } = await supabase
      .from("editorial_projects")
      .select("id, title, author_name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const currentManuscript = await getCurrentEditorialTextAsset(
      projectId,
      FINAL_MANUSCRIPT_PRIORITY
    );

    if (!currentManuscript?.fullText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Todavía no hay un manuscrito final consolidado para exportar.",
        },
        { status: 404 }
      );
    }

    const buffer = await generateDocxFromText(currentManuscript.fullText);
    const safeTitle = createSafeTitleSegment(project.title, "manuscrito_final");
    const fileName = `Manuscrito_final_${safeTitle}_v${currentManuscript.version}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.length),
        "X-Editorial-Asset-Kind": currentManuscript.assetKind,
      },
    });
  } catch (error) {
    console.error("[final-manuscript] unexpected error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
