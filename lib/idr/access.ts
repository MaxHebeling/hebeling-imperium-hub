const IDR_BRAND_ALIASES = ["idr", "inversionistas-del-reino", "inversionistasdelreino", "inversionistas"] as const;

export function isIdrBrandSlug(value?: string | null) {
  if (!value) return false;
  return IDR_BRAND_ALIASES.includes(value.trim().toLowerCase() as (typeof IDR_BRAND_ALIASES)[number]);
}

export function isIdrAdminRole(role?: string | null) {
  return role === "superadmin" || role === "admin";
}

export function isIdrStaffRole(role?: string | null) {
  return role === "sales" || role === "ops";
}

export function canAccessIdrStaff(role?: string | null, brandSlug?: string | null) {
  if (isIdrAdminRole(role)) {
    return true;
  }

  return isIdrStaffRole(role) && isIdrBrandSlug(brandSlug);
}

export function canAccessIdrPortal(role?: string | null, brandSlug?: string | null) {
  if (isIdrAdminRole(role)) {
    return true;
  }

  if (!isIdrBrandSlug(brandSlug)) {
    return false;
  }

  return role === "client" || isIdrStaffRole(role);
}

export function getIdrCommunityPath() {
  return "/idr/overview";
}

export function getIdrOfficePath(officeSlug: string) {
  return `/idr/oficinas/${officeSlug}`;
}

export function getIdrOfficeAccessPath(officeSlug: string) {
  return `/idr/oficinas/${officeSlug}/acceso`;
}
