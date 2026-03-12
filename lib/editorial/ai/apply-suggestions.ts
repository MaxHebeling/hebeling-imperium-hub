import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { getAdminClient } from "@/lib/leads/helpers";
import { EDITORIAL_BUCKETS } from "@/lib/editorial/storage/buckets";
import { downloadEditorialFileBytes } from "@/lib/editorial/files/extract-text";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import { registerEditorialFile } from "@/lib/editorial/db/mutations";
import { getLatestFileVersion } from "@/lib/editorial/db/queries";
import type { EditorialFile } from "@/lib/editorial/types/editorial";
import type { EditorialAiSuggestion } from "@/lib/editorial/types/ai-suggestions";

export interface ApplySuggestionsResult {
  fileId: string;
  storagePath: string;
  version: number;
  appliedCount: number;
}

/**
 * Fetch all pending (applied=false) suggestions for a project.
 */
async function loadPendingSuggestions(
  projectId: string
): Promise<EditorialAiSuggestion[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_ai_suggestions")
    .select("*")
    .eq("project_id", projectId)
    .eq("applied", false)
    .order("paragraph_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to load suggestions: ${error.message}`);
  }
  return (data ?? []) as EditorialAiSuggestion[];
}

/**
 * Parse a DOCX buffer into an array of paragraph text strings using mammoth.
 * Returns one entry per paragraph (empty strings for blank paragraphs).
 */
async function extractParagraphs(buffer: Buffer): Promise<string[]> {
  // mammoth exposes paragraph-level HTML which we can split into paragraphs
  const { value: html } = await mammoth.convertToHtml({ buffer });

  // Each <p>…</p> block maps to one paragraph
  const pTagRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pTagRegex.exec(html)) !== null) {
    // Strip any remaining HTML tags inside the paragraph
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    paragraphs.push(text);
  }

  return paragraphs;
}

/**
 * Apply a list of suggestions to the paragraph array.
 * Each suggestion replaces `original_text` inside the targeted paragraph.
 * Returns the mutated paragraph array and the IDs of suggestions that were applied.
 */
function applySuggestionsToParagraphs(
  paragraphs: string[],
  suggestions: EditorialAiSuggestion[]
): { paragraphs: string[]; appliedIds: string[] } {
  const result = [...paragraphs];
  const appliedIds: string[] = [];

  for (const suggestion of suggestions) {
    const { paragraph_index, original_text, suggested_text, id } = suggestion;
    if (paragraph_index < 0 || paragraph_index >= result.length) {
      console.warn(
        "[editorial-revisions][apply] paragraph_index out of range",
        { id, paragraph_index, total: result.length }
      );
      continue;
    }

    if (result[paragraph_index].includes(original_text)) {
      result[paragraph_index] = result[paragraph_index].replaceAll(
        original_text,
        suggested_text
      );
      appliedIds.push(id);
    } else {
      console.warn(
        "[editorial-revisions][apply] original_text not found in paragraph",
        { id, paragraph_index, original_text }
      );
    }
  }

  return { paragraphs: result, appliedIds };
}

/**
 * Build a DOCX document from an array of paragraph strings and return it as a Buffer.
 */
async function buildDocxFromParagraphs(paragraphs: string[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: paragraphs.map(
          (text) =>
            new Paragraph({
              children: [new TextRun(text)],
            })
        ),
      },
    ],
  });

  const arrayBuffer = await Packer.toBuffer(doc);
  return Buffer.from(arrayBuffer);
}

/**
 * Mark a list of suggestion IDs as applied in the database.
 */
async function markSuggestionsApplied(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const supabase = getAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("editorial_ai_suggestions")
    .update({ applied: true, updated_at: now })
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to mark suggestions as applied: ${error.message}`);
  }
}

/**
 * Main orchestrator: parse the project's latest manuscript DOCX, apply pending
 * AI suggestions paragraph by paragraph, generate a new DOCX, upload it to
 * storage and register it as `manuscript_edited` in `editorial_files`.
 */
export async function applyEditorialSuggestions(options: {
  projectId: string;
  orgId: string;
  requestedBy: string;
}): Promise<ApplySuggestionsResult> {
  const { projectId, requestedBy } = options;

  // 1. Get latest manuscript file
  const manuscriptResult = await getLatestManuscriptForProject(projectId);
  if (!manuscriptResult) {
    throw new Error(
      "No se encontró ningún manuscrito DOCX para este proyecto."
    );
  }

  const sourceFile: EditorialFile = manuscriptResult.file;
  const ext = sourceFile.storage_path.split(".").pop() ?? "docx";
  const isDocx =
    ext === "docx" ||
    sourceFile.mime_type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (!isDocx) {
    throw new Error(
      "El pipeline de revisiones DOCX solo soporta archivos .docx."
    );
  }

  console.info("[editorial-revisions] applying suggestions", {
    projectId,
    fileId: sourceFile.id,
    storagePath: sourceFile.storage_path,
  });

  // 2. Download source DOCX bytes
  const buffer = await downloadEditorialFileBytes(sourceFile);

  // 3. Extract paragraphs and map with paragraph_index
  const paragraphs = await extractParagraphs(buffer);
  console.info("[editorial-revisions] paragraphs extracted", {
    count: paragraphs.length,
  });

  // 4. Load pending suggestions from editorial_ai_suggestions
  const suggestions = await loadPendingSuggestions(projectId);
  console.info("[editorial-revisions] suggestions loaded", {
    count: suggestions.length,
  });

  // 5. Apply suggestions (replace original_text with suggested_text)
  const { paragraphs: editedParagraphs, appliedIds } =
    applySuggestionsToParagraphs(paragraphs, suggestions);

  // 6. Generate a new DOCX using the docx library
  const editedBuffer = await buildDocxFromParagraphs(editedParagraphs);

  // 7. Determine next version number and upload to storage
  const currentVersion = await getLatestFileVersion(
    projectId,
    "manuscript_edited"
  );
  const newVersion = currentVersion + 1;
  const storagePath = `${projectId}/manuscripts/manuscript_edited_v${newVersion}.docx`;

  const supabase = getAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(EDITORIAL_BUCKETS.manuscripts)
    .upload(storagePath, editedBuffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Error al subir el manuscrito editado: ${uploadError.message}`
    );
  }

  console.info("[editorial-revisions] uploaded edited DOCX", {
    storagePath,
    bytes: editedBuffer.byteLength,
  });

  // 8. Insert a new version into editorial_files
  const registeredFile = await registerEditorialFile({
    projectId,
    stageKey: "estilo",
    fileType: "manuscript_edited",
    version: newVersion,
    storagePath,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: editedBuffer.byteLength,
    uploadedBy: requestedBy,
    visibility: "internal",
  });

  // 9. Mark applied suggestions as applied=true
  await markSuggestionsApplied(appliedIds);

  console.info("[editorial-revisions] done", {
    projectId,
    newFileId: registeredFile.id,
    appliedCount: appliedIds.length,
  });

  return {
    fileId: registeredFile.id,
    storagePath,
    version: newVersion,
    appliedCount: appliedIds.length,
  };
}
