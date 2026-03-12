import { getAdminClient, ORG_ID } from "@/lib/leads/helpers";
import type {
  ExportFormat,
  ExportConfig,
  ExportQuality,
  EditorialExportJob,
  ExportPreset,
} from "./types";
import { DEFAULT_EXPORT_CONFIG } from "./types";

export async function createExportJob(options: {
  projectId: string;
  format: ExportFormat;
  quality: ExportQuality;
  config?: Partial<ExportConfig>;
  requestedBy?: string;
}): Promise<EditorialExportJob> {
  const supabase = getAdminClient();

  // Get the latest version for this format
  const { data: existingExports } = await supabase
    .from("editorial_exports")
    .select("version")
    .eq("project_id", options.projectId)
    .eq("export_type", options.format)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = existingExports && existingExports.length > 0 
    ? existingExports[0].version + 1 
    : 1;

  const fullConfig: ExportConfig = {
    ...DEFAULT_EXPORT_CONFIG,
    ...options.config,
    format: options.format,
    quality: options.quality,
  };

  const { data, error } = await supabase
    .from("editorial_exports")
    .insert({
      project_id: options.projectId,
      export_type: options.format,
      version: nextVersion,
      status: "queued",
      storage_path: null,
      checksum: null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create export job: ${error?.message}`);
  }

  return {
    ...data,
    quality: options.quality,
    config: fullConfig,
  } as EditorialExportJob;
}

export async function getProjectExports(projectId: string): Promise<EditorialExportJob[]> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("editorial_exports")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[v0] Failed to get exports:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      ...row,
      quality: "digital" as ExportQuality,
      config: DEFAULT_EXPORT_CONFIG,
    })) as EditorialExportJob[];
  } catch (error) {
    console.warn("[v0] Error fetching exports:", error);
    return [];
  }
}

export async function getExportJob(exportId: string): Promise<EditorialExportJob | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_exports")
    .select("*")
    .eq("id", exportId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    quality: "digital" as ExportQuality,
    config: DEFAULT_EXPORT_CONFIG,
  } as EditorialExportJob;
}

export async function updateExportStatus(
  exportId: string,
  status: "processing" | "completed" | "failed",
  options?: {
    storagePath?: string;
    fileSizeBytes?: number;
    checksum?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = { status };

  if (status === "processing") {
    updates.started_at = new Date().toISOString();
  }

  if (status === "completed" || status === "failed") {
    updates.completed_at = new Date().toISOString();
  }

  if (options?.storagePath) {
    updates.storage_path = options.storagePath;
  }

  if (options?.fileSizeBytes) {
    updates.file_size_bytes = options.fileSizeBytes;
  }

  if (options?.checksum) {
    updates.checksum = options.checksum;
  }

  if (options?.errorMessage) {
    updates.error_message = options.errorMessage;
  }

  const { error } = await supabase
    .from("editorial_exports")
    .update(updates)
    .eq("id", exportId);

  if (error) {
    throw new Error(`Failed to update export status: ${error.message}`);
  }
}

export async function getOrgExportPresets(): Promise<ExportPreset[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("editorial_export_presets")
    .select("*")
    .eq("org_id", ORG_ID)
    .order("name", { ascending: true });

  if (error) {
    // Table may not exist yet, return empty array
    return [];
  }

  return (data ?? []) as ExportPreset[];
}

export async function deleteExport(exportId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("editorial_exports")
    .delete()
    .eq("id", exportId);

  if (error) {
    throw new Error(`Failed to delete export: ${error.message}`);
  }
}
