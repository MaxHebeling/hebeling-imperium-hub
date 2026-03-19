import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const IKINGDOM_NAV_ITEMS = [
  { href: "/app/companies/ikingdom/overview", label: "Panel" },
  { href: "/app/companies/ikingdom/leads", label: "Leads" },
  { href: "/app/companies/ikingdom/briefs", label: "Briefs" },
  { href: "/app/companies/ikingdom/proposals", label: "Propuestas" },
  { href: "/app/companies/ikingdom/projects", label: "Proyectos" },
  { href: "/app/companies/ikingdom/applications", label: "Aplicaciones" },
];

export default function IKingdomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <CompanySecondaryNav
        title="iKingdom"
        items={IKINGDOM_NAV_ITEMS}
        basePath="/app/companies/ikingdom"
      />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
