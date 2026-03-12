import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  CarriageReturn,
} from "docx";

/**
 * Genera un buffer DOCX a partir de una lista de párrafos (strings).
 * Cada string es un párrafo; \n dentro de un párrafo se convierte en salto de línea.
 */
export async function generateDocxFromParagraphs(paragraphs: string[]): Promise<Buffer> {
  const sectionChildren: Paragraph[] = paragraphs.map((text) => {
    const parts = text.split(/\n/).flatMap((line, i, arr) => {
      const run = new TextRun(line);
      const isLast = i === arr.length - 1;
      return isLast ? [run] : [run, new CarriageReturn()];
    });
    return new Paragraph({
      children: parts.length > 0 ? parts : [new TextRun("")],
      alignment: AlignmentType.LEFT,
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children:
          sectionChildren.length > 0
            ? sectionChildren
            : [new Paragraph({ children: [new TextRun("")] })],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/**
 * Genera un DOCX a partir de texto plano (párrafos separados por doble salto).
 */
export async function generateDocxFromText(fullText: string): Promise<Buffer> {
  const paragraphs = fullText.trim()
    ? fullText.split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean)
    : [""];
  return generateDocxFromParagraphs(paragraphs);
}
