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

const HEADING_LABELS = new Set([
  "Devocional",
  "Agradecimientos",
  "Introducción",
  "Introduccion",
]);

const FINAL_PARAGRAPH_OVERRIDES = new Map([
  [65, "Semana 30: Cómo Dios guía en el amor y la familia"],
  [
    149,
    "Padre, hoy renuncio a cada palabra que no vino de Ti y que me hizo sentir menos. Sana mi corazón, renueva mi mente y enséñame a escuchar solo tu voz. Afírmame en tu amor. Amén.",
  ],
  [
    404,
    "Dios desea rodearte de conexiones que edifiquen tu identidad y confirmen tu propósito. Personas que oren contigo, que te corrijan en amor, que celebren tu crecimiento y no compitan con tu llamado. No estás llamada a soportar vínculos tóxicos por temor, necesidad emocional o culpa. Estás llamada a caminar con sabiduría, aun en el amor.",
  ],
  [436, "Semana 30: Cómo Dios guía en el amor y la familia"],
  [
    451,
    "Quizás te has sentido pequeña, invisible o fuera de lugar, pero quiero recordarte: Dios no se equivocó contigo. Tus dones, tu historia, tus luchas y aun tus debilidades son parte de un diseño mayor. No esperes a estar “lista”; Dios te capacita mientras obedeces. Este es tu tiempo, y lo que Dios ha depositado en ti es necesario para otros.",
  ],
]);

const RESOLUTION_NOTES = new Map([
  ["21:AGREEMENT_ADJ_NOUN_AREA", "Se conserva. La construcción «la hija que tanto ama» es correcta en contexto."],
  ["56:MAYUSCULAS_INICIO_FRASE", "Se conserva. El encabezado usa numeración romana intencional."],
  ["57:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en este título."],
  ["65:COMO_NO_TILDE", "Se ajusta el título a «Cómo Dios guía en el amor y la familia». Se conserva la tilde en «Cómo» por funcionar como encabezado temático."],
  ["110:MORFOLOGIK_RULE_ES", "Se conserva. «Pr.» es abreviatura válida en la firma del prólogo."],
  ["124:MORFOLOGIK_RULE_ES", "Se conserva. «NVI» es la sigla correcta de la versión bíblica citada."],
  ["134:MORFOLOGIK_RULE_ES", "Se conserva. «NVI» es la sigla correcta de la versión bíblica citada."],
  ["144:MORFOLOGIK_RULE_ES", "Se conserva. «NVI» es la sigla correcta de la versión bíblica citada."],
  ["149:SOLO", "Se ajusta a «solo» sin tilde para uniformidad ortográfica."],
  ["154:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["165:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["187:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["198:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["200:AUN2", "Se conserva «aun» sin tilde. Aquí equivale a «incluso», no a «todavía»."],
  ["209:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["220:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["231:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["286:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["297:MORFOLOGIK_RULE_ES", "Se conserva la cita tal como quedó en el manuscrito base."],
  ["346:AUN2", "Se conserva «aun» sin tilde. Aquí equivale a «incluso»."],
  ["354:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en este título."],
  ["355:MORFOLOGIK_RULE_ES", "Se conserva. «16b» identifica correctamente la segunda parte del versículo."],
  ["357:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en contexto."],
  ["364:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en contexto."],
  ["368:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en contexto."],
  ["379:DET_FEM_NOM_FEM", "Se conserva la cita bíblica. «La ama» remite a «la lengua»."],
  ["402:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["404:AUN", "Se ajusta a «aun en el amor» por valor concesivo de «incluso»."],
  ["428:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en contexto."],
  ["436:COMO_NO_TILDE", "Se ajusta el título a «Cómo Dios guía en el amor y la familia». Se conserva la tilde en «Cómo» por funcionar como encabezado temático."],
  ["450:MORFOLOGIK_RULE_ES", "Se conserva. «Mardoqueo» es el nombre propio correcto."],
  ["451:AUN", "Se ajusta a «aun tus debilidades» por valor de «incluso»."],
  ["459:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["492:MORFOLOGIK_RULE_ES", "Se conserva. «Lapidot» es el nombre propio correcto de la cita."],
  ["516:ARTICULO_EN_TOPONIMOS", "Se conserva «al Salvador». No se refiere al topónimo «El Salvador»."],
  ["539:ORA_HORA", "Se conserva. «Ora» es el verbo correcto en contexto."],
  ["547:MORFOLOGIK_RULE_ES", "Se conserva. «NTV» es la sigla correcta de la versión bíblica citada."],
  ["639:UPPERCASE_SENTENCE_START", "Se conserva. La minúscula después de los puntos suspensivos funciona aquí como continuidad enfática de la misma idea."],
]);

function isLikelyHeading(text) {
  if (!text) return false;
  if (HEADING_LABELS.has(text)) return true;
  if (/^Semana\s+\d+:/i.test(text)) return true;
  if (/[.!?…:]$/.test(text)) return false;

  const words = text.trim().split(/\s+/);
  return words.length <= 10;
}

function createTextParagraph(text, index) {
  if (index <= 3) {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new TextRun({
          text,
          bold: index <= 2,
          size: index === 1 ? 34 : 28,
        }),
      ],
    });
  }

  if (isLikelyHeading(text)) {
    return new Paragraph({
      heading: /^Semana\s+\d+:/i.test(text)
        ? HeadingLevel.HEADING_1
        : HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 180 },
      children: [new TextRun({ text, bold: true })],
    });
  }

  return new Paragraph({
    spacing: { after: 180 },
    children: [new TextRun(text)],
  });
}

function createReportParagraph(text, { heading = false, bullet = false } = {}) {
  return new Paragraph({
    heading: heading ? HeadingLevel.HEADING_2 : undefined,
    bullet: bullet ? { level: 0 } : undefined,
    spacing: { before: heading ? 240 : 0, after: 140 },
    children: [new TextRun(text)],
  });
}

async function writeDocx(paragraphs, outputPath) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs.map((paragraph, index) =>
          createTextParagraph(paragraph, index)
        ),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
}

async function writeReportDocx(paragraphs, outputPath) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(outputPath, buffer);
}

async function main() {
  const editorialDirArg = process.argv[2];
  const baseNameArg = process.argv[3] ?? "En los brazos del Padre";

  if (!editorialDirArg) {
    throw new Error(
      "Uso: node scripts/editorial-finalize-manuscript.mjs <directorio-editorial> [nombre-base]"
    );
  }

  const editorialDir = path.resolve(editorialDirArg);
  const baseName = baseNameArg;
  const correctedTextPath = path.join(editorialDir, `${baseName} - corregido base.txt`);
  const pendingJsonPath = path.join(
    editorialDir,
    `${baseName} - observaciones pendientes.json`
  );
  const finalTextPath = path.join(editorialDir, `${baseName} - listo para maquetar.txt`);
  const finalDocxPath = path.join(editorialDir, `${baseName} - listo para maquetar.docx`);
  const closureDocxPath = path.join(editorialDir, `${baseName} - cierre editorial.docx`);
  const closureJsonPath = path.join(editorialDir, `${baseName} - cierre editorial.json`);

  const correctedText = await fs.readFile(correctedTextPath, "utf8");
  const pendingItems = JSON.parse(await fs.readFile(pendingJsonPath, "utf8"));
  const paragraphs = correctedText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const [paragraphNumber, replacement] of FINAL_PARAGRAPH_OVERRIDES.entries()) {
    paragraphs[paragraphNumber - 1] = replacement;
  }

  const decisions = pendingItems.map((item) => {
    const key = `${item.paragraph}:${item.ruleId}`;
    const note = RESOLUTION_NOTES.get(key);

    if (!note) {
      throw new Error(`Falta nota editorial para ${key}`);
    }

    return {
      paragraph: item.paragraph,
      ruleId: item.ruleId,
      original: item.original,
      suggestedReplacement: item.replacement,
      sentence: item.sentence,
      status: FINAL_PARAGRAPH_OVERRIDES.has(item.paragraph) ? "applied" : "kept",
      note,
    };
  });

  const applied = decisions.filter((item) => item.status === "applied");
  const kept = decisions.filter((item) => item.status === "kept");

  const reportParagraphs = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "Cierre editorial final", bold: true, size: 32 })],
    }),
    createReportParagraph(`${baseName}`),
    createReportParagraph("Resumen", { heading: true }),
    createReportParagraph(
      `Observaciones revisadas: ${decisions.length}`,
      { bullet: true }
    ),
    createReportParagraph(
      `Ajustes finales aplicados: ${applied.length}`,
      { bullet: true }
    ),
    createReportParagraph(
      `Observaciones cerradas sin cambio: ${kept.length}`,
      { bullet: true }
    ),
    createReportParagraph(
      "Resultado editorial: manuscrito unificado y listo para maquetación.",
      { bullet: true }
    ),
    createReportParagraph("Ajustes aplicados", { heading: true }),
    ...applied.map((item) =>
      createReportParagraph(
        `Párrafo ${item.paragraph}. ${item.note}`,
        { bullet: true }
      )
    ),
    createReportParagraph("Decisiones conservadas", { heading: true }),
    ...kept.map((item) =>
      createReportParagraph(
        `Párrafo ${item.paragraph}. ${item.note}`,
        { bullet: true }
      )
    ),
  ];

  await fs.writeFile(finalTextPath, `${paragraphs.join("\n\n")}\n`, "utf8");
  await writeDocx(paragraphs, finalDocxPath);
  await writeReportDocx(reportParagraphs, closureDocxPath);
  await fs.writeFile(closureJsonPath, JSON.stringify(decisions, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        finalDocxPath,
        finalTextPath,
        closureDocxPath,
        closureJsonPath,
        reviewedObservations: decisions.length,
        appliedAdjustments: applied.length,
        keptDecisions: kept.length,
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
