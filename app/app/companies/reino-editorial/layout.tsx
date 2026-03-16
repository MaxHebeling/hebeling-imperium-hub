import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const REINO_NAV_ITEMS = [
  { href: "/app/companies/reino-editorial/overview", label: "Panel" },
  { href: "/app/companies/reino-editorial/authors", label: "Autores" },
  { href: "/app/companies/reino-editorial/staff", label: "Equipo" },
  { href: "/app/companies/reino-editorial/reports", label: "Reportes" },
];

export default function ReinoEditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="editorial-theme flex flex-col min-h-0 flex-1">
      <CompanySecondaryNav
        title="Reino Editorial"
        items={REINO_NAV_ITEMS}
        basePath="/app/companies/reino-editorial"
      />
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
