"use client";

import { Clapperboard, PlayCircle, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { IDR_THEME } from "@/lib/idr/module-content";

export default function IdrPortalMediaPage() {
  const { locale } = useLanguage();

  const mediaCards = [
    {
      title: locale === "es" ? "Briefing mensual" : "Monthly briefing",
      description: locale === "es" ? "Video principal del mes" : "Main video of the month",
      icon: PlayCircle,
    },
    {
      title: locale === "es" ? "Cápsulas ejecutivas" : "Executive capsules",
      description: locale === "es" ? "Mensajes cortos de dirección" : "Short leadership messages",
      icon: Video,
    },
    {
      title: locale === "es" ? "Biblioteca audiovisual" : "Audiovisual library",
      description: locale === "es" ? "Archivo premium de contenido" : "Premium content archive",
      icon: Clapperboard,
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
          {locale === "es" ? "Media premium" : "Premium media"}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-[#F5F0E8]">
          {locale === "es" ? "Videos y contenido mensual" : "Videos and monthly content"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
          {locale === "es"
            ? "Aquí vive el carril de videos privados para la comunidad, con estética premium y navegación optimizada para móvil."
            : "This is the private video lane for the community, with premium aesthetics and mobile-optimized navigation."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {mediaCards.map((item) => (
          <Card key={item.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A646]/10">
                <item.icon className="h-5 w-5 text-[#E2C36B]" />
              </div>
              <div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="pt-2 text-[#9DA9BA]">
                  {item.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-2xl border px-4 py-4 text-sm"
                style={{
                  borderColor: IDR_THEME.border,
                  background:
                    "linear-gradient(135deg, rgba(201,166,70,0.08) 0%, rgba(114,47,55,0.08) 100%)",
                }}
              >
                {locale === "es"
                  ? "Slot preparado para integrar videos, sesiones mensuales y contenidos exclusivos."
                  : "Slot prepared to integrate videos, monthly sessions, and exclusive content."}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
