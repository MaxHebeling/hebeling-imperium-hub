"use client";

import { useState, useCallback } from "react";
import type { ContractLocale } from "@/lib/editorial/oficina/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InvoiceFormItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormData {
  locale: ContractLocale;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId: string;
  projectTitle: string;
  items: InvoiceFormItem[];
  taxRate: number;
  discount: number;
  currency: "USD" | "MXN" | "ARS";
  dueInDays: number;
  notes: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
}

interface InvoiceManagerProps {
  locale?: ContractLocale;
  prefillClient?: {
    name: string;
    email: string;
    address?: string;
    taxId?: string;
  };
  prefillProject?: { title: string };
  prefillItems?: InvoiceFormItem[];
  prefillDiscount?: number;
  prefillCurrency?: "USD" | "MXN" | "ARS";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InvoiceManager({
  locale = "es",
  prefillClient,
  prefillProject,
  prefillItems,
  prefillDiscount,
  prefillCurrency,
}: InvoiceManagerProps) {
  const isES = locale === "es";

  const [form, setForm] = useState<InvoiceFormData>({
    locale,
    clientName: prefillClient?.name ?? "",
    clientEmail: prefillClient?.email ?? "",
    clientAddress: prefillClient?.address ?? "",
    clientTaxId: prefillClient?.taxId ?? "",
    projectTitle: prefillProject?.title ?? "",
    items: prefillItems ?? [{ description: "", quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    discount: prefillDiscount ?? 0,
    currency: prefillCurrency ?? "USD",
    dueInDays: 30,
    notes: "",
    status: "draft",
  });

  const [generating, setGenerating] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<"invoice" | "receipt">("invoice");

  // --- Receipt state ---
  const [receiptInvoiceNumber, setReceiptInvoiceNumber] = useState("");
  const [receiptAmount, setReceiptAmount] = useState(0);
  const [receiptPaymentMethod, setReceiptPaymentMethod] = useState("");
  const [receiptServiceDescription, setReceiptServiceDescription] = useState("");
  const [receiptHTML, setReceiptHTML] = useState<string | null>(null);

  const update = useCallback(
    <K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Items management
  const addItem = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0 }],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof InvoiceFormItem, value: string | number) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  // Calculate totals
  const subtotal = form.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = subtotal * form.taxRate;
  const total = subtotal + taxAmount - form.discount;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: form.currency }).format(n);

  // Generate invoice
  const handleGenerateInvoice = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + form.dueInDays);

      const res = await fetch("/api/staff/oficina/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invoice",
          locale: form.locale,
          client: {
            id: "temp",
            fullName: form.clientName,
            email: form.clientEmail,
            address: form.clientAddress || undefined,
            taxId: form.clientTaxId || undefined,
          },
          projectTitle: form.projectTitle,
          items: form.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
          taxRate: form.taxRate,
          discount: form.discount,
          currency: form.currency,
          issueDate: now.toISOString(),
          dueDate: dueDate.toISOString(),
          notes: form.notes || undefined,
          status: form.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar factura");
      }

      const data = await res.json();
      setInvoiceHTML(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }, [form]);

  // Generate receipt
  const handleGenerateReceipt = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/oficina/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "receipt",
          locale: form.locale,
          client: {
            id: "temp",
            fullName: form.clientName,
            email: form.clientEmail,
          },
          invoiceNumber: receiptInvoiceNumber,
          amount: receiptAmount,
          currency: form.currency,
          paymentMethod: receiptPaymentMethod,
          paymentDate: new Date().toISOString(),
          serviceDescription: receiptServiceDescription || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar recibo");
      }

      const data = await res.json();
      setReceiptHTML(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }, [form, receiptInvoiceNumber, receiptAmount, receiptPaymentMethod, receiptServiceDescription]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#C8A75B]">
          {isES ? "Facturación y Recibos" : "Invoices & Receipts"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isES
            ? "Genera facturas y recibos profesionales para Reino Editorial"
            : "Generate professional invoices and receipts for Reino Editorial"}
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 bg-[#162235] rounded-xl p-1 border border-white/5">
        <button
          onClick={() => setActiveTab("invoice")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "invoice"
              ? "bg-[#2F6FA3] text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {isES ? "Factura" : "Invoice"}
        </button>
        <button
          onClick={() => setActiveTab("receipt")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "receipt"
              ? "bg-[#059669] text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {isES ? "Recibo" : "Receipt"}
        </button>
      </div>

      {/* ============================================================ */}
      {/*  INVOICE TAB                                                  */}
      {/* ============================================================ */}
      {activeTab === "invoice" && (
        <>
          {/* Client & Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white mb-3">
                {isES ? "Cliente" : "Client"}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  placeholder={isES ? "Nombre completo" : "Full name"}
                  className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                />
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => update("clientEmail", e.target.value)}
                  placeholder="Email"
                  className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                />
                <input
                  type="text"
                  value={form.clientAddress}
                  onChange={(e) => update("clientAddress", e.target.value)}
                  placeholder={isES ? "Dirección" : "Address"}
                  className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                />
              </div>
            </div>
            <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white mb-3">
                {isES ? "Proyecto" : "Project"}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.projectTitle}
                  onChange={(e) => update("projectTitle", e.target.value)}
                  placeholder={isES ? "Título del proyecto" : "Project title"}
                  className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      {isES ? "Moneda" : "Currency"}
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value as "USD" | "MXN" | "ARS")}
                      className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="MXN">MXN</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      {isES ? "Vence en (días)" : "Due in (days)"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.dueInDays}
                      onChange={(e) => update("dueInDays", parseInt(e.target.value) || 30)}
                      className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Estado" : "Status"}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value as InvoiceFormData["status"])}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                  >
                    <option value="draft">{isES ? "Borrador" : "Draft"}</option>
                    <option value="sent">{isES ? "Enviada" : "Sent"}</option>
                    <option value="paid">{isES ? "Pagada" : "Paid"}</option>
                    <option value="overdue">{isES ? "Vencida" : "Overdue"}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                {isES ? "Conceptos" : "Line Items"}
              </h3>
              <button
                onClick={addItem}
                className="px-3 py-1.5 bg-[#2F6FA3]/20 text-[#2F6FA3] text-xs font-semibold rounded-lg hover:bg-[#2F6FA3]/30 transition-colors"
              >
                + {isES ? "Agregar" : "Add"}
              </button>
            </div>

            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold px-1">
                <div className="col-span-6">{isES ? "Descripción" : "Description"}</div>
                <div className="col-span-2 text-center">{isES ? "Cant." : "Qty"}</div>
                <div className="col-span-2 text-right">{isES ? "P. Unit." : "Price"}</div>
                <div className="col-span-1 text-right">{isES ? "Total" : "Total"}</div>
                <div className="col-span-1" />
              </div>

              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder={isES ? "Servicio..." : "Service..."}
                      className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center focus:border-[#2F6FA3] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-right focus:border-[#2F6FA3] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm text-white font-semibold">
                    {fmt(item.quantity * item.unitPrice)}
                  </div>
                  <div className="col-span-1 text-center">
                    {form.items.length > 1 && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
              <h3 className="text-sm font-semibold text-white mb-3">
                {isES ? "Ajustes" : "Adjustments"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "IVA / Impuesto (%)" : "Tax (%)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={form.taxRate}
                    onChange={(e) => update("taxRate", parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
                    placeholder="0.16"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    {isES ? "Ej: 0.16 para 16% IVA" : "E.g.: 0.16 for 16% tax"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Descuento ($)" : "Discount ($)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => update("discount", parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Notas" : "Notes"}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={2}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#162235] rounded-xl p-5 border border-[#C8A75B]/20">
              <h3 className="text-sm font-semibold text-[#C8A75B] mb-4">
                {isES ? "Resumen" : "Summary"}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-semibold">{fmt(subtotal)}</span>
                </div>
                {form.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-400">
                    <span>{isES ? "Descuento" : "Discount"}</span>
                    <span>-{fmt(form.discount)}</span>
                  </div>
                )}
                {form.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {isES ? "IVA" : "Tax"} ({(form.taxRate * 100).toFixed(0)}%)
                    </span>
                    <span className="text-white">{fmt(taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-[#C8A75B]/20 pt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-[#C8A75B]">Total</span>
                    <span className="text-xl font-bold text-[#C8A75B]">{fmt(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateInvoice}
                disabled={generating || !form.clientName || form.items.length === 0}
                className="w-full mt-4 py-3 bg-[#2F6FA3] text-white font-bold text-sm rounded-lg hover:bg-[#2F6FA3]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating
                  ? (isES ? "Generando..." : "Generating...")
                  : (isES ? "Generar Factura" : "Generate Invoice")}
              </button>
            </div>
          </div>

          {/* Invoice Preview */}
          {invoiceHTML && (
            <div className="bg-white rounded-xl overflow-hidden border border-white/10">
              <div className="bg-[#162235] px-5 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#C8A75B]">
                  {isES ? "Vista Previa de Factura" : "Invoice Preview"}
                </h3>
                <button
                  onClick={() => {
                    const blob = new Blob([invoiceHTML], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `factura-${form.clientName.replace(/\s+/g, "-")}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-[#C8A75B]/20 text-[#C8A75B] text-xs font-semibold rounded-lg hover:bg-[#C8A75B]/30 transition-colors"
                >
                  {isES ? "Descargar HTML" : "Download HTML"}
                </button>
              </div>
              <iframe
                srcDoc={invoiceHTML}
                className="w-full h-[600px] border-0"
                title="Invoice Preview"
              />
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  RECEIPT TAB                                                  */}
      {/* ============================================================ */}
      {activeTab === "receipt" && (
        <>
          <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-4">
              {isES ? "Datos del Recibo" : "Receipt Details"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Cliente" : "Client"}
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => update("clientName", e.target.value)}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#059669] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Número de factura" : "Invoice number"}
                  </label>
                  <input
                    type="text"
                    value={receiptInvoiceNumber}
                    onChange={(e) => setReceiptInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#059669] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Descripción del servicio" : "Service description"}
                  </label>
                  <input
                    type="text"
                    value={receiptServiceDescription}
                    onChange={(e) => setReceiptServiceDescription(e.target.value)}
                    placeholder={isES ? "Paquete Editorial Completo" : "Complete Editorial Package"}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Monto recibido" : "Amount received"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={receiptAmount}
                    onChange={(e) => setReceiptAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#059669] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Método de pago" : "Payment method"}
                  </label>
                  <select
                    value={receiptPaymentMethod}
                    onChange={(e) => setReceiptPaymentMethod(e.target.value)}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#059669] focus:outline-none"
                  >
                    <option value="">{isES ? "Seleccionar..." : "Select..."}</option>
                    <option value="Transferencia bancaria">{isES ? "Transferencia bancaria" : "Bank transfer"}</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Stripe">Stripe</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Efectivo">{isES ? "Efectivo" : "Cash"}</option>
                    <option value="Tarjeta de crédito">{isES ? "Tarjeta de crédito" : "Credit card"}</option>
                    <option value="Otro">{isES ? "Otro" : "Other"}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Moneda" : "Currency"}
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value as "USD" | "MXN" | "ARS")}
                    className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#059669] focus:outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateReceipt}
              disabled={generating || !form.clientName || !receiptInvoiceNumber || receiptAmount <= 0}
              className="w-full mt-4 py-3 bg-[#059669] text-white font-bold text-sm rounded-lg hover:bg-[#059669]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? (isES ? "Generando..." : "Generating...")
                : (isES ? "Generar Recibo" : "Generate Receipt")}
            </button>
          </div>

          {/* Receipt Preview */}
          {receiptHTML && (
            <div className="bg-white rounded-xl overflow-hidden border border-white/10">
              <div className="bg-[#162235] px-5 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#059669]">
                  {isES ? "Vista Previa del Recibo" : "Receipt Preview"}
                </h3>
                <button
                  onClick={() => {
                    const blob = new Blob([receiptHTML], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `recibo-${form.clientName.replace(/\s+/g, "-")}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-[#059669]/20 text-[#059669] text-xs font-semibold rounded-lg hover:bg-[#059669]/30 transition-colors"
                >
                  {isES ? "Descargar HTML" : "Download HTML"}
                </button>
              </div>
              <iframe
                srcDoc={receiptHTML}
                className="w-full h-[500px] border-0"
                title="Receipt Preview"
              />
            </div>
          )}
        </>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
