import mammoth from "mammoth";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import type { SupportedPreprocessingMimeType } from "./types";

type PdfParseResult = {
  text?: string;
};

type PdfParseModule = {
  default?: (buffer: Buffer) => Promise<PdfParseResult>;
};

function getExtension(fileName: string): string {
  return (fileName.split(".").pop() ?? "").toLowerCase();
}

function isDocx(fileName: string, mimeType: string): boolean {
  const extension = getExtension(fileName);
  return (
    extension === "docx" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function isPdf(fileName: string, mimeType: string): boolean {
  const extension = getExtension(fileName);
  return extension === "pdf" || mimeType === "application/pdf";
}

function isTxt(fileName: string, mimeType: string): boolean {
  const extension = getExtension(fileName);
  return extension === "txt" || mimeType === "text/plain";
}

export async function downloadManuscriptBytes(storagePath: string): Promise<Buffer> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download manuscript: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function extractRawManuscriptText(options: {
  fileName: string;
  mimeType: SupportedPreprocessingMimeType | string;
  storagePath: string;
}): Promise<string> {
  const buffer = await downloadManuscriptBytes(options.storagePath);

  if (isDocx(options.fileName, options.mimeType)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (isPdf(options.fileName, options.mimeType)) {
    const pdfParseModule = (await import("pdf-parse")) as PdfParseModule;
    const pdfParse = pdfParseModule.default;

    if (!pdfParse) {
      throw new Error("pdf-parse default export is unavailable.");
    }

    const result = await pdfParse(buffer);
    return result.text ?? "";
  }

  if (isTxt(options.fileName, options.mimeType)) {
    return buffer.toString("utf8");
  }

  throw new Error("Unsupported manuscript format for preprocessing.");
}
