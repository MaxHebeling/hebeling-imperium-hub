/**
 * Publishing Integration — Bridges Publishing Director with DB Checklist System
 *
 * Priority 4: Persists the in-memory publishing checklist into the
 *   editorial_project_stage_checklists / editorial_project_stage_checklist_items tables.
 *
 * Priority 5: Assembles the final publishing package from generated assets
 *   (interior PDF, cover, metadata, reports) using existing publishing modules.
 */

import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialProjectStageChecklist } from "@/lib/editorial/types/editorial";
import {
  generatePublishingChecklist,
  generatePackageFileList,
  type PublishingConfig,
  type BookMetadata,
  type PublishingChecklistItem,
  type PublishingPackage,
  type PublishingPackageFile,
} from "./publishing-director";

// ─── Priority 4: Persist Publishing Checklist to DB ─────────────────

/**
 * Generate the publishing checklist and persist it into the DB-backed
 * checklist system so staff can review it in the UI.
 *
 * Maps PublishingChecklistItem[] → editorial_project_stage_checklists
 *   + editorial_project_stage_checklist_items rows.
 *
 * Uses the "export" stage key since publishing checklist applies at export time.
 */
export async function persistPublishingChecklist(options: {
  projectId: string;
  config: PublishingConfig;
  metadata: Partial<BookMetadata>;
}): Promise<{
  checklistId: string;
  items: PublishingChecklistItem[];
  persisted: number;
}> {
  const supabase = getAdminClient();
  const stageKey = "export";

  // Generate the in-memory checklist
  const items = generatePublishingChecklist(options.config, options.metadata);

  // Check if a checklist already exists for this project + stage
  const { data: existing } = await supabase
    .from("editorial_project_stage_checklists")
    .select("id")
    .eq("project_id", options.projectId)
    .eq("stage_key", stageKey)
    .maybeSingle();

  let checklistId: string;

  if (existing) {
    // Update existing checklist — delete old items and re-insert
    checklistId = existing.id;

    await supabase
      .from("editorial_project_stage_checklist_items")
      .delete()
      .eq("checklist_id", checklistId);

    // Reset progress
    await supabase
      .from("editorial_project_stage_checklists")
      .update({
        status: "open",
        progress_percent: 0,
        updated_at: new Date().toISOString(),
        completed_at: null,
      })
      .eq("id", checklistId);
  } else {
    // Create new checklist row (no template_id since these are dynamically generated)
    const { data: newChecklist, error } = await supabase
      .from("editorial_project_stage_checklists")
      .insert({
        project_id: options.projectId,
        stage_key: stageKey,
        template_id: null,
        status: "open",
        progress_percent: 0,
      })
      .select("id")
      .single();

    if (error || !newChecklist) {
      throw new Error(`Error al crear checklist de publicacion: ${error?.message}`);
    }
    checklistId = newChecklist.id;
  }

  // Map publishing checklist items to DB rows
  const dbItems = items.map((item, index) => ({
    checklist_id: checklistId,
    template_item_id: null,
    item_key: item.id,
    label: item.label,
    sort_order: index,
    is_required: item.required,
    requires_file: false,
    required_file_types: null as string[] | null,
    is_completed: item.completed,
    completed_at: item.completedAt ?? null,
    completed_by: null as string | null,
  }));

  const { error: insertError } = await supabase
    .from("editorial_project_stage_checklist_items")
    .insert(dbItems);

  if (insertError) {
    throw new Error(`Error al insertar items del checklist: ${insertError.message}`);
  }

  // Compute initial progress
  const requiredItems = items.filter((i) => i.required);
  const completedRequired = requiredItems.filter((i) => i.completed);
  const progressPercent =
    requiredItems.length === 0
      ? 100
      : Math.round((completedRequired.length / requiredItems.length) * 100);

  await supabase
    .from("editorial_project_stage_checklists")
    .update({
      progress_percent: progressPercent,
      status: progressPercent === 100 ? "completed" : "open",
      updated_at: new Date().toISOString(),
    })
    .eq("id", checklistId);

  return {
    checklistId,
    items,
    persisted: dbItems.length,
  };
}

/**
 * Retrieve the persisted publishing checklist for a project from the DB.
 */
export async function getPersistedPublishingChecklist(
  projectId: string
): Promise<{
  checklist: EditorialProjectStageChecklist | null;
  items: Array<{
    id: string;
    item_key: string;
    label: string;
    is_required: boolean;
    is_completed: boolean;
    completed_at: string | null;
    sort_order: number;
  }>;
}> {
  const supabase = getAdminClient();

  const { data: checklist } = await supabase
    .from("editorial_project_stage_checklists")
    .select("*")
    .eq("project_id", projectId)
    .eq("stage_key", "export")
    .maybeSingle();

  if (!checklist) {
    return { checklist: null, items: [] };
  }

  const { data: items } = await supabase
    .from("editorial_project_stage_checklist_items")
    .select("id, item_key, label, is_required, is_completed, completed_at, sort_order")
    .eq("checklist_id", checklist.id)
    .order("sort_order", { ascending: true });

  return {
    checklist: checklist as EditorialProjectStageChecklist,
    items: items ?? [],
  };
}

// ─── Priority 5: Publishing Package Assembly ────────────────────────

/**
 * Assemble the final publishing package from generated assets.
 *
 * Gathers existing artifacts (interior PDF, cover, metadata, reports)
 * from the editorial pipeline and creates a PublishingPackage record.
 *
 * Reuses existing modules:
 * - generatePackageFileList() from publishing-director
 * - Storage paths from editorial_files and editorial_exports tables
 */
export async function assemblePublishingPackage(options: {
  projectId: string;
  config: PublishingConfig;
  metadata: BookMetadata;
}): Promise<PublishingPackage> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  // Generate the expected file manifest
  const expectedFiles = generatePackageFileList(options.projectId, options.config);

  // Look up actual generated files from the editorial pipeline
  const { data: editorialFiles } = await supabase
    .from("editorial_files")
    .select("id, file_type, storage_path, mime_type, size_bytes, created_at")
    .eq("project_id", options.projectId);

  const { data: editorialExports } = await supabase
    .from("editorial_exports")
    .select("id, export_type, storage_path, status, created_at")
    .eq("project_id", options.projectId)
    .eq("status", "completed");

  // Match expected files with actual artifacts
  const resolvedFiles: PublishingPackageFile[] = expectedFiles.map((expected) => {
    const resolved = { ...expected };

    switch (expected.fileType) {
      case "interior_pdf": {
        // Look for PDF export
        const pdfExport = (editorialExports ?? []).find(
          (e) => e.export_type === "pdf"
        );
        if (pdfExport) {
          resolved.storagePath = pdfExport.storage_path;
          resolved.generatedAt = pdfExport.created_at;
          resolved.status = "ready";
        }
        break;
      }
      case "manuscript_source": {
        // Look for uploaded manuscript
        const manuscript = (editorialFiles ?? []).find(
          (f) => f.file_type === "manuscript"
        );
        if (manuscript) {
          resolved.storagePath = manuscript.storage_path;
          resolved.sizeBytes = manuscript.size_bytes;
          resolved.generatedAt = manuscript.created_at;
          resolved.status = "ready";
        }
        break;
      }
      case "front_cover_image": {
        // Look for cover image
        const cover = (editorialFiles ?? []).find(
          (f) => f.file_type === "cover" || f.file_type === "cover_front"
        );
        if (cover) {
          resolved.storagePath = cover.storage_path;
          resolved.sizeBytes = cover.size_bytes;
          resolved.generatedAt = cover.created_at;
          resolved.status = "ready";
        }
        break;
      }
      case "cover_pdf": {
        // Look for cover PDF
        const coverPdf = (editorialFiles ?? []).find(
          (f) => f.file_type === "cover_pdf"
        );
        if (coverPdf) {
          resolved.storagePath = coverPdf.storage_path;
          resolved.sizeBytes = coverPdf.size_bytes;
          resolved.generatedAt = coverPdf.created_at;
          resolved.status = "ready";
        }
        break;
      }
      case "ebook_epub": {
        // Look for ebook export
        const ebookExport = (editorialExports ?? []).find(
          (e) => e.export_type === "epub"
        );
        if (ebookExport) {
          resolved.storagePath = ebookExport.storage_path;
          resolved.generatedAt = ebookExport.created_at;
          resolved.status = "ready";
        }
        break;
      }
      // metadata_json, editorial_reports, and publishing_checklist
      // remain "pending" until explicitly generated
      default:
        break;
    }

    return resolved;
  });

  // Generate the publishing checklist
  const checklist = generatePublishingChecklist(options.config, options.metadata);

  // Determine overall package status
  const requiredFiles = resolvedFiles.filter(
    (f) => f.fileType === "interior_pdf" || f.fileType === "cover_pdf" || f.fileType === "metadata_json"
  );
  const allRequiredReady = requiredFiles.every((f) => f.status === "ready");
  const anyFailed = resolvedFiles.some((f) => f.status === "failed");

  const packageStatus: "building" | "ready" | "failed" = anyFailed
    ? "failed"
    : allRequiredReady
      ? "ready"
      : "building";

  const publishingPackage: PublishingPackage = {
    id: `pkg_${options.projectId}_${Date.now()}`,
    projectId: options.projectId,
    files: resolvedFiles,
    checklist,
    metadata: options.metadata,
    config: options.config,
    status: packageStatus,
    createdAt: now,
    completedAt: packageStatus === "ready" ? now : null,
  };

  return publishingPackage;
}
