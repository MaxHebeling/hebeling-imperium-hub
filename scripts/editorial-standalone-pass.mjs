import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const SAFE_CATEGORIES = new Set([
  "TYPOS",
  "TYPOGRAPHY",
  "CASING",
  "PUNCTUATION",
  "MISSPELLING",
]);

const SAFE_ISSUE_TYPES = new Set([
  "misspelling",
  "typographical",
  "whitespace",
  "duplication",
]);

const SAFE_RULE_IDS = new Set([
  "WHITESPACE_RULE",
  "ESPACIO_DESPUES_DE_PUNTO",
  "AUTO_NO_SEPARADO",
  "COMMA_PERO",
  "ENSENAR",
]);

const BLOCKED_RULE_IDS = new Set([
  "ORA_HORA",
  "SE",
  "MI_TILDE",
  "COMO_NO_TILDE",
  "QUE_TILDE2",
  "AUN",
  "AUN2",
  "SOLO",
  "ESTE_TILDE",
  "DIACRITICS_VERB_N_ADJ",
  "DIACRITICS_03",
  "AGREEMENT_ADJ_NOUN_AREA",
  "AGREEMENT_POSTPONED_ADJ",
  "DET_FEM_NOM_FEM",
  "ARTICULO_EN_TOPONIMOS",
  "MAYUSCULAS_INICIO_FRASE",
  "UPPERCASE_SENTENCE_START",
]);

const HEADING_LABELS = new Set([
  "Devocional",
  "Agradecimientos",
  "Introducción",
  "Introduccion",
]);

const MANUAL_PARAGRAPH_OVERRIDES = new Map([
  [
    8,
    "A mi abuela materna, que desde niña me inculcó el temor de Dios y por ello he corrido toda mi vida hasta el día de hoy. Buen trabajo; eso se lo he enseñado a mis hijos.",
  ],
  [
    11,
    "Finalmente, a mi querido esposo, el profeta Ernesto López, gracias por haber creído en mí. Eres un regalo de Dios para mi vida; tu apoyo, tu comprensión y tu fe me inspiran cada día a ser una mejor esposa y una fiel creyente. Gracias por amarme como Cristo ama a su iglesia y por proteger nuestra familia como tu prioridad. ¡Te amo!",
  ],
  [
    33,
    "Semana 4: No soy lo que otros dijeron de mí",
  ],
  [
    94,
    "¡Qué alegría me da escribir este prólogo a la mujer que más amo en esta vida, la que conozco y sé cómo piensa, la que me acompaña en cada proceso y ha vivido conmigo cada experiencia! Gracias por darme esta gran oportunidad. Si tienes este devocional en tus manos, no es por casualidad. Este libro es una invitación sagrada, un susurro del Padre que te llama por tu nombre para recordarte quién eres realmente.",
  ],
  [
    98,
    "A lo largo de estas páginas, te encontrarás con promesas que te abrazan, desafíos que te retan y verdades que te sacuden. Tal vez habrá días en que estas palabras parecerán incómodas, pero no temas: a veces Dios incomoda para despertar lo que ha estado dormido demasiado tiempo. Habrá devocionales que te confronten y otros que te llenen de consuelo, porque Dios sabe exactamente lo que necesitas cada día.",
  ],
  [
    690,
    "Que este devocional sea el comienzo de una vida abrazada, no una temporada pasajera. Que cada mañana recuerdes que, antes de enfrentarte al mundo, eres envuelta por la ternura del Dios que te formó. Que cuando el miedo te visite, encuentres refugio en Sus brazos eternos. Que cuando la duda te toque, escuches Su voz que dice: “Hija mía, estoy contigo”. Tu historia no termina aquí. El Padre continúa escribiendo capítulos nuevos sobre tu vida, llenos de misericordia fresca, gracia abundante y propósito renovado. Y mientras caminas hacia lo que viene, lleva esta certeza contigo: no importa cuán lejos vayas, jamás dejarás de estar al alcance de los brazos del Padre.",
  ],
]);

function stripDiacritics(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function isLikelyHeading(text) {
  if (!text) return false;
  if (HEADING_LABELS.has(text)) return true;
  if (/^Semana\s+\d+:/i.test(text)) return true;
  if (/[.!?…:]$/.test(text)) return false;

  const words = text.trim().split(/\s+/);
  return words.length <= 10;
}

function shouldApplyMatch(match, paragraphText) {
  if (!match.replacements?.length) return false;

  const ruleId = match.rule?.id ?? "";
  const categoryId = match.rule?.category?.id ?? "";
  const issueType = match.rule?.issueType ?? "";
  const replacement = match.replacements[0]?.value ?? "";
  const original = paragraphText.slice(match.offset, match.offset + match.length);

  if (!replacement || !original) return false;
  if (BLOCKED_RULE_IDS.has(ruleId)) return false;

  const normalizedOriginal = stripDiacritics(original).toLowerCase();
  const normalizedReplacement = stripDiacritics(replacement).toLowerCase();
  const isAcronymLike = /^[A-Z0-9]+$/.test(original);
  const isRomanNumeral = /^[IVXLCDM]+$/i.test(original);
  const isAlphabetic =
    /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/.test(original) &&
    /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/.test(replacement);

  if (
    isAlphabetic &&
    original.length > 3 &&
    !isAcronymLike &&
    !isRomanNumeral &&
    normalizedOriginal === normalizedReplacement
  ) {
    return true;
  }

  if (ruleId === "MORFOLOGIK_RULE_ES") {
    return false;
  }

  if (SAFE_RULE_IDS.has(ruleId)) return true;
  if (SAFE_CATEGORIES.has(categoryId)) return true;
  if (SAFE_ISSUE_TYPES.has(issueType)) return true;

  return false;
}

function applyMatches(paragraphText, matches, paragraphIndex) {
  const accepted = [];
  const skipped = [];

  for (const match of matches) {
    const original = paragraphText.slice(match.offset, match.offset + match.length);
    const replacement = match.replacements?.[0]?.value ?? "";
    const payload = {
      paragraph: paragraphIndex + 1,
      ruleId: match.rule?.id ?? "UNKNOWN",
      category: match.rule?.category?.id ?? "UNKNOWN",
      issueType: match.rule?.issueType ?? "UNKNOWN",
      original,
      replacement,
      sentence: match.sentence ?? paragraphText,
      message: match.message ?? "",
    };

    if (shouldApplyMatch(match, paragraphText)) {
      accepted.push({ ...match, payload });
    } else {
      skipped.push(payload);
    }
  }

  accepted.sort((a, b) => b.offset - a.offset);

  let updated = paragraphText;
  const applied = [];

  for (const match of accepted) {
    const original = updated.slice(match.offset, match.offset + match.length);
    const replacement = match.replacements?.[0]?.value ?? "";

    if (!original || !replacement) continue;

    updated =
      updated.slice(0, match.offset) +
      replacement +
      updated.slice(match.offset + match.length);

    applied.push(match.payload);
  }

  applied.reverse();

  return {
    updated,
    applied,
    skipped,
  };
}

async function checkParagraph(text) {
  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      language: "es",
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`LanguageTool request failed with status ${response.status}`);
  }

  return response.json();
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

function buildRuleBreakdown(changes) {
  const counts = new Map();
  for (const change of changes) {
    counts.set(change.ruleId, (counts.get(change.ruleId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ruleId, count]) => `- \`${ruleId}\`: ${count}`)
    .join("\n");
}

function buildSkippedPreview(skipped) {
  if (skipped.length === 0) {
    return "- No quedaron observaciones ambiguas en esta pasada conservadora.";
  }

  return skipped
    .slice(0, 40)
    .map((item) => {
      const suggestion = item.replacement ? ` -> ${item.replacement}` : "";
      return `- Párrafo ${item.paragraph} · \`${item.ruleId}\` · ${item.original}${suggestion}\n  ${item.sentence}`;
    })
    .join("\n");
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Uso: node scripts/editorial-standalone-pass.mjs <ruta-docx> [directorio-salida]");
  }

  const resolvedInput = path.resolve(inputPath);
  const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
  const outputDir =
    process.argv[3] != null
      ? path.resolve(process.argv[3])
      : path.join(path.dirname(resolvedInput), `${baseName} - Editorial`);

  await fs.mkdir(outputDir, { recursive: true });

  const extraction = await mammoth.extractRawText({ path: resolvedInput });
  const rawText = extraction.value ?? "";
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const correctedParagraphs = [];
  const appliedChanges = [];
  const skippedChanges = [];
  let manualOverrideCount = 0;

  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index];
    const result = await checkParagraph(paragraph);
    const processed = applyMatches(paragraph, result.matches ?? [], index);

    const overriddenParagraph = MANUAL_PARAGRAPH_OVERRIDES.get(index + 1);
    if (overriddenParagraph != null) {
      manualOverrideCount += 1;
    }

    correctedParagraphs.push(overriddenParagraph ?? processed.updated);
    appliedChanges.push(...processed.applied);
    if (overriddenParagraph == null) {
      skippedChanges.push(...processed.skipped);
    }

    if ((index + 1) % 100 === 0 || index === paragraphs.length - 1) {
      console.error(`Procesados ${index + 1}/${paragraphs.length} párrafos`);
    }
  }

  const correctedText = correctedParagraphs.join("\n\n");
  const correctedTextPath = path.join(outputDir, `${baseName} - corregido base.txt`);
  const correctedDocxPath = path.join(outputDir, `${baseName} - corregido base.docx`);
  const reportPath = path.join(outputDir, `${baseName} - reporte editorial.md`);
  const changesPath = path.join(outputDir, `${baseName} - cambios aplicados.json`);
  const skippedPath = path.join(outputDir, `${baseName} - observaciones pendientes.json`);

  const report = [
    `# Reporte editorial base`,
    ``,
    `- Archivo origen: \`${resolvedInput}\``,
    `- Párrafos procesados: ${paragraphs.length}`,
    `- Palabras aproximadas: ${rawText.trim() ? rawText.trim().split(/\s+/).length : 0}`,
    `- Cambios aplicados automáticamente: ${appliedChanges.length}`,
    `- Ajustes manuales editoriales: ${manualOverrideCount}`,
    `- Observaciones omitidas por ambigüedad: ${skippedChanges.length}`,
    ``,
    `## Criterio aplicado`,
    ``,
    `Se aplicó una pasada conservadora de ortografía, puntuación, espacios, mayúsculas y tildes seguras.`,
    `Se bloquearon reglas ambiguas que podían alterar el sentido devocional del texto, como \`ora/hora\`, tildes diacríticas dudosas y concordancias sensibles.`,
    ``,
    `## Reglas aplicadas`,
    ``,
    buildRuleBreakdown(appliedChanges) || "- No hubo cambios automáticos.",
    ``,
    `## Observaciones pendientes`,
    ``,
    buildSkippedPreview(skippedChanges),
    ``,
    `## Recomendación editorial`,
    ``,
    `Esta salida sirve como manuscrito corregido base para maquetación, pero conviene una revisión humana final para pulir estilo fino, consistencia bíblica y decisiones de voz/autora.`,
    ``,
  ].join("\n");

  await fs.writeFile(correctedTextPath, correctedText, "utf8");
  await writeDocx(correctedParagraphs, correctedDocxPath);
  await fs.writeFile(reportPath, report, "utf8");
  await fs.writeFile(changesPath, JSON.stringify(appliedChanges, null, 2), "utf8");
  await fs.writeFile(skippedPath, JSON.stringify(skippedChanges, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        input: resolvedInput,
        outputDir,
        correctedDocxPath,
        correctedTextPath,
        reportPath,
        appliedChanges: appliedChanges.length,
        skippedChanges: skippedChanges.length,
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
