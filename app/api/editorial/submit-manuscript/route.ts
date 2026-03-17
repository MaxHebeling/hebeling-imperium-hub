import { NextResponse } from "next/server";
import { createEditorialProject, registerManuscriptFile } from "@/lib/editorial/db/mutations";
import { requestAiTask } from "@/lib/editorial/ai/jobs";
import { uploadManuscript } from "@/lib/editorial/storage/upload";
import { logWorkflowEvent } from "@/lib/editorial/workflow-events/service";
import { ORG_ID } from "@/lib/leads/helpers";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
]);
const ALLOWED_EXTENSIONS = new Set([".docx", ".pdf"]);

function validateManuscriptFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File must be 25MB or less.";
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return "Only .docx and .pdf are allowed.";
  if (!ALLOWED_TYPES.has(file.type) && ext !== ".docx" && ext !== ".pdf") {
    return "Invalid file type. Use .docx or .pdf.";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    console.log("[v0] submit-manuscript: Starting");
    
    const formData = await request.formData();
    console.log("[v0] FormData keys:", Array.from(formData.keys()));
    
    const authorName = (formData.get("authorName") as string)?.trim();
    const authorEmail = (formData.get("authorEmail") as string)?.trim();
    const bookTitle = (formData.get("bookTitle") as string)?.trim();
    const bookSubtitle = (formData.get("bookSubtitle") as string)?.trim() || undefined;
    const language = (formData.get("language") as string)?.trim() || "es";
    const category = (formData.get("category") as string)?.trim();
    const shortDescription = (formData.get("shortDescription") as string)?.trim() || undefined;
    const creativeMode = (formData.get("creativeMode") as string)?.trim() || "author_directed";
    const coverPrompt = (formData.get("coverPrompt") as string)?.trim() || undefined;
    const coverNotes = (formData.get("coverNotes") as string)?.trim() || undefined;
    const bookSize = (formData.get("bookSize") as string)?.trim() || undefined;
    const observations = (formData.get("observations") as string)?.trim() || undefined;
    const manuscript = formData.get("manuscript") as File | null;

    console.log("[v0] Form fields:", { authorName, authorEmail, bookTitle, category, creativeMode, hasManuscript: !!manuscript });

    if (!authorName || !authorEmail || !bookTitle || !category) {
      console.log("[v0] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: authorName, authorEmail, bookTitle, category." },
        { status: 400 }
      );
    }

    if (!manuscript || !(manuscript instanceof File) || manuscript.size === 0) {
      console.log("[v0] Manuscript file is required");
      return NextResponse.json(
        { error: "Manuscript file is required (.docx or .pdf, max 25MB)." },
        { status: 400 }
      );
    }

    console.log("[v0] Validating file:", { name: manuscript.name, size: manuscript.size, type: manuscript.type });
    const fileError = validateManuscriptFile(manuscript);
    if (fileError) {
      console.log("[v0] File validation error:", fileError);
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // 1. Create editorial project
    console.log("[v0] Creating editorial project");
    const project = await createEditorialProject({
      title: bookTitle,
      subtitle: bookSubtitle,
      author_name: authorName,
      language,
      genre: category,
      target_audience: shortDescription ?? undefined,
      creative_mode: creativeMode as "author_directed" | "editorial_directed",
      cover_prompt: coverPrompt,
      cover_notes: coverNotes,
      book_size: bookSize,
      observations,
    });
    console.log("[v0] Project created:", project.id);

    // 2. Upload manuscript to bucket
    console.log("[v0] Uploading manuscript to storage");
    const uploadResult = await uploadManuscript(project.id, manuscript, 1);
    console.log("[v0] Manuscript uploaded:", uploadResult.storagePath);

    // 3. Link file to project
    console.log("[v0] Registering manuscript file in DB");
    const fileRecord = await registerManuscriptFile(
      project.id,
      uploadResult.storagePath,
      uploadResult.mimeType,
      uploadResult.sizeBytes,
      undefined,
      1,
      "client"
    );
    console.log("[v0] File registered:", fileRecord.id);

    // 4. Queue AI job
    console.log("[v0] Queuing AI task");
    await requestAiTask({
      orgId: ORG_ID,
      projectId: project.id,
      stageKey: "recepcion",
      taskKey: "manuscript_analysis",
      sourceFileId: fileRecord.id,
      sourceFileVersion: 1,
      requestedBy: authorEmail,
    });
    console.log("[v0] AI task queued");

    // 5. Create workflow event
    console.log("[v0] Logging workflow event");
    await logWorkflowEvent({
      orgId: ORG_ID,
      projectId: project.id,
      stageKey: "recepcion",
      eventType: "manuscript_submitted",
      payload: {
        author_email: authorEmail,
        short_description: shortDescription ?? null,
        submitted_via: "submit-manuscript",
      },
    });
    console.log("[v0] Workflow event logged");

    console.log("[v0] Submission successful");
    return NextResponse.json({
      success: true,
      projectId: project.id,
      message: "Manuscript submitted successfully. Redirecting to your projects.",
    });
  } catch (err) {
    console.error("[v0] submit-manuscript error:", err);
    const message = err instanceof Error ? err.message : "Submission failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
