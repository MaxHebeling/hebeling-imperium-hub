import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { bucketKeyForFileType } from "@/lib/editorial/storage/upload";
import type { EditorialFile } from "@/lib/editorial/types/editorial";
import mammoth from "mammoth";

// Límite para el texto extraído que enviaremos a IA en el MVP.
// El archivo binario se descarga completo; solo se trunca el texto ya parseado.
const MAX_CHARS_FOR_MVP = 50_000;

export interface ExtractedManuscriptText {
  text: string;
  truncated: boolean;
}

type PdfParseResult = {
  text?: string;
};

type PdfParseModule = {
  default?: (buffer: Buffer) => Promise<PdfParseResult>;
};

function isDocx(file: EditorialFile): boolean {
  const ext = (file.storage_path.split(".").pop() ?? "").toLowerCase();
  return ext === "docx" || file.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isPdf(file: EditorialFile): boolean {
  const ext = (file.storage_path.split(".").pop() ?? "").toLowerCase();
  return ext === "pdf" || file.mime_type === "application/pdf";
}

export async function downloadEditorialFileBytes(file: EditorialFile): Promise<Buffer> {
  const supabase = getAdminClient();
  const bucketKey = bucketKeyForFileType(file.file_type);
  const bucket = EDITORIAL_BUCKETS[bucketKey];

  console.info("[editorial-ai][extract] download start", {
    bucket,
    storagePath: file.storage_path,
    fileId: file.id,
  });

  const { data, error } = await supabase.storage.from(bucket).download(file.storage_path);

  if (error || !data) {
    console.error("[editorial-ai][extract] download error", {
      bucket,
      storagePath: file.storage_path,
      fileId: file.id,
      message: error?.message,
    });
    throw new Error("No se pudo descargar el manuscrito desde storage.");
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.info("[editorial-ai][extract] download complete", {
    fileId: file.id,
    bytes: buffer.byteLength,
    reportedSize: file.size_bytes ?? null,
  });

  return buffer;
}

export async function extractManuscriptText(file: EditorialFile): Promise<ExtractedManuscriptText> {
  if (!file.storage_path) {
    console.error("[editorial-ai][extract] missing storage_path", { fileId: file.id });
    throw new Error("El archivo de manuscrito no tiene storage_path.");
  }

  const buffer = await downloadEditorialFileBytes(file);
  const approxOriginalSize = file.size_bytes ?? buffer.byteLength;

  if (isDocx(file)) {
    console.info("[editorial-ai][extract] parsing DOCX", { fileId: file.id });
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      const truncated = value.length > MAX_CHARS_FOR_MVP;
      const text = truncated ? value.slice(0, MAX_CHARS_FOR_MVP) : value;

      if (truncated) {
      console.warn("[editorial-ai][extract] DOCX text truncated for MVP", {
          fileId: file.id,
          originalChars: value.length,
          maxChars: MAX_CHARS_FOR_MVP,
          approxOriginalSize,
        });
      }

      return { text, truncated };
    } catch (error) {
      console.error("[editorial-ai][extract] DOCX parse error", {
        fileId: file.id,
        message: (error as Error).message,
      });
      throw new Error("No se pudo extraer texto del DOCX.");
    }
  }

  if (isPdf(file)) {
    console.info("[editorial-ai][extract] parsing PDF", { fileId: file.id });
    try {
      const pdfParseModule = (await import("pdf-parse")) as PdfParseModule;
      const pdfParse = pdfParseModule.default;

      if (!pdfParse) {
        throw new Error("pdf-parse default export is unavailable.");
      }

      const result = await pdfParse(buffer);
      const originalText = result.text ?? "";
      const truncated = originalText.length > MAX_CHARS_FOR_MVP;
      const text = truncated ? originalText.slice(0, MAX_CHARS_FOR_MVP) : originalText;

      if (truncated) {
        console.warn("[editorial-ai][extract] PDF text truncated for MVP", {
          fileId: file.id,
          originalChars: originalText.length,
          maxChars: MAX_CHARS_FOR_MVP,
          approxOriginalSize,
        });
      }

      return { text, truncated };
    } catch (error) {
      console.error("[editorial-ai][extract] PDF parse error", {
        fileId: file.id,
        message: (error as Error).message,
      });
      throw new Error("No se pudo extraer texto del PDF.");
    }
  }

  console.error("[editorial-ai][extract] unsupported format", {
    fileId: file.id,
    storagePath: file.storage_path,
    mimeType: file.mime_type,
  });
  throw new Error("Formato de manuscrito no soportado para extracción de texto (solo DOCX y PDF).");
}
