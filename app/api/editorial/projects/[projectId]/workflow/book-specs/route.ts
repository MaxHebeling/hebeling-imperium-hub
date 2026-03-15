import { NextRequest, NextResponse } from "next/server";
import {
  getBookSpecifications,
  upsertBookSpecifications,
  estimatePageCount,
} from "@/lib/editorial/workflow/professional";

/**
 * GET /api/editorial/projects/[projectId]/workflow/book-specs
 * Returns the book specifications for a project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const specs = await getBookSpecifications(projectId);
    return NextResponse.json({ success: true, data: specs });
  } catch (error) {
    console.error("[book-specs/GET] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/editorial/projects/[projectId]/workflow/book-specs
 * Create or update book specifications (KDP configuration).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    // Auto-calculate estimated pages if word_count is provided
    if (body.word_count && !body.estimated_pages) {
      body.estimated_pages = estimatePageCount(
        body.word_count,
        body.font_size ?? 11,
        body.line_spacing ?? 1.15,
        body.trim_size_id ?? "6x9"
      );
    }

    // Auto-calculate spine width if estimated_pages is available
    if (body.estimated_pages && !body.spine_width_in) {
      const ppi = body.paper_type === "cream" ? 0.0025 : 0.002252;
      body.spine_width_in = +(body.estimated_pages * ppi).toFixed(4);
    }

    const specs = await upsertBookSpecifications(
      projectId,
      body,
      body.configured_by
    );

    return NextResponse.json({ success: true, data: specs });
  } catch (error) {
    console.error("[book-specs/POST] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
