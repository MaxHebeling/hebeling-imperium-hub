import type { EditorialMarketingKit } from "./types";

type ParsedMarketingPayload = {
  positioning_hook: string;
  ad_copies: Array<{
    channel: "meta_ads" | "google_ads";
    headline: string;
    primary_text: string;
    call_to_action: string;
    audience_angle: string;
  }>;
  email_sequence: Array<{
    sequence_key: string;
    step_order: number;
    subject: string;
    preview_text: string;
    body: string;
    call_to_action: string;
  }>;
  landing_page: {
    hero_title: string;
    hero_subtitle: string;
    sections: Array<{
      key: string;
      heading: string;
      body: string;
    }>;
    primary_call_to_action: string;
  };
  campaign_structure: Array<{
    id: string;
    name: string;
    objective: string;
    channels: Array<"meta_ads" | "google_ads" | "email" | "landing_page">;
    audience: string;
    core_message: string;
    call_to_action: string;
  }>;
};

function extractFirstJsonObject(rawText: string): string | null {
  const fencedMatch =
    rawText.match(/```json\s*([\s\S]*?)```/i) ??
    rawText.match(/```\s*([\s\S]*?)```/);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = rawText.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "\"") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return rawText.slice(start, index + 1);
      }
    }
  }

  return null;
}

function sanitizeJsonStringControls(value: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === "\"") {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
        continue;
      }
      if (char === "\r") {
        result += "\\r";
        continue;
      }
      if (char === "\t") {
        result += "\\t";
        continue;
      }
      if (char.charCodeAt(0) < 0x20) {
        result += " ";
        continue;
      }
    }

    result += char;
  }

  return result;
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function buildFallbackMarketingKit(input: {
  projectId: string;
  metadataAssetId: string;
  coverAssetId: string | null;
  publicationAssetId: string;
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  positioningStatement: string;
  categories: string[];
  keywords: string[];
  generatedAt: string;
  model: string;
}): EditorialMarketingKit {
  const baseCta = "Descubre el libro";
  const baseHook = input.positioningStatement || `Una propuesta editorial alrededor de ${input.title}.`;

  return {
    schema_version: 1,
    project_id: input.projectId,
    metadata_asset_id: input.metadataAssetId,
    cover_asset_id: input.coverAssetId,
    publication_asset_id: input.publicationAssetId,
    positioning_hook: baseHook,
    ad_copies: [
      {
        channel: "meta_ads",
        headline: input.title,
        primary_text: `${input.description} Ideal para ${input.targetAudience}.`,
        call_to_action: baseCta,
        audience_angle: input.targetAudience,
      },
      {
        channel: "google_ads",
        headline: `${input.title}: ${input.subtitle}`.slice(0, 90),
        primary_text: `${input.categories[0] ?? "Libro"} para lectores de ${input.keywords[0] ?? input.title}.`,
        call_to_action: "Comprar ahora",
        audience_angle: input.targetAudience,
      },
    ],
    email_sequence: [
      {
        sequence_key: "launch",
        step_order: 1,
        subject: `Ya disponible: ${input.title}`,
        preview_text: input.subtitle,
        body: `${input.description}\n\n${baseHook}`,
        call_to_action: baseCta,
      },
      {
        sequence_key: "reminder",
        step_order: 2,
        subject: `Por qué leer ${input.title}`,
        preview_text: input.positioningStatement,
        body: `Este libro conecta con ${input.targetAudience}. ${input.description}`,
        call_to_action: "Ver detalles",
      },
    ],
    landing_page: {
      hero_title: input.title,
      hero_subtitle: input.subtitle,
      sections: [
        {
          key: "overview",
          heading: "De qué trata",
          body: input.description,
        },
        {
          key: "audience",
          heading: "Para quién es",
          body: input.targetAudience,
        },
        {
          key: "positioning",
          heading: "Por qué destaca",
          body: input.positioningStatement,
        },
      ],
      primary_call_to_action: baseCta,
    },
    campaign_structure: [
      {
        id: "launch-campaign",
        name: "Launch Campaign",
        objective: "Awareness and conversion",
        channels: ["meta_ads", "email", "landing_page"],
        audience: input.targetAudience,
        core_message: baseHook,
        call_to_action: baseCta,
      },
      {
        id: "search-demand",
        name: "Search Demand Capture",
        objective: "Capture existing intent",
        channels: ["google_ads", "landing_page"],
        audience: input.targetAudience,
        core_message: input.categories.join(", ") || input.title,
        call_to_action: "Comprar ahora",
      },
    ],
    generated_at: input.generatedAt,
    model: input.model,
  };
}

export function parseMarketingKit(input: {
  rawText: string;
  projectId: string;
  metadataAssetId: string;
  coverAssetId: string | null;
  publicationAssetId: string;
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  positioningStatement: string;
  categories: string[];
  keywords: string[];
  generatedAt: string;
  model: string;
}): EditorialMarketingKit {
  const extractedJson = extractFirstJsonObject(input.rawText);
  if (!extractedJson) {
    return buildFallbackMarketingKit(input);
  }

  try {
    const parsed = JSON.parse(
      sanitizeJsonStringControls(extractedJson)
    ) as Partial<ParsedMarketingPayload>;

    if (
      typeof parsed.positioning_hook !== "string" ||
      !parsed.landing_page ||
      !Array.isArray(parsed.ad_copies) ||
      !Array.isArray(parsed.email_sequence) ||
      !Array.isArray(parsed.campaign_structure)
    ) {
      return buildFallbackMarketingKit(input);
    }

    return {
      schema_version: 1,
      project_id: input.projectId,
      metadata_asset_id: input.metadataAssetId,
      cover_asset_id: input.coverAssetId,
      publication_asset_id: input.publicationAssetId,
      positioning_hook: normalizeString(
        parsed.positioning_hook,
        input.positioningStatement
      ),
      ad_copies: parsed.ad_copies
        .filter((item) => item && typeof item === "object")
        .slice(0, 4)
        .map((item, index) => ({
          channel: item.channel === "google_ads" ? "google_ads" : "meta_ads",
          headline: normalizeString(item.headline, `${input.title} ${index + 1}`),
          primary_text: normalizeString(item.primary_text, input.description),
          call_to_action: normalizeString(item.call_to_action, "Descubre el libro"),
          audience_angle: normalizeString(item.audience_angle, input.targetAudience),
        })),
      email_sequence: parsed.email_sequence
        .filter((item) => item && typeof item === "object")
        .slice(0, 4)
        .map((item, index) => ({
          sequence_key: normalizeString(item.sequence_key, `email_${index + 1}`),
          step_order:
            typeof item.step_order === "number" && item.step_order > 0
              ? item.step_order
              : index + 1,
          subject: normalizeString(item.subject, input.title),
          preview_text: normalizeString(item.preview_text, input.subtitle),
          body: normalizeString(item.body, input.description),
          call_to_action: normalizeString(item.call_to_action, "Descubre el libro"),
        })),
      landing_page: {
        hero_title: normalizeString(parsed.landing_page.hero_title, input.title),
        hero_subtitle: normalizeString(
          parsed.landing_page.hero_subtitle,
          input.subtitle
        ),
        sections: Array.isArray(parsed.landing_page.sections)
          ? parsed.landing_page.sections
              .filter((item) => item && typeof item === "object")
              .slice(0, 6)
              .map((item, index) => ({
                key: normalizeString(item.key, `section_${index + 1}`),
                heading: normalizeString(item.heading, `Section ${index + 1}`),
                body: normalizeString(item.body, input.description),
              }))
          : buildFallbackMarketingKit(input).landing_page.sections,
        primary_call_to_action: normalizeString(
          parsed.landing_page.primary_call_to_action,
          "Descubre el libro"
        ),
      },
      campaign_structure: parsed.campaign_structure
        .filter((item) => item && typeof item === "object")
        .slice(0, 4)
        .map((item, index) => ({
          id: normalizeString(item.id, `campaign_${index + 1}`),
          name: normalizeString(item.name, `Campaign ${index + 1}`),
          objective: normalizeString(item.objective, "Awareness and conversion"),
          channels:
            Array.isArray(item.channels) && item.channels.length
              ? item.channels.filter(
                  (
                    channel
                  ): channel is "meta_ads" | "google_ads" | "email" | "landing_page" =>
                    channel === "meta_ads" ||
                    channel === "google_ads" ||
                    channel === "email" ||
                    channel === "landing_page"
                )
              : ["meta_ads", "landing_page"],
          audience: normalizeString(item.audience, input.targetAudience),
          core_message: normalizeString(
            item.core_message,
            input.positioningStatement
          ),
          call_to_action: normalizeString(item.call_to_action, "Descubre el libro"),
        })),
      generated_at: input.generatedAt,
      model: input.model,
    };
  } catch {
    return buildFallbackMarketingKit(input);
  }
}
