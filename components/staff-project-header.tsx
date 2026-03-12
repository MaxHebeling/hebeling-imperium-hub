"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DEFAULT_BACK_HREF = "/staff/books";
const DEFAULT_BACK_LABEL = "Back to Books";

export interface StaffProjectHeaderProps {
  /** When provided, overrides the default legacy back link (/staff/books). */
  backHref?: string;
  /** When provided, overrides the default legacy back label ("Back to Books"). */
  backLabel?: string;
}

/**
 * Contextual back navigation for project detail pages.
 * With no props: links to /staff/books ("Back to Books") for legacy staff routes.
 * With backHref/backLabel: e.g. company projects list for company-first routes.
 */
export function StaffProjectHeader({
  backHref = DEFAULT_BACK_HREF,
  backLabel = DEFAULT_BACK_LABEL,
}: StaffProjectHeaderProps) {
  return (
    <Link
      href={backHref}
      className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      {backLabel}
    </Link>
  );
}
