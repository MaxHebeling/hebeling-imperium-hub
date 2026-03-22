export type LeadBrand =
  | "ikingdom"
  | "editorial-reino"
  | "lead_hunter"
  | "imperium"
  | "max-hebeling";

export interface LeadBrandProfile {
  value: LeadBrand;
  label: string;
  codePrefix: string;
  pipeline: string;
  dealLabel: string;
  formPath: string;
  companyPath: string;
}

export const DEFAULT_LEAD_BRAND: LeadBrand = "ikingdom";

export const LEAD_BRAND_PROFILES: Record<LeadBrand, LeadBrandProfile> = {
  ikingdom: {
    value: "ikingdom",
    label: "iKingdom",
    codePrefix: "IK",
    pipeline: "ikingdom",
    dealLabel: "Landing Page",
    formPath: "/apply/ikingdom-diagnosis",
    companyPath: "/app/companies/ikingdom",
  },
  "editorial-reino": {
    value: "editorial-reino",
    label: "Reino Editorial",
    codePrefix: "RE",
    pipeline: "editorial-reino",
    dealLabel: "Editorial Opportunity",
    formPath: "/apply?brand=editorialreino",
    companyPath: "/app/editorial",
  },
  lead_hunter: {
    value: "lead_hunter",
    label: "Lead Hunter",
    codePrefix: "LH",
    pipeline: "lead_hunter",
    dealLabel: "Construction Lead",
    formPath: "/apply/lead-hunter",
    companyPath: "/app/companies/lead-hunter",
  },
  imperium: {
    value: "imperium",
    label: "Imperium Group",
    codePrefix: "IG",
    pipeline: "imperium",
    dealLabel: "Investor Opportunity",
    formPath: "/apply?brand=imperium",
    companyPath: "/app/companies/imperium",
  },
  "max-hebeling": {
    value: "max-hebeling",
    label: "Max Hebeling",
    codePrefix: "MH",
    pipeline: "max-hebeling",
    dealLabel: "Brand Inquiry",
    formPath: "/apply?brand=maxhebeling",
    companyPath: "/app/companies/max-hebeling",
  },
};

const LEAD_BRAND_ALIASES: Record<string, LeadBrand> = {
  ikingdom: "ikingdom",
  "editorial-reino": "editorial-reino",
  editorialreino: "editorial-reino",
  lead_hunter: "lead_hunter",
  "lead-hunter": "lead_hunter",
  leadhunter: "lead_hunter",
  imperium: "imperium",
  "max-hebeling": "max-hebeling",
  maxhebeling: "max-hebeling",
};

export function normalizeLeadBrand(input?: string | null): LeadBrand {
  if (!input) return DEFAULT_LEAD_BRAND;
  return LEAD_BRAND_ALIASES[input] || DEFAULT_LEAD_BRAND;
}

export function getLeadBrandProfile(input?: string | null): LeadBrandProfile {
  const normalized = normalizeLeadBrand(input);
  return LEAD_BRAND_PROFILES[normalized];
}

export const LEAD_BRAND_OPTIONS = Object.values(LEAD_BRAND_PROFILES);
