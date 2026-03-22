import { z } from "zod";

const MAX_MANUSCRIPT_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([".docx", ".pdf", ".doc", ".epub", ".txt"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "application/msword",
  "application/epub+zip",
  "text/plain",
  "application/octet-stream",
]);

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getFileExtension(fileName: string): string {
  const value = fileName.trim();
  const lastDotIndex = value.lastIndexOf(".");
  if (lastDotIndex < 0) return "";
  return value.slice(lastDotIndex).toLowerCase();
}

const optionalStringSchema = z.preprocess(normalizeOptionalString, z.string().optional());

export const receptionMetadataSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  authorName: z.string().trim().min(1, "Author name is required."),
  genre: z.string().trim().min(1, "Genre is required."),
  language: z.string().trim().min(2).max(12).default("es"),
  subtitle: optionalStringSchema,
  targetAudience: optionalStringSchema,
  serviceType: z
    .enum(["full_pipeline", "reedicion", "rediseno_portada", "reedicion_y_portada"])
    .default("full_pipeline"),
  creativeMode: z.enum(["author_directed", "editorial_directed"]).default("author_directed"),
  coverPrompt: optionalStringSchema,
  coverNotes: optionalStringSchema,
  bookSize: optionalStringSchema,
  observations: optionalStringSchema,
});

export const receptionManuscriptSchema = z
  .object({
    fileName: z.string().trim().min(1, "fileName is required."),
    mimeType: optionalStringSchema,
    sizeBytes: z.coerce
      .number()
      .int()
      .positive("sizeBytes must be greater than zero.")
      .max(MAX_MANUSCRIPT_SIZE_BYTES, `Manuscript must be ${MAX_MANUSCRIPT_SIZE_BYTES} bytes or smaller.`),
  })
  .superRefine((value, ctx) => {
    const extension = getFileExtension(value.fileName);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unsupported manuscript extension: ${extension || "none"}.`,
        path: ["fileName"],
      });
    }

    const mimeType = value.mimeType ?? "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unsupported manuscript mimeType: ${mimeType}.`,
        path: ["mimeType"],
      });
    }
  });

export const receptionStartInputSchema = z.object({
  metadata: receptionMetadataSchema,
  manuscript: receptionManuscriptSchema,
  actorId: z.string().trim().uuid("actorId must be a valid UUID."),
});

export const receptionCompleteInputSchema = z.object({
  projectId: z.string().trim().uuid("projectId must be a valid UUID."),
  fileId: z.string().trim().uuid("fileId must be a valid UUID."),
  actorId: z.string().trim().uuid("actorId must be a valid UUID."),
});

export function extractManuscriptExtension(fileName: string): string {
  return getFileExtension(fileName);
}

export function parseReceptionStartInput(input: unknown) {
  return receptionStartInputSchema.parse(input);
}

export function parseReceptionCompleteInput(input: unknown) {
  return receptionCompleteInputSchema.parse(input);
}

export const receptionValidationConstants = {
  maxManuscriptSizeBytes: MAX_MANUSCRIPT_SIZE_BYTES,
  allowedExtensions: Array.from(ALLOWED_EXTENSIONS),
  allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
} as const;
