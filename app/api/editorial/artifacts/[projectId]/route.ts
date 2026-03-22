import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createArtifact,
  getArtifacts,
  toggleArtifactVisibility,
} from "@/lib/editorial/timeline";
import type { EditorialPipelineStageKey } from "@/lib/editorial/types/editorial";

/**
 * GET /api/editorial/artifacts/[projectId]
 * Returns artifacts for a project.
 * Staff sees all, clients see only visible ones.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const staffRoles = ["superadmin", "admin", "sales", "ops"];
    const isStaff = profile && staffRoles.includes(profile.role);
    const clientOnly = !isStaff;

    const artifacts = await getArtifacts(projectId, clientOnly);
    return NextResponse.json({ success: true, artifacts });
  } catch (err) {
    console.error("[artifacts] GET error:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/editorial/artifacts/[projectId]
 * Staff action: create/attach an artifact to a stage.
 * Body: { stageKey, artifactType, title, description?, storagePath?, thumbnailPath?, isVisibleToClient? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const staffRoles = ["superadmin", "admin", "sales", "ops"];
    if (!profile || !staffRoles.includes(profile.role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { stageKey, artifactType, title, description, storagePath, thumbnailPath, isVisibleToClient } = body;

    if (!stageKey || !artifactType || !title) {
      return NextResponse.json(
        { success: false, error: "stageKey, artifactType y title son requeridos" },
        { status: 400 }
      );
    }

    const artifact = await createArtifact({
      projectId,
      stageKey: stageKey as EditorialPipelineStageKey,
      artifactType,
      title,
      description: description ?? null,
      storagePath: storagePath ?? null,
      thumbnailPath: thumbnailPath ?? null,
      isVisibleToClient: isVisibleToClient ?? false,
      createdBy: user.id,
    });

    if (!artifact) {
      return NextResponse.json({ success: false, error: "Error creando artefacto" }, { status: 500 });
    }

    return NextResponse.json({ success: true, artifact });
  } catch (err) {
    console.error("[artifacts] POST error:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

/**
 * PATCH /api/editorial/artifacts/[projectId]
 * Staff action: toggle artifact visibility.
 * Body: { artifactId, visible }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await params; // consume params
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const staffRoles = ["superadmin", "admin", "sales", "ops"];
    if (!profile || !staffRoles.includes(profile.role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { artifactId, visible } = body;

    if (!artifactId || typeof visible !== "boolean") {
      return NextResponse.json(
        { success: false, error: "artifactId y visible son requeridos" },
        { status: 400 }
      );
    }

    const ok = await toggleArtifactVisibility(artifactId, visible);
    return NextResponse.json({ success: ok });
  } catch (err) {
    console.error("[artifacts] PATCH error:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
