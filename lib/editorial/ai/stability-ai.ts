/**
 * Stability AI Integration — Premium Book Cover Generation
 *
 * Stability AI provides high-quality image generation models (SDXL, SD3, etc.)
 * as an alternative to DALL-E 3 for producing professional book covers.
 *
 * API Docs: https://platform.stability.ai/docs/api-reference
 *
 * Configuration:
 * - STABILITY_API_KEY: API key from https://platform.stability.ai/account/keys
 *
 * Pricing: ~$0.03-0.06 per image (varies by model and resolution)
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface StabilityCoverRequest {
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
  /** Visual tone */
  visualTone?: string;
  /** Author's custom prompt (used when mode = "author") */
  authorPrompt?: string;
  /** Visual references */
  references?: string;
  /** Keywords describing the book */
  keywords?: string[];
  /** Preferred color palette */
  colorPalette?: string;
  /** Image style */
  imageStyle?: "realistic" | "illustrated" | "abstract" | "typographic" | "photographic";
  /** Negative prompt — things to avoid in the image */
  negativePrompt?: string;
  /** Model to use: "sd3" (highest quality) or "sdxl" (faster, good quality) */
  model?: "sd3" | "sdxl";
}

export interface StabilityCoverResult {
  /** Base64-encoded image data */
  imageBase64: string;
  /** Content type (image/png) */
  contentType: string;
  /** The prompt that was used */
  prompt: string;
  /** Model used for generation */
  model: string;
  /** Generation timestamp */
  generatedAt: string;
  /** Seed used (for reproducibility) */
  seed?: number;
}

// ─── Configuration ──────────────────────────────────────────────────

const STABILITY_API_URL = "https://api.stability.ai";

function getApiKey(): string | null {
  return process.env.STABILITY_API_KEY || null;
}

/**
 * Check if Stability AI is available (API key configured)
 */
export function isStabilityAiAvailable(): boolean {
  return !!getApiKey();
}

// ─── Prompt Building ────────────────────────────────────────────────

function buildEditorialCoverPrompt(req: StabilityCoverRequest): string {
  const styleMap: Record<string, string> = {
    realistic: "photorealistic, professional photography",
    illustrated: "high-quality digital illustration, artistic",
    abstract: "modern abstract art, elegant, symbolic",
    typographic: "minimalist typographic design, clean layout",
    photographic: "fine art photography, dramatic lighting",
  };

  const style = req.imageStyle
    ? styleMap[req.imageStyle] || "professional editorial design"
    : "professional editorial book cover design";

  const parts: string[] = [
    `Professional book cover design, ${style}`,
    `vertical portrait format, 2:3 aspect ratio`,
    `Book title "${req.title}" by "${req.authorName}"`,
  ];

  if (req.genre) parts.push(`Genre: ${req.genre}`);
  if (req.synopsis) parts.push(`Theme: ${req.synopsis}`);
  if (req.targetAudience) parts.push(`Target audience: ${req.targetAudience}`);
  if (req.visualTone) parts.push(`Visual tone: ${req.visualTone}`);
  if (req.colorPalette) parts.push(`Color palette: ${req.colorPalette}`);
  if (req.keywords?.length) parts.push(`Keywords: ${req.keywords.join(", ")}`);
  if (req.references) parts.push(`Style reference: ${req.references}`);

  parts.push("elegant typography, balanced composition, high resolution");
  parts.push("professional publishing quality, ready for print");
  parts.push("no watermarks, no stock photo badges, no generic clipart");

  return parts.join(". ");
}

function buildAuthorCoverPrompt(req: StabilityCoverRequest): string {
  if (!req.authorPrompt) {
    throw new Error(
      "El autor debe proporcionar una descripción de su visión para la portada."
    );
  }

  const parts: string[] = [
    `Professional book cover design, vertical portrait format, 2:3 aspect ratio`,
    `Book: "${req.title}" by "${req.authorName}"`,
    `Author's vision: ${req.authorPrompt}`,
  ];

  if (req.genre) parts.push(`Genre: ${req.genre}`);
  if (req.colorPalette) parts.push(`Colors: ${req.colorPalette}`);

  parts.push("elegant typography, balanced composition, high resolution");
  parts.push("professional publishing quality");

  return parts.join(". ");
}

const DEFAULT_NEGATIVE_PROMPT = [
  "low quality",
  "blurry",
  "watermark",
  "stock photo badge",
  "generic clipart",
  "amateur design",
  "distorted text",
  "illegible text",
  "deformed",
  "ugly",
  "duplicate",
  "poorly drawn",
  "bad anatomy",
  "bad proportions",
].join(", ");

// ─── API Call — Stable Diffusion 3 ─────────────────────────────────

async function generateWithSD3(
  prompt: string,
  negativePrompt: string,
  apiKey: string
): Promise<StabilityCoverResult> {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("negative_prompt", negativePrompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", "2:3");

  const response = await fetch(
    `${STABILITY_API_URL}/v2beta/stable-image/generate/sd3`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Stability AI SD3 error (${response.status}): ${errorText}`
    );
  }

  const json = (await response.json()) as {
    image: string;
    seed: number;
    finish_reason: string;
  };

  return {
    imageBase64: json.image,
    contentType: "image/png",
    prompt,
    model: "sd3",
    generatedAt: new Date().toISOString(),
    seed: json.seed,
  };
}

// ─── API Call — SDXL (faster, more affordable) ─────────────────────

async function generateWithSDXL(
  prompt: string,
  negativePrompt: string,
  apiKey: string
): Promise<StabilityCoverResult> {
  const response = await fetch(
    `${STABILITY_API_URL}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        text_prompts: [
          { text: prompt, weight: 1 },
          { text: negativePrompt, weight: -1 },
        ],
        cfg_scale: 7,
        height: 1536,
        width: 1024,
        samples: 1,
        steps: 40,
        style_preset: "photographic",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Stability AI SDXL error (${response.status}): ${errorText}`
    );
  }

  const json = (await response.json()) as {
    artifacts: Array<{
      base64: string;
      seed: number;
      finishReason: string;
    }>;
  };

  const image = json.artifacts?.[0];
  if (!image?.base64) {
    throw new Error("Stability AI no devolvió imagen.");
  }

  return {
    imageBase64: image.base64,
    contentType: "image/png",
    prompt,
    model: "sdxl",
    generatedAt: new Date().toISOString(),
    seed: image.seed,
  };
}

// ─── Main Generation Function ───────────────────────────────────────

/**
 * Generate a professional book cover using Stability AI.
 *
 * Uses SD3 by default (highest quality) or SDXL (faster, more affordable).
 * Falls back to SDXL if SD3 fails.
 *
 * @param req Cover generation request with book metadata and style preferences
 * @returns Generated cover image as base64 with metadata
 */
export async function generateBookCoverStability(
  req: StabilityCoverRequest
): Promise<StabilityCoverResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Configuración de Stability AI ausente (STABILITY_API_KEY). " +
        "Obtén tu API key en https://platform.stability.ai/account/keys"
    );
  }

  const prompt =
    req.mode === "author"
      ? buildAuthorCoverPrompt(req)
      : buildEditorialCoverPrompt(req);

  const negativePrompt = req.negativePrompt || DEFAULT_NEGATIVE_PROMPT;

  const preferredModel = req.model || "sd3";

  console.info("[stability-ai] generating cover", {
    mode: req.mode,
    title: req.title,
    model: preferredModel,
    promptLength: prompt.length,
  });

  try {
    if (preferredModel === "sd3") {
      return await generateWithSD3(prompt, negativePrompt, apiKey);
    }
    return await generateWithSDXL(prompt, negativePrompt, apiKey);
  } catch (error) {
    // If SD3 fails, fall back to SDXL
    if (preferredModel === "sd3") {
      console.warn(
        "[stability-ai] SD3 failed, falling back to SDXL:",
        (error as Error).message
      );
      return await generateWithSDXL(prompt, negativePrompt, apiKey);
    }
    throw error;
  }
}

/**
 * Upload a Stability AI generated cover to Supabase Storage.
 * Returns the storage path.
 */
export async function uploadStabilityCoverToStorage(
  result: StabilityCoverResult,
  projectId: string,
  supabaseAdmin: ReturnType<typeof import("@/lib/leads/helpers").getAdminClient>
): Promise<string> {
  const buffer = Buffer.from(result.imageBase64, "base64");
  const fileName = `cover_stability_${result.model}_${Date.now()}.png`;
  const storagePath = `${projectId}/covers/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from("editorial-covers")
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(`Error al subir portada a storage: ${error.message}`);
  }

  return storagePath;
}
