import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import { requireEditorialCapability } from "@/lib/editorial/permissions";
import { generateBookCover } from "@/lib/editorial/ai/cover-generation";
import type { CoverGenerationRequest } from "@/lib/editorial/ai/cover-generation";
import { logEditorialActivity } from "@/lib/editorial/db/mutations";

/**
 * POST /api/staff/projects/[projectId]/generate-cover
 *
 * Generate a book cover using DALL-E 3.
 *
 * Body JSON:
 * - mode: "editorial" | "author" (required)
 * - visualTone: string (optional)
 * - imageStyle: "realistic" | "illustrated" | "abstract" | "typographic" | "photographic" (optional)
 * - authorPrompt: string (required for mode = "author")
 * - colorPalette: string (optional)
 * - references: string (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;

    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const decision = await requireEditorialCapability({
      projectId,
      orgId: project.org_id,
      userId: staff.userId,
      capability: "ai:run",
    });
    if (!decision.allowed) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para generar portada" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const mode = body?.mode === "author" ? "author" : "editorial";

    if (mode === "author" && !body?.authorPrompt?.trim()) {
      return NextResponse.json(
        { success: false, error: "Se requiere una descripción de la visión del autor (authorPrompt)" },
        { status: 400 }
      );
    }

    const coverRequest: CoverGenerationRequest = {
      mode,
      title: project.title || "Sin título",
      authorName: project.author_name || "Autor",
      genre: project.genre || body?.genre,
      synopsis: body?.synopsis,
      targetAudience: project.target_audience || body?.targetAudience,
      visualTone: body?.visualTone,
      authorPrompt: body?.authorPrompt,
      references: body?.references,
      keywords: body?.keywords,
      colorPalette: body?.colorPalette,
      imageStyle: body?.imageStyle,
    };

    const result = await generateBookCover(coverRequest);

    // Log activity
    await logEditorialActivity(projectId, "cover_generated", {
      actorId: staff.userId,
      actorType: "staff",
      payload: {
        mode,
        imageStyle: body?.imageStyle,
        visualTone: body?.visualTone,
      },
    });

    return NextResponse.json({
      success: true,
      cover: result,
    });
  } catch (error) {
    console.error("[generate-cover] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
