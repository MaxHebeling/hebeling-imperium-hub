import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { getClientEditorialProject } from "@/lib/editorial/db/queries";

/**
 * POST /api/editorial/client/projects/[projectId]/comments
 * Allows clients to leave comments on their project (bidirectional communication).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // Verify ownership
    const project = await getClientEditorialProject(projectId, user.id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const comment = (body.comment ?? "").trim();

    if (!comment || comment.length === 0) {
      return NextResponse.json(
        { success: false, error: "El comentario no puede estar vacío" },
        { status: 400 }
      );
    }

    if (comment.length > 2000) {
      return NextResponse.json(
        { success: false, error: "El comentario es demasiado largo (máx. 2000 caracteres)" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("editorial_comments")
      .insert({
        project_id: projectId,
        stage_key: body.stageKey ?? null,
        author_type: "client",
        author_id: user.id,
        comment,
        visibility: "client",
      })
      .select()
      .single();

    if (error) {
      console.error("[client/comments] insert error:", error);
      return NextResponse.json(
        { success: false, error: "Error al guardar el comentario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comment: data });
  } catch (error) {
    console.error("[client/comments] error:", error);
    const message =
      error instanceof Error ? error.message : "Error interno";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
