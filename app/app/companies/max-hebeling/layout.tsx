import { CompanySecondaryNav } from "@/components/company-secondary-nav";

const MAX_HEBELING_NAV_ITEMS = [
  { href: "/app/companies/max-hebeling/overview", label: "Overview" },
];

export default function MaxHebelingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <CompanySecondaryNav
        title="Max Hebeling"
        items={MAX_HEBELING_NAV_ITEMS}
        basePath="/app/companies/max-hebeling"
      />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
