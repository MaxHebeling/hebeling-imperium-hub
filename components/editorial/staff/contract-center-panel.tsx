"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSignature,
  Plus,
  Download,
  Loader2,
  Send,
  Eye,
} from "lucide-react";

interface Contract {
  id: string;
  type: string;
  status: "draft" | "sent" | "signed" | "expired";
  createdAt: string;
  signedAt: string | null;
  clientName: string;
}

interface ContractCenterPanelProps {
  projectId: string;
  projectTitle: string;
  clientName?: string;
}

const CONTRACT_TYPES = [
  { value: "editorial_service", label: "Servicio Editorial Completo" },
  { value: "editing_only", label: "Solo Edicion / Correccion" },
  { value: "design_cover", label: "Diseno de Portada" },
  { value: "distribution", label: "Distribucion y Publicacion" },
  { value: "ebook_production", label: "Produccion eBook" },
  { value: "custom", label: "Personalizado" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviado", color: "bg-blue-500/10 text-blue-600" },
  signed: { label: "Firmado", color: "bg-emerald-500/10 text-emerald-600" },
  expired: { label: "Expirado", color: "bg-destructive/10 text-destructive" },
};

export function ContractCenterPanel({ projectId, projectTitle, clientName }: ContractCenterPanelProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newContractType, setNewContractType] = useState("editorial_service");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateContract() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/projects/${projectId}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newContractType, projectTitle, clientName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al generar contrato");
      }

      const json = await res.json();
      setContracts((prev) => [
        {
          id: json.contractId ?? `contract-${Date.now()}`,
          type: newContractType,
          status: "draft",
          createdAt: new Date().toISOString(),
          signedAt: null,
          clientName: clientName ?? "Cliente",
        },
        ...prev,
      ]);
      setShowNewForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Centro de Contratos</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowNewForm(!showNewForm)} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Nuevo contrato
            </Button>
          </div>
          <CardDescription>
            Genera, envia y gestiona los contratos del proyecto.
          </CardDescription>
        </CardHeader>

        {showNewForm && (
          <CardContent className="space-y-3 border-t border-border/50 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de contrato</Label>
                <Select value={newContractType} onValueChange={setNewContractType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Input value={clientName ?? ""} disabled className="h-9" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={generateContract} disabled={generating} className="gap-1">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSignature className="h-3.5 w-3.5" />}
                {generating ? "Generando..." : "Generar contrato"}
              </Button>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
          </CardContent>
        )}

        <CardContent className={showNewForm ? "pt-0" : ""}>
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <FileSignature className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay contratos para este proyecto.</p>
              <p className="text-xs text-muted-foreground">Crea uno nuevo para comenzar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contracts.map((contract) => {
                const statusInfo = STATUS_LABELS[contract.status] ?? STATUS_LABELS.draft;
                return (
                  <div key={contract.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileSignature className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {CONTRACT_TYPES.find((t) => t.value === contract.type)?.label ?? contract.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contract.clientName} - {new Date(contract.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {contract.status === "draft" && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
