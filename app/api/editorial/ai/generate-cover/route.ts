import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { generateBookCover } from "@/lib/editorial/ai/cover-generation";
import type { CoverGenerationRequest } from "@/lib/editorial/ai/cover-generation";

/**
 * POST /api/editorial/ai/generate-cover
 *
 * Standalone cover generation endpoint (no project required).
 * Used when staff enters book data manually.
 *
 * Body JSON:
 * - mode: "editorial" | "author" (required)
 * - title: string (required)
 * - authorName: string (required)
 * - genre: string (optional)
 * - synopsis: string (optional)
 * - targetAudience: string (optional)
 * - imageStyle: string (optional)
 * - visualTone: string (optional)
 * - authorPrompt: string (required for mode = "author")
 * - colorPalette: string (optional)
 * - references: string (optional)
 * - keywords: string[] (optional)
 */
export async function POST(request: NextRequest) {
  try {
    await requireStaff();

    const body = await request.json();
    const mode = body?.mode === "author" ? "author" : "editorial";
    const title = String(body?.title ?? "").trim();
    const authorName = String(body?.authorName ?? "").trim();

    if (!title) {
      return NextResponse.json(
        { success: false, error: "El título del libro es obligatorio" },
        { status: 400 }
      );
    }
    if (!authorName) {
      return NextResponse.json(
        { success: false, error: "El nombre del autor es obligatorio" },
        { status: 400 }
      );
    }
    if (mode === "author" && !body?.authorPrompt?.trim()) {
      return NextResponse.json(
        { success: false, error: "Se requiere la visión del autor (authorPrompt)" },
        { status: 400 }
      );
    }

    const coverRequest: CoverGenerationRequest = {
      mode,
      title,
      authorName,
      genre: body?.genre,
      synopsis: body?.synopsis,
      targetAudience: body?.targetAudience,
      visualTone: body?.visualTone,
      authorPrompt: body?.authorPrompt,
      references: body?.references,
      keywords: body?.keywords,
      colorPalette: body?.colorPalette,
      imageStyle: body?.imageStyle,
    };

    const result = await generateBookCover(coverRequest);

    return NextResponse.json({
      success: true,
      cover: result,
    });
  } catch (error) {
    console.error("[ai/generate-cover] error:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
