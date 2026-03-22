"use client";

import { KeyRound, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { IDR_THEME } from "@/lib/idr/module-content";
import { getIdrStaffOffices } from "@/lib/idr/workspaces";

export default function IdrAccessesPage() {
  const { locale } = useLanguage();
  const offices = getIdrStaffOffices(locale);

  return (
    <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
            {locale === "es" ? "Control de Accesos IDR" : "IDR access control"}
          </p>
          <h1 className="font-heading text-3xl font-semibold">
            {locale === "es" ? "Personas previstas por oficina y estado de ingreso" : "Planned people by office and access status"}
          </h1>
          <p className="max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
            {locale === "es"
              ? "Aquí queda la base de quién debe entrar a cada oficina, con su nivel de acceso y estado de credencial. Cuando nos pases correos o usuarios, este será el tablero natural para activarlos."
              : "This is the base of who should enter each office, with access level and credential status. Once you provide emails or usernames, this becomes the natural board for activation."}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: locale === "es" ? "Equipo previsto" : "Planned team",
              value: offices.reduce((total, office) => total + office.seats.length, 0).toString(),
            },
            {
              icon: ShieldCheck,
              title: locale === "es" ? "Oficinas activas" : "Active offices",
              value: offices.length.toString(),
            },
            {
              icon: KeyRound,
              title: locale === "es" ? "Credenciales por asignar" : "Credentials to assign",
              value: locale === "es" ? "Siguiente fase" : "Next phase",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
                <CardHeader className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A646]/10">
                    <Icon className="h-5 w-5 text-[#E2C36B]" />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="pt-2 text-[#E2C36B]">{item.value}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {offices.map((office) => (
            <Card key={office.slug} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
              <CardHeader>
                <CardTitle className="text-xl">{office.title}</CardTitle>
                <CardDescription className="text-[#9DA9BA]">{office.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {office.seats.map((seat) => (
                  <div
                    key={`${office.slug}-${seat.title}`}
                    className="rounded-2xl border px-4 py-4"
                    style={{
                      borderColor: IDR_THEME.border,
                      background:
                        "linear-gradient(135deg, rgba(201,166,70,0.08) 0%, rgba(114,47,55,0.08) 100%)",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E2C36B]">{seat.title}</p>
                    <p className="mt-2 text-base font-semibold text-[#F5F0E8]">{seat.person}</p>
                    <p className="mt-2 text-sm text-[#9DA9BA]">{seat.scope}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{ background: "rgba(201,166,70,0.12)", color: IDR_THEME.goldSoft }}
                      >
                        {seat.accessLevel}
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{ background: "rgba(255,255,255,0.05)", color: IDR_THEME.ivory }}
                      >
                        {seat.credentialStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
