import { type LucideIcon } from "lucide-react";

interface StaffEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Empty state block for staff dashboard and books list.
 * Reusable; sober, editorial style.
 */
export function StaffEmptyState({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: StaffEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 px-4 text-center ${className}`}
    >
      <Icon className="h-12 w-12 text-muted-foreground/60 mb-3 shrink-0" aria-hidden />
      <h3 className="font-medium text-sm text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
