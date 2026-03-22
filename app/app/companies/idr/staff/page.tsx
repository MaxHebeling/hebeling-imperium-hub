"use client";

import { FileStack, Landmark, ShieldCheck, Users2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { getIdrModuleContent, IDR_THEME } from "@/lib/idr/module-content";

export default function IdrStaffPage() {
  const { locale } = useLanguage();
  const content = getIdrModuleContent(locale);

  return (
    <div className="min-h-full bg-[#07101C] px-6 py-8 text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: "rgba(201,166,70,0.7)" }}>
            {locale === "es" ? "Carril Staff" : "Staff lane"}
          </p>
          <h1 className="font-heading text-3xl font-semibold">
            {locale === "es" ? "Gobernanza, documentos y operación interna" : "Governance, documents, and internal operations"}
          </h1>
          <p className="max-w-3xl text-sm leading-7" style={{ color: IDR_THEME.muted }}>
            {locale === "es"
              ? "Esta capa está reservada a presidencia, secretaría y staff autorizado. Aquí vive la estructura operativa del ministerio, el repositorio documental y el control editorial de lo que sale hacia la comunidad."
              : "This layer is reserved for presidency, secretary, and authorized staff. It houses the ministry’s operating structure, document repository, and editorial control for what gets published to the community."}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {content.staffRoles.map((role, index) => {
            const Icon = index === 0 ? Landmark : index === 1 ? ShieldCheck : Users2;

            return (
              <Card key={role.title} className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
                <CardHeader className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C9A646]/10">
                    <Icon className="h-5 w-5 text-[#E2C36B]" />
                  </div>
                  <div>
                    <CardTitle>{role.title}</CardTitle>
                    <CardDescription className="pt-2 text-[#9DA9BA]">
                      {role.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileStack className="h-5 w-5 text-[#E2C36B]" />
                {locale === "es" ? "Biblioteca privada del staff" : "Private staff library"}
              </CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "Primer bloque recomendado para lanzar con orden y seguridad."
                  : "Recommended first block to launch with order and security."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.staffResources.map((resource, index) => (
                <div
                  key={resource}
                  className="flex items-start gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: IDR_THEME.border,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: "rgba(201,166,70,0.10)", color: IDR_THEME.goldSoft }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6">{resource}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#1B2A40] bg-[#101C2E]/88 text-[#F5F0E8]">
            <CardHeader>
              <CardTitle>{locale === "es" ? "Resultado esperado del primer release" : "Expected first-release outcome"}</CardTitle>
              <CardDescription className="text-[#9DA9BA]">
                {locale === "es"
                  ? "No buscamos todavía complejidad total; buscamos control, orden y publicación consistente."
                  : "We are not chasing full complexity yet; we want control, order, and consistent publishing."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7" style={{ color: IDR_THEME.muted }}>
              <p>
                {locale === "es"
                  ? "El staff debe poder entrar, encontrar documentación crítica, consultar lineamientos y preparar con rapidez lo que se comunica a la comunidad."
                  : "Staff should be able to enter, find critical documentation, consult guidelines, and quickly prepare what is communicated to the community."}
              </p>
              <p>
                {locale === "es"
                  ? "Esto convierte a HEBELING OS en la capa de gobierno real de IDR, sin alterar el sitio público ni su repositorio independiente."
                  : "This turns HEBELING OS into the real governance layer for IDR, without altering the public site or its independent repository."}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
