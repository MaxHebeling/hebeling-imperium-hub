import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { getPermitHunterLeadDetail } from "@/lib/lead-hunter/permit-hunter-service";
import type {
  PermitHunterLead,
  PermitHunterOutreachRecord,
} from "@/lib/lead-hunter/permit-hunter-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const LEAD_HUNTER_BACKGROUND = "/lead-hunter-cinematic-luxury-v1.jpg";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number | null) {
  if (!value) {
    return "Valuación pendiente";
  }

  return `$${value.toLocaleString()}`;
}

function getContactStatus(lead: PermitHunterLead) {
  if (lead.ownerPhone || lead.ownerEmail) {
    return "Contacto completo";
  }

  if (lead.ownerName || lead.mailingAddress) {
    return "Owner identificado";
  }

  return "Investigación manual";
}

function getActivationStatus(outreach: PermitHunterOutreachRecord | null) {
  switch (outreach?.status) {
    case "attempted":
      return "Primer intento realizado";
    case "contacted":
      return "Contacto activo";
    case "won":
      return "Lead ganado";
    case "lost":
      return "Lead perdido";
    default:
      return "Sin activación todavía";
  }
}

function getOperationalRead(lead: PermitHunterLead) {
  if (lead.recommendedAction === "call_first") {
    return "Lead listo para ataque directo por llamada.";
  }

  if (lead.recommendedAction === "enrich_immediately") {
    return "Conviene completar owner phone y email antes de operar.";
  }

  if (lead.recommendedAction === "research_next") {
    return "Todavía requiere investigación manual antes de outreach.";
  }

  return "Lead en monitoreo hasta nuevo cambio del permiso.";
}

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{value}</p>
    </div>
  );
}

export default async function LeadHunterLeadDetailPage({
  params,
}: {
  params: Promise<{ permitNumber: string }>;
}) {
  const { permitNumber } = await params;
  const detail = await getPermitHunterLeadDetail(decodeURIComponent(permitNumber));

  if (!detail.lead) {
    notFound();
  }

  const contactLine = detail.lead.ownerName
    ? [
        detail.lead.ownerName,
        detail.lead.ownerPhone ?? null,
        detail.lead.ownerEmail ?? null,
        detail.lead.mailingAddress ?? null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Owner no enriquecido todavía";

  const licensedProfessionalLine =
    detail.lead.licensedProfessionalName || detail.lead.licensedProfessionalBusiness
      ? [
          detail.lead.licensedProfessionalName ??
            detail.lead.licensedProfessionalBusiness,
          detail.lead.licensedProfessionalBusiness &&
          detail.lead.licensedProfessionalBusiness !==
            detail.lead.licensedProfessionalName
            ? detail.lead.licensedProfessionalBusiness
            : null,
          detail.lead.licensedProfessionalLicenseType,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Sin profesional licenciado cargado";

  return (
    <main className="min-h-full px-6 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Link
          href="/app/companies/lead-hunter"
          className="text-sm font-medium uppercase tracking-[0.18em] text-[#E1A24A]"
        >
          Volver a Lead Hunter
        </Link>

        <Card className="relative overflow-hidden rounded-[28px] border border-[#E1A24A]/16 bg-[#0D1B2D]/78 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
            style={{ backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(8,19,32,0.94) 0%, rgba(8,19,32,0.84) 42%, rgba(201,111,45,0.12) 100%)",
            }}
          />
          <div className="h-px bg-[#C96F2D]" />
          <CardContent className="relative p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-[#C96F2D]/20 bg-[#C96F2D]/10 text-[#E1A24A] hover:bg-[#C96F2D]/10">
                {detail.lead.normalizedStage.replaceAll("_", " ")}
              </Badge>
              <Badge variant="secondary">
                {detail.lead.normalizedProjectType.replaceAll("_", " ")}
              </Badge>
              <Badge variant="secondary">Score {detail.lead.score}</Badge>
              {detail.lead.isHotLead ? <Badge variant="secondary">Hot lead</Badge> : null}
            </div>

            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-slate-400">
              Expediente Lead Hunter · {detail.lead.permitNumber}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              {detail.lead.address}
            </h1>
            <p className="mt-3 text-slate-300">
              {detail.lead.rawStatus} · {detail.lead.city} · {formatCurrency(detail.lead.valuation)}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DetailTile
                label="Acción sugerida"
                value={detail.lead.recommendedAction.replaceAll("_", " ")}
              />
              <DetailTile
                label="Estado de contacto"
                value={getContactStatus(detail.lead)}
              />
              <DetailTile
                label="Estado de activación"
                value={getActivationStatus(detail.outreach)}
              />
              <DetailTile
                label="Última actualización"
                value={formatDateTime(detail.lead.updatedAt)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden rounded-[24px] border border-[#1E3048] bg-[#0D1828]/78 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <div className="h-px bg-[#C96F2D]" />
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Señal operativa</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {getOperationalRead(detail.lead)}
                </p>
              </div>

              <DetailTile
                label="Alcance del permiso"
                value={
                  detail.lead.scopeOfWork ??
                  detail.lead.rawDescription ??
                  "Sin alcance cargado"
                }
              />

              <DetailTile
                label="Descripción base"
                value={detail.lead.rawDescription ?? "Sin descripción base"}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <DetailTile
                  label="Fecha de ingreso"
                  value={formatDateTime(detail.lead.submittedAt)}
                />
                <DetailTile
                  label="APN"
                  value={detail.lead.apn ?? "Sin APN cargado"}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[24px] border border-[#1E3048] bg-[#0D1828]/78 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <div className="h-px bg-[#C96F2D]" />
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Datos propios</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Información operativa interna de Lead Hunter para trabajar este expediente.
                </p>
              </div>

              <DetailTile label="Contacto y owner" value={contactLine} />
              <DetailTile
                label="Profesional licenciado"
                value={licensedProfessionalLine}
              />
              <DetailTile
                label="Próximo seguimiento"
                value={formatDateTime(detail.outreach?.nextFollowUpAt)}
              />

              {detail.lead.sourceUrl ? (
                <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Fuente del permiso
                  </p>
                  <Link
                    href={detail.lead.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#E1A24A] hover:text-[#f0b766]"
                  >
                    Abrir fuente
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
