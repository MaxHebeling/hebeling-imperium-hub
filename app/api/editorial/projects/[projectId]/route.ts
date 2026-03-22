import { NextRequest, NextResponse } from "next/server";
import { getEditorialProject } from "@/lib/editorial/db/queries";
import {
  buildAmazonKdpConfigurationSnapshot,
  buildEditorialPolicySnapshot,
  buildMergedEditorialProjectPipelineContext,
  buildTypographyConfigurationSnapshot,
  extractEditorialInterventionLevelFromPipelineContext,
  extractSpecialKdpFormatEnabledFromPipelineContext,
  extractTypographyPresetIdFromPipelineContext,
  normalizeEditorialInterventionLevel,
} from "@/lib/editorial/pipeline/editorial-policy";
import {
  buildEditorialBookSpecsSeed,
  getReinoEditorialDefaultFontSize,
  getReinoEditorialDefaultLineSpacing,
  getReinoEditorialLayoutPresetId,
  getReinoEditorialTypographyPreset,
  isReinoEditorialTypographyPresetId,
  isReinoEditorialCollectionTrimSizeId,
  isSupportedKdpTrimSizeId,
  KDP_PAPER_SPECS,
  REINO_EDITORIAL_FONT_SIZE_OPTIONS,
  REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID,
} from "@/lib/editorial/kdp";
import {
  estimatePageCount,
  getBookSpecifications,
  upsertBookSpecifications,
} from "@/lib/editorial/workflow/professional";
import { getAdminClient } from "@/lib/leads/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getEditorialProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("[editorial/project] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    console.info("[editorial/project] DELETE requested", { projectId });

    // Ensure it exists (nicer error than silent success)
    const project = await getEditorialProject(projectId);
    if (!project) {
      console.info("[editorial/project] DELETE not found", { projectId });
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const supabase = getAdminClient();
    const { data: deleted, error } = await supabase
      .from("editorial_projects")
      .delete()
      .eq("id", projectId)
      .select("id");

    if (error) {
      console.error("[editorial/project] DELETE supabase error", { projectId, error });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deletedCount = Array.isArray(deleted) ? deleted.length : 0;
    console.info("[editorial/project] DELETE result", { projectId, deletedCount });

    if (deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Delete returned 0 rows." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("[editorial/project] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const project = await getEditorialProject(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      editorialInterventionLevel?: unknown;
      trimSizeId?: unknown;
      specialKdpFormatEnabled?: unknown;
      bodyFontPresetId?: unknown;
      bodyFontSize?: unknown;
    };
    const editorialInterventionLevel =
      body.editorialInterventionLevel === undefined
        ? extractEditorialInterventionLevelFromPipelineContext(
            (project as { pipeline_context?: unknown }).pipeline_context
          )
        : normalizeEditorialInterventionLevel(body.editorialInterventionLevel);
    const currentSpecialKdpFormatEnabled =
      extractSpecialKdpFormatEnabledFromPipelineContext(
        (project as { pipeline_context?: unknown }).pipeline_context
      );
    const nextSpecialKdpFormatEnabled =
      typeof body.specialKdpFormatEnabled === "boolean"
        ? body.specialKdpFormatEnabled
        : currentSpecialKdpFormatEnabled;
    const requestedTrimSizeId =
      typeof body.trimSizeId === "string" ? body.trimSizeId.trim() : "";
    const nextTrimSizeId =
      requestedTrimSizeId ||
      project.book_size ||
      REINO_EDITORIAL_DEFAULT_TRIM_SIZE_ID;
    const currentBodyFontPresetId = extractTypographyPresetIdFromPipelineContext(
      (project as { pipeline_context?: unknown }).pipeline_context
    );
    const requestedBodyFontPresetId =
      typeof body.bodyFontPresetId === "string"
        ? body.bodyFontPresetId.trim()
        : "";
    const nextBodyFontPresetId =
      requestedBodyFontPresetId || currentBodyFontPresetId;
    const parsedBodyFontSize =
      typeof body.bodyFontSize === "number"
        ? body.bodyFontSize
        : typeof body.bodyFontSize === "string"
          ? Number(body.bodyFontSize)
          : Number.NaN;

    if (!isSupportedKdpTrimSizeId(nextTrimSizeId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El trim size solicitado no existe dentro del catálogo oficial de Amazon KDP.",
        },
        { status: 400 }
      );
    }

    if (
      !nextSpecialKdpFormatEnabled &&
      !isReinoEditorialCollectionTrimSizeId(nextTrimSizeId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ese formato requiere activar primero el modo de formato especial KDP para este proyecto.",
        },
        { status: 400 }
      );
    }

    if (!isReinoEditorialTypographyPresetId(nextBodyFontPresetId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La tipografia solicitada no existe dentro del catalogo editorial permitido.",
        },
        { status: 400 }
      );
    }

    const currentBookSpecs = await getBookSpecifications(projectId);
    const nextBodyFontSize = Number.isFinite(parsedBodyFontSize)
      ? parsedBodyFontSize
      : currentBookSpecs?.font_size ??
        getReinoEditorialDefaultFontSize(nextTrimSizeId);

    if (
      !REINO_EDITORIAL_FONT_SIZE_OPTIONS.some(
        (option) => option === nextBodyFontSize
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El tamano de cuerpo solicitado no esta dentro del catalogo editorial permitido.",
        },
        { status: 400 }
      );
    }

    const nextLineSpacing =
      currentBookSpecs?.line_spacing ??
      getReinoEditorialDefaultLineSpacing();
    const estimatedPages =
      typeof project.word_count === "number" && project.word_count > 0
        ? estimatePageCount(
            project.word_count,
            nextBodyFontSize,
            nextLineSpacing,
            nextTrimSizeId
          )
        : currentBookSpecs?.estimated_pages ?? null;
    const nextPaperType =
      currentBookSpecs?.paper_type === "white" ||
      currentBookSpecs?.paper_type === "color_standard" ||
      currentBookSpecs?.paper_type === "color_premium"
        ? currentBookSpecs.paper_type
        : "cream";
    const nextSpineWidthIn =
      typeof estimatedPages === "number" && estimatedPages > 0
        ? +(
            estimatedPages /
            (KDP_PAPER_SPECS.find((paper) => paper.type === nextPaperType)?.ppi ??
              434)
          ).toFixed(4)
        : currentBookSpecs?.spine_width_in ?? null;
    const nextBookSpecsSeed = buildEditorialBookSpecsSeed(nextTrimSizeId, {
      pageCount: estimatedPages ?? currentBookSpecs?.estimated_pages ?? 24,
      printType:
        currentBookSpecs?.print_type === "standard_color" ||
        currentBookSpecs?.print_type === "premium_color"
          ? currentBookSpecs.print_type
          : "black_and_white",
      paperType:
        nextPaperType,
      binding: currentBookSpecs?.binding === "hardcover" ? "hardcover" : "paperback",
      bleed: currentBookSpecs?.bleed === "bleed" ? "bleed" : "no_bleed",
      fontSize: nextBodyFontSize,
      lineSpacing: nextLineSpacing,
    });
    const pipelineContext = await buildMergedEditorialProjectPipelineContext(
      projectId,
      {
        editorial_policy: buildEditorialPolicySnapshot(editorialInterventionLevel),
        amazon_kdp_configuration: buildAmazonKdpConfigurationSnapshot({
          specialFormatEnabled: nextSpecialKdpFormatEnabled,
          trimSizeId: nextTrimSizeId,
        }),
        typography_configuration: buildTypographyConfigurationSnapshot({
          bodyFontPresetId: nextBodyFontPresetId,
        }),
      }
    );

    const supabase = getAdminClient();
    const { error } = await supabase
      .from("editorial_projects")
      .update({
        book_size: nextTrimSizeId,
        page_estimate: estimatedPages ?? project.page_estimate ?? null,
        pipeline_context: pipelineContext,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await upsertBookSpecifications(
      projectId,
      {
        ...nextBookSpecsSeed,
        trim_size_id: nextTrimSizeId,
        paper_type: nextPaperType,
        word_count: project.word_count ?? currentBookSpecs?.word_count ?? null,
        estimated_pages: estimatedPages,
        spine_width_in: nextSpineWidthIn,
        layout_template: getReinoEditorialLayoutPresetId(nextTrimSizeId),
      }
    );

    const nextTypographyPreset = getReinoEditorialTypographyPreset(
      nextBodyFontPresetId
    );

    return NextResponse.json({
      success: true,
      editorialInterventionLevel,
      trimSizeId: nextTrimSizeId,
      specialKdpFormatEnabled: nextSpecialKdpFormatEnabled,
      bodyFontPresetId: nextBodyFontPresetId,
      bodyFontPresetLabel: nextTypographyPreset.label,
      bodyFontSize: nextBodyFontSize,
      bodyLineSpacing: nextLineSpacing,
      estimatedPages,
    });
  } catch (error) {
    console.error("[editorial/project] PATCH error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
