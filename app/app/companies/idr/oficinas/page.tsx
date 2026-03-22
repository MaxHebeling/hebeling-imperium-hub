"use client";

import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { DEFAULT_IDR_OFFICE_ICON, IDR_OFFICE_ICONS } from "@/lib/idr/office-icons";
import { IDR_THEME } from "@/lib/idr/module-content";
import { getIdrCommunityWorkspace, getIdrStaffOffices } from "@/lib/idr/workspaces";

export default function IdrOfficesPage() {
  const { locale } = useLanguage();
  const offices = getIdrStaffOffices(locale);
  const community = getIdrCommunityWorkspace(locale);

  return (
    <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section
          className="overflow-hidden rounded-[30px] border p-8"
          style={{
            borderColor: IDR_THEME.border,
            background:
              "linear-gradient(135deg, rgba(12,22,38,0.98) 0%, rgba(16,28,46,0.96) 54%, rgba(201,166,70,0.10) 100%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
          }}
        >
          <div className="max-w-4xl space-y-4">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.35em]"
              style={{ color: "rgba(201,166,70,0.7)" }}
            >
              {locale === "es" ? "Arquitectura Operativa IDR" : "IDR Operating Architecture"}
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">
              {locale === "es"
                ? "Seis oficinas internas y un séptimo acceso para la comunidad"
                : "Six internal offices and a seventh community access point"}
            </h1>
            <p className="max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
              {locale === "es"
                ? "Aquí queda trazada la base real del módulo privado de IDR: seis oficinas del staff, cada una con propósito distinto, y un séptimo portal para todos los inversionistas del proyecto."
                : "This maps the real foundation of the private IDR module: six staff offices, each with a distinct purpose, and a seventh portal for all project investors."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-[#C9A646]/25 bg-[#C9A646]/10 text-[#E2C36B] hover:bg-[#C9A646]/10">
                {locale === "es" ? "6 oficinas staff" : "6 staff offices"}
              </Badge>
              <Badge className="border-[#C9A646]/25 bg-[#C9A646]/10 text-[#E2C36B] hover:bg-[#C9A646]/10">
                {locale === "es" ? "1 portal comunidad" : "1 community portal"}
              </Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offices.map((office) => {
            const Icon = IDR_OFFICE_ICONS[office.slug] ?? DEFAULT_IDR_OFFICE_ICON;

            return (
              <Link key={office.slug} href={office.href} className="block">
                <Card className="h-full border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8] transition-transform duration-200 hover:-translate-y-1">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(201,166,70,0.10)" }}
                      >
                        <Icon className="h-6 w-6 text-[#E2C36B]" />
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                        style={{
                          background: "rgba(201,166,70,0.10)",
                          color: IDR_THEME.goldSoft,
                        }}
                      >
                        {office.code}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-xl">{office.title}</CardTitle>
                      <CardDescription className="pt-2 text-[#9DA9BA]">
                        {office.subtitle}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-7 text-[#F5F0E8]/92">{office.summary}</p>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E2C36B]">
                        {locale === "es" ? "Acceso previsto" : "Expected access"}
                      </p>
                      <p className="text-sm text-[#9DA9BA]">{office.access}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#E2C36B]">
                      {locale === "es" ? "Abrir oficina" : "Open office"}
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E2C36B]">
                    {community.code}
                  </p>
                  <CardTitle className="mt-2 text-2xl">{community.title}</CardTitle>
                  <CardDescription className="pt-2 text-[#9DA9BA]">
                    {community.subtitle}
                  </CardDescription>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(201,166,70,0.10)" }}
                >
                  <Users className="h-6 w-6 text-[#E2C36B]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-[#F5F0E8]/92">{community.summary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: IDR_THEME.border, background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E2C36B]">
                    {locale === "es" ? "Audiencia" : "Audience"}
                  </p>
                  <p className="mt-2 text-sm text-[#9DA9BA]">{community.audience}</p>
                </div>
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: IDR_THEME.border, background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E2C36B]">
                    {locale === "es" ? "Acceso" : "Access"}
                  </p>
                  <p className="mt-2 text-sm text-[#9DA9BA]">{community.access}</p>
                </div>
              </div>
              <Link
                href={community.href}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  color: IDR_THEME.bg,
                  background: `linear-gradient(135deg, ${IDR_THEME.gold}, ${IDR_THEME.goldSoft})`,
                }}
              >
                {locale === "es" ? "Abrir séptimo acceso" : "Open seventh access"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle>
                {locale === "es" ? "Cómo vamos a usar esta base" : "How this foundation will be used"}
              </CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "La estructura ya queda viva; lo siguiente será poblarla con personas, permisos y materiales."
                  : "The structure is now live; next comes populating it with people, permissions, and materials."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                locale === "es"
                  ? "Definir quién entra a cada oficina."
                  : "Define who enters each office.",
                locale === "es"
                  ? "Decidir qué documentos, avisos y videos pertenecen a cada espacio."
                  : "Decide which documents, notices, and videos belong to each space.",
                locale === "es"
                  ? "Asignar permisos granulares por usuario y contraseña."
                  : "Assign granular permissions per username and password.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border px-4 py-3"
                  style={{ borderColor: IDR_THEME.border, background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: "rgba(201,166,70,0.10)", color: IDR_THEME.goldSoft }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-[#F5F0E8]/92">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
