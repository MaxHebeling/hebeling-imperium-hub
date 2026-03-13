/**
 * AI Cover Design Generator using DALL-E 3
 *
 * Generates professional book cover designs based on book metadata.
 * Supports two modes:
 * - "editorial": AI generates a cover based on the book's content, genre, and target audience
 * - "author": AI generates a cover based on the author's own vision/prompt
 */

export interface CoverGenerationRequest {
  /** "editorial" = AI decides based on book data; "author" = author provides their vision */
  mode: "editorial" | "author";
  /** Book title */
  title: string;
  /** Author name */
  authorName: string;
  /** Literary genre */
  genre?: string;
  /** Brief synopsis or description of the book */
  synopsis?: string;
  /** Target audience */
  targetAudience?: string;
  /** Visual tone: dark, light, warm, cold, minimalist, maximalist, etc. */
  visualTone?: string;
  /** Author's custom prompt (used when mode = "author") */
  authorPrompt?: string;
  /** Visual references (books or styles to emulate) */
  references?: string;
  /** Keywords describing the book */
  keywords?: string[];
  /** Preferred color palette (optional) */
  colorPalette?: string;
  /** Image style: realistic, illustrated, abstract, typographic, photographic */
  imageStyle?: "realistic" | "illustrated" | "abstract" | "typographic" | "photographic";
}

export interface CoverGenerationResult {
  imageUrl: string;
  revisedPrompt: string;
  mode: "editorial" | "author";
  generatedAt: string;
}

/**
 * Build the DALL-E 3 prompt for editorial mode.
 * The AI creates a cover based on the book's metadata.
 */
function buildEditorialPrompt(req: CoverGenerationRequest): string {
  const styleMap: Record<string, string> = {
    realistic: "fotorrealista con fotografía profesional",
    illustrated: "ilustración artística digital de alta calidad",
    abstract: "arte abstracto moderno y elegante",
    typographic: "diseño tipográfico minimalista y elegante",
    photographic: "fotografía artística profesional",
  };

  const style = req.imageStyle ? styleMap[req.imageStyle] || "diseño profesional" : "diseño profesional editorial";

  let prompt = `Diseña una portada de libro profesional con estilo ${style}. `;
  prompt += `Formato vertical de libro (ratio 2:3, como 6x9 pulgadas). `;
  prompt += `El libro se titula "${req.title}" del autor "${req.authorName}". `;

  if (req.genre) {
    prompt += `Género: ${req.genre}. `;
  }

  if (req.synopsis) {
    prompt += `Sinopsis breve: ${req.synopsis}. `;
  }

  if (req.targetAudience) {
    prompt += `Público objetivo: ${req.targetAudience}. `;
  }

  if (req.visualTone) {
    prompt += `Tono visual: ${req.visualTone}. `;
  }

  if (req.colorPalette) {
    prompt += `Paleta de colores preferida: ${req.colorPalette}. `;
  }

  if (req.keywords && req.keywords.length > 0) {
    prompt += `Palabras clave del libro: ${req.keywords.join(", ")}. `;
  }

  if (req.references) {
    prompt += `El autor quiere un estilo similar a: ${req.references}. `;
  }

  prompt += `IMPORTANTE: Incluir el título "${req.title}" y el nombre del autor "${req.authorName}" de forma legible y elegante en la portada. `;
  prompt += `La portada debe verse profesional, lista para publicación editorial. `;
  prompt += `No incluir textos de "bestseller", sellos, ni marcas de agua. `;
  prompt += `Resolución alta, composición equilibrada, tipografía clara.`;

  return prompt;
}

/**
 * Build the DALL-E 3 prompt for author mode.
 * The author provides their own vision and the AI creates based on that.
 */
function buildAuthorPrompt(req: CoverGenerationRequest): string {
  if (!req.authorPrompt) {
    throw new Error("El autor debe proporcionar una descripción de su visión para la portada.");
  }

  let prompt = `Diseña una portada de libro profesional en formato vertical (ratio 2:3, como 6x9 pulgadas). `;
  prompt += `El libro se titula "${req.title}" del autor "${req.authorName}". `;
  prompt += `Visión del autor para la portada: ${req.authorPrompt}. `;

  if (req.genre) {
    prompt += `Género del libro: ${req.genre}. `;
  }

  if (req.colorPalette) {
    prompt += `Colores preferidos: ${req.colorPalette}. `;
  }

  prompt += `IMPORTANTE: Incluir el título "${req.title}" y el nombre del autor "${req.authorName}" de forma legible y elegante en la portada. `;
  prompt += `La portada debe verse profesional, lista para publicación editorial. `;
  prompt += `No incluir textos de "bestseller", sellos, ni marcas de agua. `;
  prompt += `Resolución alta, composición equilibrada, tipografía clara.`;

  return prompt;
}

/**
 * Generate a book cover using DALL-E 3.
 */
export async function generateBookCover(
  req: CoverGenerationRequest
): Promise<CoverGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Configuración de OpenAI ausente (OPENAI_API_KEY). Configúrala en Vercel.");
  }

  const prompt = req.mode === "author"
    ? buildAuthorPrompt(req)
    : buildEditorialPrompt(req);

  console.info("[cover-generation] generating cover", {
    mode: req.mode,
    title: req.title,
    genre: req.genre,
    promptLength: prompt.length,
  });

  const MAX_RETRIES = 2;
  let response: Response | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1792", // Vertical book format
        quality: "hd",
        style: "vivid",
      }),
    });

    if (response.ok) break;

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const waitSeconds = attempt * 10;
      console.warn(`[cover-generation] Rate limited (429). Retrying in ${waitSeconds}s...`);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      continue;
    }

    const textBody = await response.text();
    console.error("[cover-generation] HTTP error", {
      status: response.status,
      body: textBody,
      attempt,
    });
    throw new Error(`Fallo al generar portada con DALL-E 3 (status ${response.status}).`);
  }

  if (!response || !response.ok) {
    throw new Error("Fallo al generar portada después de múltiples reintentos.");
  }

  const json = (await response.json()) as {
    data: Array<{ url: string; revised_prompt: string }>;
  };

  const image = json?.data?.[0];
  if (!image?.url) {
    throw new Error("Respuesta de DALL-E 3 sin URL de imagen.");
  }

  console.info("[cover-generation] cover generated successfully", {
    mode: req.mode,
    title: req.title,
    hasRevisedPrompt: !!image.revised_prompt,
  });

  return {
    imageUrl: image.url,
    revisedPrompt: image.revised_prompt || prompt,
    mode: req.mode,
    generatedAt: new Date().toISOString(),
  };
}
