import { DEFAULT_LEAD_BRAND, LeadBrand, normalizeLeadBrand } from "./brand-config";
import { Lead, LeadPayload } from "./helpers";

export type AnnaChannel = "web_chat" | "whatsapp" | "voice" | "email" | "manual";

export interface AnnaIntakePayload {
  message?: string;
  conversation_summary?: string;
  channel?: AnnaChannel;
  language?: string;
  brand?: string | null;
  source?: string | null;
  origin_page?: string | null;
  form_type?: string | null;
  contact?: {
    full_name?: string;
    company_name?: string;
    email?: string;
    whatsapp?: string;
    city?: string;
    country?: string;
    preferred_contact_method?: string;
  };
  qualification?: {
    project_type?: string;
    main_service?: string;
    main_goal?: string;
    budget_range?: string;
    timeline?: string;
    priority?: "low" | "medium" | "high";
  };
  metadata?: Record<string, unknown>;
}

const BRAND_KEYWORDS: Array<{ brand: LeadBrand; keywords: string[] }> = [
  {
    brand: "lead_hunter",
    keywords: [
      "construction",
      "contractor",
      "builders",
      "builder",
      "remodel",
      "renovation",
      "roofing",
      "hvac",
      "plumbing",
      "construccion",
      "contratista",
      "obra",
      "remodelacion",
      "renovacion",
    ],
  },
  {
    brand: "ikingdom",
    keywords: [
      "website",
      "landing page",
      "landing",
      "funnel",
      "ecommerce",
      "app",
      "web design",
      "sitio web",
      "pagina web",
      "embudo",
    ],
  },
  {
    brand: "editorial-reino",
    keywords: [
      "book",
      "manuscript",
      "publishing",
      "editorial",
      "author",
      "libro",
      "manuscrito",
      "publicacion",
      "autor",
    ],
  },
  {
    brand: "imperium",
    keywords: [
      "investor",
      "investment",
      "fund",
      "capital",
      "networking",
      "inversion",
      "inversor",
      "capital privado",
    ],
  },
  {
    brand: "max-hebeling",
    keywords: [
      "ministry",
      "church",
      "preaching",
      "invitation",
      "conference",
      "ministerio",
      "iglesia",
      "predicacion",
      "invitacion",
    ],
  },
];

function buildSearchText(payload: AnnaIntakePayload): string {
  return [
    payload.message,
    payload.conversation_summary,
    payload.contact?.company_name,
    payload.qualification?.project_type,
    payload.qualification?.main_service,
    payload.qualification?.main_goal,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function inferLeadBrandFromAnna(payload: AnnaIntakePayload): LeadBrand {
  if (payload.brand) {
    return normalizeLeadBrand(payload.brand);
  }

  const searchText = buildSearchText(payload);
  if (!searchText) {
    return DEFAULT_LEAD_BRAND;
  }

  let bestBrand = DEFAULT_LEAD_BRAND;
  let bestScore = 0;

  for (const candidate of BRAND_KEYWORDS) {
    const score = candidate.keywords.reduce((total, keyword) => {
      return total + (searchText.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestBrand = candidate.brand;
    }
  }

  return bestBrand;
}

function buildProjectDescription(payload: AnnaIntakePayload): string | undefined {
  const blocks = [
    payload.conversation_summary
      ? `Conversation summary:\n${payload.conversation_summary}`
      : null,
    payload.message ? `Latest message:\n${payload.message}` : null,
  ].filter(Boolean);

  return blocks.length > 0 ? blocks.join("\n\n") : undefined;
}

function buildAdditionalNotes(payload: AnnaIntakePayload): string | undefined {
  const notes = [
    `Captured by ANNA via ${payload.channel || "web_chat"}`,
    payload.language ? `Language: ${payload.language}` : null,
    payload.qualification?.priority
      ? `Priority: ${payload.qualification.priority}`
      : null,
    payload.metadata ? `Metadata: ${JSON.stringify(payload.metadata)}` : null,
  ].filter(Boolean);

  return notes.length > 0 ? notes.join("\n") : undefined;
}

export function buildLeadPayloadFromAnna(payload: AnnaIntakePayload): LeadPayload {
  const brand = inferLeadBrandFromAnna(payload);

  return {
    full_name:
      payload.contact?.full_name ||
      payload.contact?.company_name ||
      payload.contact?.email ||
      payload.contact?.whatsapp ||
      "Lead via ANNA",
    company_name: payload.contact?.company_name,
    email: payload.contact?.email,
    whatsapp: payload.contact?.whatsapp,
    city: payload.contact?.city,
    country: payload.contact?.country,
    project_description: buildProjectDescription(payload),
    main_service: payload.qualification?.main_service,
    main_goal: payload.qualification?.main_goal,
    project_type: payload.qualification?.project_type,
    budget_range: payload.qualification?.budget_range,
    timeline: payload.qualification?.timeline,
    preferred_contact_method:
      payload.contact?.preferred_contact_method ||
      (payload.contact?.whatsapp ? "whatsapp" : payload.contact?.email ? "email" : undefined),
    additional_notes: buildAdditionalNotes(payload),
    source: payload.source || `anna_${payload.channel || "web_chat"}`,
    brand,
    origin_page: payload.origin_page || "/anna/intake",
    form_type: payload.form_type || "anna_intake",
  };
}

function joinUniqueText(existing?: string | null, incoming?: string | null): string | undefined {
  const values = [existing?.trim(), incoming?.trim()].filter(Boolean) as string[];
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  if (values[0] === values[1]) return values[0];
  return values.join("\n\n");
}

export function buildLeadUpdateFromAnna(
  existingLead: Lead,
  incomingLead: LeadPayload
): Partial<LeadPayload> {
  return {
    full_name: existingLead.full_name || incomingLead.full_name,
    company_name: incomingLead.company_name || existingLead.company_name,
    email: incomingLead.email || existingLead.email,
    whatsapp: incomingLead.whatsapp || existingLead.whatsapp,
    city: incomingLead.city || existingLead.city,
    country: incomingLead.country || existingLead.country,
    project_type: incomingLead.project_type || existingLead.project_type,
    main_service: incomingLead.main_service || existingLead.main_service,
    main_goal: incomingLead.main_goal || existingLead.main_goal,
    budget_range: incomingLead.budget_range || existingLead.budget_range,
    timeline: incomingLead.timeline || existingLead.timeline,
    preferred_contact_method:
      incomingLead.preferred_contact_method || existingLead.preferred_contact_method,
    project_description: joinUniqueText(
      existingLead.project_description,
      incomingLead.project_description
    ),
    additional_notes: joinUniqueText(
      existingLead.additional_notes,
      incomingLead.additional_notes
    ),
    source: existingLead.source || incomingLead.source,
    brand: incomingLead.brand || existingLead.brand,
    origin_page: incomingLead.origin_page || existingLead.origin_page,
    form_type: incomingLead.form_type || existingLead.form_type,
  };
}
