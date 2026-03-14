import PDFDocument from "pdfkit";
import { getAdminClient } from "@/lib/leads/helpers";
import { getLatestManuscriptForProject } from "@/lib/editorial/files/get-latest-manuscript";
import { extractManuscriptText } from "@/lib/editorial/files/extract-text";
import type { ExportConfig } from "./types";
import { DEFAULT_EXPORT_CONFIG } from "./types";
import { getBookFormatPreset } from "./book-format-presets";
import {
  inferLayoutStyle,
  getLayoutStylePreset,
  getFontCombinationForStyle,
  buildChapterOpenerConfig,
  type LayoutStyleConfig,
  type ChapterOpenerConfig,
} from "@/lib/editorial/layout/layout-director";

/** Page dimensions in PDF points (1 point = 1/72 inch) */
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  a5: { width: 419.53, height: 595.28 },
  letter: { width: 612, height: 792 },
  // Trade paperback (6x9 inches) — standard book size
  trade: { width: 432, height: 648 },
  trade_6x9: { width: 432, height: 648 },
  "trade_5.5x8.5": { width: 396, height: 612 },
  pocket_5x8: { width: 360, height: 576 },
};

interface BookMetadata {
  title: string;
  subtitle: string | null;
  authorName: string | null;
  genre: string | null;
  language: string;
}

/**
 * Parse manuscript text into chapters.
 * Looks for common chapter markers: "Capítulo X", "CAPÍTULO X", "Chapter X", numbered headings, etc.
 */
function parseChapters(text: string): Array<{ title: string; content: string }> {
  // Split by common chapter patterns
  const chapterRegex = /^(?:cap[ií]tulo|chapter)\s+[\divxlc]+[.:)—\-\s]*.*/gim;
  const matches = [...text.matchAll(chapterRegex)];

  if (matches.length === 0) {
    // No chapters found — split by double newlines into sections
    const paragraphs = text.split(/\n{3,}/).filter((p) => p.trim().length > 0);
    if (paragraphs.length <= 1) {
      return [{ title: "", content: text.trim() }];
    }
    return paragraphs.map((p, i) => ({
      title: i === 0 ? "" : `Sección ${i}`,
      content: p.trim(),
    }));
  }

  const chapters: Array<{ title: string; content: string }> = [];

  // Content before first chapter
  const beforeFirst = text.slice(0, matches[0].index).trim();
  if (beforeFirst.length > 100) {
    chapters.push({ title: "Prefacio", content: beforeFirst });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const content = text.slice(start, end).trim();
    chapters.push({
      title: matches[i][0].trim(),
      content,
    });
  }

  return chapters;
}

/**
 * Generate a professionally formatted PDF from a manuscript.
 * Returns a Buffer with the PDF content.
 */
export async function generateBookPdf(options: {
  projectId: string;
  config?: Partial<ExportConfig>;
}): Promise<{ buffer: Buffer; pageCount: number }> {
  const supabase = getAdminClient();
  const config: ExportConfig = { ...DEFAULT_EXPORT_CONFIG, ...options.config };

  // Get project metadata
  const { data: project } = await supabase
    .from("editorial_projects")
    .select("title, subtitle, author_name, genre, language")
    .eq("id", options.projectId)
    .single();

  if (!project) {
    throw new Error("Proyecto no encontrado.");
  }

  const metadata: BookMetadata = {
    title: project.title ?? "Sin título",
    subtitle: project.subtitle ?? null,
    authorName: project.author_name ?? "Autor desconocido",
    genre: project.genre ?? null,
    language: project.language ?? "es",
  };

  // Get manuscript text
  const latest = await getLatestManuscriptForProject(options.projectId);
  if (!latest) {
    throw new Error("No se encontró manuscrito para generar el PDF.");
  }

  const extracted = await extractManuscriptText(latest.file);
  const manuscriptText = extracted.text;

  // Parse chapters
  const chapters = parseChapters(manuscriptText);

  // Page setup — try book format preset first, then fall back to config
  const preset = config.pageSize ? getBookFormatPreset(config.pageSize) : undefined;
  const pageSize = preset
    ? { width: preset.widthPt, height: preset.heightPt }
    : PAGE_SIZES[config.pageSize ?? "trade"] ?? PAGE_SIZES.trade;

  const mmToPt = 2.835;
  const margins = preset
    ? {
        top: preset.margins.top * mmToPt,
        bottom: preset.margins.bottom * mmToPt,
        left: preset.margins.interior * mmToPt,
        right: preset.margins.exterior * mmToPt,
      }
    : {
        top: (config.margins?.top ?? 20) * mmToPt,
        bottom: (config.margins?.bottom ?? 20) * mmToPt,
        left: (config.margins?.left ?? 15) * mmToPt,
        right: (config.margins?.right ?? 15) * mmToPt,
      };

  // ── Layout Director Integration ──
  // Resolve the layout style from the project's genre using the Layout Director
  const layoutStyle = inferLayoutStyle({
    genre: metadata.genre ?? "general",
    tone: "neutral",
    audience: "general",
    wordCount: manuscriptText.length / 5, // rough word estimate
  });
  const layoutPreset: LayoutStyleConfig | undefined = getLayoutStylePreset(layoutStyle);
  const fontCombo = getFontCombinationForStyle(layoutStyle);
  const chapterOpenerCfg: ChapterOpenerConfig = buildChapterOpenerConfig(
    layoutPreset?.chapterOpener ?? "centered_classic"
  );

  // Use Layout Director typography when available, fall back to book-format preset, then defaults
  const bodyFont = layoutPreset?.typography.bodyFont ?? fontCombo.bodyFont ?? preset?.typography.bodyFont ?? "Helvetica";
  const headingFont = layoutPreset?.typography.chapterTitleFont ?? fontCombo.headingFont ?? preset?.typography.headingFont ?? "Helvetica-Bold";
  const headingSize = layoutPreset?.typography.chapterTitleSize ?? preset?.typography.headingSize ?? 22;
  const paragraphIndent = layoutPreset
    ? layoutPreset.typography.paragraphIndent * mmToPt
    : preset
      ? preset.typography.paragraphIndent * mmToPt
      : (config.paragraphIndent ?? 7) * mmToPt;
  const pageNumberFont = layoutPreset?.typography.pageNumberFont ?? bodyFont;
  const pageNumberSize = layoutPreset?.typography.pageNumberSize ?? 9;

  // Create PDF document
  const doc = new PDFDocument({
    size: [pageSize.width, pageSize.height],
    margins: {
      top: margins.top,
      bottom: margins.bottom,
      left: margins.left,
      right: margins.right,
    },
    info: {
      Title: metadata.title,
      Author: metadata.authorName ?? undefined,
      Subject: metadata.genre ?? undefined,
      Creator: "Reino Editorial AI Engine",
      Producer: "Hebeling OS — Editorial Pipeline",
    },
    bufferPages: true,
  });

  // Collect PDF into buffer
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const bodyFontSize = layoutPreset?.typography.bodySize ?? preset?.typography.bodySize ?? config.fontSize ?? 11;
  const lineHeight = layoutPreset?.typography.bodyLineHeight ?? preset?.typography.lineHeight ?? config.lineHeight ?? 1.5;
  const contentWidth = pageSize.width - margins.left - margins.right;

  // ─── HALF-TITLE PAGE ───
  doc.moveDown(8);
  doc
    .fontSize(24)
    .font(bodyFont)
    .text(metadata.title, { align: "center" });
  if (metadata.subtitle) {
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .font(bodyFont)
      .text(metadata.subtitle, { align: "center" });
  }

  // ─── TITLE PAGE ───
  doc.addPage();
  doc.moveDown(6);
  doc
    .fontSize(28)
    .font(headingFont)
    .text(metadata.title.toUpperCase(), { align: "center" });

  if (metadata.subtitle) {
    doc.moveDown(0.8);
    doc
      .fontSize(16)
      .font(bodyFont)
      .text(metadata.subtitle, { align: "center" });
  }

  doc.moveDown(2);
  // Decorative line
  const centerX = margins.left + contentWidth / 2;
  doc
    .moveTo(centerX - 50, doc.y)
    .lineTo(centerX + 50, doc.y)
    .lineWidth(0.5)
    .stroke("#333333");

  doc.moveDown(2);
  doc
    .fontSize(18)
    .font(bodyFont)
    .text(metadata.authorName ?? "Autor desconocido", { align: "center" });

  doc.moveDown(8);
  doc
    .fontSize(10)
    .font(bodyFont)
    .fillColor("#666666")
    .text("Reino Editorial", { align: "center" });
  doc.fillColor("#000000");

  // ─── COPYRIGHT PAGE ───
  doc.addPage();
  doc.moveDown(20);
  doc
    .fontSize(8)
    .font(bodyFont)
    .fillColor("#666666");
  doc.text(`${metadata.title}`, { align: "center" });
  if (metadata.authorName) {
    doc.text(`© ${new Date().getFullYear()} ${metadata.authorName}`, { align: "center" });
  }
  doc.moveDown(0.5);
  doc.text("Todos los derechos reservados.", { align: "center" });
  doc.moveDown(0.5);
  doc.text("Publicado por Reino Editorial", { align: "center" });
  doc.text("Producido con Reino Editorial AI Engine", { align: "center" });
  doc.moveDown(1);
  doc.text(`Primera edición: ${new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}`, { align: "center" });
  doc.fillColor("#000000");

  // ─── TABLE OF CONTENTS ───
  if (config.includeTableOfContents && chapters.length > 1) {
    doc.addPage();
    doc.moveDown(3);
    doc
      .fontSize(20)
      .font(headingFont)
      .text(metadata.language === "en" ? "CONTENTS" : "CONTENIDO", { align: "center" });
    doc.moveDown(2);

    // We'll fill in page numbers after rendering chapters
    const tocEntries: Array<{ title: string; yPos: number }> = [];
    for (const chapter of chapters) {
      if (chapter.title) {
        tocEntries.push({ title: chapter.title, yPos: doc.y });
        doc
          .fontSize(11)
          .font(bodyFont)
          .text(chapter.title, margins.left, doc.y, {
            width: contentWidth,
            continued: false,
          });
        doc.moveDown(0.3);
      }
    }
  }

  // ─── CHAPTERS ───
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];

    // Each chapter starts on a new page
    doc.addPage();

    // Chapter title — rendered using Layout Director's chapter opener config
    if (chapter.title) {
      const topMoveDown = chapterOpenerCfg.topOffset > 0
        ? chapterOpenerCfg.topOffset / 14 // convert mm-ish offset to moveDown units
        : 4;
      doc.moveDown(topMoveDown);

      // Show chapter number if configured
      if (chapterOpenerCfg.showNumber && i > 0) {
        let chapterNum: string;
        switch (chapterOpenerCfg.numberFormat) {
          case "roman": {
            const romans = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
              "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
            chapterNum = romans[i] ?? String(i);
            break;
          }
          case "spelled":
            chapterNum = `Capitulo ${i}`;
            break;
          default:
            chapterNum = String(i);
        }
        const numAlign = chapterOpenerCfg.style === "left_modern" ? "left" as const : "center" as const;
        doc
          .fontSize(headingSize * 0.6)
          .font(headingFont)
          .fillColor("#666666")
          .text(chapterNum, { align: numAlign });
        doc.fillColor("#000000");
        doc.moveDown(0.5);
      }

      // Chapter title text
      const titleAlign = chapterOpenerCfg.style === "left_modern" ? "left" as const : "center" as const;
      if (chapterOpenerCfg.showTitle) {
        doc
          .fontSize(headingSize)
          .font(headingFont)
          .text(chapter.title.toUpperCase(), { align: titleAlign });
        doc.moveDown(1);
      }

      // Decorative element based on chapter opener config
      if (chapterOpenerCfg.decorativeElement === "line") {
        const sepY = doc.y;
        doc
          .moveTo(centerX - 30, sepY)
          .lineTo(centerX + 30, sepY)
          .lineWidth(0.5)
          .stroke("#999999");
        doc.moveDown(1.5);
      } else if (chapterOpenerCfg.decorativeElement === "dots") {
        doc
          .fontSize(12)
          .font(bodyFont)
          .fillColor("#999999")
          .text("· · ·", { align: "center" });
        doc.fillColor("#000000");
        doc.moveDown(1);
      } else if (chapterOpenerCfg.decorativeElement === "ornament") {
        doc
          .fontSize(14)
          .font(bodyFont)
          .fillColor("#999999")
          .text("§", { align: "center" });
        doc.fillColor("#000000");
        doc.moveDown(1);
      } else {
        doc.moveDown(1);
      }
    }

    // Chapter content
    const paragraphs = chapter.content.split(/\n{2,}/).filter((p) => p.trim().length > 0);

    for (const paragraph of paragraphs) {
      const cleanText = paragraph.replace(/\n/g, " ").trim();
      if (!cleanText) continue;

      doc
        .fontSize(bodyFontSize)
        .font(bodyFont)
        .text(cleanText, {
          align: "justify",
          lineGap: (lineHeight - 1) * bodyFontSize,
          indent: paragraphIndent,
          width: contentWidth,
        });
      doc.moveDown(0.4);
    }
  }

  // ─── PAGE NUMBERS (added after all content) ───
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    // Skip page numbers on first 4 pages (half-title, title, copyright, TOC)
    if (i < 4) continue;

    const pageNum = i + 1;
    doc
      .fontSize(pageNumberSize)
      .font(pageNumberFont)
      .fillColor("#999999");

    // Alternate page number position (left/right) for book feel
    const numX = pageNum % 2 === 0 ? margins.left : pageSize.width - margins.right - 20;
    doc.text(String(pageNum), numX, pageSize.height - margins.bottom + 10, {
      width: 20,
      align: pageNum % 2 === 0 ? "left" : "right",
    });
    doc.fillColor("#000000");
  }

  // Finalize
  doc.end();

  // Wait for doc to finish
  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });

  return { buffer, pageCount: totalPages };
}
