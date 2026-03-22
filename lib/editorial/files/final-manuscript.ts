import type { EditorialEditedManuscript } from "@/lib/editorial/phases/content-editing/types";
import type { EditorialProofreadManuscript } from "@/lib/editorial/phases/proofreading/types";
import type { EditorialValidatedManuscript } from "@/lib/editorial/phases/semantic-validation/types";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { getAdminClient } from "@/lib/leads/helpers";

export type EditorialTextAssetKind =
  | "validated_manuscript"
  | "proofread_manuscript"
  | "edited_manuscript";

export const FINAL_MANUSCRIPT_PRIORITY: readonly EditorialTextAssetKind[] = [
  "validated_manuscript",
  "proofread_manuscript",
  "edited_manuscript",
];

export const CORRECTION_REPORT_PRIORITY: readonly EditorialTextAssetKind[] = [
  "proofread_manuscript",
  "edited_manuscript",
  "validated_manuscript",
];

type ManuscriptAssetRow = {
  id: string;
  asset_kind: string;
  source_uri: string | null;
  version: number;
};

type BaseEditorialTextAsset = {
  assetId: string;
  version: number;
  sourceUri: string;
  summary: string;
};

export type CurrentEditorialTextAsset =
  | (BaseEditorialTextAsset & {
      assetKind: "validated_manuscript";
      manuscript: EditorialValidatedManuscript;
      fullText: string;
    })
  | (BaseEditorialTextAsset & {
      assetKind: "proofread_manuscript";
      manuscript: EditorialProofreadManuscript;
      fullText: string;
    })
  | (BaseEditorialTextAsset & {
      assetKind: "edited_manuscript";
      manuscript: EditorialEditedManuscript;
      fullText: string;
    });

function isEditorialTextAssetKind(value: string): value is EditorialTextAssetKind {
  return (
    value === "validated_manuscript" ||
    value === "proofread_manuscript" ||
    value === "edited_manuscript"
  );
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

export async function getCurrentEditorialTextAsset(
  projectId: string,
  priority: readonly EditorialTextAssetKind[] = FINAL_MANUSCRIPT_PRIORITY
): Promise<CurrentEditorialTextAsset | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("manuscript_assets")
    .select("id, asset_kind, source_uri, version")
    .eq("project_id", projectId)
    .eq("is_current", true)
    .in("asset_kind", [...priority])
    .order("version", { ascending: false });

  if (error) {
    throw new Error(`Failed to load current editorial manuscript assets: ${error.message}`);
  }

  const rows = ((data ?? []) as ManuscriptAssetRow[]).filter(
    (row): row is ManuscriptAssetRow & { asset_kind: EditorialTextAssetKind } =>
      isEditorialTextAssetKind(row.asset_kind)
  );

  let selected: (ManuscriptAssetRow & { asset_kind: EditorialTextAssetKind }) | null = null;

  for (const kind of priority) {
    const candidate = rows.find((row) => row.asset_kind === kind && row.source_uri);
    if (candidate) {
      selected = candidate;
      break;
    }
  }

  if (!selected?.source_uri) {
    return null;
  }

  if (selected.asset_kind === "validated_manuscript") {
    const manuscript = await readWorkingJson<EditorialValidatedManuscript>(selected.source_uri);
    return {
      assetId: selected.id,
      assetKind: selected.asset_kind,
      version: selected.version,
      sourceUri: selected.source_uri,
      manuscript,
      fullText: manuscript.full_validated_text || manuscript.full_proofread_text,
      summary: manuscript.global_summary,
    };
  }

  if (selected.asset_kind === "proofread_manuscript") {
    const manuscript = await readWorkingJson<EditorialProofreadManuscript>(selected.source_uri);
    return {
      assetId: selected.id,
      assetKind: selected.asset_kind,
      version: selected.version,
      sourceUri: selected.source_uri,
      manuscript,
      fullText: manuscript.full_proofread_text || manuscript.full_edited_text,
      summary: manuscript.global_summary,
    };
  }

  const manuscript = await readWorkingJson<EditorialEditedManuscript>(selected.source_uri);
  return {
    assetId: selected.id,
    assetKind: selected.asset_kind,
    version: selected.version,
    sourceUri: selected.source_uri,
    manuscript,
    fullText: manuscript.full_edited_text || manuscript.full_original_text,
    summary: manuscript.global_summary,
  };
}
