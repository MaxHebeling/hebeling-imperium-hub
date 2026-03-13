import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";

// ---------- Types ----------

export interface CorrectionEntry {
  id: string;
  kind: string;
  severity: "baja" | "media" | "alta";
  confidence: number;
  original_text: string;
  suggested_text: string;
  justification: string;
  location?: {
    chapter?: number | null;
    paragraph_index?: number | null;
    sentence_index?: number | null;
  } | null;
}

export interface CorrectionReportInput {
  projectTitle: string;
  authorName?: string | null;
  generatedAt?: string;
  summary?: string;
  corrections: CorrectionEntry[];
}

// ---------- Helpers ----------

const SEVERITY_LABELS: Record<string, string> = {
  alta: "ALTA",
  media: "MEDIA",
  baja: "BAJA",
};

const KIND_LABELS: Record<string, string> = {
  gramatica: "Gramática",
  ortografia: "Ortografía",
  puntuacion: "Puntuación",
  estilo: "Estilo",
  estructura: "Estructura",
  doctrina: "Doctrina",
  formato: "Formato",
  otro: "Otro",
};

function severityColor(severity: string): string {
  if (severity === "alta") return "C0392B";
  if (severity === "media") return "E67E22";
  return "27AE60";
}

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none };
}

function thinBorders() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "D5D8DC" };
  return { top: border, bottom: border, left: border, right: border };
}

// ---------- Document builder ----------

export function buildCorrectionReportDocument(input: CorrectionReportInput): Document {
  const now = input.generatedAt ?? new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalAlta = input.corrections.filter((c) => c.severity === "alta").length;
  const totalMedia = input.corrections.filter((c) => c.severity === "media").length;
  const totalBaja = input.corrections.filter((c) => c.severity === "baja").length;

  // Group corrections by kind
  const byKind = new Map<string, CorrectionEntry[]>();
  for (const c of input.corrections) {
    const key = c.kind || "otro";
    if (!byKind.has(key)) byKind.set(key, []);
    byKind.get(key)!.push(c);
  }

  const sections: Paragraph[] = [];

  // ---- Title page ----
  sections.push(
    new Paragraph({ spacing: { after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "REPORTE DE CORRECCIONES", bold: true, size: 36, color: "1A3A6B", font: "Calibri" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: "Editorial", size: 22, color: "7F8C8D", font: "Calibri" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "Reino Editorial", bold: true, size: 26, color: "1A3A6B", font: "Calibri" }),
      ],
    }),
  );

  // Project info
  sections.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Obra: ", bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text: input.projectTitle, size: 22, font: "Calibri" }),
      ],
    }),
  );

  if (input.authorName) {
    sections.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Autor: ", bold: true, size: 22, font: "Calibri" }),
          new TextRun({ text: input.authorName, size: 22, font: "Calibri" }),
        ],
      }),
    );
  }

  sections.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Fecha: ", bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text: now, size: 22, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({ text: "Total de correcciones: ", bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text: String(input.corrections.length), size: 22, font: "Calibri" }),
      ],
    }),
  );

  // ---- Summary stats ----
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: "Resumen", bold: true, size: 26, color: "1A3A6B", font: "Calibri" }),
      ],
    }),
  );

  if (input.summary) {
    sections.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: input.summary, size: 20, font: "Calibri", italics: true, color: "555555" }),
        ],
      }),
    );
  }

  // Stats table
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: thinBorders(),
              shading: { fill: "C0392B", type: ShadingType.CLEAR, color: "auto" },
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Alta: ${totalAlta}`, bold: true, size: 20, color: "FFFFFF", font: "Calibri" })],
                }),
              ],
            }),
            new TableCell({
              borders: thinBorders(),
              shading: { fill: "E67E22", type: ShadingType.CLEAR, color: "auto" },
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Media: ${totalMedia}`, bold: true, size: 20, color: "FFFFFF", font: "Calibri" })],
                }),
              ],
            }),
            new TableCell({
              borders: thinBorders(),
              shading: { fill: "27AE60", type: ShadingType.CLEAR, color: "auto" },
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Baja: ${totalBaja}`, bold: true, size: 20, color: "FFFFFF", font: "Calibri" })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  sections.push(new Paragraph({ spacing: { after: 300 } }));

  // ---- Corrections by kind ----
  for (const [kind, corrections] of byKind) {
    sections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: `${KIND_LABELS[kind] ?? kind} (${corrections.length})`,
            bold: true,
            size: 24,
            color: "1A3A6B",
            font: "Calibri",
          }),
        ],
      }),
    );

    // Table header
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders: thinBorders(),
          shading: { fill: "1A3A6B", type: ShadingType.CLEAR, color: "auto" },
          width: { size: 5, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "#", bold: true, size: 18, color: "FFFFFF", font: "Calibri" })] })],
        }),
        new TableCell({
          borders: thinBorders(),
          shading: { fill: "1A3A6B", type: ShadingType.CLEAR, color: "auto" },
          width: { size: 10, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Severidad", bold: true, size: 18, color: "FFFFFF", font: "Calibri" })] })],
        }),
        new TableCell({
          borders: thinBorders(),
          shading: { fill: "1A3A6B", type: ShadingType.CLEAR, color: "auto" },
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Texto Original", bold: true, size: 18, color: "FFFFFF", font: "Calibri" })] })],
        }),
        new TableCell({
          borders: thinBorders(),
          shading: { fill: "1A3A6B", type: ShadingType.CLEAR, color: "auto" },
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Corrección Sugerida", bold: true, size: 18, color: "FFFFFF", font: "Calibri" })] })],
        }),
        new TableCell({
          borders: thinBorders(),
          shading: { fill: "1A3A6B", type: ShadingType.CLEAR, color: "auto" },
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Justificación", bold: true, size: 18, color: "FFFFFF", font: "Calibri" })] })],
        }),
      ],
    });

    const dataRows = corrections.map((c, idx) => {
      const sevColor = severityColor(c.severity);
      const rowShading = idx % 2 === 0 ? "FFFFFF" : "F8F9FA";

      return new TableRow({
        children: [
          new TableCell({
            borders: thinBorders(),
            shading: { fill: rowShading, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), size: 18, font: "Calibri" })] })],
          }),
          new TableCell({
            borders: thinBorders(),
            shading: { fill: rowShading, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [new TextRun({ text: SEVERITY_LABELS[c.severity] ?? c.severity, bold: true, size: 18, color: sevColor, font: "Calibri" })] })],
          }),
          new TableCell({
            borders: thinBorders(),
            shading: { fill: rowShading, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [new TextRun({ text: c.original_text, size: 18, font: "Calibri", strike: true, color: "C0392B" })] })],
          }),
          new TableCell({
            borders: thinBorders(),
            shading: { fill: rowShading, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [new TextRun({ text: c.suggested_text, size: 18, font: "Calibri", color: "27AE60" })] })],
          }),
          new TableCell({
            borders: thinBorders(),
            shading: { fill: rowShading, type: ShadingType.CLEAR, color: "auto" },
            children: [new Paragraph({ children: [new TextRun({ text: c.justification, size: 16, font: "Calibri", color: "555555", italics: true })] })],
          }),
        ],
      });
    });

    sections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      }),
    );
  }

  // ---- Footer note ----
  sections.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "Este documento fue generado autom\u00e1ticamente por el sistema de correcci\u00f3n editorial de Reino Editorial.",
          size: 16,
          font: "Calibri",
          italics: true,
          color: "999999",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Las correcciones propuestas son sugerencias y deben ser revisadas por el autor antes de su aplicaci\u00f3n.",
          size: 16,
          font: "Calibri",
          italics: true,
          color: "999999",
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "Reino Editorial",
    title: `Reporte de Correcciones - ${input.projectTitle}`,
    description: "Reporte autom\u00e1tico de correcciones ortogr\u00e1ficas y gramaticales",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 800, bottom: 1000, left: 800 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Reino Editorial \u2014 Reporte de Correcciones", size: 16, color: "AAAAAA", font: "Calibri", italics: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "P\u00e1gina ", size: 16, color: "AAAAAA", font: "Calibri" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "AAAAAA", font: "Calibri" }),
                  new TextRun({ text: " de ", size: 16, color: "AAAAAA", font: "Calibri" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "AAAAAA", font: "Calibri" }),
                ],
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  return doc;
}

/**
 * Generate a correction report as a Buffer (ready to send as download or upload to storage).
 */
export async function generateCorrectionReportBuffer(input: CorrectionReportInput): Promise<Buffer> {
  const doc = buildCorrectionReportDocument(input);
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
