import fs from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  Document,
  Footer,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";

const DISPLAY_FONT = "Georgia";
const BODY_FONT = "Garamond";
const ACCENT_COLOR = "7A4B35";
const SUBTLE_COLOR = "7A756F";
const BODY_COLOR = "2A2724";

const BODY_SIZE = 23;
const SMALL_SIZE = 19;
const LABEL_SIZE = 20;
const TITLE_SIZE = 36;
const SUBTITLE_SIZE = 24;
const PART_SIZE = 28;
const WEEK_SIZE = 27;

function makeRun(text, options = {}) {
  return new TextRun({
    text,
    font: options.font ?? BODY_FONT,
    size: options.size ?? BODY_SIZE,
    bold: options.bold ?? false,
    italics: options.italics ?? false,
    color: options.color ?? BODY_COLOR,
    allCaps: options.allCaps ?? false,
    smallCaps: options.smallCaps ?? false,
  });
}

function bodyParagraph(text, options = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: options.before ?? 0,
      after: options.after ?? 140,
      line: options.line ?? 360,
    },
    indent: options.indent
      ? { firstLine: convertInchesToTwip(0.22) }
      : undefined,
    children: [
      makeRun(text, {
        italics: options.italics,
        color: options.color,
      }),
    ],
  });
}

function centeredParagraph(text, options = {}) {
  return new Paragraph({
    pageBreakBefore: options.pageBreakBefore ?? false,
    alignment: AlignmentType.CENTER,
    heading: options.heading,
    spacing: {
      before: options.before ?? 0,
      after: options.after ?? 180,
      line: options.line,
    },
    children: [
      makeRun(text, {
        font: options.font ?? DISPLAY_FONT,
        size: options.size ?? BODY_SIZE,
        bold: options.bold ?? false,
        italics: options.italics ?? false,
        color: options.color ?? BODY_COLOR,
        allCaps: options.allCaps ?? false,
        smallCaps: options.smallCaps ?? false,
      }),
    ],
  });
}

function rightParagraph(text, options = {}) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: {
      before: options.before ?? 140,
      after: options.after ?? 180,
      line: options.line ?? 360,
    },
    children: [
      makeRun(text, {
        font: options.font ?? BODY_FONT,
        size: options.size ?? BODY_SIZE,
        italics: options.italics ?? false,
        color: options.color ?? BODY_COLOR,
      }),
    ],
  });
}

function labelParagraph(text) {
  return new Paragraph({
    spacing: { before: 120, after: 100 },
    children: [
      makeRun(text, {
        font: DISPLAY_FONT,
        size: LABEL_SIZE,
        bold: true,
        color: ACCENT_COLOR,
      }),
    ],
  });
}

function dividerParagraph() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 140 },
    children: [
      makeRun("* * *", {
        font: DISPLAY_FONT,
        size: SMALL_SIZE,
        color: SUBTLE_COLOR,
      }),
    ],
  });
}

function isWeekHeading(text) {
  return /^Semana\s+\d+:/i.test(text);
}

function isPartHeading(text) {
  return /^[IVXLCDM]+\.-\s+/.test(text);
}

function normalizePartTitle(text) {
  return text.replace(/^[IVXLCDM]+\.-\s+/, "").trim();
}

function parseContents(paragraphs) {
  const contents = [];
  let currentPart = null;

  for (const paragraph of paragraphs.slice(28, 92)) {
    if (isPartHeading(paragraph)) {
      const [numeral] = paragraph.split(".-");
      currentPart = {
        numeral: numeral.trim(),
        tocTitle: normalizePartTitle(paragraph),
        label: paragraph.trim(),
        weeks: [],
      };
      contents.push(currentPart);
      continue;
    }

    if (isWeekHeading(paragraph) && currentPart) {
      const match = paragraph.match(/^Semana\s+(\d+):/i);
      currentPart.weeks.push({
        number: Number(match?.[1] ?? 0),
        title: paragraph.trim(),
      });
    }
  }

  return contents;
}

function parseDevotions(paragraphs, contents) {
  const partByWeek = new Map();
  const bodyPartLabels = new Set(["Mi identidad en Cristo"]);

  for (const part of contents) {
    bodyPartLabels.add(part.tocTitle);
    for (const week of part.weeks) {
      partByWeek.set(week.number, part);
    }
  }

  const devotions = [];
  const epilogue = [];
  let currentDevotion = null;
  let inEpilogue = false;

  for (const paragraph of paragraphs.slice(110)) {
    if (paragraph === "Epílogo") {
      if (currentDevotion) {
        devotions.push(currentDevotion);
        currentDevotion = null;
      }
      inEpilogue = true;
      continue;
    }

    if (inEpilogue) {
      epilogue.push(paragraph);
      continue;
    }

    if (isWeekHeading(paragraph)) {
      if (currentDevotion) {
        devotions.push(currentDevotion);
      }

      const match = paragraph.match(/^Semana\s+(\d+):/i);
      const weekNumber = Number(match?.[1] ?? 0);
      currentDevotion = {
        weekNumber,
        title: paragraph.replace(/\.$/, "").trim(),
        part: partByWeek.get(weekNumber) ?? null,
        items: [],
      };
      continue;
    }

    if (bodyPartLabels.has(paragraph)) {
      continue;
    }

    if (currentDevotion) {
      currentDevotion.items.push(paragraph);
    }
  }

  if (currentDevotion) {
    devotions.push(currentDevotion);
  }

  return { devotions, epilogue };
}

function buildTitlePage(paragraphs) {
  const [formatLabel, title, subtitle, author] = paragraphs;

  return [
    centeredParagraph(formatLabel, {
      before: 1600,
      after: 260,
      font: DISPLAY_FONT,
      size: SMALL_SIZE,
      smallCaps: true,
      color: SUBTLE_COLOR,
    }),
    centeredParagraph(title, {
      after: 180,
      font: DISPLAY_FONT,
      size: TITLE_SIZE,
      bold: true,
      color: ACCENT_COLOR,
    }),
    centeredParagraph(subtitle, {
      after: 520,
      font: DISPLAY_FONT,
      size: SUBTITLE_SIZE,
      italics: true,
      color: SUBTLE_COLOR,
    }),
    centeredParagraph(author, {
      after: 180,
      font: BODY_FONT,
      size: BODY_SIZE,
      color: BODY_COLOR,
    }),
    centeredParagraph("Maqueta de revision para autora", {
      before: 420,
      font: DISPLAY_FONT,
      size: SMALL_SIZE,
      smallCaps: true,
      color: SUBTLE_COLOR,
    }),
  ];
}

function buildFrontMatter(title, paragraphs, { signature } = {}) {
  const children = [
    centeredParagraph(title, {
      pageBreakBefore: true,
      font: DISPLAY_FONT,
      size: PART_SIZE,
      bold: true,
      color: ACCENT_COLOR,
      after: 280,
    }),
  ];

  for (const paragraph of paragraphs) {
    if (!paragraph) continue;

    if (paragraph.startsWith("“") && paragraph.includes("—")) {
      children.push(
        centeredParagraph(paragraph, {
          font: BODY_FONT,
          size: BODY_SIZE,
          italics: true,
          color: SUBTLE_COLOR,
          after: 220,
        })
      );
      continue;
    }

    if (paragraph === "De mi corazón:") {
      children.push(
        labelParagraph("De mi corazon")
      );
      continue;
    }

    if (paragraph.endsWith(",") || paragraph === "Querida mujer de Reino,") {
      children.push(
        centeredParagraph(paragraph, {
          font: DISPLAY_FONT,
          size: BODY_SIZE,
          italics: true,
          color: ACCENT_COLOR,
          after: 180,
        })
      );
      continue;
    }

    children.push(bodyParagraph(paragraph, { indent: true }));
  }

  if (signature) {
    children.push(rightParagraph(signature, { before: 220 }));
  }

  return children;
}

function buildContentsSection(contents) {
  const children = [
    centeredParagraph("Contenido", {
      pageBreakBefore: true,
      font: DISPLAY_FONT,
      size: PART_SIZE,
      bold: true,
      color: ACCENT_COLOR,
      after: 260,
    }),
  ];

  for (const part of contents) {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          makeRun(`${part.numeral}. ${part.tocTitle}`, {
            font: DISPLAY_FONT,
            size: LABEL_SIZE,
            bold: true,
            color: ACCENT_COLOR,
          }),
        ],
      })
    );

    for (const week of part.weeks) {
      children.push(
        new Paragraph({
          spacing: { before: 0, after: 70 },
          indent: { left: convertInchesToTwip(0.2) },
          children: [
            makeRun(week.title, {
              size: SMALL_SIZE,
              color: BODY_COLOR,
            }),
          ],
        })
      );
    }
  }

  return children;
}

function buildPartPage(part) {
  return [
    centeredParagraph(`Parte ${part.numeral}`, {
      pageBreakBefore: true,
      before: 1800,
      after: 140,
      font: DISPLAY_FONT,
      size: LABEL_SIZE,
      smallCaps: true,
      color: SUBTLE_COLOR,
    }),
    centeredParagraph(part.tocTitle, {
      after: 220,
      font: DISPLAY_FONT,
      size: PART_SIZE,
      bold: true,
      color: ACCENT_COLOR,
    }),
    centeredParagraph("Maqueta de revision", {
      font: DISPLAY_FONT,
      size: SMALL_SIZE,
      italics: true,
      color: SUBTLE_COLOR,
    }),
  ];
}

function buildDevotion(devotion) {
  const children = [
    centeredParagraph(
      `Parte ${devotion.part?.numeral ?? ""} · ${devotion.part?.tocTitle ?? ""}`.trim(),
      {
        pageBreakBefore: true,
        before: 300,
        after: 120,
        font: DISPLAY_FONT,
        size: SMALL_SIZE,
        smallCaps: true,
        color: SUBTLE_COLOR,
      }
    ),
    centeredParagraph(devotion.title, {
      after: 180,
      font: DISPLAY_FONT,
      size: WEEK_SIZE,
      bold: true,
      color: ACCENT_COLOR,
    }),
  ];

  const [verse, ...rest] = devotion.items;

  if (verse) {
    children.push(
      centeredParagraph(verse, {
        font: BODY_FONT,
        size: BODY_SIZE,
        italics: true,
        color: SUBTLE_COLOR,
        after: 220,
      })
    );
    children.push(dividerParagraph());
  }

  let mode = "body";

  for (const paragraph of rest) {
    if (/^Oración:?$/i.test(paragraph)) {
      mode = "prayer";
      children.push(labelParagraph("Oracion"));
      continue;
    }

    if (/^Declaración\s+Profética:?$/i.test(paragraph) || /^Declaración\s+profética:?$/i.test(paragraph)) {
      mode = "declaration";
      children.push(labelParagraph("Declaracion profetica"));
      continue;
    }

    if (mode === "prayer") {
      children.push(bodyParagraph(paragraph, { indent: true, italics: true }));
      mode = "body";
      continue;
    }

    if (mode === "declaration") {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 180, line: 360 },
          indent: {
            left: convertInchesToTwip(0.15),
            right: convertInchesToTwip(0.15),
          },
          children: [
            makeRun(paragraph, {
              italics: true,
              color: ACCENT_COLOR,
            }),
          ],
        })
      );
      mode = "body";
      continue;
    }

    children.push(bodyParagraph(paragraph, { indent: true }));
  }

  return children;
}

function buildEpilogue(paragraphs) {
  const children = [
    centeredParagraph("Epilogo", {
      pageBreakBefore: true,
      font: DISPLAY_FONT,
      size: PART_SIZE,
      bold: true,
      color: ACCENT_COLOR,
      after: 260,
    }),
  ];

  for (const paragraph of paragraphs) {
    children.push(bodyParagraph(paragraph, { indent: true }));
  }

  return children;
}

async function main() {
  const productionDirArg = process.argv[2];
  const baseNameArg = process.argv[3] ?? "En los brazos del Padre";

  if (!productionDirArg) {
    throw new Error(
      "Uso: node scripts/editorial-build-review-layout.mjs <directorio-produccion> [nombre-base]"
    );
  }

  const productionDir = path.resolve(productionDirArg);
  const baseName = baseNameArg;
  const sourceTextPath = path.join(
    productionDir,
    "02 Listo para maquetar",
    `${baseName} - listo para maquetar.txt`
  );
  const outputDir = path.join(productionDir, "05 Maqueta revision autora");
  const reviewDocxPath = path.join(
    outputDir,
    `${baseName} - maqueta de revision autora.docx`
  );
  const notesPath = path.join(outputDir, "LEER PRIMERO - maqueta de revision.txt");

  await fs.mkdir(outputDir, { recursive: true });

  const sourceText = await fs.readFile(sourceTextPath, "utf8");
  const paragraphs = sourceText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const contents = parseContents(paragraphs);
  const { devotions, epilogue } = parseDevotions(paragraphs, contents);

  if (contents.length !== 12) {
    throw new Error(`Se esperaban 12 partes y se encontraron ${contents.length}`);
  }

  if (devotions.length !== 52) {
    throw new Error(`Se esperaban 52 devocionales y se encontraron ${devotions.length}`);
  }

  const children = [
    ...buildTitlePage(paragraphs.slice(0, 4)),
    ...buildFrontMatter("Agradecimientos", paragraphs.slice(5, 11)),
    ...buildFrontMatter("Dedicatoria", paragraphs.slice(12, 27)),
    ...buildContentsSection(contents),
    ...buildFrontMatter("Prologo", paragraphs.slice(93, 102), {
      signature: paragraphs[102],
    }),
    ...buildFrontMatter("Introduccion", paragraphs.slice(104, 109), {
      signature: paragraphs[109],
    }),
  ];

  let currentPartNumber = null;

  for (const devotion of devotions) {
    if (devotion.part && devotion.part.numeral !== currentPartNumber) {
      children.push(...buildPartPage(devotion.part));
      currentPartNumber = devotion.part.numeral;
    }

    children.push(...buildDevotion(devotion));
  }

  children.push(...buildEpilogue(epilogue));

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [
          makeRun(`${baseName}  ·  `, {
            font: BODY_FONT,
            size: SMALL_SIZE,
            color: SUBTLE_COLOR,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: BODY_FONT,
            size: SMALL_SIZE,
            color: SUBTLE_COLOR,
          }),
        ],
      }),
    ],
  });

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(6),
              height: convertInchesToTwip(9),
            },
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        footers: {
          default: footer,
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);
  await fs.writeFile(reviewDocxPath, buffer);

  const notes = [
    "MAQUETA DE REVISION PARA AUTORA",
    "",
    `Archivo principal: ${path.basename(reviewDocxPath)}`,
    "",
    "Criterio aplicado:",
    "- Tamano de pagina simulado de libro 6x9 pulgadas.",
    "- Separacion de preliminares, partes tematicas y semanas/devocionales.",
    "- Cada semana inicia en pagina nueva para facilitar la revision visual.",
    "- Esta salida es para revision de autora, no para imprenta final.",
    "",
    "Siguiente paso sugerido:",
    "- Enviar este Word a la autora para que revise estructura, orden y texto.",
    "- Recoger cambios y luego cerrar la maqueta definitiva.",
    "",
  ].join("\n");

  await fs.writeFile(notesPath, notes, "utf8");

  console.log(
    JSON.stringify(
      {
        sourceTextPath,
        reviewDocxPath,
        notesPath,
        parts: contents.length,
        devotions: devotions.length,
        epilogueParagraphs: epilogue.length,
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
