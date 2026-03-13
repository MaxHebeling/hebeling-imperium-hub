import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { generateBookPdf } from "@/lib/editorial/export/generate-pdf";
import type { ExportConfig } from "@/lib/editorial/export/types";

/**
 * POST /api/staff/projects/[projectId]/export/generate-pdf
 * Generate a professionally formatted PDF from the manuscript.
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
    const body = await request.json().catch(() => ({}));
    const config: Partial<ExportConfig> = body.config ?? {};

    // Generate PDF
    const { buffer, pageCount } = await generateBookPdf({
      projectId,
      config,
    });

    // Upload to Supabase Storage
    const admin = getAdminClient();
    const storagePath = `${projectId}/export/libro_v${Date.now()}.pdf`;

    const { error: uploadError } = await admin.storage
      .from(EDITORIAL_BUCKETS.exports)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-pdf] upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Error al subir el PDF generado" },
        { status: 500 }
      );
    }

    // Create export record
    const { data: exportRecord, error: dbError } = await admin
      .from("editorial_exports")
      .insert({
        project_id: projectId,
        export_type: "pdf",
        version: 1,
        status: "completed",
        storage_path: storagePath,
        file_size_bytes: buffer.length,
      })
      .select()
      .single();

    if (dbError) {
      console.warn("[generate-pdf] db record error:", dbError.message);
    }

    // Get signed download URL
    const { data: signedUrl } = await admin.storage
      .from(EDITORIAL_BUCKETS.exports)
      .createSignedUrl(storagePath, 60 * 60); // 1 hour

    return NextResponse.json({
      success: true,
      exportId: exportRecord?.id ?? null,
      storagePath,
      pageCount,
      fileSizeBytes: buffer.length,
      downloadUrl: signedUrl?.signedUrl ?? null,
    });
  } catch (error) {
    console.error("[generate-pdf] error:", error);
    const message =
      error instanceof Error ? error.message : "Error interno al generar PDF";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
