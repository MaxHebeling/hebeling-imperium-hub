import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const REINO_NAV_ITEMS = [
  { href: "/app/companies/reino-editorial/overview", label: "Overview" },
  { href: "/app/companies/reino-editorial/projects", label: "Projects" },
  { href: "/app/companies/reino-editorial/pipeline", label: "Pipeline" },
  { href: "/app/companies/reino-editorial/ai", label: "AI Review" },
  { href: "/app/companies/reino-editorial/authors", label: "Authors" },
  { href: "/app/companies/reino-editorial/staff", label: "Staff" },
  { href: "/app/companies/reino-editorial/marketplace", label: "Marketplace" },
  { href: "/app/companies/reino-editorial/distribution", label: "Distribution" },
  { href: "/app/companies/reino-editorial/operations", label: "Operations" },
  { href: "/app/companies/reino-editorial/reports", label: "Reports" },
];

export default function ReinoEditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <CompanySecondaryNav
        title="Reino Editorial"
        items={REINO_NAV_ITEMS}
        basePath="/app/companies/reino-editorial"
      />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
