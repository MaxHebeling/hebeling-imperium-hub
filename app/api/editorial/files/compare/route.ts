import { NextRequest, NextResponse } from "next/server";
import { getEditorialFile } from "@/lib/editorial/db/queries";
import { extractManuscriptText } from "@/lib/editorial/files/extract-text";

function buildLineDiff(previousText: string, currentText: string) {
  const previousLines = previousText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const currentLines = currentText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const previousSet = new Set(previousLines);
  const currentSet = new Set(currentLines);

  const added = currentLines.filter((line) => !previousSet.has(line)).slice(0, 20);
  const removed = previousLines.filter((line) => !currentSet.has(line)).slice(0, 20);

  return { added, removed };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentFileId = searchParams.get("currentFileId");
    const previousFileId = searchParams.get("previousFileId");

    if (!currentFileId || !previousFileId) {
      return NextResponse.json(
        { success: false, error: "currentFileId and previousFileId are required" },
        { status: 400 }
      );
    }

    const [currentFile, previousFile] = await Promise.all([
      getEditorialFile(currentFileId),
      getEditorialFile(previousFileId),
    ]);

    if (!currentFile || !previousFile) {
      return NextResponse.json({ success: false, error: "One or both files were not found" }, { status: 404 });
    }

    const [currentText, previousText] = await Promise.all([
      extractManuscriptText(currentFile),
      extractManuscriptText(previousFile),
    ]);

    const diff = buildLineDiff(previousText.text, currentText.text);

    return NextResponse.json({
      success: true,
      diff: {
        added: diff.added,
        removed: diff.removed,
        currentTruncated: currentText.truncated,
        previousTruncated: previousText.truncated,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
