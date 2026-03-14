import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { generateBookPdf } from "@/lib/editorial/export/generate-pdf";
import { persistPublishingChecklist, assemblePublishingPackage } from "@/lib/editorial/publishing/publishing-integration";
import type { ExportConfig } from "@/lib/editorial/export/types";
import type { PublishingConfig, BookMetadata } from "@/lib/editorial/publishing/publishing-director";

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

    // ── Persist publishing checklist to DB ────────────────────────────
    // After successful PDF generation, persist the 26-item publishing
    // checklist so staff can review it in the UI.
    let checklistResult: { checklistId: string; persisted: number } | null = null;
    let packageResult: { status: string; fileCount: number } | null = null;

    try {
      const { data: projectMeta } = await admin
        .from("editorial_projects")
        .select("title, author_name, genre, language, page_estimate")
        .eq("id", projectId)
        .single();

      const publishingConfig: PublishingConfig = {
        trimSizeId: "6x9",
        paperType: "cream",
        binding: "paperback",
        bleed: "no_bleed",
        pageCount: pageCount ?? 0,
        platform: "amazon_kdp",
      };

      const bookMetadata: Partial<BookMetadata> = {
        title: projectMeta?.title ?? "",
        authors: projectMeta?.author_name ? [projectMeta.author_name] : [],
        language: projectMeta?.language ?? "es",
      };

      const checklist = await persistPublishingChecklist({
        projectId,
        config: publishingConfig,
        metadata: bookMetadata,
      });
      checklistResult = { checklistId: checklist.checklistId, persisted: checklist.persisted };
      console.log(`[generate-pdf] Publishing checklist persisted: ${checklist.persisted} items for project ${projectId}`);

      // ── Assemble publishing package ──────────────────────────────────
      const fullMetadata: BookMetadata = {
        title: projectMeta?.title ?? "",
        authors: projectMeta?.author_name ? [projectMeta.author_name] : [],
        publisher: "Reino Editorial",
        language: projectMeta?.language ?? "es",
        primaryCategory: projectMeta?.genre ?? "general",
        secondaryCategories: [],
        keywords: [],
        description: "",
        copyrightYear: new Date().getFullYear(),
        copyrightHolder: projectMeta?.author_name ?? "",
        countryOfPublication: "ES",
        pageCount: pageCount ?? 0,
        trimSize: "6x9",
        paperType: "cream",
        binding: "paperback",
      };

      const publishingPackage = await assemblePublishingPackage({
        projectId,
        config: publishingConfig,
        metadata: fullMetadata,
      });
      packageResult = {
        status: publishingPackage.status,
        fileCount: publishingPackage.files.length,
      };
      console.log(`[generate-pdf] Publishing package assembled: status=${publishingPackage.status}, files=${publishingPackage.files.length}`);
    } catch (pubErr) {
      // Don't fail the PDF generation if publishing extras fail
      console.warn("[generate-pdf] Publishing checklist/package error (non-blocking):", (pubErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      exportId: exportRecord?.id ?? null,
      storagePath,
      pageCount,
      fileSizeBytes: buffer.length,
      downloadUrl: signedUrl?.signedUrl ?? null,
      publishingChecklist: checklistResult,
      publishingPackage: packageResult,
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
