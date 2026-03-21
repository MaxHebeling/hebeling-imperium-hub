import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const CONVOCATION_OS_NAV_ITEMS = [
  { href: "/app/companies/convocation-os/overview", label: "Overview" },
  { href: "/app/companies/convocation-os/event-series", label: "Event Series" },
];

export default function ConvocationOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <CompanySecondaryNav
        title="Convocation OS"
        items={CONVOCATION_OS_NAV_ITEMS}
        basePath="/app/companies/convocation-os"
      />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
