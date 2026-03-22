import { createFoundationId, createFoundationTimestamp } from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type { EditorialValidatedManuscript } from "../semantic-validation/types";
import {
  assertCoverGenerationState,
  parseEditorialCoverGenerationInput,
} from "./validation";
import {
  buildCreativeDirection,
  buildVariationPrompt,
  createCoverVariationId,
  getCoverVariationBlueprints,
} from "./rules";
import type {
  EditorialCoverConceptPackage,
  EditorialCoverGenerationResult,
  EditorialCoverVariation,
} from "./types";

const COVER_IMAGE_MODEL = "dall-e-3";

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
  metadata_id: string | null;
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
    .select("id, title, author_name, genre, language, current_status, metadata_id")
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
      metadata_id: (project as { metadata_id?: string | null }).metadata_id ?? null,
    },
    workflow: workflow as WorkflowRow,
  };
}

async function getCurrentAsset(
  projectId: string,
  assetKind: "metadata_asset" | "validated_manuscript"
): Promise<AssetRow> {
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

  if (error || !data) {
    throw new Error(`Failed to load ${assetKind} asset: ${error?.message}`);
  }

  if (!data.source_uri) {
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

  return JSON.parse(
    Buffer.from(await data.arrayBuffer()).toString("utf8")
  ) as T;
}

async function getNextCoverVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "cover_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read cover asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function generateVariationImage(prompt: string): Promise<{
  imageBuffer: Buffer;
  revisedPrompt: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for cover generation.");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: COVER_IMAGE_MODEL,
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: "1024x1792",
      quality: "hd",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cover image generation failed (HTTP ${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    data?: Array<{ b64_json?: string | null; revised_prompt?: string | null }>;
  };

  const imageB64 = json.data?.[0]?.b64_json;
  if (!imageB64) {
    throw new Error("Image generation response did not include b64_json.");
  }

  return {
    imageBuffer: Buffer.from(imageB64, "base64"),
    revisedPrompt: json.data?.[0]?.revised_prompt ?? prompt,
  };
}

async function uploadCoverImage(input: {
  projectId: string;
  version: number;
  variationKey: string;
  imageBuffer: Buffer;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getAdminClient();
  const storagePath = `${input.projectId}/concepts/v${input.version}-${input.variationKey}.png`;

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.covers)
    .upload(storagePath, input.imageBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload cover image: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(EDITORIAL_BUCKETS.covers)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: data.publicUrl,
  };
}

async function uploadCoverPackage(
  projectId: string,
  version: number,
  coverPackage: EditorialCoverConceptPackage
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/cover-package/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(coverPackage, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload cover package: ${error.message}`);
  }

  return storagePath;
}

async function persistCoverReadyState(input: {
  projectId: string;
  workflowId: string;
  currentState: "metadata_ready" | "cover_ready";
  metadataAssetId: string;
  validatedAssetId: string;
  coverPackageStoragePath: string;
  coverPackage: EditorialCoverConceptPackage;
  coverVersion: number;
}): Promise<{ coverAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const coverAssetId = createFoundationId();
  const transitioned = input.currentState === "metadata_ready";

  if (transitioned) {
    validateEditorialWorkflowTransition("metadata_ready", "cover_ready");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "cover_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(`Failed to clear current cover asset: ${clearCurrentError.message}`);
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: coverAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "cover_asset",
    source_type: "external",
    source_label: `Cover concepts v${input.coverVersion}`,
    source_uri: input.coverPackageStoragePath,
    original_file_name: `cover-concepts-v${input.coverVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.coverPackage), "utf8"),
    extracted_text_uri: null,
    version: input.coverVersion,
    is_current: true,
    details: {
      model: input.coverPackage.model,
      variation_count: input.coverPackage.variations.length,
      covers_bucket: EDITORIAL_BUCKETS.covers,
      variation_storage_paths: input.coverPackage.variations.map((item) => item.storage_path),
      metadata_asset_id: input.metadataAssetId,
      validated_asset_id: input.validatedAssetId,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist cover asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "cover_ready",
      context: {
        cover_asset_id: coverAssetId,
        metadata_asset_id: input.metadataAssetId,
        validated_asset_id: input.validatedAssetId,
      },
      metrics: {
        variation_count: input.coverPackage.variations.length,
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
      current_status: "cover_ready",
      pipeline_context: {
        cover_ready: true,
        cover_asset_id: coverAssetId,
      },
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project cover state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "cover_ready",
      event_type: "cover_generation.completed",
      level: "info",
      message: "Cover concepts generated successfully.",
      payload: {
        coverAssetId,
        variationCount: input.coverPackage.variations.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "cover_ready",
      event_type: transitioned ? "workflow.transitioned" : "workflow.recovered",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from metadata_ready to cover_ready."
        : "Cover generation was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "cover_ready",
        coverAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist cover generation logs: ${logsError.message}`);
  }

  return { coverAssetId, transitioned };
}

export async function executeEditorialCoverGeneration(
  input: unknown
): Promise<EditorialCoverGenerationResult> {
  const parsed = parseEditorialCoverGenerationInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertCoverGenerationState(
    workflow.current_state ?? project.current_status
  ) as "metadata_ready" | "cover_ready";

  const metadataAsset = await getCurrentAsset(parsed.projectId, "metadata_asset");
  const validatedAsset = await getCurrentAsset(parsed.projectId, "validated_manuscript");

  const metadataPackage = await readWorkingJson<EditorialMetadataPackage>(
    metadataAsset.source_uri!
  );
  const validatedManuscript = await readWorkingJson<EditorialValidatedManuscript>(
    validatedAsset.source_uri!
  );

  const creativeDirection = buildCreativeDirection(metadataPackage);
  const coverVersion = await getNextCoverVersion(parsed.projectId);

  const variations: EditorialCoverVariation[] = [];

  for (const blueprint of getCoverVariationBlueprints()) {
    const prompt = buildVariationPrompt({
      metadata: metadataPackage,
      direction: creativeDirection,
      blueprint,
      validatedSummary: validatedManuscript.global_summary,
    });

    const generated = await generateVariationImage(prompt);
    const uploaded = await uploadCoverImage({
      projectId: parsed.projectId,
      version: coverVersion,
      variationKey: blueprint.key,
      imageBuffer: generated.imageBuffer,
    });

    variations.push({
      id: createCoverVariationId(),
      key: blueprint.key,
      title: blueprint.title,
      rationale: blueprint.rationale,
      market_angle: blueprint.marketAngle,
      prompt,
      revised_prompt: generated.revisedPrompt,
      storage_path: uploaded.storagePath,
      public_url: uploaded.publicUrl,
    });
  }

  const coverPackage: EditorialCoverConceptPackage = {
    schema_version: 1,
    project_id: parsed.projectId,
    metadata_asset_id: metadataAsset.id,
    validated_asset_id: validatedAsset.id,
    creative_direction: creativeDirection,
    variations,
    generated_at: createFoundationTimestamp(),
    model: COVER_IMAGE_MODEL,
  };

  const coverPackageStoragePath = await uploadCoverPackage(
    parsed.projectId,
    coverVersion,
    coverPackage
  );

  const { coverAssetId, transitioned } = await persistCoverReadyState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    metadataAssetId: metadataAsset.id,
    validatedAssetId: validatedAsset.id,
    coverPackageStoragePath,
    coverPackage,
    coverVersion,
  });

  return {
    state: "cover_ready",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    metadataAssetId: metadataAsset.id,
    validatedAssetId: validatedAsset.id,
    coverAssetId,
    coverAssetUri: coverPackageStoragePath,
    variationCount: coverPackage.variations.length,
    transitioned,
  };
}
