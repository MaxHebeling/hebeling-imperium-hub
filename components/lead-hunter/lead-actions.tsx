"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import type { PermitHunterOutreachRecord } from "@/lib/lead-hunter/permit-hunter-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function LeadHunterLeadActions({
  permitNumber,
  defaultStatus,
  hasContact,
}: {
  permitNumber: string;
  defaultStatus: PermitHunterOutreachRecord | null;
  hasContact: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [createdBy, setCreatedBy] = useState("operador");
  const [status, setStatus] = useState(defaultStatus?.status ?? "new");
  const [channel, setChannel] = useState(defaultStatus?.channel ?? "call");
  const [ownerResponse, setOwnerResponse] = useState(defaultStatus?.ownerResponse ?? "");
  const [nextFollowUpAt, setNextFollowUpAt] = useState(
    defaultStatus?.nextFollowUpAt?.slice(0, 16) ?? ""
  );
  const [lastContactedAt, setLastContactedAt] = useState(
    defaultStatus?.lastContactedAt?.slice(0, 16) ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);

  async function submitNote() {
    if (!note.trim()) return;
    setBusy(true);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/leads/${encodeURIComponent(permitNumber)}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note, createdBy }),
        }
      );

      if (!response.ok) {
        throw new Error("No pude guardar la nota.");
      }

      setNote("");
      toast({
        title: "Nota guardada",
        description: "La nota ya quedó registrada dentro de Lead Hunter.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "No pude guardar la nota",
        description: error instanceof Error ? error.message : "Error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveOutreach() {
    setBusy(true);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/leads/${encodeURIComponent(permitNumber)}/outreach`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            channel,
            ownerResponse: ownerResponse || null,
            lastContactedAt: lastContactedAt ? new Date(lastContactedAt).toISOString() : null,
            nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("No pude guardar el outreach.");
      }

      toast({
        title: "Outreach actualizado",
        description: "El estado del contacto quedó actualizado.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "No pude guardar el outreach",
        description: error instanceof Error ? error.message : "Error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function buyContact() {
    setContactBusy(true);
    setContactMessage(null);

    try {
      const response = await fetch(
        `/api/lead-hunter/permit-hunter/leads/${encodeURIComponent(permitNumber)}/buy-contact`,
        {
          method: "POST",
        }
      );
      const payload = (await response.json()) as
        | {
            success: true;
            enrichment: {
              ownerPhone: string;
              ownerEmail: string;
            };
          }
        | { success: false; error?: string };

      if (!response.ok || !payload.success) {
        const error =
          "error" in payload ? payload.error || "No pude comprar el contacto." : "No pude comprar el contacto.";
        throw new Error(error);
      }

      setContactMessage(
        [payload.enrichment.ownerPhone, payload.enrichment.ownerEmail]
          .filter(Boolean)
          .join(" · ")
      );
      toast({
        title: "Contacto agregado",
        description: "El owner ya tiene teléfono y email dentro del sistema.",
      });
      router.refresh();
    } catch (error) {
      setContactMessage(error instanceof Error ? error.message : "Error inesperado.");
      toast({
        title: "No pude enriquecer el contacto",
        description: error instanceof Error ? error.message : "Error inesperado.",
        variant: "destructive",
      });
    } finally {
      setContactBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
        <div className="h-px bg-[#C96F2D]" />
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Agregar nota</CardTitle>
          <CardDescription className="text-muted-foreground">
            Log operativo del lead para que el equipo vea contexto real.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={createdBy}
            onChange={(event) => setCreatedBy(event.target.value)}
            placeholder="Creado por"
            className="bg-background/60"
          />
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="¿Qué pasó en este lead?"
            className="min-h-32 bg-background/60"
          />
          <Button
            className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
            onClick={submitNote}
            disabled={busy}
          >
            Guardar nota
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.16)]">
        <div className="h-px bg-[#C96F2D]" />
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Estado de outreach</CardTitle>
          <CardDescription className="text-muted-foreground">
            Controla estado, canal y siguiente seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <select
            className="h-10 rounded-md border border-border bg-background/60 px-3 text-sm text-foreground"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="new">Nuevo</option>
            <option value="attempted">Intentado</option>
            <option value="contacted">Contactado</option>
            <option value="won">Ganado</option>
            <option value="lost">Perdido</option>
          </select>
          <select
            className="h-10 rounded-md border border-border bg-background/60 px-3 text-sm text-foreground"
            value={channel ?? "call"}
            onChange={(event) => setChannel(event.target.value as typeof channel)}
          >
            <option value="call">Llamada</option>
            <option value="text">Texto</option>
            <option value="email">Email</option>
            <option value="other">Otro</option>
          </select>
          <Textarea
            value={ownerResponse}
            onChange={(event) => setOwnerResponse(event.target.value)}
            placeholder="Respuesta del owner o disposition"
            className="min-h-24 bg-background/60"
          />
          <Input
            type="datetime-local"
            value={lastContactedAt}
            onChange={(event) => setLastContactedAt(event.target.value)}
            className="bg-background/60"
          />
          <Input
            type="datetime-local"
            value={nextFollowUpAt}
            onChange={(event) => setNextFollowUpAt(event.target.value)}
            className="bg-background/60"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
              onClick={saveOutreach}
              disabled={busy}
            >
              Guardar outreach
            </Button>
            <Button
              variant="outline"
              className="border-[#C96F2D]/30 bg-background/60 text-[#E1A24A] hover:bg-[#C96F2D]/10 hover:text-[#E1A24A]"
              onClick={buyContact}
              disabled={contactBusy || hasContact}
            >
              {hasContact ? "Contacto en archivo" : contactBusy ? "Comprando..." : "Comprar contacto"}
            </Button>
          </div>
          {contactMessage ? (
            <p className="text-sm text-muted-foreground">{contactMessage}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
