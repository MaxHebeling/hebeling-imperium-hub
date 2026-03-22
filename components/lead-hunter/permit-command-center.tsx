"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Database,
  HardHat,
  Loader2,
  Mail,
  MapPinned,
  PhoneCall,
  Radar,
  RefreshCw,
  Search,
  Target,
  Wrench,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n";
import type {
  PermitHunterCommandCenterSnapshot,
  PermitHunterCommandType,
  PermitHunterLead,
  PermitHunterRecommendedAction,
  PermitHunterRunStatus,
} from "@/lib/lead-hunter/permit-hunter-types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SnapshotResponse =
  | {
      success: true;
      snapshot: PermitHunterCommandCenterSnapshot;
    }
  | {
      success: false;
      error?: string;
    };

const LEAD_HUNTER_LOGO = "/logo-lead-hunter.svg";
const LEAD_HUNTER_ACCENT_BG = "bg-[#C96F2D]";
const LEAD_HUNTER_ACCENT_TEXT = "text-[#E1A24A]";
const LEAD_HUNTER_ACCENT_BADGE =
  "border-[#C96F2D]/20 bg-[#C96F2D]/10 text-[#E1A24A] hover:bg-[#C96F2D]/10";

const stageLabelMap = {
  issuance: { es: "Emisión", en: "Issuance" },
  plan_check: { es: "Revisión", en: "Plan Check" },
  other: { es: "Otro", en: "Other" },
} as const;

const recommendedActionMap: Record<
  PermitHunterRecommendedAction,
  { es: string; en: string }
> = {
  call_first: { es: "Llamar primero", en: "Call first" },
  enrich_immediately: { es: "Enriquecer ya", en: "Enrich immediately" },
  research_next: { es: "Investigar después", en: "Research next" },
  monitor_only: { es: "Solo monitoreo", en: "Monitor only" },
};

const runStatusMap: Record<PermitHunterRunStatus, { es: string; en: string; className: string }> = {
  success: {
    es: "Correcto",
    en: "Success",
    className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  },
  partial_failure: {
    es: "Parcial",
    en: "Partial",
    className: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  },
  failure: {
    es: "Fallo",
    en: "Failure",
    className: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  },
  running: {
    es: "Corriendo",
    en: "Running",
    className: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  },
};

const commandCopyMap: Record<PermitHunterCommandType, { es: string; en: string }> = {
  daily_scan: { es: "Escaneo diario", en: "Daily scan" },
  backfill_30: { es: "Backfill 30 días", en: "30-day backfill" },
  contact_sweep: { es: "Barrido de contacto", en: "Contact sweep" },
};

function formatDate(value: string | null, locale: "es" | "en") {
  if (!value) {
    return locale === "es" ? "Sin registro" : "No record";
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number | null, locale: "es" | "en") {
  if (!value) {
    return "—";
  }

  return new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getContactLine(lead: PermitHunterLead, locale: "es" | "en") {
  if (lead.ownerPhone || lead.ownerEmail) {
    return [lead.ownerPhone, lead.ownerEmail].filter(Boolean).join(" · ");
  }

  if (lead.ownerName || lead.mailingAddress) {
    return locale === "es" ? "Solo propietario + mailing" : "Owner + mailing only";
  }

  return locale === "es" ? "Investigación manual" : "Manual research";
}

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={`group relative overflow-hidden rounded-[24px] border border-[#1E3048] bg-[#0D1828]/78 text-white backdrop-blur-sm ${className}`.trim()}
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}
    >
      <div className={`absolute top-0 left-0 right-0 h-px ${LEAD_HUNTER_ACCENT_BG}`} />
      <div className="relative">{children}</div>
    </Card>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#081320]/72 px-3 py-3 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function PermitCommandCenter() {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<PermitHunterCommandCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingCommand, setSubmittingCommand] = useState<PermitHunterCommandType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () => ({
      eyebrow: locale === "es" ? "Permit Command Center" : "Permit Command Center",
      title:
        locale === "es"
          ? "Permit Hunter ya corre con la misma identidad visual de Lead Hunter dentro de HEBELING OS."
          : "Permit Hunter now runs with the same Lead Hunter visual identity inside HEBELING OS.",
      description:
        locale === "es"
          ? "La operación de permisos quedó montada con el diseño base de la tarjeta de Lead Hunter: misma estructura de card, mismo acento naranja, mismo ritmo visual y mismas acciones directas desde la unidad."
          : "The permit operation now sits on top of the same Lead Hunter card language: same card structure, same orange accent, same visual rhythm, and the same direct actions from the business unit.",
      workspaceBridge: locale === "es" ? "Operación local activa" : "Local operation active",
      supabasePending: locale === "es" ? "Handoff a Supabase pendiente" : "Supabase handoff pending",
      constructionIntel: locale === "es" ? "Permit ops" : "Permit ops",
      runDaily: locale === "es" ? "Ejecutar escaneo diario" : "Run daily scan",
      runBackfill: locale === "es" ? "Ejecutar backfill 30 días" : "Run 30-day backfill",
      contactSweep: locale === "es" ? "Ejecutar barrido de contacto" : "Run contact sweep",
      openIntake: locale === "es" ? "Abrir intake" : "Open intake",
      refresh: locale === "es" ? "Actualizar panel" : "Refresh panel",
      metricsTitle: locale === "es" ? "Lectura operativa" : "Operational readout",
      metricsDescription:
        locale === "es"
          ? "Métricas puente con la estructura de Permit Hunter, preparadas para sustituirse por el proyecto real."
          : "Bridge metrics following the Permit Hunter structure, ready to be replaced by the real project.",
      queueTitle: locale === "es" ? "Cola prioritaria" : "Priority queue",
      queueDescription:
        locale === "es"
          ? "Permisos y leads de construcción que Lead Hunter debe atacar primero."
          : "Construction permits and leads that Lead Hunter should attack first.",
      activityTitle: locale === "es" ? "Actividad" : "Activity",
      activityDescription:
        locale === "es"
          ? "Última corrida conocida y operaciones ejecutadas desde HEBELING OS."
          : "Latest known run plus operations executed from HEBELING OS.",
      emptyCommands:
        locale === "es"
          ? "Todavía no hay operaciones registradas. Usa los botones superiores para empezar a operar desde aquí."
          : "There are no operations yet. Use the top buttons to start operating from here.",
      latestRun: locale === "es" ? "Última corrida conocida" : "Latest known run",
      queuedCommands: locale === "es" ? "Historial operativo" : "Operation history",
      localQueueNote:
        locale === "es"
          ? "Las operaciones corren localmente dentro de HEBELING OS hasta conectar el proyecto Supabase de Permit Hunter."
          : "Operations run locally inside HEBELING OS until the Permit Hunter Supabase project is connected.",
      retry: locale === "es" ? "Reintentar" : "Retry",
      fetchError:
        locale === "es"
          ? "No pude cargar el command center de Permit Hunter."
          : "I could not load the Permit Hunter command center.",
      queueSuccessTitle: locale === "es" ? "Operación ejecutada" : "Operation executed",
      queueSuccessDescription:
        locale === "es"
          ? "La operación corrió localmente dentro de Lead Hunter y quedó lista para el handoff de mañana."
          : "The operation ran locally inside Lead Hunter and is ready for tomorrow's handoff.",
      queueErrorTitle: locale === "es" ? "No pude ejecutar la operación" : "I could not execute the operation",
      statusLastSnapshot: locale === "es" ? "Último snapshot" : "Last snapshot",
      statusLastRun: locale === "es" ? "Última corrida" : "Latest run",
      statusWorkspace: locale === "es" ? "Workspace" : "Workspace",
      statusStorage: locale === "es" ? "Almacenamiento" : "Storage",
      score: locale === "es" ? "Score" : "Score",
      valuation: locale === "es" ? "Valuación" : "Valuation",
      contactStatus: locale === "es" ? "Contacto" : "Contact",
      licensedPro: locale === "es" ? "Profesional licenciado" : "Licensed Pro",
      noRun: locale === "es" ? "Sin corridas registradas" : "No runs recorded",
      permitsFound: locale === "es" ? "encontrados" : "found",
      inserted: locale === "es" ? "insertados" : "inserted",
      updated: locale === "es" ? "actualizados" : "updated",
      owner: locale === "es" ? "Propietario" : "Owner",
      pendingBackend: locale === "es" ? "Pendiente de backend" : "Backend pending",
      completedLocal: locale === "es" ? "Ejecutado local" : "Executed locally",
      fullContactLabel: locale === "es" ? "Contacto completo" : "Full contact",
      manualResearchLabel: locale === "es" ? "Investigación manual" : "Manual research",
      contactQueueTitle: locale === "es" ? "Queue de contacto" : "Contact queue",
      nextHandoffTitle: locale === "es" ? "Siguiente paso" : "Next step",
      nextHandoffBody:
        locale === "es"
          ? "Usa el barrido de contacto para completar owner records pendientes y luego abre el expediente nativo de Lead Hunter para operar el lead."
          : "Use the contact sweep to complete unresolved owner records and then open the native Lead Hunter dossier to work the lead.",
    }),
    [locale]
  );

  const loadSnapshot = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/lead-hunter/permit-hunter", {
        credentials: "include",
      });
      const payload = (await response.json()) as SnapshotResponse;

      if (!response.ok || !payload.success) {
        throw new Error("error" in payload ? payload.error || copy.fetchError : copy.fetchError);
      }

      setSnapshot(payload.snapshot);
      setError(null);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : copy.fetchError;
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [copy.fetchError]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadSnapshot]);

  const queueCommand = useCallback(
    async (commandType: PermitHunterCommandType) => {
      setSubmittingCommand(commandType);

      try {
        const response = await fetch("/api/lead-hunter/permit-hunter", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commandType }),
        });
        const payload = (await response.json()) as SnapshotResponse;

        if (!response.ok || !payload.success) {
          throw new Error("error" in payload ? payload.error || copy.queueErrorTitle : copy.queueErrorTitle);
        }

        setSnapshot(payload.snapshot);
        setError(null);
        toast({
          title: copy.queueSuccessTitle,
          description: copy.queueSuccessDescription,
        });
      } catch (queueError) {
        toast({
          title: copy.queueErrorTitle,
          description:
            queueError instanceof Error ? queueError.message : copy.queueErrorTitle,
          variant: "destructive",
        });
      } finally {
        setSubmittingCommand(null);
      }
    },
    [copy.queueErrorTitle, copy.queueSuccessDescription, copy.queueSuccessTitle, toast]
  );

  if (loading && !snapshot) {
    return (
      <ShellCard>
        <CardHeader>
          <Skeleton className="h-5 w-40 bg-muted" />
          <Skeleton className="h-10 w-full bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-lg bg-muted" />
        </CardContent>
      </ShellCard>
    );
  }

  if (!snapshot) {
    return (
      <ShellCard>
        <CardContent className="p-6">
          <Alert className="border-rose-400/20 bg-rose-500/10">
            <AlertTitle>{copy.fetchError}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-3">
              <span>{error ?? copy.fetchError}</span>
              <Button
                onClick={() => {
                  void loadSnapshot();
                }}
                variant="outline"
                className="w-fit"
              >
                {copy.retry}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </ShellCard>
    );
  }

  const metricCards = [
    {
      label: locale === "es" ? "Permisos activos" : "Tracked permits",
      value: snapshot.metrics.trackedLeads,
      icon: HardHat,
    },
    {
      label: locale === "es" ? "Hot leads" : "Hot leads",
      value: snapshot.metrics.hotLeads,
      icon: Target,
    },
    {
      label: locale === "es" ? "Emisión" : "Issuance",
      value: snapshot.metrics.issuance,
      icon: Radar,
    },
    {
      label: locale === "es" ? "Revisión" : "Plan check",
      value: snapshot.metrics.planCheck,
      icon: Search,
    },
    {
      label: copy.fullContactLabel,
      value: snapshot.metrics.fullContact,
      icon: PhoneCall,
    },
    {
      label: copy.manualResearchLabel,
      value: snapshot.metrics.manualResearch,
      icon: Database,
    },
  ];

  return (
    <section className="space-y-4">
      <ShellCard>
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-background/60 border border-border/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Image
                  src={LEAD_HUNTER_LOGO}
                  alt="Lead Hunter logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge className={LEAD_HUNTER_ACCENT_BADGE}>{copy.workspaceBridge}</Badge>
                  <Badge variant="secondary" className="text-xs">
                    {copy.constructionIntel}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {copy.supabasePending}
                  </Badge>
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${LEAD_HUNTER_ACCENT_TEXT}`}>
                  {copy.eyebrow}
                </p>
                <CardTitle className="mt-2 text-xl text-white">{copy.title}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                  {copy.description}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:max-w-[460px] xl:justify-end">
              <Button
                onClick={() => {
                  void queueCommand("daily_scan");
                }}
                disabled={submittingCommand !== null}
                className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
              >
                {submittingCommand === "daily_scan" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Radar className="mr-2 h-4 w-4" />
                )}
                {copy.runDaily}
              </Button>
              <Button
                onClick={() => {
                  void queueCommand("backfill_30");
                }}
                disabled={submittingCommand !== null}
                variant="outline"
                className={`bg-background/60 ${LEAD_HUNTER_ACCENT_TEXT}`}
              >
                {submittingCommand === "backfill_30" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wrench className="mr-2 h-4 w-4" />
                )}
                {copy.runBackfill}
              </Button>
              <Button
                onClick={() => {
                  void queueCommand("contact_sweep");
                }}
                disabled={submittingCommand !== null}
                variant="outline"
                className="bg-background/60"
              >
                {submittingCommand === "contact_sweep" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PhoneCall className="mr-2 h-4 w-4" />
                )}
                {copy.contactSweep}
              </Button>
              <Button asChild variant="outline" className="bg-background/60">
                <Link href="/apply/lead-hunter">
                  {copy.openIntake}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                onClick={() => {
                  void loadSnapshot();
                }}
                variant="ghost"
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {copy.refresh}
              </Button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <InfoTile label={copy.statusWorkspace} value={snapshot.workspaceLabel} />
            <InfoTile label={copy.statusStorage} value={snapshot.storageLabel} />
            <InfoTile
              label={copy.statusLastSnapshot}
              value={formatDate(snapshot.reporting.lastUpdatedAt, locale)}
            />
            <InfoTile
              label={copy.statusLastRun}
              value={formatDate(snapshot.reporting.lastRunAt, locale)}
            />
            <InfoTile
              label={locale === "es" ? "Comandos pendientes" : "Pending commands"}
              value={String(snapshot.metrics.pendingCommands)}
            />
          </div>
        </CardHeader>
      </ShellCard>

      {error ? (
        <Alert className="border-amber-400/20 bg-amber-500/10">
          <AlertTitle>{copy.fetchError}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ShellCard>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base text-white">{copy.metricsTitle}</CardTitle>
              <CardDescription className="text-slate-300">{copy.metricsDescription}</CardDescription>
            </div>
            <HardHat className={`h-5 w-5 ${LEAD_HUNTER_ACCENT_TEXT}`} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/10 bg-[#081320]/72 px-3 py-3 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{metric.label}</p>
                <metric.icon className={`h-4 w-4 ${LEAD_HUNTER_ACCENT_TEXT}`} />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </CardContent>
      </ShellCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <ShellCard>
          <CardHeader>
            <CardTitle className="text-base text-white">{copy.queueTitle}</CardTitle>
            <CardDescription className="text-slate-300">{copy.queueDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.priorityLeads.map((lead) => (
              <div
                key={lead.permitNumber}
                className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {stageLabelMap[lead.normalizedStage][locale]}
                      </Badge>
                      <Badge className={LEAD_HUNTER_ACCENT_BADGE}>
                        {recommendedActionMap[lead.recommendedAction][locale]}
                      </Badge>
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">{lead.address}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {lead.scopeOfWork ?? lead.normalizedProjectType.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="min-w-24 rounded-lg border border-white/10 bg-[#0D1828]/86 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{copy.score}</p>
                    <p className={`mt-1 text-xl font-bold ${LEAD_HUNTER_ACCENT_TEXT}`}>{lead.score}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <InfoTile label={copy.valuation} value={formatCurrency(lead.valuation, locale)} />
                  <InfoTile label={copy.contactStatus} value={getContactLine(lead, locale)} />
                  <InfoTile label={copy.owner} value={lead.ownerName ?? "—"} />
                  <InfoTile
                    label={copy.licensedPro}
                    value={lead.licensedProfessionalBusiness ?? lead.licensedProfessionalName ?? "—"}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </ShellCard>

        <div className="space-y-4">
          <ShellCard>
            <CardHeader>
              <CardTitle className="text-base text-white">{copy.activityTitle}</CardTitle>
              <CardDescription className="text-slate-300">{copy.activityDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{copy.latestRun}</p>
                    {snapshot.runs[0] ? (
                      <>
                        <p className="mt-2 text-sm font-semibold text-white">{snapshot.runs[0].id}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {formatDate(snapshot.runs[0].completedAt ?? snapshot.runs[0].startedAt, locale)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-300">{copy.noRun}</p>
                    )}
                  </div>

                  {snapshot.runs[0] ? (
                    <Badge className={runStatusMap[snapshot.runs[0].status].className}>
                      {runStatusMap[snapshot.runs[0].status][locale]}
                    </Badge>
                  ) : null}
                </div>

                {snapshot.runs[0] ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      {
                        label: copy.permitsFound,
                        value: snapshot.runs[0].permitsFound,
                        icon: Radar,
                      },
                      {
                        label: copy.inserted,
                        value: snapshot.runs[0].permitsInserted,
                        icon: Target,
                      },
                      {
                        label: copy.updated,
                        value: snapshot.runs[0].permitsUpdated,
                        icon: RefreshCw,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-white/10 bg-[#0D1828]/86 px-3 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">{item.label}</p>
                          <item.icon className={`h-4 w-4 ${LEAD_HUNTER_ACCENT_TEXT}`} />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{copy.queuedCommands}</p>
                <div className="mt-4 space-y-2">
                  {snapshot.commands.length === 0 ? (
                    <p className="text-sm leading-7 text-slate-300">{copy.emptyCommands}</p>
                  ) : (
                    snapshot.commands.map((command) => (
                      <div
                        key={command.id}
                        className="rounded-lg border border-white/10 bg-[#0D1828]/86 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {commandCopyMap[command.type][locale]}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                              {formatDate(command.requestedAt, locale)}
                            </p>
                            {command.note ? (
                              <p className="mt-2 text-xs leading-5 text-slate-300">
                                {command.note}
                              </p>
                            ) : null}
                          </div>
                          <Badge className={command.status === "completed" ? LEAD_HUNTER_ACCENT_BADGE : "border-border/60 bg-background/60 text-muted-foreground"}>
                            {command.status === "completed" ? copy.completedLocal : copy.pendingBackend}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-4 text-xs leading-6 text-slate-300">{copy.localQueueNote}</p>
              </div>
            </CardContent>
          </ShellCard>

          <ShellCard>
            <CardContent className="space-y-3 p-5">
              <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0D1828]/86">
                    <MapPinned className={`h-5 w-5 ${LEAD_HUNTER_ACCENT_TEXT}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{copy.contactQueueTitle}</p>
                    <p className="text-xs text-slate-300">
                      {locale === "es"
                        ? `${snapshot.metrics.fullContact} contacto completo · ${snapshot.metrics.ownerOnly} solo owner · ${snapshot.metrics.manualResearch} investigación manual`
                        : `${snapshot.metrics.fullContact} full contact · ${snapshot.metrics.ownerOnly} owner only · ${snapshot.metrics.manualResearch} manual research`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#0D1828]/86">
                    <Mail className={`h-5 w-5 ${LEAD_HUNTER_ACCENT_TEXT}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{copy.nextHandoffTitle}</p>
                    <p className="text-xs leading-6 text-slate-300">{copy.nextHandoffBody}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </ShellCard>
        </div>
      </div>
    </section>
  );
}
