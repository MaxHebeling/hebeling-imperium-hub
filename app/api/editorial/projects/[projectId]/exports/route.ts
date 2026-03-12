import { NextRequest, NextResponse } from "next/server";
import { createExportJob, getProjectExports } from "@/lib/editorial/export/services";
import { logEditorialActivity } from "@/lib/editorial/db/mutations";
import type { ExportFormat, ExportQuality, ExportConfig } from "@/lib/editorial/export/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const exports = await getProjectExports(projectId);

    return NextResponse.json({ exports });
  } catch (error) {
    console.error("Failed to get exports:", error);
    return NextResponse.json(
      { error: "Failed to get exports" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const {
      format,
      quality = "digital",
      config,
    } = body as {
      format: ExportFormat;
      quality?: ExportQuality;
      config?: Partial<ExportConfig>;
    };

    if (!format) {
      return NextResponse.json(
        { error: "Export format is required" },
        { status: 400 }
      );
    }

    const validFormats: ExportFormat[] = ["pdf", "epub", "mobi", "docx", "html"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: "Invalid export format" },
        { status: 400 }
      );
    }

    const exportJob = await createExportJob({
      projectId,
      format,
      quality,
      config,
    });

    await logEditorialActivity(projectId, "export_requested", {
      stageKey: "export",
      payload: {
        export_id: exportJob.id,
        format,
        quality,
        version: exportJob.version,
      },
    });

    return NextResponse.json({ export: exportJob }, { status: 201 });
  } catch (error) {
    console.error("Failed to create export:", error);
    return NextResponse.json(
      { error: "Failed to create export" },
      { status: 500 }
    );
  }
}
