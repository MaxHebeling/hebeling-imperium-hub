import { z } from "zod";
import type { EditorialIntakeInput, IntakeSupportedExtension } from "./types";

export const MAX_MANUSCRIPT_SIZE_BYTES = 25 * 1024 * 1024;

const SUPPORTED_EXTENSIONS: readonly IntakeSupportedExtension[] = [
  "docx",
  "pdf",
  "txt",
] as const;

const SUPPORTED_MIME_TYPES = new Set<string>([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "text/plain",
  "application/octet-stream",
]);

const editorialIntakeMetadataSchema = z.object({
  author: z.string().trim().min(1),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().nullable().optional(),
  language: z.string().trim().min(2).max(12).default("es"),
  genre: z.string().trim().min(1),
  synopsis: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  serviceType: z
    .enum([
      "full_pipeline",
      "reedicion",
      "rediseno_portada",
      "reedicion_y_portada",
    ])
    .nullable()
    .optional(),
});

function getFileExtension(fileName: string): IntakeSupportedExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? null;
  if (!extension) {
    return null;
  }

  return SUPPORTED_EXTENSIONS.includes(extension as IntakeSupportedExtension)
    ? (extension as IntakeSupportedExtension)
    : null;
}

export function validateEditorialIntakeFile(file: File): {
  extension: IntakeSupportedExtension;
  mimeType: string;
} {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A manuscript file is required.");
  }

  if (file.size > MAX_MANUSCRIPT_SIZE_BYTES) {
    throw new Error("The manuscript file must be 25MB or less.");
  }

  const extension = getFileExtension(file.name);
  if (!extension) {
    throw new Error("Only .docx, .pdf, and .txt manuscripts are allowed.");
  }

  const mimeType = file.type || "application/octet-stream";
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error("Unsupported manuscript MIME type.");
  }

  if (extension === "docx" && !mimeType.includes("wordprocessingml") && mimeType !== "application/octet-stream") {
    throw new Error("DOCX manuscripts must use a valid Word MIME type.");
  }

  if (extension === "pdf" && mimeType !== "application/pdf" && mimeType !== "application/octet-stream") {
    throw new Error("PDF manuscripts must use a valid PDF MIME type.");
  }

  if (extension === "txt" && mimeType !== "text/plain" && mimeType !== "application/octet-stream") {
    throw new Error("TXT manuscripts must use a valid text MIME type.");
  }

  return { extension, mimeType };
}

export function parseEditorialIntakeInput(input: unknown): EditorialIntakeInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid editorial intake payload.");
  }

  const candidate = input as Partial<EditorialIntakeInput>;
  const metadata = editorialIntakeMetadataSchema.parse(candidate.metadata);

  if (!(candidate.manuscript instanceof File)) {
    throw new Error("A manuscript file is required.");
  }

  validateEditorialIntakeFile(candidate.manuscript);

  return {
    metadata,
    manuscript: candidate.manuscript,
    actorId:
      typeof candidate.actorId === "string" && candidate.actorId.trim().length > 0
        ? candidate.actorId
        : null,
  };
}
