"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  projectTitle: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  discount?: number;
  amountPaid?: number;
  issueDate: string;
  dueDate: string;
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
}

interface InvoiceViewerPanelProps {
  projectId: string;
  locale?: "es" | "en";
}

const INVOICE_STATUS_CONFIG = {
  draft: {
    icon: Clock,
    labelEs: "Borrador",
    labelEn: "Draft",
    color: "bg-gray-100 text-gray-600",
  },
  sent: {
    icon: FileText,
    labelEs: "Enviada",
    labelEn: "Sent",
    color: "bg-blue-100 text-blue-700",
  },
  paid: {
    icon: CheckCircle2,
    labelEs: "Pagada",
    labelEn: "Paid",
    color: "bg-green-100 text-green-700",
  },
  overdue: {
    icon: AlertTriangle,
    labelEs: "Vencida",
    labelEn: "Overdue",
    color: "bg-red-100 text-red-600",
  },
  cancelled: {
    icon: XCircle,
    labelEs: "Cancelada",
    labelEn: "Cancelled",
    color: "bg-gray-100 text-gray-500",
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

export function InvoiceViewerPanel({
  projectId,
  locale = "es",
}: InvoiceViewerPanelProps) {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch(
          `/api/editorial/client/projects/${projectId}/invoices`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setInvoices(json.invoices ?? []);
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">
              {locale === "es"
                ? "Cargando facturas..."
                : "Loading invoices..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-400" />
            {locale === "es" ? "Mis Facturas" : "My Invoices"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              {locale === "es"
                ? "No hay facturas para este proyecto aun."
                : "No invoices for this project yet."}
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
            <Receipt className="h-4 w-4 text-gray-400" />
            {locale === "es" ? "Mis Facturas" : "My Invoices"} (
            {invoices.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const statusCfg = INVOICE_STATUS_CONFIG[invoice.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === invoice.id;
            const balance = invoice.total - (invoice.amountPaid ?? 0);

            return (
              <div
                key={invoice.id}
                className="rounded-xl border border-gray-100 overflow-hidden"
              >
                {/* Invoice header - clickable */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : invoice.id)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Receipt className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        #{invoice.invoiceNumber}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {fmtDate(invoice.issueDate, locale)}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          {fmtCurrency(invoice.total, invoice.currency)}
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
                    {/* Line items */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-3 mb-2">
                      {locale === "es" ? "Detalle" : "Details"}
                    </p>
                    <div className="space-y-1.5">
                      {invoice.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <span className="text-gray-600 truncate block">
                              {item.description}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {item.quantity} x{" "}
                              {fmtCurrency(item.unitPrice, invoice.currency)}
                            </span>
                          </div>
                          <span className="text-gray-500 font-medium tabular-nums shrink-0 ml-2">
                            {fmtCurrency(item.amount, invoice.currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-500 tabular-nums">
                          {fmtCurrency(invoice.subtotal, invoice.currency)}
                        </span>
                      </div>
                      {invoice.taxRate > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {locale === "es" ? "Impuesto" : "Tax"} (
                            {(invoice.taxRate * 100).toFixed(0)}%)
                          </span>
                          <span className="text-gray-500 tabular-nums">
                            {fmtCurrency(invoice.taxAmount, invoice.currency)}
                          </span>
                        </div>
                      )}
                      {invoice.discount && invoice.discount > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600">
                            {locale === "es" ? "Descuento" : "Discount"}
                          </span>
                          <span className="text-green-600 tabular-nums">
                            -{fmtCurrency(invoice.discount, invoice.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                        <span className="font-semibold text-gray-700">
                          Total
                        </span>
                        <span className="font-bold text-gray-900 tabular-nums">
                          {fmtCurrency(invoice.total, invoice.currency)}
                        </span>
                      </div>
                      {invoice.amountPaid != null && invoice.amountPaid > 0 && (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600">
                              {locale === "es" ? "Pagado" : "Paid"}
                            </span>
                            <span className="text-green-600 tabular-nums">
                              {fmtCurrency(
                                invoice.amountPaid,
                                invoice.currency
                              )}
                            </span>
                          </div>
                          {balance > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-amber-600">
                                {locale === "es" ? "Saldo" : "Balance"}
                              </span>
                              <span className="font-bold text-amber-600 tabular-nums">
                                {fmtCurrency(balance, invoice.currency)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Due date */}
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                      <span>
                        {locale === "es" ? "Vencimiento" : "Due"}:{" "}
                        {fmtDate(invoice.dueDate, locale)}
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
