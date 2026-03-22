import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createFoundationId,
  createFoundationTimestamp,
} from "@/lib/editorial/foundation";
import { validateEditorialWorkflowTransition } from "@/lib/editorial/foundation/pipeline/state-machine";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialCoverConceptPackage } from "../cover-generation/types";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type { EditorialPublishedPackage } from "../publishing/types";
import { parseMarketingKit } from "./parser";
import type {
  EditorialMarketingAutomationResult,
  EditorialMarketingKit,
} from "./types";
import {
  assertMarketingAutomationState,
  parseEditorialMarketingAutomationInput,
} from "./validation";

const MARKETING_MODEL = "gpt-4o-mini";
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
  current_status: string | null;
};

type AssetRow = {
  id: string;
  source_uri: string | null;
  version: number;
};

function buildMarketingPrompt(options: {
  title: string;
  subtitle: string;
  author: string;
  description: string;
  targetAudience: string;
  positioningStatement: string;
  categories: string[];
  keywords: string[];
  platforms: string[];
  coverAngle: string | null;
}): string {
  return [
    "You are a senior publishing marketer for a premium editorial house.",
    "Generate a structured multi-channel marketing kit in the book language.",
    "Make it commercial, clear, and audience-aware.",
    "Return only valid JSON. No markdown. No explanation.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        positioning_hook: "string",
        ad_copies: [
          {
            channel: "meta_ads",
            headline: "string",
            primary_text: "string",
            call_to_action: "string",
            audience_angle: "string",
          },
        ],
        email_sequence: [
          {
            sequence_key: "string",
            step_order: 1,
            subject: "string",
            preview_text: "string",
            body: "string",
            call_to_action: "string",
          },
        ],
        landing_page: {
          hero_title: "string",
          hero_subtitle: "string",
          sections: [
            {
              key: "string",
              heading: "string",
              body: "string",
            },
          ],
          primary_call_to_action: "string",
        },
        campaign_structure: [
          {
            id: "string",
            name: "string",
            objective: "string",
            channels: ["meta_ads", "google_ads", "email", "landing_page"],
            audience: "string",
            core_message: "string",
            call_to_action: "string",
          },
        ],
      },
      null,
      2
    ),
    "",
    `Title: ${options.title}`,
    `Subtitle: ${options.subtitle}`,
    `Author: ${options.author}`,
    `Description: ${options.description}`,
    `Target audience: ${options.targetAudience}`,
    `Positioning statement: ${options.positioningStatement}`,
    `Categories: ${options.categories.join(", ")}`,
    `Keywords: ${options.keywords.join(", ")}`,
    `Published platforms: ${options.platforms.join(", ") || "N/A"}`,
    `Cover angle: ${options.coverAngle ?? "N/A"}`,
  ].join("\n");
}

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
  assetKind:
    | "metadata_asset"
    | "cover_asset"
    | "publication_asset"
    | "marketing_asset",
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

async function getNextMarketingVersion(projectId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("asset_kind", "marketing_asset")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read marketing asset versions: ${error.message}`);
  }

  return (data?.version ?? 0) + 1;
}

async function uploadMarketingKit(
  projectId: string,
  version: number,
  marketingKit: EditorialMarketingKit
): Promise<string> {
  const supabase = getAdminClient();
  const storagePath = `${projectId}/marketing/v${version}.json`;
  const buffer = Buffer.from(JSON.stringify(marketingKit, null, 2), "utf8");

  const { error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.working)
    .upload(storagePath, buffer, {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload marketing kit: ${error.message}`);
  }

  return storagePath;
}

async function persistMarketedState(input: {
  projectId: string;
  workflowId: string;
  currentState: "published" | "marketed";
  publicationAssetId: string;
  marketingStoragePath: string;
  marketingKit: EditorialMarketingKit;
  marketingVersion: number;
}): Promise<{ marketingAssetId: string; transitioned: boolean }> {
  const supabase = getAdminClient();
  const now = createFoundationTimestamp();
  const marketingAssetId = createFoundationId();
  const transitioned = input.currentState === "published";

  if (transitioned) {
    validateEditorialWorkflowTransition("published", "marketed");
  }

  const { error: clearCurrentError } = await supabase
    .from("manuscript_assets")
    .update({ is_current: false })
    .eq("project_id", input.projectId)
    .eq("asset_kind", "marketing_asset")
    .eq("is_current", true);

  if (clearCurrentError) {
    throw new Error(
      `Failed to clear current marketing asset: ${clearCurrentError.message}`
    );
  }

  const { error: assetError } = await supabase.from("manuscript_assets").insert({
    id: marketingAssetId,
    project_id: input.projectId,
    workflow_id: input.workflowId,
    asset_kind: "marketing_asset",
    source_type: "external",
    source_label: `Marketing kit v${input.marketingVersion}`,
    source_uri: input.marketingStoragePath,
    original_file_name: `marketing-kit-v${input.marketingVersion}.json`,
    mime_type: "application/json",
    checksum: null,
    size_bytes: Buffer.byteLength(JSON.stringify(input.marketingKit), "utf8"),
    extracted_text_uri: null,
    version: input.marketingVersion,
    is_current: true,
    details: {
      campaign_count: input.marketingKit.campaign_structure.length,
      channel_mix: [...new Set(input.marketingKit.campaign_structure.flatMap((item) => item.channels))],
      publication_asset_id: input.publicationAssetId,
      model: input.marketingKit.model,
    },
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  });

  if (assetError) {
    throw new Error(`Failed to persist marketing asset: ${assetError.message}`);
  }

  const { error: workflowError } = await supabase
    .from("editorial_workflows")
    .update({
      current_state: "marketed",
      context: {
        marketing_asset_id: marketingAssetId,
        publication_asset_id: input.publicationAssetId,
      },
      metrics: {
        campaign_count: input.marketingKit.campaign_structure.length,
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
      current_status: "marketed",
      pipeline_context: {
        marketed: true,
        marketing_asset_id: marketingAssetId,
      },
      updated_at: now,
    })
    .eq("id", input.projectId);

  if (projectError) {
    throw new Error(`Failed to update editorial project marketing state: ${projectError.message}`);
  }

  const logs = [
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "marketed",
      event_type: "marketing.completed",
      level: "info",
      message: "Marketing kit generated successfully.",
      payload: {
        marketingAssetId,
        campaign_count: input.marketingKit.campaign_structure.length,
      },
      created_at: now,
    },
    {
      id: createFoundationId(),
      project_id: input.projectId,
      workflow_id: input.workflowId,
      stage_id: null,
      stage_key: "marketed",
      event_type: transitioned ? "workflow.transitioned" : "workflow.remarketed",
      level: "info",
      message: transitioned
        ? "Workflow transitioned from published to marketed."
        : "Marketing kit was regenerated.",
      payload: {
        fromState: input.currentState,
        toState: "marketed",
        marketingAssetId,
      },
      created_at: now,
    },
  ];

  const { error: logsError } = await supabase.from("pipeline_logs").insert(logs);
  if (logsError) {
    throw new Error(`Failed to persist marketing logs: ${logsError.message}`);
  }

  return { marketingAssetId, transitioned };
}

export async function executeEditorialMarketingAutomation(
  input: unknown
): Promise<EditorialMarketingAutomationResult> {
  const parsed = parseEditorialMarketingAutomationInput(input);
  const { project, workflow } = await getProjectAndWorkflow(parsed.projectId);
  const currentState = assertMarketingAutomationState(
    workflow.current_state ?? project.current_status
  ) as "published" | "marketed";

  const metadataAsset = await getCurrentAsset(parsed.projectId, "metadata_asset");
  const publicationAsset = await getCurrentAsset(parsed.projectId, "publication_asset");
  const coverAsset = await getCurrentAsset(parsed.projectId, "cover_asset", false);

  const metadataPackage = await readWorkingJson<EditorialMetadataPackage>(
    metadataAsset!.source_uri!
  );
  const publicationPackage = await readWorkingJson<EditorialPublishedPackage>(
    publicationAsset!.source_uri!
  );
  const coverPackage =
    coverAsset?.source_uri != null
      ? await readWorkingJson<EditorialCoverConceptPackage>(coverAsset.source_uri)
      : null;

  const prompt = buildMarketingPrompt({
    title: metadataPackage.optimized_title,
    subtitle: metadataPackage.subtitle,
    author: project.author ?? "Autor no especificado",
    description: metadataPackage.book_description,
    targetAudience: metadataPackage.target_audience,
    positioningStatement: metadataPackage.positioning_statement,
    categories: metadataPackage.categories,
    keywords: metadataPackage.keywords,
    platforms: publicationPackage.platforms
      .filter((item) => item.status === "published")
      .map((item) => item.platform),
    coverAngle:
      coverPackage?.variations[0]?.market_angle ??
      coverPackage?.creative_direction.mood ??
      null,
  });

  const generatedAt = createFoundationTimestamp();
  const response = await generateText({
    model: openai(MARKETING_MODEL),
    prompt,
    temperature: 0.4,
  });

  const marketingKit = parseMarketingKit({
    rawText: response.text,
    projectId: parsed.projectId,
    metadataAssetId: metadataAsset!.id,
    coverAssetId: coverAsset?.id ?? null,
    publicationAssetId: publicationAsset!.id,
    title: metadataPackage.optimized_title,
    subtitle: metadataPackage.subtitle,
    description: metadataPackage.book_description,
    targetAudience: metadataPackage.target_audience,
    positioningStatement: metadataPackage.positioning_statement,
    categories: metadataPackage.categories,
    keywords: metadataPackage.keywords,
    generatedAt,
    model: MARKETING_MODEL,
  });

  const marketingVersion = await getNextMarketingVersion(parsed.projectId);
  const marketingStoragePath = await uploadMarketingKit(
    parsed.projectId,
    marketingVersion,
    marketingKit
  );

  const { marketingAssetId, transitioned } = await persistMarketedState({
    projectId: parsed.projectId,
    workflowId: workflow.id,
    currentState,
    publicationAssetId: publicationAsset!.id,
    marketingStoragePath,
    marketingKit,
    marketingVersion,
  });

  return {
    state: "marketed",
    projectId: parsed.projectId,
    workflowId: workflow.id,
    publicationAssetId: publicationAsset!.id,
    marketingAssetId,
    marketingAssetUri: marketingStoragePath,
    campaignCount: marketingKit.campaign_structure.length,
    transitioned,
  };
}
