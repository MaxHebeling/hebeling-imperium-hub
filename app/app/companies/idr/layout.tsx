import { IdrCompanyNav } from "@/components/idr/idr-company-nav";

const IDR_NAV_ITEMS = [
  { href: "/app/companies/idr/overview", label: "Panel" },
  { href: "/app/companies/idr/oficinas", label: "Oficinas" },
  { href: "/app/companies/idr/staff", label: "Staff" },
  { href: "/app/companies/idr/inversionistas", label: "Comunidad" },
  { href: "/app/companies/idr/contenido", label: "Contenido" },
];

export default function IdrCompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="idr-theme flex min-h-0 flex-1 flex-col">
      <IdrCompanyNav
        title="Centro Privado IDR"
        subtitle="Seis oficinas internas del staff y un séptimo acceso para la comunidad general, todo coordinado desde HEBELING OS."
        items={IDR_NAV_ITEMS}
      />
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
