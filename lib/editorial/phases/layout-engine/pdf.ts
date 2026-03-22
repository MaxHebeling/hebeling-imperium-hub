import PDFDocument from "pdfkit";
import { getBookFormatPreset } from "@/lib/editorial/export/book-format-presets";
import type { EditorialMetadataPackage } from "../metadata-generation/types";
import type {
  EditorialLayoutChapter,
  EditorialTypographySystem,
} from "./types";

interface LayoutPdfMetadata {
  title: string;
  subtitle: string | null;
  author: string;
  language: string;
}

function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "")
    .replace(/\n/g, " ");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
      continue;
    }

    const candidate = `${currentLine} ${word}`;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildFallbackPdf(input: {
  metadata: LayoutPdfMetadata;
  chapters: EditorialLayoutChapter[];
  pageSize: { width: number; height: number };
  margins: { top: number; bottom: number; left: number; right: number };
  typography: EditorialTypographySystem;
}): { buffer: Buffer; pageCount: number } {
  const contentWidth = input.pageSize.width - input.margins.left - input.margins.right;
  const bodySize = input.typography.body_size;
  const lineHeight = Math.max(bodySize * input.typography.body_line_height, bodySize + 3);
  const chapterTitleSize = input.typography.chapter_title_size;
  const maxCharsPerLine = Math.max(40, Math.floor(contentWidth / (bodySize * 0.52)));
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let cursorY = input.pageSize.height - input.margins.top;

  const pushPage = () => {
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    currentPage = [];
    cursorY = input.pageSize.height - input.margins.top;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY - requiredHeight < input.margins.bottom) {
      pushPage();
    }
  };

  const addLine = (text: string, size: number) => {
    ensureSpace(size + 6);
    currentPage.push(
      `BT /F1 ${size} Tf 1 0 0 1 ${input.margins.left.toFixed(2)} ${cursorY.toFixed(
        2
      )} Tm (${escapePdfText(text)}) Tj ET`
    );
    cursorY -= Math.max(size + 4, lineHeight);
  };

  addLine(input.metadata.title, 22);
  if (input.metadata.subtitle) {
    addLine(input.metadata.subtitle, 14);
  }
  addLine(input.metadata.author, 16);
  cursorY -= lineHeight;
  addLine("Publicado por Reino Editorial", 10);
  addLine(`Idioma: ${input.metadata.language}`, 10);
  pushPage();

  addLine(input.metadata.language === "en" ? "Contents" : "Contenido", 18);
  for (const chapter of input.chapters) {
    addLine(chapter.title, 11);
  }
  pushPage();

  for (const chapter of input.chapters) {
    addLine(chapter.title.toUpperCase(), chapterTitleSize);
    cursorY -= lineHeight * 0.5;

    for (const paragraph of toParagraphs(chapter.text)) {
      const lines = wrapText(paragraph, maxCharsPerLine);
      for (const line of lines) {
        addLine(line, bodySize);
      }
      cursorY -= lineHeight * 0.35;
    }

    pushPage();
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  const pageCount = pages.length;
  const fontObjectNumber = 1;
  const pagesObjectNumber = 2;
  const catalogObjectNumber = 3;
  const objects: string[] = [];

  objects[fontObjectNumber] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const contentObjectNumber = 4 + pageIndex * 2;
    const pageObjectNumber = contentObjectNumber + 1;
    const stream = pages[pageIndex]?.join("\n") ?? "";
    objects[contentObjectNumber] = `<< /Length ${Buffer.byteLength(
      stream,
      "utf8"
    )} >>\nstream\n${stream}\nendstream`;
    objects[pageObjectNumber] = `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${input.pageSize.width.toFixed(
      2
    )} ${input.pageSize.height.toFixed(
      2
    )}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
  }

  const pageRefs = Array.from(
    { length: pageCount },
    (_, pageIndex) => `${5 + pageIndex * 2} 0 R`
  );
  objects[pagesObjectNumber] = `<< /Type /Pages /Kids [${pageRefs.join(
    " "
  )}] /Count ${pageCount} >>`;
  objects[catalogObjectNumber] = `<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`;

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    const objectBody = objects[objectNumber];
    if (!objectBody) {
      continue;
    }
    offsets[objectNumber] = Buffer.byteLength(output, "utf8");
    output += `${objectNumber} 0 obj\n${objectBody}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, "utf8");
  output += `xref\n0 ${objects.length}\n`;
  output += "0000000000 65535 f \n";
  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    const offset = offsets[objectNumber] ?? 0;
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    buffer: Buffer.from(output, "utf8"),
    pageCount,
  };
}

export async function generateLayoutPdf(input: {
  metadata: EditorialMetadataPackage;
  author: string;
  language: string;
  chapters: EditorialLayoutChapter[];
  typography: EditorialTypographySystem;
  printPresetId: string;
}): Promise<{ buffer: Buffer; pageCount: number }> {
  const preset = getBookFormatPreset(input.printPresetId) ?? getBookFormatPreset("trade_6x9");

  if (!preset) {
    throw new Error("Missing print layout preset for PDF generation.");
  }

  const metadata: LayoutPdfMetadata = {
    title: input.metadata.optimized_title,
    subtitle: input.metadata.subtitle || null,
    author: input.author,
    language: input.language,
  };

  const mmToPt = 2.835;
  const margins = {
    top: preset.margins.top * mmToPt,
    bottom: preset.margins.bottom * mmToPt,
    left: preset.margins.interior * mmToPt,
    right: preset.margins.exterior * mmToPt,
  };

  const pageSize = {
    width: preset.widthPt,
    height: preset.heightPt,
  };

  try {
    const doc = new PDFDocument({
      size: [pageSize.width, pageSize.height],
      margins,
      info: {
        Title: metadata.title,
        Author: metadata.author,
        Subject: input.metadata.categories.join(", "),
        Creator: "HEBELING AI Layout Engine",
        Producer: "Reino Editorial",
      },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const contentWidth = pageSize.width - margins.left - margins.right;
    const centerX = margins.left + contentWidth / 2;

    doc.moveDown(7);
    doc
      .fontSize(26)
      .font(input.typography.chapter_title_font)
      .text(metadata.title, { align: "center" });

    if (metadata.subtitle) {
      doc.moveDown(0.5);
      doc
        .fontSize(input.typography.subtitle_size)
        .font(input.typography.subtitle_font)
        .text(metadata.subtitle, { align: "center" });
    }

    doc.moveDown(2);
    doc
      .moveTo(centerX - 50, doc.y)
      .lineTo(centerX + 50, doc.y)
      .lineWidth(0.5)
      .stroke("#333333");

    doc.moveDown(2);
    doc
      .fontSize(18)
      .font(input.typography.body_font)
      .text(metadata.author, { align: "center" });

    doc.addPage();
    doc.moveDown(20);
    doc
      .fontSize(8)
      .font(input.typography.body_font)
      .fillColor("#666666")
      .text(metadata.title, { align: "center" });
    doc.text(`© ${new Date().getFullYear()} ${metadata.author}`, { align: "center" });
    doc.moveDown(0.5);
    doc.text("Todos los derechos reservados.", { align: "center" });
    doc.moveDown(0.5);
    doc.text("Publicado por Reino Editorial", { align: "center" });
    doc.fillColor("#000000");

    doc.addPage();
    doc.moveDown(3);
    doc
      .fontSize(20)
      .font(input.typography.chapter_title_font)
      .text(metadata.language === "en" ? "CONTENTS" : "CONTENIDO", {
        align: "center",
      });
    doc.moveDown(2);
    for (const chapter of input.chapters) {
      doc
        .fontSize(11)
        .font(input.typography.body_font)
        .text(chapter.title, { width: contentWidth });
      doc.moveDown(0.3);
    }

    for (const chapter of input.chapters) {
      doc.addPage();
      const chapterOffset =
        input.typography.chapter_opener.topOffset > 0
          ? input.typography.chapter_opener.topOffset / 14
          : 4;
      doc.moveDown(chapterOffset);

      if (input.typography.chapter_opener.showNumber) {
        doc
          .fontSize(input.typography.chapter_title_size * 0.55)
          .font(input.typography.chapter_title_font)
          .fillColor("#666666")
          .text(String(chapter.order), {
            align:
              input.typography.chapter_opener.style === "left_modern"
                ? "left"
                : "center",
          });
        doc.fillColor("#000000");
        doc.moveDown(0.4);
      }

      doc
        .fontSize(input.typography.chapter_title_size)
        .font(input.typography.chapter_title_font)
        .text(chapter.title.toUpperCase(), {
          align:
            input.typography.chapter_opener.style === "left_modern"
              ? "left"
              : "center",
        });
      doc.moveDown(1);

      if (input.typography.chapter_opener.decorativeElement === "line") {
        const separatorY = doc.y;
        doc
          .moveTo(centerX - 28, separatorY)
          .lineTo(centerX + 28, separatorY)
          .lineWidth(0.5)
          .stroke("#999999");
        doc.moveDown(1.3);
      }

      for (const paragraph of toParagraphs(chapter.text)) {
        doc
          .fontSize(input.typography.body_size)
          .font(input.typography.body_font)
          .text(paragraph, {
            align: "justify",
            lineGap:
              (input.typography.body_line_height - 1) * input.typography.body_size,
            indent: input.typography.paragraph_indent * mmToPt,
            width: contentWidth,
          });
        doc.moveDown(0.45);
      }
    }

    const totalPages = doc.bufferedPageRange().count;
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      doc.switchToPage(pageIndex);
      if (pageIndex < 3) continue;

      const pageNumber = pageIndex + 1;
      const numberX =
        pageNumber % 2 === 0
          ? margins.left
          : pageSize.width - margins.right - 20;

      doc
        .fontSize(input.typography.page_number_size)
        .font(input.typography.page_number_font)
        .fillColor("#999999")
        .text(String(pageNumber), numberX, pageSize.height - margins.bottom + 10, {
          width: 20,
          align: pageNumber % 2 === 0 ? "left" : "right",
        });
      doc.fillColor("#000000");
    }

    doc.end();

    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    return {
      buffer,
      pageCount: totalPages,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes(".afm")) {
      return buildFallbackPdf({
        metadata,
        chapters: input.chapters,
        pageSize,
        margins,
        typography: input.typography,
      });
    }

    throw error;
  }
}
