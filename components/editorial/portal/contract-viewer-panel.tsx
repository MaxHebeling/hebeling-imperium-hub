"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface PortalContract {
  id: string;
  type: string;
  status: "draft" | "sent" | "signed" | "cancelled";
  locale: string;
  jurisdiction: string;
  projectTitle: string;
  totalAmount: number;
  currency: string;
  startDate: string;
  services: { name: string; amount: number }[];
}

interface ContractViewerPanelProps {
  projectId: string;
  locale?: "es" | "en";
}

const STATUS_CONFIG = {
  draft: {
    icon: Clock,
    labelEs: "Borrador",
    labelEn: "Draft",
    color: "bg-gray-100 text-gray-600",
  },
  sent: {
    icon: FileText,
    labelEs: "Enviado",
    labelEn: "Sent",
    color: "bg-blue-100 text-blue-700",
  },
  signed: {
    icon: CheckCircle2,
    labelEs: "Firmado",
    labelEn: "Signed",
    color: "bg-green-100 text-green-700",
  },
  cancelled: {
    icon: XCircle,
    labelEs: "Cancelado",
    labelEn: "Cancelled",
    color: "bg-red-100 text-red-600",
  },
};

function fmtCurrency(amount: number, currency: string): string {
  const loc =
    currency === "USD" ? "en-US" : currency === "ARS" ? "es-AR" : "es-MX";
  return new Intl.NumberFormat(loc, { style: "currency", currency }).format(
    amount
  );
}

function fmtDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" }
  );
}

export function ContractViewerPanel({
  projectId,
  locale = "es",
}: ContractViewerPanelProps) {
  const [contracts, setContracts] = useState<PortalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch(
          `/api/editorial/client/projects/${projectId}/contracts`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setContracts(json.contracts ?? []);
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">
              {locale === "es"
                ? "Cargando contratos..."
                : "Loading contracts..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            {locale === "es" ? "Mis Contratos" : "My Contracts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              {locale === "es"
                ? "No hay contratos para este proyecto aun."
                : "No contracts for this project yet."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            {locale === "es" ? "Mis Contratos" : "My Contracts"} (
            {contracts.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {contracts.map((contract) => {
            const statusCfg = STATUS_CONFIG[contract.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === contract.id;

            return (
              <div
                key={contract.id}
                className="rounded-xl border border-gray-100 overflow-hidden"
              >
                {/* Contract header - clickable */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : contract.id)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-[#1a3a6b]/60" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {contract.projectTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {fmtDate(contract.startDate, locale)}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          <DollarSign className="h-3 w-3 inline" />
                          {fmtCurrency(contract.totalAmount, contract.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${statusCfg.color} text-[10px] shrink-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {locale === "es" ? statusCfg.labelEs : statusCfg.labelEn}
                  </Badge>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">
                      {locale === "es"
                        ? "Servicios contratados"
                        : "Contracted services"}
                    </p>
                    <div className="space-y-1.5">
                      {contract.services.map((svc, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-600">{svc.name}</span>
                          <span className="text-gray-500 font-medium tabular-nums">
                            {fmtCurrency(svc.amount, contract.currency)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-100">
                        <span className="font-semibold text-gray-700">
                          Total
                        </span>
                        <span className="font-bold text-[#1a3a6b] tabular-nums">
                          {fmtCurrency(
                            contract.totalAmount,
                            contract.currency
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                      <span>
                        {locale === "es" ? "Jurisdiccion" : "Jurisdiction"}:{" "}
                        {contract.jurisdiction.toUpperCase()}
                      </span>
                      <span>
                        {locale === "es" ? "Idioma" : "Language"}:{" "}
                        {contract.locale.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
