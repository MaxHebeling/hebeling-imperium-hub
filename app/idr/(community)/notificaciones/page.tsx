"use client";

import { AlertTriangle, Bell, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { IDR_THEME } from "@/lib/idr/module-content";

export default function IdrPortalNotificationsPage() {
  const { locale } = useLanguage();

  const items = [
    {
      title: locale === "es" ? "Actualización mensual de visión" : "Monthly vision update",
      type: locale === "es" ? "Prioridad alta" : "High priority",
      tone: IDR_THEME.goldSoft,
      icon: CalendarClock,
    },
    {
      title: locale === "es" ? "Nuevo aviso para la comunidad" : "New community notice",
      type: locale === "es" ? "General" : "General",
      tone: IDR_THEME.success,
      icon: Bell,
    },
    {
      title: locale === "es" ? "Recordatorio de sesión privada" : "Private session reminder",
      type: locale === "es" ? "Programado" : "Scheduled",
      tone: IDR_THEME.warning,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
          {locale === "es" ? "Centro de avisos" : "Notice center"}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-[#F5F0E8]">
          {locale === "es" ? "Notificaciones y anuncios IDR" : "IDR notifications and announcements"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
          {locale === "es"
            ? "Esta sección concentra los avisos oficiales que la comunidad de inversionistas recibe dentro de su espacio privado."
            : "This section concentrates the official notices the investor community receives inside its private space."}
        </p>
      </section>

      <section className="grid gap-4">
        {items.map((item) => (
          <Card key={item.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                  <item.icon className="h-5 w-5" style={{ color: item.tone }} />
                </div>
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription style={{ color: item.tone }}>
                    {item.type}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7" style={{ color: IDR_THEME.muted }}>
                {locale === "es"
                  ? "Placeholder premium para futuras notificaciones reales conectadas a contenido, publicaciones y sesiones privadas."
                  : "Premium placeholder for future real notifications connected to content, publications, and private sessions."}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
