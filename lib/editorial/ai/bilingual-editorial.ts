/**
 * Bilingual Editorial Intelligence Module
 *
 * Supports Spanish and American English editorial standards with:
 * - Automatic language detection
 * - Language-specific editorial rules
 * - Translation capability (ES<>EN) with theological accuracy
 * - Bible verse protection
 * - Christian terminology preservation
 * - Pastoral tone maintenance
 */

// ─── Language Detection ─────────────────────────────────────────────

export type ManuscriptLanguage = "es" | "en" | "mixed";

interface LanguageDetectionResult {
  /** Detected primary language */
  language: ManuscriptLanguage;
  /** Confidence score 0-1 */
  confidence: number;
  /** Percentage of text in each language */
  breakdown: {
    spanish: number;
    english: number;
    other: number;
  };
  /** Sample indicators that led to the detection */
  indicators: string[];
}

/**
 * Detect the language of a manuscript text using heuristic analysis.
 * This runs locally without AI calls for fast initial detection.
 */
export function detectManuscriptLanguage(
  text: string
): LanguageDetectionResult {
  const sampleText = text.slice(0, 10000);
  const words = sampleText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      language: "es",
      confidence: 0,
      breakdown: { spanish: 0, english: 0, other: 0 },
      indicators: ["Texto vacio - idioma por defecto: espanol"],
    };
  }

  // Spanish-specific indicators
  const spanishPatterns = [
    /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\u00bf\u00a1]/g,
    /\b(que|del|los|las|una|por|con|para|como|este|esta|pero|mas|tambien|porque|entre|desde|sobre|tiene|puede|cuando|donde|hay|ser|estar|hacer|poder|decir|algo|otro|despues|ahora|siempre|aunque|mismo|cada|todo|muy)\b/gi,
    /\b(el|la|lo|de|en|es|un|se|no|al|le|su|me|ya|te|si|nos|mi)\b/gi,
  ];

  const englishPatterns = [
    /\b(the|and|that|have|for|not|with|you|this|but|his|from|they|been|said|each|which|their|will|other|about|many|then|them|these|some|would|make|like|into|could|time|very|when|come|made|after|only|also|back|just|know|take|people|year|your|good|give|most|work|well|way|even|new|want|because|first|still|much|find|here|thing|before|thought|through|long|right|where|does|should|between|under|never|same|another|those|tell|while|last|might|great|since|against|went|often|being|world|without|again|place|around|however|home|small|found|began|upon|part|keep)\b/gi,
    /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|i'm|i've|i'll|i'd|he's|she's|it's|we're|they're|you're|you've|you'll|we've|they've|let's)\b/gi,
  ];

  let spanishScore = 0;
  let englishScore = 0;
  const foundIndicators: string[] = [];

  // Check for accented characters (strong Spanish indicator)
  const accentedChars = (
    sampleText.match(/[\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\u00bf\u00a1]/g) || []
  ).length;
  if (accentedChars > 5) {
    spanishScore += accentedChars * 2;
    foundIndicators.push(`Caracteres acentuados: ${accentedChars}`);
  }

  for (const pattern of spanishPatterns) {
    const matches = sampleText.match(pattern);
    if (matches) {
      spanishScore += matches.length;
    }
  }

  for (const pattern of englishPatterns) {
    const matches = sampleText.match(pattern);
    if (matches) {
      englishScore += matches.length;
    }
  }

  const total = spanishScore + englishScore || 1;
  const spanishPct = Math.round((spanishScore / total) * 100);
  const englishPct = Math.round((englishScore / total) * 100);

  let language: ManuscriptLanguage;
  let confidence: number;

  if (spanishPct > 70) {
    language = "es";
    confidence = Math.min(spanishPct / 100, 0.99);
    foundIndicators.push(`Espanol dominante: ${spanishPct}%`);
  } else if (englishPct > 70) {
    language = "en";
    confidence = Math.min(englishPct / 100, 0.99);
    foundIndicators.push(`Ingles dominante: ${englishPct}%`);
  } else {
    language = "mixed";
    confidence = Math.max(spanishPct, englishPct) / 100;
    foundIndicators.push(`Texto mixto: ES ${spanishPct}% / EN ${englishPct}%`);
  }

  return {
    language,
    confidence,
    breakdown: {
      spanish: spanishPct,
      english: englishPct,
      other: Math.max(0, 100 - spanishPct - englishPct),
    },
    indicators: foundIndicators,
  };
}

// ─── Editorial Standards ────────────────────────────────────────────

export interface EditorialStandard {
  language: ManuscriptLanguage;
  name: string;
  description: string;
  rules: string[];
}

export const SPANISH_EDITORIAL_STANDARD: EditorialStandard = {
  language: "es",
  name: "Estandar Editorial Espanol Latinoamericano",
  description:
    "Normas editoriales profesionales para publicaciones en espanol latinoamericano.",
  rules: [
    "Seguir normas RAE vigentes para ortografia y gramatica",
    "Respetar convenciones del espanol latinoamericano",
    "Mantener claridad y legibilidad por encima de formalismo academico",
    "Preservar tono pastoral cuando sea relevante",
    "Comillas angulares como primera opcion, inglesas como segunda",
    "Raya para dialogos e incisos, NO guion ni guion largo",
    "Puntos suspensivos como caracter tipografico",
    "Numeros: del uno al veinte en letras; cifras a partir de 21",
    "Coma vocativa obligatoria",
    "Tildes diacriticas segun normativa vigente",
    "Evitar formalismos academicos innecesarios",
    "Priorizar naturalidad del espanol hablado en America Latina",
  ],
};

export const AMERICAN_ENGLISH_EDITORIAL_STANDARD: EditorialStandard = {
  language: "en",
  name: "American English Editorial Standard",
  description:
    "Professional editorial standards for American English publications.",
  rules: [
    "Use American spelling: color, center, organization, favor (NOT British)",
    "Produce natural American English, not academic or overly formal",
    "Text should read as if a native American English speaker wrote it",
    "Clear, natural, conversational, reader-friendly tone",
    "Use double quotation marks as primary",
    "Em dash for parenthetical statements",
    "En dash for ranges (pages 10-15)",
    "Oxford comma when it improves clarity",
    "Consistent American date format (Month Day, Year)",
    "Avoid academic jargon and overly complex sentence structures",
    "Avoid unnatural literal translations from Spanish",
    "Maintain accessibility for general Christian readership",
  ],
};

/**
 * Get the editorial standard for a given language.
 */
export function getEditorialStandard(
  language: ManuscriptLanguage
): EditorialStandard {
  switch (language) {
    case "en":
      return AMERICAN_ENGLISH_EDITORIAL_STANDARD;
    case "es":
    case "mixed":
    default:
      return SPANISH_EDITORIAL_STANDARD;
  }
}

// ─── Bible Verse Protection ─────────────────────────────────────────

export interface BibleVerseReference {
  matchedText: string;
  book: string;
  chapter: number;
  verse: string;
  position: number;
  language: ManuscriptLanguage;
}

const BIBLE_BOOKS_ES = [
  "Genesis", "Exodo", "Levitico", "Numeros", "Deuteronomio",
  "Josue", "Jueces", "Rut", "Samuel", "Reyes", "Cronicas",
  "Esdras", "Nehemias", "Ester", "Job", "Salmos", "Salmo",
  "Proverbios", "Eclesiastes", "Cantares", "Isaias", "Jeremias",
  "Lamentaciones", "Ezequiel", "Daniel", "Oseas", "Joel", "Amos",
  "Abdias", "Jonas", "Miqueas", "Nahum", "Habacuc", "Sofonias",
  "Hageo", "Zacarias", "Malaquias",
  "Mateo", "Marcos", "Lucas", "Juan", "Hechos", "Romanos",
  "Corintios", "Galatas", "Efesios", "Filipenses", "Colosenses",
  "Tesalonicenses", "Timoteo", "Tito", "Filemon", "Hebreos",
  "Santiago", "Pedro", "Judas", "Apocalipsis",
];

const BIBLE_BOOKS_EN = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "Samuel", "Kings", "Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Psalm",
  "Proverbs", "Ecclesiastes", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "Thessalonians", "Timothy", "Titus", "Philemon", "Hebrews",
  "James", "Peter", "Jude", "Revelation",
];

/**
 * Detect Bible verse references in text.
 * Returns positions that should be protected from editorial changes.
 */
export function detectBibleReferences(text: string): BibleVerseReference[] {
  const references: BibleVerseReference[] = [];
  const allBooks = [...BIBLE_BOOKS_ES, ...BIBLE_BOOKS_EN];

  const bookPattern = allBooks
    .map((b) => b.replace(/\s+/g, "\\s+"))
    .join("|");
  const regex = new RegExp(
    `(?:\\d\\s+)?(?:${bookPattern})\\s+\\d{1,3}(?::\\d{1,3}(?:\\s*[-]\\s*\\d{1,3})?)`,
    "gi"
  );

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const parts = matchedText.match(
      /(?:(\d)\s+)?([\w\s]+?)\s+(\d{1,3})(?::(\d{1,3}(?:\s*[-]\s*\d{1,3})?))?/
    );

    if (parts) {
      const book = (parts[1] ? `${parts[1]} ` : "") + parts[2].trim();
      const isSpanish = BIBLE_BOOKS_ES.some(
        (b) => b.toLowerCase() === parts[2].trim().toLowerCase()
      );

      references.push({
        matchedText,
        book,
        chapter: parseInt(parts[3], 10),
        verse: parts[4] || "",
        position: match.index,
        language: isSpanish ? "es" : "en",
      });
    }
  }

  return references;
}

// ─── Christian Terminology ──────────────────────────────────────────

export interface TerminologyPair {
  spanish: string;
  english: string;
  context: string;
}

/**
 * Standard Christian terminology mappings.
 * These must be preserved accurately in translations.
 */
export const CHRISTIAN_TERMINOLOGY: TerminologyPair[] = [
  { spanish: "gracia", english: "grace", context: "teologia" },
  { spanish: "salvacion", english: "salvation", context: "teologia" },
  { spanish: "arrepentimiento", english: "repentance", context: "teologia" },
  { spanish: "evangelio", english: "gospel", context: "teologia" },
  { spanish: "Espiritu Santo", english: "Holy Spirit", context: "teologia" },
  { spanish: "reino de Dios", english: "Kingdom of God", context: "teologia" },
  { spanish: "fe", english: "faith", context: "teologia" },
  { spanish: "esperanza", english: "hope", context: "teologia" },
  { spanish: "redencion", english: "redemption", context: "teologia" },
  { spanish: "justificacion", english: "justification", context: "teologia" },
  { spanish: "santificacion", english: "sanctification", context: "teologia" },
  { spanish: "pecado", english: "sin", context: "teologia" },
  { spanish: "perdon", english: "forgiveness", context: "teologia" },
  { spanish: "misericordia", english: "mercy", context: "teologia" },
  { spanish: "adoracion", english: "worship", context: "liturgia" },
  { spanish: "oracion", english: "prayer", context: "liturgia" },
  { spanish: "alabanza", english: "praise", context: "liturgia" },
  { spanish: "predica", english: "sermon", context: "liturgia" },
  { spanish: "discipulado", english: "discipleship", context: "formacion" },
  { spanish: "congregacion", english: "congregation", context: "eclesiologia" },
  { spanish: "iglesia", english: "church", context: "eclesiologia" },
  { spanish: "pastor", english: "pastor", context: "eclesiologia" },
  { spanish: "ministerio", english: "ministry", context: "eclesiologia" },
  { spanish: "bautismo", english: "baptism", context: "sacramentos" },
  { spanish: "comunion", english: "communion", context: "sacramentos" },
  { spanish: "Santa Cena", english: "Lord's Supper", context: "sacramentos" },
  { spanish: "Escrituras", english: "Scriptures", context: "biblia" },
  { spanish: "Palabra de Dios", english: "Word of God", context: "biblia" },
  { spanish: "Antiguo Testamento", english: "Old Testament", context: "biblia" },
  { spanish: "Nuevo Testamento", english: "New Testament", context: "biblia" },
  { spanish: "Cristo", english: "Christ", context: "cristologia" },
  { spanish: "Jesucristo", english: "Jesus Christ", context: "cristologia" },
  { spanish: "Senor", english: "Lord", context: "cristologia" },
  { spanish: "Salvador", english: "Savior", context: "cristologia" },
  { spanish: "cruz", english: "cross", context: "cristologia" },
  { spanish: "resurreccion", english: "resurrection", context: "cristologia" },
  { spanish: "segunda venida", english: "second coming", context: "escatologia" },
  { spanish: "vida eterna", english: "eternal life", context: "escatologia" },
  { spanish: "cielo", english: "heaven", context: "escatologia" },
  { spanish: "avivamiento", english: "revival", context: "movimientos" },
  { spanish: "testimonio", english: "testimony", context: "practica" },
  { spanish: "diezmo", english: "tithe", context: "practica" },
  { spanish: "ofrenda", english: "offering", context: "practica" },
];

/**
 * Get the translation of a Christian term.
 */
export function translateChristianTerm(
  term: string,
  fromLanguage: ManuscriptLanguage
): string | undefined {
  const lower = term.toLowerCase();
  const pair = CHRISTIAN_TERMINOLOGY.find((t) => {
    if (fromLanguage === "es") {
      return t.spanish.toLowerCase() === lower;
    }
    return t.english.toLowerCase() === lower;
  });

  if (!pair) return undefined;
  return fromLanguage === "es" ? pair.english : pair.spanish;
}

// ─── Translation System Prompts ─────────────────────────────────────

/**
 * Get the system prompt for translating a manuscript.
 */
export function getTranslationSystemPrompt(
  fromLanguage: ManuscriptLanguage,
  toLanguage: ManuscriptLanguage
): string {
  const direction =
    fromLanguage === "es" ? "Espanol a Ingles" : "Ingles a Espanol";
  const targetDesc =
    toLanguage === "en"
      ? "American English natural y accesible"
      : "espanol latinoamericano claro y natural";

  const targetRules =
    toLanguage === "en"
      ? `- Usa ortografia americana: color, center, organization, favor.
   - El texto debe leerse como si un hablante nativo americano lo escribio.
   - Tono claro, natural, conversacional, accesible.
   - Evita jerga academica y estructuras de oracion excesivamente complejas.
   - Evita traducciones literales que danien la legibilidad.`
      : `- Respeta convenciones del espanol latinoamericano.
   - Mantiene claridad y legibilidad.
   - Evita formalismos academicos innecesarios.
   - Mantiene tono pastoral cuando sea relevante.`;

  const targetLang = toLanguage === "en" ? "ingles" : "espanol";

  return `Eres un traductor editorial profesional especializado en literatura cristiana.

DIRECCION DE TRADUCCION: ${direction}
IDIOMA OBJETIVO: ${targetDesc}

PERFIL PROFESIONAL:
- Traductor con mas de 15 anos de experiencia en publicaciones cristianas.
- Dominio nativo de ambos idiomas (espanol latinoamericano e ingles americano).
- Conocimiento profundo de terminologia teologica y cristiana.
- Experiencia en traduccion de devocionales, estudios biblicos y sermones.

REGLAS FUNDAMENTALES:

1. PRESERVACION DE SIGNIFICADO (REGLA ABSOLUTA):
   - NUNCA cambies el significado del mensaje del autor.
   - NUNCA cambies afirmaciones teologicas o doctrinales.
   - NUNCA reinterpretes el mensaje del autor.
   - Si una correccion arriesga cambiar el significado, MARCALA para revision humana en lugar de modificarla.

2. NATURALIDAD DEL IDIOMA OBJETIVO:
   ${targetRules}

3. PROTECCION DE VERSICULOS BIBLICOS:
   - Preserva las referencias biblicas exactas (ej: Juan 3:16, John 3:16).
   - NO parafrasees texto biblico citado automaticamente.
   - Si se requiere traduccion de un versiculo citado, usa una traduccion reconocida.
   - NUNCA inventes traducciones nuevas de las Escrituras.
   - Marca versiculos que requieran revision editorial.

4. TERMINOLOGIA CRISTIANA ESTANDAR:
   - Usa vocabulario cristiano estandar, no sinonimos genericos.
   - gracia -> grace (no "favor" generico)
   - salvacion -> salvation
   - arrepentimiento -> repentance
   - evangelio -> gospel
   - Espiritu Santo -> Holy Spirit
   - reino de Dios -> Kingdom of God

5. PRESERVACION DE TONO PASTORAL:
   - Muchos autores escriben en formato de sermon, devocional o ensenanza pastoral.
   - PRESERVA ese tono en la traduccion.
   - No conviertas escritura pastoral en escritura teologica academica.
   - El resultado debe sentirse calido, claro y accesible para lectores de iglesia.

6. TRADUCCION DE SIGNIFICADO, NO LITERAL:
   - Traduce SIGNIFICADO e INTENCION, no palabra por palabra.
   - Si una traduccion literal dania la legibilidad, adapta manteniendo el significado.
   - El lector debe sentir que el texto fue ORIGINALMENTE ESCRITO en el idioma objetivo.

FORMATO DE SALIDA:
Responde siempre en espanol para las notas y comentarios.
El texto traducido debe estar en el idioma objetivo (${targetLang}).`;
}

/**
 * Get the user prompt template for translation.
 */
export function getTranslationUserPrompt(
  fromLanguage: ManuscriptLanguage,
  toLanguage: ManuscriptLanguage
): string {
  const fromLang = fromLanguage === "es" ? "espanol" : "ingles";
  const toLang =
    toLanguage === "en" ? "ingles americano" : "espanol latinoamericano";

  return `Traduce el siguiente manuscrito de ${fromLang} a ${toLang}.

INSTRUCCIONES:
1. Traduce el texto completo preservando la estructura (capitulos, secciones, parrafos).
2. Para cada seccion traducida, incluye:
   - El texto traducido
   - Notas donde el significado requirio adaptacion
   - Pasajes teologicos o ambiguos marcados para revision

3. Al final, genera un REPORTE DE TRADUCCION con:
   - Total de secciones traducidas
   - Adaptaciones significativas realizadas
   - Versiculos biblicos encontrados y como fueron tratados
   - Pasajes marcados para revision editorial
   - Terminologia cristiana utilizada
   - Nivel de confianza general: alto / medio / bajo

TEXTO ORIGINAL:
{{content}}`;
}
