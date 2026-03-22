import { NextResponse } from "next/server";
import { extractRawManuscriptText } from "@/lib/editorial/phases/preprocessing/extract";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { generateWorkflowAssetDocx } from "@/lib/editorial/workflow-assets/docx";

type WorkflowAssetRow = {
  id: string;
  asset_kind: string;
  source_uri: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  version: number | null;
  details: Record<string, unknown> | null;
};

type CoverPackagePayload = {
  variations?: Array<{
    storage_path?: string | null;
  }>;
};

function resolveWorkflowAssetBucket(asset: WorkflowAssetRow): string {
  const explicitBucket = asset.details?.bucket;
  if (typeof explicitBucket === "string" && explicitBucket.trim()) {
    return explicitBucket;
  }

  if (asset.asset_kind === "manuscript") {
    return EDITORIAL_BUCKETS.manuscripts;
  }

  return EDITORIAL_BUCKETS.working;
}

async function readBucketJson(bucket: string, storagePath: string): Promise<unknown> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download workflow asset: ${error?.message}`);
  }

  const raw = Buffer.from(await data.arrayBuffer()).toString("utf8");
  return JSON.parse(raw) as unknown;
}

function extractCoverStoragePathFromDetails(
  asset: WorkflowAssetRow
): string | null {
  const variationPaths = asset.details?.variation_storage_paths;
  if (!Array.isArray(variationPaths)) {
    return null;
  }

  const firstPath = variationPaths.find(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  return firstPath ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  try {
    const supabase = getAdminClient();
    const { data: asset, error: assetError } = await supabase
      .from("manuscript_assets")
      .select("id, asset_kind, source_uri, original_file_name, mime_type, version, details")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Workflow asset not found" }, { status: 404 });
    }

    if (!asset.source_uri) {
      return NextResponse.json(
        { error: "Workflow asset does not have a source file." },
        { status: 400 }
      );
    }

    const typedAsset = asset as WorkflowAssetRow;
    const sourceUri = typedAsset.source_uri;
    if (!sourceUri) {
      return NextResponse.json(
        { error: "Workflow asset does not have a source file." },
        { status: 400 }
      );
    }

    if (typedAsset.asset_kind === "cover_asset") {
      const coverStoragePathFromDetails = extractCoverStoragePathFromDetails(
        typedAsset
      );
      let coverStoragePath = coverStoragePathFromDetails;

      if (!coverStoragePath) {
        const coverPackage = await readBucketJson(
          EDITORIAL_BUCKETS.working,
          sourceUri
        );
        const parsedCoverPackage = coverPackage as CoverPackagePayload;
        coverStoragePath =
          parsedCoverPackage.variations?.find(
            (variation) =>
              typeof variation?.storage_path === "string" &&
              variation.storage_path.trim().length > 0
          )?.storage_path ?? null;
      }

      if (!coverStoragePath) {
        return NextResponse.json(
          { error: "Cover asset does not have an image variation ready for download." },
          { status: 400 }
        );
      }

      const downloadName =
        coverStoragePath.split("/").pop() ||
        `cover-v${typedAsset.version ?? 1}.png`;
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(EDITORIAL_BUCKETS.covers)
        .createSignedUrl(coverStoragePath, 3600, {
          download: downloadName,
        });

      if (signedUrlError || !signedUrlData?.signedUrl) {
        return NextResponse.json(
          { error: "Could not generate cover image download URL." },
          { status: 500 }
        );
      }

      return NextResponse.redirect(signedUrlData.signedUrl);
    }

    const bucket = resolveWorkflowAssetBucket(typedAsset);
    const docxExport =
      typedAsset.asset_kind === "manuscript"
        ? await generateWorkflowAssetDocx({
            assetKind: typedAsset.asset_kind,
            payload: await extractRawManuscriptText({
              fileName:
                typedAsset.original_file_name?.trim() ||
                sourceUri.split("/").pop() ||
                "manuscript",
              mimeType: typedAsset.mime_type ?? "application/octet-stream",
              storagePath: sourceUri,
            }),
            originalFileName: typedAsset.original_file_name,
            version: typedAsset.version,
          })
        : bucket === EDITORIAL_BUCKETS.working &&
            sourceUri.toLowerCase().endsWith(".json")
          ? await generateWorkflowAssetDocx({
              assetKind: typedAsset.asset_kind,
              payload: await readBucketJson(bucket, sourceUri),
              originalFileName: typedAsset.original_file_name,
              version: typedAsset.version,
            })
          : null;

    if (docxExport) {
      return new NextResponse(docxExport.buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${docxExport.fileName}"`,
          "Content-Length": String(docxExport.buffer.length),
          "X-Editorial-Asset-Kind": typedAsset.asset_kind,
        },
      });
    }

    const downloadName =
      typedAsset.original_file_name?.trim() ||
      sourceUri.split("/").pop() ||
      `${typedAsset.asset_kind}.bin`;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(sourceUri, 3600, {
        download: downloadName,
      });

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Could not generate workflow asset download URL." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("[editorial/workflow-assets] Download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
