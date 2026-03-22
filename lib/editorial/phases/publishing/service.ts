import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialCoverConceptPackage } from "../cover-generation/types";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type { EditorialFinalPackageManifest } from "../packaging/types";
import {
  getPublishingPlatformLabel,
  publishToMockPlatform,
} from "./platforms";
import type {
  EditorialPublishedPackage,
  EditorialPublishingPayload,
  EditorialPublishingResult,
} from "./types";
import {
  assertPublishingState,
  parseEditorialPublishingInput,
  resolvePublishingPlatforms,
} from "./validation";

type WorkflowRow = {
  id: string;
  current_state: string;
};

type ProjectRow = {
  id: string;
  title: string;
  author_name: string | null;
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
    .select("id, title, author_name, language, current_status")
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
    project: project as ProjectRow,
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentAsset(
  projectId: string,
  assetKind: "package_asset" | "metadata_asset" | "cover_asset" | "publication_asset",
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

async function getNextPublicationVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "publication_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read publication asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

function getFilePublicUrl(
  manifest: EditorialFinalPackageManifest,
  role: "print_pdf" | "digital_epub" | "cover_image"
): string | null {
  return manifest.files.find((file) => file.role === role)?.public_url ?? null;
}

async function uploadPublicationManifest(
  projectId: string,
  version: number,
  manifest: EditorialPublishedPackage
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/publication/v${version}/manifest.json`;
  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload publication manifest: ${error.message}`);
  }

  return storagePath;
}

async function persistPublishedState(input: {
  projectId: string;
  workflowId: string;
  currentState: "packaged" | "published";
  manifest: EditorialPublishedPackage;
  manifestStoragePath: string;
  publicationVersion: number;
}): Promise<{ publicationAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const publicationAssetId = createFoundationId();
  const transitioned = input.currentState === "packaged";

  if (transitioned) {
    validateEditorialWorkflowTransition("packaged", "published");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "publication_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(
      `Failed to clear current publication asset: ${clearCurrentError.message}`
    );
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: publicationAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "publication_asset",
    source_type: "external",
    source_label: `Publication manifest v${input.publicationVersion}`,
    source_uri: input.manifestStoragePath,
    original_file_name: `publication-v${input.publicationVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.manifest), "utf8"),
    extracted_text_uri: null,
    version: input.publicationVersion,
    is_current: true,
    details: {
      package_asset_id: input.manifest.package_asset_id,
      platform_count: input.manifest.platforms.length,
      published_count: input.manifest.platforms.filter(
        (platform) => platform.status === "published"
      ).length,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist publication asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "published",
      context: {
        publication_asset_id: publicationAssetId,
        package_asset_id: input.manifest.package_asset_id,
      },
      metrics: {
        platform_count: input.manifest.platforms.length,
        published_count: input.manifest.platforms.filter(
          (platform) => platform.status === "published"
        ).length,
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
      current_status: "published",
      pipeline_context: {
        published: true,
        publication_asset_id: publicationAssetId,
      },
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project publish state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "published",
      event_type: "publishing.completed",
      level: "info",
      message: "Mock publication completed successfully.",
      payload: {
        publicationAssetId,
        platform_count: input.manifest.platforms.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "published",
      event_type: transitioned ? "workflow.transitioned" : "workflow.republished",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from packaged to published."
        : "Publication manifest was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "published",
        publicationAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist publishing logs: ${logsError.message}`);
  }

  return { publicationAssetId, transitioned };
}

function buildPublishingSummary(
  projectTitle: string,
  platformNames: string[]
): string {
  return `${projectTitle} quedó publicado en modo mock en ${platformNames.join(", ")}.`;
}

export async function executeEditorialPublishing(
  input: unknown
): Promise<EditorialPublishingResult> {
  const parsed = parseEditorialPublishingInput(input);
  const platforms = resolvePublishingPlatforms(parsed.platforms);
  const maxRetries = parsed.maxRetries ?? 3;

  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertPublishingState(
    workflow.current_state ?? project.current_status
  ) as "packaged" | "published";

  const packageAsset = await getCurrentAsset(parsed.projectId, "package_asset");
  const metadataAsset = await getCurrentAsset(parsed.projectId, "metadata_asset");
  const coverAsset = await getCurrentAsset(parsed.projectId, "cover_asset", false);

  const packageManifest = await readWorkingJson<EditorialFinalPackageManifest>(
    packageAsset!.source_uri!
  );
  const metadataPackage = await readWorkingJson<EditorialMetadataPackage>(
    metadataAsset!.source_uri!
  );
  const coverPackage =
    coverAsset?.source_uri != null
      ? await readWorkingJson<EditorialCoverConceptPackage>(coverAsset.source_uri)
      : null;

  const pdfUrl = getFilePublicUrl(packageManifest, "print_pdf");
  const epubUrl = getFilePublicUrl(packageManifest, "digital_epub");

  if (!pdfUrl || !epubUrl) {
    throw new Error("Publishing requires package manifest PDF and EPUB public URLs.");
  }

  const coverUrl =
    getFilePublicUrl(packageManifest, "cover_image") ??
    coverPackage?.variations[0]?.public_url ??
    null;

  const publicationResults = await Promise.all(
    platforms.map(async (platform) => {
      const payload: EditorialPublishingPayload = {
        title: metadataPackage.optimized_title,
        subtitle: metadataPackage.subtitle,
        description: metadataPackage.book_description,
        keywords: metadataPackage.keywords,
        categories: metadataPackage.categories,
        language: project.language ?? "es",
        author: project.author_name,
        bundle_url: packageManifest.bundle_public_url,
        pdf_url: pdfUrl,
        epub_url: epubUrl,
        cover_url: coverUrl,
      };

      return publishToMockPlatform({
        projectId: parsed.projectId,
        platform,
        payload,
        maxRetries,
      });
    })
  );

  const publicationVersion = await getNextPublicationVersion(parsed.projectId);
  const publicationManifest: EditorialPublishedPackage = {
    schema_version: 1,
    project_id: parsed.projectId,
    package_asset_id: packageAsset!.id,
    metadata_asset_id: metadataAsset!.id,
    cover_asset_id: coverAsset?.id ?? null,
    platforms: publicationResults,
    summary: buildPublishingSummary(
      project.title,
      publicationResults.map((platform) => getPublishingPlatformLabel(platform.platform))
    ),
    generated_at: createFoundationTimestamp(),
  };

  const manifestStoragePath = await uploadPublicationManifest(
    parsed.projectId,
    publicationVersion,
    publicationManifest
  );

  const { publicationAssetId, transitioned } = await persistPublishedState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    manifest: publicationManifest,
    manifestStoragePath,
    publicationVersion,
  });

  return {
    state: "published",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    packageAssetId: packageAsset!.id,
    publicationAssetId,
    publicationAssetUri: manifestStoragePath,
    platformCount: publicationResults.length,
    publishedCount: publicationResults.filter(
      (platform) => platform.status === "published"
    ).length,
    transitioned,
  };
}
