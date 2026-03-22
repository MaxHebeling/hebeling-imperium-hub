import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { buildMergedEditorialProjectPipelineContext } from "@/lib/editorial/pipeline/editorial-policy";
import { mapWorkflowStateToLegacyStage } from "@/lib/editorial/pipeline/workflow-stage-sync";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialValidatedManuscript } from "../semantic-validation/types";
import {
  assertMetadataGenerationState,
  parseEditorialMetadataGenerationInput,
} from "./validation";
import { parseMetadataPackage } from "./parser";
import type {
  EditorialMetadataGenerationResult,
  EditorialMetadataPackage,
} from "./types";

const METADATA_MODEL = "gpt-4o-mini";
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

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

type MetadataRow = {
  id: string;
  title: string;
  subtitle: string | null;
  synopsis: string | null;
  genre: string;
  language: string;
  tags: string[] | null;
};

type AssetRow = {
  id: string;
  source_uri: string | null;
  version: number;
};

function buildMetadataPrompt(options: {
  title: string;
  author: string;
  genre: string;
  language: string;
  synopsis: string | null;
  validatedText: string;
  globalSummary: string;
}): string {
  return [
    "You are a publishing metadata strategist for a premium editorial house.",
    "Create SEO-friendly and commercially strong metadata in the manuscript's language.",
    "Preserve the core identity of the book.",
    "Return only valid JSON. No markdown. No extra explanation.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        optimized_title: "string",
        subtitle: "string",
        book_description: "string",
        keywords: ["string"],
        categories: ["string"],
        target_audience: "string",
        positioning_statement: "string",
        seo_notes: ["string"],
      },
      null,
      2
    ),
    "",
    "Rules:",
    "- make the title commercially attractive without betraying the work",
    "- subtitle must improve discoverability",
    "- description should be market-ready and concise",
    "- keywords should be search-friendly",
    "- categories should be plausible editorial/commercial categories",
    "",
    `Current title: ${options.title}`,
    `Author: ${options.author}`,
    `Genre: ${options.genre}`,
    `Language: ${options.language}`,
    `Existing synopsis: ${options.synopsis ?? "N/A"}`,
    `Validated manuscript summary: ${options.globalSummary}`,
    "",
    "Validated manuscript excerpt:",
    options.validatedText.slice(0, 12000),
  ].join("\n");
}

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
    throw new Error(
      `Failed to load editorial project: ${projectError?.message}`
    );
  }

  const { data: workflow, error: workflowError } = await supabase
    .from("editorial_workflows")
    .select("id, current_state")
    .eq("project_id", projectId)
    .single();

  if (workflowError || !workflow) {
    throw new Error(
      `Failed to load editorial workflow: ${workflowError?.message}`
    );
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

async function getProjectMetadata(projectId: string): Promise<MetadataRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_metadata")
    .select("id, title, subtitle, synopsis, genre, language, tags")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load editorial metadata: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle,
    synopsis: data.synopsis,
    genre: data.genre,
    language: data.language,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((item): item is string => typeof item === "string")
      : null,
  };
}

async function getCurrentValidatedAsset(projectId: string): Promise<AssetRow> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, source_uri, version")
    .eq("project_id", projectId)
    .eq("asset_kind", "validated_manuscript")
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Failed to load validated_manuscript asset: ${error?.message}`
    );
  }

  if (!data.source_uri) {
    throw new Error("The validated_manuscript asset does not have a source URI.");
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

async function getNextMetadataVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "metadata_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read metadata asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadMetadataPackage(
  projectId: string,
  version: number,
  metadataPackage: EditorialMetadataPackage
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/metadata/v${version}.json`;
  const buffer = Buffer.from(
    JSON.stringify(metadataPackage, null, 2),
    "utf8"
  );

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload metadata package: ${error.message}`);
  }

  return storagePath;
}

async function persistMetadataReadyState(input: {
  projectId: string;
  workflowId: string;
  currentState: "validated" | "metadata_ready";
  metadataRowId: string | null;
  validatedAssetId: string;
  metadataStoragePath: string;
  metadataPackage: EditorialMetadataPackage;
  metadataVersion: number;
}): Promise<{ metadataAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const metadataAssetId = createFoundationId();
  const transitioned = input.currentState === "validated";

  if (transitioned) {
    validateEditorialWorkflowTransition("validated", "metadata_ready");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "metadata_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(
      `Failed to clear current metadata asset: ${clearCurrentError.message}`
    );
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: metadataAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "metadata_asset",
    source_type: "external",
    source_label: `Metadata package v${input.metadataVersion}`,
    source_uri: input.metadataStoragePath,
    original_file_name: `metadata-package-v${input.metadataVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(
      JSON.stringify(input.metadataPackage),
      "utf8"
    ),
    extracted_text_uri: null,
    version: input.metadataVersion,
    is_current: true,
    details: {
      model: input.metadataPackage.model,
      keywords: input.metadataPackage.keywords,
      categories: input.metadataPackage.categories,
      validated_asset_id: input.validatedAssetId,
      bucket: EDITORIAL_BUCKETS.working,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist metadata asset: ${assetError.message}`);
  }

  if (input.metadataRowId) {
    const { error: metadataUpdateError } = await supabase
      .from("editorial_metadata")
      .update({
        title: input.metadataPackage.optimized_title,
        subtitle: input.metadataPackage.subtitle,
        synopsis: input.metadataPackage.book_description,
        tags: input.metadataPackage.keywords,
        extra: {
          categories: input.metadataPackage.categories,
          target_audience: input.metadataPackage.target_audience,
          positioning_statement: input.metadataPackage.positioning_statement,
          seo_notes: input.metadataPackage.seo_notes,
          metadata_asset_id: metadataAssetId,
        },
        updated_at: now,
      })
      .eq("id", input.metadataRowId);

    if (metadataUpdateError) {
      throw new Error(
        `Failed to update editorial metadata row: ${metadataUpdateError.message}`
      );
    }
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "metadata_ready",
      context: {
        metadata_asset_id: metadataAssetId,
        validated_asset_id: input.validatedAssetId,
      },
      metrics: {
        keyword_count: input.metadataPackage.keywords.length,
        category_count: input.metadataPackage.categories.length,
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
      current_stage: mapWorkflowStateToLegacyStage("metadata_ready"),
      current_status: "metadata_ready",
      pipeline_context: await buildMergedEditorialProjectPipelineContext(
        input.projectId,
        {
          metadata_ready: true,
          metadata_asset_id: metadataAssetId,
        }
      ),
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(
      `Failed to update editorial project metadata state: ${projectError.message}`
    );
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "metadata_ready",
      event_type: "metadata_generation.completed",
      level: "info",
      message: "Metadata package generated successfully.",
      payload: {
        metadataAssetId,
        keywordCount: input.metadataPackage.keywords.length,
        categoryCount: input.metadataPackage.categories.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "metadata_ready",
      event_type: transitioned
        ? "workflow.transitioned"
        : "workflow.remetadatized",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from validated to metadata_ready."
        : "Metadata generation was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "metadata_ready",
        metadataAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase
    .from("pipeline_logs")
    .insert(logs);

  if (logsError) {
    throw new Error(
      `Failed to persist metadata generation logs: ${logsError.message}`
    );
  }

  return { metadataAssetId, transitioned };
}

export async function executeEditorialMetadataGeneration(
  input: unknown
): Promise<EditorialMetadataGenerationResult> {
  const parsed = parseEditorialMetadataGenerationInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertMetadataGenerationState(
    workflow.current_state ?? project.current_status
  ) as "validated" | "metadata_ready";

  const metadataRow = await getProjectMetadata(parsed.projectId);
  const validatedAsset = await getCurrentValidatedAsset(parsed.projectId);
  const validatedManuscript = await readWorkingJson<EditorialValidatedManuscript>(
    validatedAsset.source_uri!
  );

  const result = await generateText({
    model: openai(METADATA_MODEL),
    temperature: 0,
    prompt: buildMetadataPrompt({
      title: metadataRow?.title ?? project.title,
      author: project.author ?? metadataRow?.title ?? "Autor",
      genre: metadataRow?.genre ?? project.genre ?? "general",
      language: metadataRow?.language ?? project.language ?? "es",
      synopsis: metadataRow?.synopsis ?? null,
      validatedText: validatedManuscript.full_validated_text,
      globalSummary: validatedManuscript.global_summary,
    }),
  });

  const generatedAt = createFoundationTimestamp();
  const metadataPackage = parseMetadataPackage({
    rawText: result.text,
    projectId: parsed.projectId,
    validatedAssetId: validatedAsset.id,
    title: metadataRow?.title ?? project.title,
    genre: metadataRow?.genre ?? project.genre ?? "general",
    language: metadataRow?.language ?? project.language ?? "es",
    synopsis: metadataRow?.synopsis ?? null,
    generatedAt,
    model: METADATA_MODEL,
  });

  const metadataVersion = await getNextMetadataVersion(parsed.projectId);
  const metadataStoragePath = await uploadMetadataPackage(
    parsed.projectId,
    metadataVersion,
    metadataPackage
  );

  const { metadataAssetId, transitioned } = await persistMetadataReadyState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    metadataRowId: metadataRow?.id ?? project.metadata_id,
    validatedAssetId: validatedAsset.id,
    metadataStoragePath,
    metadataPackage,
    metadataVersion,
  });

  return {
    state: "metadata_ready",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    validatedAssetId: validatedAsset.id,
    metadataAssetId,
    metadataAssetUri: metadataStoragePath,
    transitioned,
  };
}
