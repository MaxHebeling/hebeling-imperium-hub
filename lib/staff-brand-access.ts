import { normalizeLeadBrand, type LeadBrand } from "@/lib/leads/brand-config";

type StaffBrandScopeConfig = {
  label: string;
  homePath: string;
  crmBrand: LeadBrand;
  canAccessCrm?: boolean;
  workspaceOnly?: boolean;
};

export interface StaffBrandScope {
  slug: string;
  label: string;
  homePath: string;
  crmBrand: LeadBrand;
  crmPath: string | null;
  canAccessCrm: boolean;
  workspaceOnly: boolean;
}

const STAFF_BRAND_SCOPE_CONFIG: Record<string, StaffBrandScopeConfig> = {
  ikingdom: {
    label: "iKingdom",
    homePath: "/app/companies/ikingdom",
    crmBrand: "ikingdom",
  },
  "editorial-reino": {
    label: "Reino Editorial",
    homePath: "/app/editorial",
    crmBrand: "editorial-reino",
  },
  editorialreino: {
    label: "Reino Editorial",
    homePath: "/app/editorial",
    crmBrand: "editorial-reino",
  },
  "lead-hunter": {
    label: "Lead Hunter",
    homePath: "/app/companies/lead-hunter",
    crmBrand: "lead_hunter",
    canAccessCrm: false,
    workspaceOnly: true,
  },
  lead_hunter: {
    label: "Lead Hunter",
    homePath: "/app/companies/lead-hunter",
    crmBrand: "lead_hunter",
    canAccessCrm: false,
    workspaceOnly: true,
  },
  leadhunter: {
    label: "Lead Hunter",
    homePath: "/app/companies/lead-hunter",
    crmBrand: "lead_hunter",
    canAccessCrm: false,
    workspaceOnly: true,
  },
  imperium: {
    label: "Imperium Group",
    homePath: "/app/companies/imperium",
    crmBrand: "imperium",
  },
  "max-hebeling": {
    label: "Max Hebeling",
    homePath: "/app/companies/max-hebeling",
    crmBrand: "max-hebeling",
  },
  maxhebeling: {
    label: "Max Hebeling",
    homePath: "/app/companies/max-hebeling",
    crmBrand: "max-hebeling",
  },
};

export function isRestrictedStaffRole(role?: string | null) {
  return role === "sales" || role === "ops";
}

export function getStaffBrandScope(brandSlug?: string | null): StaffBrandScope | null {
  if (!brandSlug) return null;

  const normalizedSlug = brandSlug.trim().toLowerCase();
  const config = STAFF_BRAND_SCOPE_CONFIG[normalizedSlug];

  if (!config) return null;

  const crmBrand = normalizeLeadBrand(config.crmBrand);
  const canAccessCrm = config.canAccessCrm ?? true;
  const workspaceOnly = config.workspaceOnly ?? false;

  return {
    slug: normalizedSlug,
    label: config.label,
    homePath: config.homePath,
    crmBrand,
    crmPath: canAccessCrm ? `/app/crm?tab=leads&brand=${crmBrand}` : null,
    canAccessCrm,
    workspaceOnly,
  };
}
