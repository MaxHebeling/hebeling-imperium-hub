import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const IMPERIUM_NAV_ITEMS = [
  { href: "/app/companies/imperium/overview", label: "Overview" },
];

export default function ImperiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <CompanySecondaryNav
        title="Imperium"
        items={IMPERIUM_NAV_ITEMS}
        basePath="/app/companies/imperium"
      />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
