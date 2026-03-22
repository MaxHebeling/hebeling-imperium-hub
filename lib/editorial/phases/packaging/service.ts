import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialCoverConceptPackage } from "../cover-generation/types";
import type { EditorialLayoutPackage } from "../layout-engine/types";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type { EditorialApprovedPackage } from "../quality-assurance/types";
import { buildEditorialPackageBundle } from "./bundle";
import type {
  EditorialFinalPackageManifest,
  EditorialPackageFile,
  EditorialPackagingResult,
} from "./types";
import {
  assertPackagingState,
  parseEditorialPackagingInput,
} from "./validation";

type WorkflowRow = {
  id: string;
  current_state: string;
};

type ProjectRow = {
  id: string;
  title: string;
  author: string | null;
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
    .select("id, title, author_name, current_status")
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
      current_status: project.current_status,
    },
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentAsset(
  projectId: string,
  assetKind: "qa_asset" | "layout_asset" | "metadata_asset" | "cover_asset",
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

async function downloadFromBucket(
  bucket: string,
  storagePath: string
): Promise<Buffer> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download ${bucket}/${storagePath}: ${error?.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function getPublicUrl(bucket: string, storagePath: string): Promise<string> {
  const supabase = getAdminClient();
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

async function getNextPackageVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "package_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read package asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadBundleZip(input: {
  projectId: string;
  version: number;
  bundle: Buffer;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getAdminClient();
  const storagePath = `${input.projectId}/publishing-package/v${input.version}/editorial-package.zip`;

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.exports)
    .upload(storagePath, input.bundle, {
      contentType: "application/zip",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload packaging bundle: ${error.message}`);
  }

  const publicUrl = await getPublicUrl(EDITORIAL_BUCKETS.exports, storagePath);
  return { storagePath, publicUrl };
}

async function uploadPackageManifest(
  projectId: string,
  version: number,
  manifest: EditorialFinalPackageManifest
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/publishing-package/v${version}/manifest.json`;
  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload packaging manifest: ${error.message}`);
  }

  return storagePath;
}

async function persistPackagedState(input: {
  projectId: string;
  workflowId: string;
  currentState: "qa_passed" | "packaged";
  manifest: EditorialFinalPackageManifest;
  manifestStoragePath: string;
  packageVersion: number;
}): Promise<{ packageAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const packageAssetId = createFoundationId();
  const transitioned = input.currentState === "qa_passed";

  if (transitioned) {
    validateEditorialWorkflowTransition("qa_passed", "packaged");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "package_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current package asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: packageAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "package_asset",
    source_type: "external",
    source_label: `Publishing package v${input.packageVersion}`,
    source_uri: input.manifestStoragePath,
    original_file_name: `publishing-package-v${input.packageVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.manifest), "utf8"),
    extracted_text_uri: null,
    version: input.packageVersion,
    is_current: true,
    details: {
      bundle_storage_path: input.manifest.bundle_storage_path,
      bundle_public_url: input.manifest.bundle_public_url,
      file_count: input.manifest.files.length,
      qa_asset_id: input.manifest.qa_asset_id,
      layout_asset_id: input.manifest.layout_asset_id,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist package asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "packaged",
      context: {
        package_asset_id: packageAssetId,
        qa_asset_id: input.manifest.qa_asset_id,
        layout_asset_id: input.manifest.layout_asset_id,
      },
      metrics: {
        package_file_count: input.manifest.files.length,
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
      current_status: "packaged",
      pipeline_context: {
        packaged: true,
        package_asset_id: packageAssetId,
        bundle_storage_path: input.manifest.bundle_storage_path,
      },
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project package state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "packaged",
      event_type: "packaging.completed",
      level: "info",
      message: "Publishing package generated successfully.",
      payload: {
        packageAssetId,
        fileCount: input.manifest.files.length,
        bundleStoragePath: input.manifest.bundle_storage_path,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "packaged",
      event_type: transitioned ? "workflow.transitioned" : "workflow.repackaged",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from qa_passed to packaged."
        : "Publishing package was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "packaged",
        packageAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist packaging logs: ${logsError.message}`);
  }

  return { packageAssetId, transitioned };
}

function buildSummary(fileCount: number): string {
  return `Publishing package listo con ${fileCount} archivo(s) organizados para salida editorial.`;
}

export async function executeEditorialPackaging(
  input: unknown
): Promise<EditorialPackagingResult> {
  const parsed = parseEditorialPackagingInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertPackagingState(
    workflow.current_state ?? project.current_status
  ) as "qa_passed" | "packaged";

  const qaAsset = await getCurrentAsset(parsed.projectId, "qa_asset");
  const layoutAsset = await getCurrentAsset(parsed.projectId, "layout_asset");
  const metadataAsset = await getCurrentAsset(parsed.projectId, "metadata_asset");
  const coverAsset = await getCurrentAsset(parsed.projectId, "cover_asset", false);

  const qaPackage = await readWorkingJson<EditorialApprovedPackage>(qaAsset!.source_uri!);
  if (!qaPackage.approved) {
    throw new Error("Packaging requires an approved QA package with zero critical errors.");
  }

  const layoutPackage = await readWorkingJson<EditorialLayoutPackage>(
    layoutAsset!.source_uri!
  );
  const metadataPackage = await readWorkingJson<EditorialMetadataPackage>(
    metadataAsset!.source_uri!
  );
  const coverPackage =
    coverAsset?.source_uri != null
      ? await readWorkingJson<EditorialCoverConceptPackage>(coverAsset.source_uri)
      : null;

  const pdfArtifact = layoutPackage.exports.find((item) => item.format === "pdf");
  const epubArtifact = layoutPackage.exports.find((item) => item.format === "epub");

  if (!pdfArtifact || !epubArtifact) {
    throw new Error("Layout package is missing required PDF or EPUB exports.");
  }

  const [pdfBuffer, epubBuffer] = await Promise.all([
    downloadFromBucket(EDITORIAL_BUCKETS.exports, pdfArtifact.storage_path),
    downloadFromBucket(EDITORIAL_BUCKETS.exports, epubArtifact.storage_path),
  ]);

  const metadataBuffer = Buffer.from(JSON.stringify(metadataPackage, null, 2), "utf8");
  const qaBuffer = Buffer.from(JSON.stringify(qaPackage, null, 2), "utf8");
  const coverVariation = coverPackage?.variations[0] ?? null;
  const coverImageBuffer = coverVariation
    ? await downloadFromBucket(EDITORIAL_BUCKETS.covers, coverVariation.storage_path)
    : null;

  const packageVersion = await getNextPackageVersion(parsed.projectId);

  const files: EditorialPackageFile[] = [
    {
      role: "print_pdf",
      file_name: `${project.title}-print.pdf`,
      relative_path: "exports/print/interior.pdf",
      source_storage_path: pdfArtifact.storage_path,
      public_url: pdfArtifact.public_url,
      mime_type: "application/pdf",
      size_bytes: pdfBuffer.length,
    },
    {
      role: "digital_epub",
      file_name: `${project.title}.epub`,
      relative_path: "exports/digital/book.epub",
      source_storage_path: epubArtifact.storage_path,
      public_url: epubArtifact.public_url,
      mime_type: "application/epub+zip",
      size_bytes: epubBuffer.length,
    },
    {
      role: "metadata",
      file_name: "metadata.json",
      relative_path: "metadata/metadata.json",
      source_storage_path: metadataAsset!.source_uri,
      public_url: null,
      mime_type: "application/json",
      size_bytes: metadataBuffer.length,
    },
    {
      role: "qa_report",
      file_name: "qa-report.json",
      relative_path: "quality/qa-report.json",
      source_storage_path: qaAsset!.source_uri,
      public_url: null,
      mime_type: "application/json",
      size_bytes: qaBuffer.length,
    },
  ];

  if (coverVariation && coverImageBuffer) {
    files.push({
      role: "cover_image",
      file_name: "cover.png",
      relative_path: "cover/cover.png",
      source_storage_path: coverVariation.storage_path,
      public_url: coverVariation.public_url,
      mime_type: "image/png",
      size_bytes: coverImageBuffer.length,
    });
  }

  const entries = [
    {
      name: "exports/print/interior.pdf",
      data: pdfBuffer,
    },
    {
      name: "exports/digital/book.epub",
      data: epubBuffer,
    },
    {
      name: "metadata/metadata.json",
      data: metadataBuffer,
    },
    {
      name: "quality/qa-report.json",
      data: qaBuffer,
    },
  ];

  if (coverVariation && coverImageBuffer) {
    entries.push({
      name: "cover/cover.png",
      data: coverImageBuffer,
    });
  }

  const folderStructure = [
    "exports/",
    "exports/print/",
    "exports/digital/",
    "metadata/",
    "quality/",
    "manifest/",
    ...(coverVariation ? ["cover/"] : []),
  ];

  const provisionalManifest: EditorialFinalPackageManifest = {
    schema_version: 1,
    project_id: parsed.projectId,
    qa_asset_id: qaAsset!.id,
    layout_asset_id: layoutAsset!.id,
    metadata_asset_id: metadataAsset!.id,
    cover_asset_id: coverAsset?.id ?? null,
    bundle_storage_path: "",
    bundle_public_url: "",
    files: [],
    folder_structure: folderStructure,
    summary: "",
    generated_at: createFoundationTimestamp(),
  };

  const manifestBuffer = Buffer.from(
    JSON.stringify(
      {
        ...provisionalManifest,
        files,
      },
      null,
      2
    ),
    "utf8"
  );

  const bundle = buildEditorialPackageBundle([
    ...entries,
    {
      name: "manifest/package-manifest.json",
      data: manifestBuffer,
    },
  ]);

  const uploadedBundle = await uploadBundleZip({
    projectId: parsed.projectId,
    version: packageVersion,
    bundle,
  });

  const finalFiles: EditorialPackageFile[] = [
    ...files,
    {
      role: "package_manifest",
      file_name: "package-manifest.json",
      relative_path: "manifest/package-manifest.json",
      source_storage_path: null,
      public_url: null,
      mime_type: "application/json",
      size_bytes: manifestBuffer.length,
    },
  ];

  const manifest: EditorialFinalPackageManifest = {
    schema_version: 1,
    project_id: parsed.projectId,
    qa_asset_id: qaAsset!.id,
    layout_asset_id: layoutAsset!.id,
    metadata_asset_id: metadataAsset!.id,
    cover_asset_id: coverAsset?.id ?? null,
    bundle_storage_path: uploadedBundle.storagePath,
    bundle_public_url: uploadedBundle.publicUrl,
    files: finalFiles,
    folder_structure: folderStructure,
    summary: buildSummary(finalFiles.length),
    generated_at: createFoundationTimestamp(),
  };

  const manifestStoragePath = await uploadPackageManifest(
    parsed.projectId,
    packageVersion,
    manifest
  );

  const { packageAssetId, transitioned } = await persistPackagedState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    manifest,
    manifestStoragePath,
    packageVersion,
  });

  return {
    state: "packaged",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    qaAssetId: qaAsset!.id,
    packageAssetId,
    packageAssetUri: manifestStoragePath,
    bundleStoragePath: uploadedBundle.storagePath,
    fileCount: finalFiles.length,
    transitioned,
  };
}
