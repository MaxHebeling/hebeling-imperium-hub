"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock3,
  ListFilter,
  PhoneCall,
  Radar,
  Users,
} from "lucide-react";

import { LeadHunterLeadRow } from "@/components/lead-hunter/lead-row";
import { LeadHunterOperatorsAccessPanel } from "@/components/lead-hunter/operators-access-panel";
import { PermitCommandCenter } from "@/components/lead-hunter/permit-command-center";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PermitHunterCommandCenterSnapshot } from "@/lib/lead-hunter/permit-hunter-types";

type SnapshotResponse =
  | {
      success: true;
      snapshot: PermitHunterCommandCenterSnapshot;
    }
  | {
      success: false;
      error?: string;
    };

function formatDateTime(value: string | null) {
  if (!value) return "Sin registro";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sectionShell(title: string, subtitle: string, children: React.ReactNode) {
  return (
    <Card className="overflow-hidden rounded-[24px] border border-[#1E3048] bg-[#0D1828]/78 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="h-px bg-[#C96F2D]" />
      <CardHeader>
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        <CardDescription className="text-slate-300">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function metricCard(label: string, value: string | number, icon: React.ReactNode) {
  return (
    <Card className="overflow-hidden rounded-[24px] border border-[#1E3048] bg-[#0D1828]/78 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="h-px bg-[#C96F2D]" />
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          {icon}
        </div>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

export function LeadHunterOperatingSystem() {
  const [snapshot, setSnapshot] = useState<PermitHunterCommandCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    try {
      const response = await fetch("/api/lead-hunter/permit-hunter", {
        credentials: "include",
      });
      const payload = (await response.json()) as SnapshotResponse;

      if (!response.ok || !payload.success) {
        throw new Error(
          "error" in payload ? payload.error || "No pude cargar Lead Hunter." : "No pude cargar Lead Hunter."
        );
      }

      setSnapshot(payload.snapshot);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "No pude cargar Lead Hunter.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [loadSnapshot]);

  const topInventory = useMemo(() => snapshot?.dashboard.sections.qualifiedPipeline ?? [], [snapshot]);
  const fullContact = useMemo(
    () =>
      topInventory.filter((lead) => Boolean(lead.ownerPhone || lead.ownerEmail)),
    [topInventory]
  );
  const ownerOnly = useMemo(
    () =>
      topInventory.filter(
        (lead) =>
          !lead.ownerPhone &&
          !lead.ownerEmail &&
          Boolean(lead.ownerName || lead.mailingAddress)
      ),
    [topInventory]
  );
  const manualResearch = useMemo(
    () =>
      topInventory.filter(
        (lead) =>
          !lead.ownerPhone &&
          !lead.ownerEmail &&
          !lead.ownerName &&
          !lead.mailingAddress
      ),
    [topInventory]
  );

  if (loading && !snapshot) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full bg-muted" />
          ))}
        </div>
        <Skeleton className="h-[480px] w-full bg-muted" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No pude abrir Lead Hunter</AlertTitle>
        <AlertDescription>{error ?? "No hay snapshot disponible."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-[20px] border border-[#1E3048] bg-[#081320]/78 p-2 backdrop-blur-sm">
        <TabsTrigger value="overview" className="gap-2 text-slate-300 data-[state=active]:bg-[#162235] data-[state=active]:text-white">
          <Radar className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="inventory" className="gap-2 text-slate-300 data-[state=active]:bg-[#162235] data-[state=active]:text-white">
          <ListFilter className="h-4 w-4" />
          Inventory
        </TabsTrigger>
        <TabsTrigger value="access" className="gap-2 text-slate-300 data-[state=active]:bg-[#162235] data-[state=active]:text-white">
          <Users className="h-4 w-4" />
          Access
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <PermitCommandCenter />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCard(
            "Inventario activo",
            snapshot.dashboard.metrics.qualifiedLeadInventory,
            <Building2 className="h-4 w-4 text-[#E1A24A]" />
          )}
          {metricCard(
            "Hot Leads",
            snapshot.dashboard.metrics.hotLeads,
            <PhoneCall className="h-4 w-4 text-[#E1A24A]" />
          )}
          {metricCard(
            "Fresh Issuance",
            snapshot.dashboard.metrics.freshIssuanceLeads,
            <Building2 className="h-4 w-4 text-[#E1A24A]" />
          )}
          {metricCard(
            "Enrichment Pending",
            snapshot.dashboard.metrics.enrichmentPending,
            <Clock3 className="h-4 w-4 text-[#E1A24A]" />
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {sectionShell(
            "Prioridades de ataque",
            "Las colas accionables que ya venían construidas en Permit-Hunter.",
            <div className="space-y-4">
              {[
                { label: "Call first", leads: snapshot.dashboard.priorities.call_first },
                {
                  label: "Enrich immediately",
                  leads: snapshot.dashboard.priorities.enrich_immediately,
                },
                { label: "Research next", leads: snapshot.dashboard.priorities.research_next },
              ].map(({ label, leads }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{label}</p>
                    <Badge variant="secondary">{leads.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {leads.slice(0, 3).map((lead) => (
                      <LeadHunterLeadRow
                        key={`${label}-${lead.permitNumber}`}
                        lead={lead}
                        href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                        onUpdated={loadSnapshot}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {sectionShell(
              "Estado del sistema",
              "Lectura rápida del inventario y las corridas actuales.",
              <div className="grid gap-3">
                <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Última corrida exitosa
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {formatDateTime(
                      snapshot.dashboard.reporting.lastSuccessfulRun?.completedAt ?? null
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Inventario actualizado
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {formatDateTime(snapshot.dashboard.reporting.latestLeadUpdatedAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Run status
                  </p>
                  <p className="mt-2 text-base font-semibold capitalize text-white">
                    {snapshot.dashboard.metrics.lastRunStatus.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            )}

            {sectionShell(
              "Cobertura",
              "Distribución actual por ciudad y tipo de proyecto.",
              <div className="grid gap-3 md:grid-cols-2">
                {snapshot.dashboard.reporting.inventoryByCity.map((item) => (
                  <div
                    key={item.city}
                    className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.city}</p>
                      <p className="text-sm text-slate-300">{item.count} leads</p>
                    </div>
                  </div>
                ))}
                {snapshot.dashboard.reporting.inventoryByProjectType.map((item) => (
                  <div
                    key={item.projectType}
                    className="rounded-xl border border-white/10 bg-[#081320]/72 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium capitalize text-white">
                        {item.projectType.replaceAll("_", " ")}
                      </p>
                      <p className="text-sm text-slate-300">{item.count} leads</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="inventory" className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-3">
          {sectionShell(
            "Full contact",
            "Leads listos para contacto inmediato.",
            <div className="space-y-3">
              {fullContact.slice(0, 4).map((lead) => (
                <LeadHunterLeadRow
                  key={`full-${lead.permitNumber}`}
                  lead={lead}
                  href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                  onUpdated={loadSnapshot}
                />
              ))}
            </div>
          )}
          {sectionShell(
            "Owner only",
            "Owner y mailing disponibles, pero falta contacto directo.",
            <div className="space-y-3">
              {ownerOnly.slice(0, 4).map((lead) => (
                <LeadHunterLeadRow
                  key={`owner-${lead.permitNumber}`}
                  lead={lead}
                  href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                  onUpdated={loadSnapshot}
                />
              ))}
            </div>
          )}
          {sectionShell(
            "Manual research",
            "Permisos que todavía requieren trabajo manual o compra de contacto.",
            <div className="space-y-3">
              {manualResearch.slice(0, 4).map((lead) => (
                <LeadHunterLeadRow
                  key={`manual-${lead.permitNumber}`}
                  lead={lead}
                  href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                  onUpdated={loadSnapshot}
                />
              ))}
            </div>
          )}
        </div>

        {sectionShell(
          "Inventario calificado",
          "Inventario principal ya filtrado y listo para trabajarse dentro de Lead Hunter.",
          <div className="space-y-3">
            {snapshot.dashboard.sections.qualifiedPipeline.map((lead) => (
              <LeadHunterLeadRow
                key={lead.permitNumber}
                lead={lead}
                href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                onUpdated={loadSnapshot}
              />
            ))}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          {sectionShell(
            "Hot leads",
            "Permisos de mayor score para atacar primero.",
            <div className="space-y-3">
              {snapshot.dashboard.sections.hotLeads.map((lead) => (
                <LeadHunterLeadRow
                  key={`hot-${lead.permitNumber}`}
                  lead={lead}
                  href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                  onUpdated={loadSnapshot}
                />
              ))}
            </div>
          )}
          {sectionShell(
            "Recent updates",
            "Cambios más recientes dentro del inventario activo.",
            <div className="space-y-3">
              {snapshot.dashboard.sections.recentUpdates.map((lead) => (
                <LeadHunterLeadRow
                  key={`recent-${lead.permitNumber}`}
                  lead={lead}
                  href={`/app/companies/lead-hunter/leads/${encodeURIComponent(lead.permitNumber)}`}
                  onUpdated={loadSnapshot}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-[#1E3048] bg-[#0D1828]/78 p-4 text-sm text-slate-300 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          Cada lead abre su expediente propio con información operativa y señales del permiso en{" "}
          <Link
            href="/app/companies/lead-hunter/leads/PRJ-2026-001245"
            className="font-medium text-[#E1A24A] underline-offset-4 hover:underline"
          >
            la vista de detalle de Lead Hunter
          </Link>
          .
        </div>
      </TabsContent>

      <TabsContent value="access" className="space-y-6">
        <LeadHunterOperatorsAccessPanel />
      </TabsContent>
    </Tabs>
  );
}
