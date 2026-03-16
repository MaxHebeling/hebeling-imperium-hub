import type { ExtractedManuscriptText } from "@/lib/editorial/files/extract-text";

export interface EditorialManuscriptAnalysis {
  summary: string;
  strengths: string[];
  structural_issues: string[];
  style_issues: string[];
  grammar_issues: string[];
  recommendations: string[];
  readiness_score: number;
}

const MAX_CHARS_FOR_MVP = 20_000;

function buildEditorialPrompt(text: string, truncated: boolean): string {
  const header = truncated
    ? "ATENCIÓN: El manuscrito ha sido truncado para este análisis (MVP). Debes indicar en las recomendaciones si consideras que necesitas ver el texto completo.\n\n"
    : "";

  return (
    header +
    `Eres un editor profesional de una editorial literaria de alto nivel. ` +
    `Vas a analizar un manuscrito en español y devolver un dictamen editorial inicial.\n\n` +
    `Tareas:\n` +
    `1) Escribe un resumen editorial general del manuscrito.\n` +
    `2) Enumera las principales fortalezas del manuscrito.\n` +
    `3) Enumera problemas estructurales (estructura global, ritmo, organización por capítulos o secciones).\n` +
    `4) Enumera problemas de estilo (voz, tono, claridad, coherencia estilística).\n` +
    `5) Enumera problemas gramaticales u ortotipográficos visibles (sin necesidad de ser exhaustivo a nivel de línea).\n` +
    `6) Propón recomendaciones concretas y accionables para mejorar el manuscrito.\n` +
    `7) Asigna una puntuación de preparación editorial (readiness_score) entre 0 y 100, donde 0 es muy inmaduro y 100 está listo para publicación.\n\n` +
    `Formato de salida OBLIGATORIO:\n` +
    `Devuelve EXCLUSIVAMENTE un JSON válido, sin texto adicional, con esta forma exacta:\n\n` +
    `{\n` +
    `  "summary": "resumen editorial general",\n` +
    `  "strengths": ["fortaleza 1", "fortaleza 2"],\n` +
    `  "structural_issues": ["issue 1", "issue 2"],\n` +
    `  "style_issues": ["issue 1", "issue 2"],\n` +
    `  "grammar_issues": ["issue 1", "issue 2"],\n` +
    `  "recommendations": ["recomendación 1", "recomendación 2"],\n` +
    `  "readiness_score": 0\n` +
    `}\n\n` +
    `No incluyas comentarios fuera del JSON.\n\n` +
    `Texto del manuscrito (puede estar truncado):\n\n` +
    text
  );
}

export async function runEditorialManuscriptAnalysis(
  extracted: ExtractedManuscriptText
): Promise<EditorialManuscriptAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[editorial-ai][openai] missing OPENAI_API_KEY");
    throw new Error("Configuración de OpenAI ausente (OPENAI_API_KEY).");
  }

  let text = extracted.text ?? "";
  if (text.length > MAX_CHARS_FOR_MVP) {
    console.warn("[editorial-ai][openai] truncating manuscript text for MVP", {
      originalChars: text.length,
      maxChars: MAX_CHARS_FOR_MVP,
    });
    text = text.slice(0, MAX_CHARS_FOR_MVP);
  }

  const prompt = buildEditorialPrompt(text, extracted.truncated || text.length < extracted.text.length);

  console.info("[editorial-ai][openai] sending request", {
    model: "gpt-4o-mini",
    promptChars: prompt.length,
  });

  const MAX_RETRIES = 3;
  let response: Response | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un editor profesional de una editorial literaria. Siempre respondes EXCLUSIVAMENTE en JSON válido, sin ningún texto adicional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (response.ok) break;

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const waitSeconds = attempt * 5;
      console.warn(`[editorial-ai][openai] Rate limited (429). Retrying in ${waitSeconds}s... (attempt ${attempt}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      continue;
    }

    const textBody = await response.text();
    console.error("[editorial-ai][openai] HTTP error", {
      status: response.status,
      body: textBody,
      attempt,
    });
    throw new Error(`Fallo al llamar a OpenAI (status ${response.status}).`);
  }

  if (!response || !response.ok) {
    throw new Error("Fallo al llamar a OpenAI después de múltiples reintentos.");
  }

  const json = (await response.json()) as any;
  const raw = json?.choices?.[0]?.message?.content;

  if (!raw || typeof raw !== "string") {
    console.error("[editorial-ai][openai] invalid response shape", { json });
    throw new Error("Respuesta de OpenAI sin contenido esperado.");
  }

  let parsed: EditorialManuscriptAnalysis;
  try {
    parsed = JSON.parse(raw) as EditorialManuscriptAnalysis;
  } catch (error) {
    console.error("[editorial-ai][openai] JSON parse error", {
      message: (error as Error).message,
      raw,
    });
    throw new Error("No se pudo parsear la respuesta JSON de OpenAI.");
  }

  console.info("[editorial-ai][openai] analysis received", {
    hasSummary: !!parsed.summary,
    strengths: parsed.strengths?.length ?? 0,
    structural_issues: parsed.structural_issues?.length ?? 0,
  });

  return parsed;
}

