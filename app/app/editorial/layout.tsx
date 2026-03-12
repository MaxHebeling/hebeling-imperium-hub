import type { ReactNode } from "react";

/**
 * Layout wrapper for the Reino Editorial section.
 * Applies the Reino brand color palette via CSS custom properties
 * scoped to this subtree only — no impact on other app sections.
 */
export default function EditorialLayout({ children }: { children: ReactNode }) {
  return (
    <div className="editorial-theme min-h-full">
      {children}
    </div>
  );
}
