import fs from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

function cleanMarkdownInline(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: options.spacing ?? { after: 140 },
    heading: options.heading,
    alignment: options.alignment,
    children: [
      new TextRun({
        text,
        bold: options.bold ?? false,
        italics: options.italics ?? false,
        size: options.size,
      }),
    ],
  });
}

function buildMarkdownDoc(title, markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const children = [
    paragraph(title, {
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  ];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    if (line.startsWith("# ")) {
      children.push(
        paragraph(cleanMarkdownInline(line.slice(2)), {
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 160 },
        })
      );
      continue;
    }

    if (line.startsWith("## ")) {
      children.push(
        paragraph(cleanMarkdownInline(line.slice(3)), {
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 220, after: 140 },
        })
      );
      continue;
    }

    if (line.startsWith("- ")) {
      children.push(
        paragraph(cleanMarkdownInline(`• ${line.slice(2)}`), {
          spacing: { after: 90 },
        })
      );
      continue;
    }

    children.push(paragraph(cleanMarkdownInline(line)));
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

function buildChangesDoc(title, changes, kindLabel) {
  const children = [
    paragraph(title, {
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
    }),
    paragraph(`${kindLabel}: ${changes.length}`, {
      bold: true,
      spacing: { after: 200 },
    }),
  ];

  for (const change of changes) {
    const summary = change.ruleId
      ? `Párrafo ${change.paragraph} · ${change.ruleId}`
      : `Párrafo ${change.paragraph}`;

    children.push(
      paragraph(summary, {
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 90 },
      }),
      paragraph(`Original: ${change.original ?? ""}`),
      paragraph(`Sugerencia: ${change.replacement ?? ""}`),
      paragraph(`Frase: ${change.sentence ?? ""}`),
      paragraph(`Nota: ${change.message ?? ""}`, {
        italics: true,
        spacing: { after: 180 },
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

function buildCombinedDoc(input) {
  const children = [
    paragraph(input.title, {
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
    }),
    paragraph("Paquete editorial en Word", {
      alignment: AlignmentType.CENTER,
      italics: true,
      spacing: { after: 260 },
    }),
    paragraph(`Archivo corregido base: ${input.correctedDocxName}`, {
      bold: true,
      spacing: { after: 200 },
    }),
    paragraph("Resumen ejecutivo", {
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 140 },
    }),
  ];

  for (const line of input.reportSummaryLines) {
    children.push(paragraph(`• ${cleanMarkdownInline(line)}`, { spacing: { after: 90 } }));
  }

  children.push(
    paragraph("Observaciones pendientes", {
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 140 },
    })
  );

  for (const item of input.pending.slice(0, 25)) {
    children.push(
      paragraph(`Párrafo ${item.paragraph} · ${item.ruleId}`, {
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 160, after: 80 },
      }),
      paragraph(`Texto observado: ${item.original ?? ""}`),
      paragraph(`Sugerencia automática: ${item.replacement ?? ""}`),
      paragraph(`${item.sentence ?? ""}`, { italics: true, spacing: { after: 150 } })
    );
  }

  children.push(
    paragraph("Cambios aplicados", {
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 140 },
    })
  );

  for (const item of input.applied) {
    children.push(
      paragraph(`Párrafo ${item.paragraph} · ${item.ruleId}`, {
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 160, after: 80 },
      }),
      paragraph(`Original: ${item.original ?? ""}`),
      paragraph(`Aplicado: ${item.replacement ?? ""}`),
      paragraph(`${item.sentence ?? ""}`, { italics: true, spacing: { after: 150 } })
    );
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

async function writeDocx(document, outputPath) {
  const buffer = await Packer.toBuffer(document);
  await fs.writeFile(outputPath, buffer);
}

async function main() {
  const editorialDir = process.argv[2];
  const baseName = process.argv[3];

  if (!editorialDir || !baseName) {
    throw new Error(
      "Uso: node scripts/editorial-export-word-package.mjs <directorio-editorial> <base-name>"
    );
  }

  const resolvedDir = path.resolve(editorialDir);
  const reportPath = path.join(resolvedDir, `${baseName} - reporte editorial.md`);
  const pendingPath = path.join(resolvedDir, `${baseName} - observaciones pendientes.json`);
  const appliedPath = path.join(resolvedDir, `${baseName} - cambios aplicados.json`);

  const reportText = await fs.readFile(reportPath, "utf8");
  const pending = JSON.parse(await fs.readFile(pendingPath, "utf8"));
  const applied = JSON.parse(await fs.readFile(appliedPath, "utf8"));

  const reportDocxPath = path.join(resolvedDir, `${baseName} - reporte editorial.docx`);
  const pendingDocxPath = path.join(resolvedDir, `${baseName} - observaciones pendientes.docx`);
  const appliedDocxPath = path.join(resolvedDir, `${baseName} - cambios aplicados.docx`);
  const combinedDocxPath = path.join(resolvedDir, `${baseName} - paquete editorial.docx`);

  const reportSummaryLines = reportText
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- "))
    .slice(0, 6);

  await writeDocx(
    buildMarkdownDoc(`${baseName} · Reporte Editorial`, reportText),
    reportDocxPath
  );

  await writeDocx(
    buildChangesDoc(`${baseName} · Observaciones Pendientes`, pending, "Observaciones"),
    pendingDocxPath
  );

  await writeDocx(
    buildChangesDoc(`${baseName} · Cambios Aplicados`, applied, "Cambios"),
    appliedDocxPath
  );

  await writeDocx(
    buildCombinedDoc({
      title: `${baseName} · Entrega Editorial`,
      correctedDocxName: `${baseName} - corregido base.docx`,
      reportSummaryLines,
      pending,
      applied,
    }),
    combinedDocxPath
  );

  console.log(
    JSON.stringify(
      {
        reportDocxPath,
        pendingDocxPath,
        appliedDocxPath,
        combinedDocxPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
