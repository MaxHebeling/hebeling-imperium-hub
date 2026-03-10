import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const IKINGDOM_NAV_ITEMS = [
  { href: "/app/companies/ikingdom/overview", label: "Overview" },
  { href: "/app/companies/ikingdom/applications", label: "Applications" },
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
