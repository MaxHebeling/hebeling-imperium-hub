"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Database, Mail, Phone, Sparkles } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import type { PermitHunterLead } from "@/lib/lead-hunter/permit-hunter-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getContactStatus(lead: PermitHunterLead) {
  if (lead.ownerPhone || lead.ownerEmail) {
    return {
      label: "Contacto completo",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (lead.ownerName || lead.mailingAddress) {
    return {
      label: "Owner identificado",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    };
  }

  return {
    label: "Investigación manual",
    className: "border-border/60 bg-background/60 text-muted-foreground",
  };
}

export function LeadHunterLeadRow({
  lead,
  href,
  onUpdated,
}: {
  lead: PermitHunterLead;
  href?: string;
  onUpdated?: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canEnrichInline = !lead.ownerPhone && !lead.ownerEmail;
  const contactStatus = getContactStatus(lead);

  async function enrichNow() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/leads/${encodeURIComponent(lead.permitNumber)}/buy-contact`,
        { method: "POST" }
      );
      const payload = (await response.json()) as
        | {
            success: true;
            enrichment: {
              ownerName: string;
              ownerPhone: string;
              ownerEmail: string;
              mailingAddress: string;
            };
          }
        | { success: false; error?: string };

      if (!response.ok || !payload.success) {
        const error =
          "error" in payload ? payload.error || "No pude enriquecer el lead." : "No pude enriquecer el lead.";
        throw new Error(error);
      }

      setMessage(
        [payload.enrichment.ownerName, payload.enrichment.ownerPhone, payload.enrichment.ownerEmail]
          .filter(Boolean)
          .join(" · ")
      );
      toast({
        title: "Contacto enriquecido",
        description: "El lead ya tiene owner phone y email dentro de Lead Hunter.",
      });
      await onUpdated?.();
    } catch (error) {
      toast({
        title: "Error de enriquecimiento",
        description: error instanceof Error ? error.message : "No pude enriquecer el lead.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[#1E3048] bg-[#0D1828]/82 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-[#C96F2D]/20 bg-[#C96F2D]/10 text-[#E1A24A] hover:bg-[#C96F2D]/10">
              {lead.normalizedStage.replaceAll("_", " ")}
            </Badge>
            <Badge variant="secondary">{lead.normalizedProjectType.replaceAll("_", " ")}</Badge>
            <Badge className={contactStatus.className}>{contactStatus.label}</Badge>
            {lead.isHotLead ? (
              <Badge className="border-rose-500/20 bg-rose-500/10 text-rose-200">
                Hot lead
              </Badge>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-white">{lead.address}</p>
              {href ? (
                <Link
                  href={href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#E1A24A] transition hover:text-[#f0b766]"
                >
                  Abrir expediente
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {lead.permitNumber} · {lead.rawStatus} · {lead.city}
            </p>
          </div>

          {lead.scopeOfWork ? (
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              {lead.scopeOfWork}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#E1A24A]" />
              Score {lead.score}
            </span>
            <span className="inline-flex items-center gap-2">
              <Database className="h-4 w-4 text-[#E1A24A]" />
              {lead.valuation ? `$${lead.valuation.toLocaleString()}` : "Valuación pendiente"}
            </span>
            {lead.ownerPhone ? (
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#E1A24A]" />
                {lead.ownerPhone}
              </span>
            ) : null}
            {lead.ownerEmail ? (
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#E1A24A]" />
                {lead.ownerEmail}
              </span>
            ) : null}
          </div>

          {lead.ownerName || lead.mailingAddress ? (
            <p className="text-sm text-slate-300">
              {[lead.ownerName, lead.mailingAddress].filter(Boolean).join(" · ")}
            </p>
          ) : null}

          {message ? <p className="text-sm text-[#E1A24A]">{message}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:max-w-[260px] xl:justify-end">
          <Badge variant="secondary">{lead.recommendedAction.replaceAll("_", " ")}</Badge>
          {canEnrichInline ? (
            <Button
              variant="outline"
              className="border-[#C96F2D]/30 bg-background/60 text-[#E1A24A] hover:bg-[#C96F2D]/10 hover:text-[#E1A24A]"
              onClick={enrichNow}
              disabled={busy}
            >
              {busy ? "Enriqueciendo..." : lead.ownerName ? "Refrescar contacto" : "Enriquecer ahora"}
            </Button>
          ) : (
            <Button variant="outline" className="border-border/60 bg-background/60" asChild>
              <Link href={href ?? "#"}>Abrir expediente</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
