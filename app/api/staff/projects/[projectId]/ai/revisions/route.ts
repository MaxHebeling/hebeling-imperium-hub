import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminClient } from "@/lib/leads/helpers";
import { listSuggestionsForFile } from "@/lib/editorial/ai/suggestions";
import { createRevisionFromSuggestions } from "@/lib/editorial/ai/revisions";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";

interface ApplyRevisionBody {
  sourceFileId: string;
  sourceFileVersion: number;
  suggestionIds: string[];
  resultFileType: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const staff = await requireStaff();
    const { projectId } = await params;
    const supabase = getAdminClient();

    const body = (await req.json()) as ApplyRevisionBody;
    const { sourceFileId, sourceFileVersion, suggestionIds, resultFileType } = body;

    if (!sourceFileId || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "sourceFileId y suggestionIds son requeridos" },
        { status: 400 }
      );
    }

    const { data: sourceFile, error: fileError } = await supabase
      .from("editorial_files")
      .select("*")
      .eq("id", sourceFileId)
      .maybeSingle();

    if (fileError || !sourceFile) {
      return NextResponse.json(
        { success: false, error: "Archivo de origen no encontrado" },
        { status: 404 }
      );
    }

    const bucket = EDITORIAL_BUCKETS.manuscripts;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(sourceFile.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { success: false, error: "No se pudo descargar el manuscrito original" },
        { status: 500 }
      );
    }

    const originalText = await fileData.text();

    const suggestions = await listSuggestionsForFile({
      projectId,
      fileId: sourceFileId,
      onlyPending: true,
    });

    const toApply = suggestions.filter((s) => suggestionIds.includes(s.id));
    if (toApply.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontraron sugerencias pendientes para aplicar" },
        { status: 400 }
      );
    }

    // Para v1, asumimos formato de texto plano y aplicamos reemplazos simples.
    // Aplicamos de atrás hacia adelante si hay offsets.
    let updatedText = originalText;

    const withOffsets = toApply.filter(
      (s) =>
        typeof s.location.offset_start === "number" &&
        typeof s.location.offset_end === "number"
    );

    withOffsets
      .sort(
        (a, b) =>
          (b.location.offset_start ?? 0) - (a.location.offset_start ?? 0)
      )
      .forEach((s) => {
        const start = s.location.offset_start as number;
        const end = s.location.offset_end as number;
        updatedText =
          updatedText.slice(0, start) +
          s.suggested_text +
          updatedText.slice(end);
      });

    // Subir nueva versión editada
    const ext = (sourceFile.storage_path.split(".").pop() ?? "txt").toLowerCase();
    const newPath = `${sourceFile.project_id}/ai-revisions/${Date.now()}-${sourceFile.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(newPath, updatedText, {
        contentType: sourceFile.mime_type ?? "text/plain",
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: "No se pudo subir la versión editada" },
        { status: 500 }
      );
    }

    const { data: resultFile, error: insertError } = await supabase
      .from("editorial_files")
      .insert({
        project_id: projectId,
        stage_key: sourceFile.stage_key,
        file_type: resultFileType,
        version: (sourceFile.version as number) + 1,
        storage_path: newPath,
        mime_type: sourceFile.mime_type,
        size_bytes: updatedText.length,
        uploaded_by: staff.userId,
        visibility: sourceFile.visibility,
      })
      .select("*")
      .single();

    if (insertError || !resultFile) {
      return NextResponse.json(
        { success: false, error: "No se pudo registrar el archivo editado" },
        { status: 500 }
      );
    }

    const revisionId = await createRevisionFromSuggestions({
      projectId,
      sourceFileId,
      sourceFileVersion,
      resultFileId: resultFile.id as string,
      resultFileVersion: resultFile.version as number,
      appliedSuggestionIds: toApply.map((s) => s.id),
      appliedBy: staff.userId,
    });

    // Marcar sugerencias como aplicadas
    const { error: updateSugError } = await supabase
      .from("editorial_ai_suggestions")
      .update({
        applied: true,
        applied_at: new Date().toISOString(),
        validated_by: staff.userId,
      })
      .in("id", toApply.map((s) => s.id));

    if (updateSugError) {
      console.error("[editorial-ai][revisions] failed to mark suggestions as applied", {
        projectId,
        sourceFileId,
        revisionId,
        code: updateSugError.code,
        message: updateSugError.message,
        details: updateSugError.details,
        hint: updateSugError.hint,
      });
    }

    return NextResponse.json({
      success: true,
      revisionId,
      resultFileId: resultFile.id,
      resultFileVersion: resultFile.version,
    });
  } catch (error) {
    console.error("[editorial-ai][revisions] POST error", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

