import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialCoverConceptPackage } from "../cover-generation/types";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type { EditorialValidatedManuscript } from "../semantic-validation/types";
import { generateLayoutEpub } from "./epub";
import { generateLayoutPdf } from "./pdf";
import {
  buildLayoutChapters,
  buildLayoutTemplates,
  buildTypographySystem,
  selectCoverVariationKey,
} from "./rules";
import type {
  EditorialLayoutEngineResult,
  EditorialLayoutExportArtifact,
  EditorialLayoutPackage,
} from "./types";
import {
  assertLayoutEngineState,
  parseEditorialLayoutEngineInput,
} from "./validation";

type WorkflowRow = {
  id: string;
  current_state: string;
};

type ProjectRow = {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  language: string | null;
  current_status: string | null;
};

type AssetRow = {
  id: string;
  source_uri: string | null;
  version: number;
};

async function getProjectAndWorkflow(projectId: string): Promise<{
  project: ProjectRow;
  workflow: WorkflowRow;
}> {
  const supabase = getAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("editorial_projects")
    .select("id, title, author_name, genre, language, current_status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to load editorial project: ${projectError?.message}`);
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state")
    .eq("project_id", projectId)
    .single();

  if (workflowError || !workflow) {
    throw new Error(`Failed to load editorial workflow: ${workflowError?.message}`);
  }

  return {
    project: {
      id: project.id,
      title: project.title,
      author: (project as { author_name?: string | null }).author_name ?? null,
      genre: project.genre,
      language: project.language,
      current_status: project.current_status,
    },
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentAsset(
  projectId: string,
  assetKind: "metadata_asset" | "validated_manuscript" | "cover_asset",
  required = true
): Promise<AssetRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("project_id", projectId)
    .eq("asset_kind", assetKind)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ${assetKind} asset: ${error.message}`);
  }

  if (!data) {
    if (required) {
      throw new Error(`Missing current ${assetKind} asset for project ${projectId}.`);
    }
    return null;
  }

  if (required && !data.source_uri) {
    throw new Error(`The ${assetKind} asset does not have a source URI.`);
  }

  return data as AssetRow;
}

async function readWorkingJson<T>(storagePath: string): Promise<T> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download working asset: ${error?.message}`);
  }

  return JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8")) as T;
}

async function maybeDownloadSelectedCover(
  coverPackage: EditorialCoverConceptPackage | null
): Promise<Buffer | null> {
  const selectedStoragePath = coverPackage?.variations[0]?.storage_path;
  if (!selectedStoragePath) {
    return null;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.covers)
    .download(selectedStoragePath);

  if (error || !data) {
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}

async function getNextLayoutVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "layout_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read layout asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadExportFile(input: {
  projectId: string;
  version: number;
  format: "pdf" | "epub";
  buffer: Buffer;
  mimeType: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getAdminClient();
  const storagePath = `${input.projectId}/layout/v${input.version}/interior.${input.format}`;

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.exports)
    .upload(storagePath, input.buffer, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload ${input.format} export: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(EDITORIAL_BUCKETS.exports)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: data.publicUrl,
  };
}

async function uploadLayoutPackage(
  projectId: string,
  version: number,
  layoutPackage: EditorialLayoutPackage
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/layout-package/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(layoutPackage, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload layout package: ${error.message}`);
  }

  return storagePath;
}

async function persistLayoutReadyState(input: {
  projectId: string;
  workflowId: string;
  currentState: "metadata_ready" | "cover_ready" | "layout_ready";
  validatedAssetId: string;
  metadataAssetId: string;
  coverAssetId: string | null;
  layoutPackage: EditorialLayoutPackage;
  layoutPackageStoragePath: string;
  layoutVersion: number;
}): Promise<{ layoutAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const layoutAssetId = createFoundationId();
  const transitioned = input.currentState !== "layout_ready";

  if (transitioned) {
    validateEditorialWorkflowTransition(input.currentState, "layout_ready");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "layout_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current layout asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: layoutAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "layout_asset",
    source_type: "external",
    source_label: `Layout package v${input.layoutVersion}`,
    source_uri: input.layoutPackageStoragePath,
    original_file_name: `layout-package-v${input.layoutVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.layoutPackage), "utf8"),
    extracted_text_uri: null,
    version: input.layoutVersion,
    is_current: true,
    details: {
      layout_style: input.layoutPackage.layout_style,
      selected_cover_variation_key: input.layoutPackage.selected_cover_variation_key,
      export_formats: input.layoutPackage.exports.map((item) => item.format),
      export_paths: input.layoutPackage.exports.map((item) => item.storage_path),
      validated_asset_id: input.validatedAssetId,
      metadata_asset_id: input.metadataAssetId,
      cover_asset_id: input.coverAssetId,
      exports_bucket: EDITORIAL_BUCKETS.exports,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist layout asset: ${assetError.message}`);
  }

  const pdfArtifact = input.layoutPackage.exports.find((item) => item.format === "pdf");
  const epubArtifact = input.layoutPackage.exports.find((item) => item.format === "epub");

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "layout_ready",
      context: {
        layout_asset_id: layoutAssetId,
        validated_asset_id: input.validatedAssetId,
        metadata_asset_id: input.metadataAssetId,
        cover_asset_id: input.coverAssetId,
      },
      metrics: {
        chapter_count: input.layoutPackage.chapters.length,
        pdf_page_count: pdfArtifact?.page_count ?? null,
        export_count: input.layoutPackage.exports.length,
      },
      updated_at: now,
    })
    .eq("id", input.workflowId);

  if (workflowError) {
    throw new Error(`Failed to update editorial workflow: ${workflowError.message}`);
  }

  const { error: projectError } = await supabase
    .from("editorial_projects")
    .update({
      current_stage: mapWorkflowStateToLegacyStage("layout_ready"),
      current_status: "layout_ready",
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          layout_ready: true,
          layout_asset_id: layoutAssetId,
          pdf_storage_path: pdfArtifact?.storage_path ?? null,
          epub_storage_path: epubArtifact?.storage_path ?? null,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project layout state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "layout_ready",
      event_type: "layout_engine.completed",
      level: "info",
      message: "Layout package generated successfully.",
      payload: {
        layoutAssetId,
        exportFormats: input.layoutPackage.exports.map((item) => item.format),
        exportPaths: input.layoutPackage.exports.map((item) => item.storage_path),
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "layout_ready",
      event_type: transitioned ? "workflow.transitioned" : "workflow.relayouted",
      level: "info",
      message: transitioned
        ? `Workflow transitioned from ${input.currentState} to layout_ready.`
        : "Layout engine was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "layout_ready",
        layoutAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist layout engine logs: ${logsError.message}`);
  }

  return { layoutAssetId, transitioned };
}

export async function executeEditorialLayoutEngine(
  input: unknown
): Promise<EditorialLayoutEngineResult> {
  const parsed = parseEditorialLayoutEngineInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertLayoutEngineState(
    workflow.current_state ?? project.current_status
  ) as "metadata_ready" | "cover_ready" | "layout_ready";

  const metadataAsset = await getCurrentAsset(parsed.projectId, "metadata_asset");
  const validatedAsset = await getCurrentAsset(
    parsed.projectId,
    "validated_manuscript"
  );
  const coverAsset = await getCurrentAsset(parsed.projectId, "cover_asset", false);

  const metadataPackage = await readWorkingJson<EditorialMetadataPackage>(
    metadataAsset!.source_uri!
  );
  const validatedManuscript = await readWorkingJson<EditorialValidatedManuscript>(
    validatedAsset!.source_uri!
  );
  const coverPackage =
    coverAsset?.source_uri != null
      ? await readWorkingJson<EditorialCoverConceptPackage>(coverAsset.source_uri)
      : null;

  const chapters = buildLayoutChapters(validatedManuscript);
  const typography = buildTypographySystem({
    metadata: metadataPackage,
    validatedManuscript,
  });
  const { printTemplate, digitalTemplate } = buildLayoutTemplates();
  const selectedCoverVariationKey = selectCoverVariationKey(coverPackage);
  const coverImageBuffer = await maybeDownloadSelectedCover(coverPackage);
  const layoutVersion = await getNextLayoutVersion(parsed.projectId);

  const pdf = await generateLayoutPdf({
    metadata: metadataPackage,
    author: project.author ?? "Autor desconocido",
    language: project.language ?? "es",
    chapters,
    typography,
    printPresetId: printTemplate.page_preset_id ?? "trade_6x9",
  });

  const epubBuffer = await generateLayoutEpub({
    metadata: metadataPackage,
    author: project.author ?? "Autor desconocido",
    language: project.language ?? "es",
    chapters,
    typography,
    coverImageBuffer,
  });

  const uploadedPdf = await uploadExportFile({
    projectId: parsed.projectId,
    version: layoutVersion,
    format: "pdf",
    buffer: pdf.buffer,
    mimeType: "application/pdf",
  });
  const uploadedEpub = await uploadExportFile({
    projectId: parsed.projectId,
    version: layoutVersion,
    format: "epub",
    buffer: epubBuffer,
    mimeType: "application/epub+zip",
  });

  const exports: EditorialLayoutExportArtifact[] = [
    {
      format: "pdf",
      storage_path: uploadedPdf.storagePath,
      public_url: uploadedPdf.publicUrl,
      mime_type: "application/pdf",
      size_bytes: pdf.buffer.length,
      page_count: pdf.pageCount,
      chapter_count: chapters.length,
    },
    {
      format: "epub",
      storage_path: uploadedEpub.storagePath,
      public_url: uploadedEpub.publicUrl,
      mime_type: "application/epub+zip",
      size_bytes: epubBuffer.length,
      page_count: null,
      chapter_count: chapters.length,
    },
  ];

  const layoutPackage: EditorialLayoutPackage = {
    schema_version: 1,
    project_id: parsed.projectId,
    validated_asset_id: validatedAsset!.id,
    metadata_asset_id: metadataAsset!.id,
    cover_asset_id: coverAsset?.id ?? null,
    layout_style: typography.layout_style,
    print_template: printTemplate,
    digital_template: digitalTemplate,
    typography,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      title: chapter.title,
      anchor: chapter.anchor,
      word_count: chapter.word_count,
    })),
    selected_cover_variation_key: selectedCoverVariationKey,
    exports,
    generated_at: createFoundationTimestamp(),
  };

  const layoutPackageStoragePath = await uploadLayoutPackage(
    parsed.projectId,
    layoutVersion,
    layoutPackage
  );

  const { layoutAssetId, transitioned } = await persistLayoutReadyState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    validatedAssetId: validatedAsset!.id,
    metadataAssetId: metadataAsset!.id,
    coverAssetId: coverAsset?.id ?? null,
    layoutPackage,
    layoutPackageStoragePath,
    layoutVersion,
  });

  return {
    state: "layout_ready",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    validatedAssetId: validatedAsset!.id,
    metadataAssetId: metadataAsset!.id,
    coverAssetId: coverAsset?.id ?? null,
    layoutAssetId,
    layoutAssetUri: layoutPackageStoragePath,
    pdfStoragePath: uploadedPdf.storagePath,
    epubStoragePath: uploadedEpub.storagePath,
    transitioned,
  };
}
