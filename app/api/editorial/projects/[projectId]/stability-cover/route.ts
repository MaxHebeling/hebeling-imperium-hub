/**
 * Stability AI Cover Generation API
 *
 * POST /api/editorial/projects/[projectId]/stability-cover
 * Body: { mode, genre, synopsis, targetAudience, visualTone, authorPrompt, ... }
 *
 * Generates professional book covers using Stability AI (SD3/SDXL).
 * Falls back to DALL-E 3 if Stability AI is not configured.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import {
  generateBookCoverStability,
  uploadStabilityCoverToStorage,
  isStabilityAiAvailable,
} from "@/lib/editorial/ai/stability-ai";

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

    // Check if Stability AI is available
    if (!isStabilityAiAvailable()) {
      return NextResponse.json(
        {
          error:
            "Stability AI no está configurado. Agrega STABILITY_API_KEY en las variables de entorno.",
          fallback: "dalle3",
          message:
            "Se usará DALL-E 3 como motor de generación de portadas alternativo.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Get project info for the cover
    const adminClient = getAdminClient();
    const { data: project } = await adminClient
      .from("editorial_projects")
      .select("title, author_name, genre, language")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Generate cover with Stability AI
    const result = await generateBookCoverStability({
      mode: body.mode || "editorial",
      title: project.title || "Sin título",
      authorName: project.author_name || "Autor",
      genre: body.genre || project.genre,
      synopsis: body.synopsis,
      targetAudience: body.targetAudience,
      visualTone: body.visualTone,
      authorPrompt: body.authorPrompt,
      references: body.references,
      keywords: body.keywords,
      colorPalette: body.colorPalette,
      imageStyle: body.imageStyle,
      negativePrompt: body.negativePrompt,
      model: body.model || "sd3",
    });

    // Upload to Supabase Storage
    const storagePath = await uploadStabilityCoverToStorage(
      result,
      projectId,
      adminClient
    );

    // Get public URL
    const { data: publicUrl } = adminClient.storage
      .from("editorial-covers")
      .getPublicUrl(storagePath);

    // Log activity
    await adminClient.from("editorial_activity_log").insert({
      project_id: projectId,
      event_type: "stability_cover_generated",
      actor_id: user.id,
      payload: {
        mode: body.mode || "editorial",
        model: result.model,
        storagePath,
        seed: result.seed,
      },
    });

    return NextResponse.json({
      success: true,
      provider: "stability-ai",
      model: result.model,
      imageUrl: publicUrl.publicUrl,
      storagePath,
      prompt: result.prompt,
      seed: result.seed,
      generatedAt: result.generatedAt,
    });
  } catch (error) {
    console.error("[stability-cover-route] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editorial/projects/[projectId]/stability-cover
 * Returns the availability status of Stability AI.
 */
export async function GET() {
  return NextResponse.json({
    available: isStabilityAiAvailable(),
    provider: "stability-ai",
    description: "Generación de portadas premium con Stability AI",
    models: [
      { id: "sd3", name: "Stable Diffusion 3", quality: "Máxima", speed: "Normal" },
      { id: "sdxl", name: "SDXL 1.0", quality: "Alta", speed: "Rápido" },
    ],
    features: [
      "Generación de portadas profesionales",
      "Múltiples estilos visuales",
      "Prompt negativo para control fino",
      "Alta resolución para impresión",
      "Formato vertical de libro (2:3)",
    ],
  });
}
