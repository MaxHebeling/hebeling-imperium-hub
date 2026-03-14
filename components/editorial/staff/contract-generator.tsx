"use client";

import { useState, useCallback } from "react";
import type {
  ContractType,
  ContractLocale,
  ContractJurisdiction,
  BookFormat,
} from "@/lib/editorial/oficina/types";
import { SERVICE_CATALOG } from "@/lib/editorial/oficina/company-config";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ContractFormData {
  type: ContractType;
  locale: ContractLocale;
  jurisdiction: ContractJurisdiction;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  clientTaxId: string;
  projectTitle: string;
  authorName: string;
  bookFormat: BookFormat;
  selectedServices: string[];
  totalAmount: number;
  currency: "USD" | "MXN" | "ARS";
  startDate: string;
  endDate: string;
  notes: string;
  showDiscountInContract: boolean;
  discountLabel: string;
  discountAmount: number;
  originalPrice: number;
}

interface ContractGeneratorProps {
  locale?: ContractLocale;
  prefillClient?: {
    name: string;
    email: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
  prefillProject?: {
    title: string;
    authorName?: string;
    bookFormat?: BookFormat;
  };
  prefillPricing?: {
    totalAmount: number;
    currency: "USD" | "MXN" | "ARS";
    discountLabel?: string;
    discountAmount?: number;
    originalPrice?: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CONTRACT_TYPES: { value: ContractType; label: { es: string; en: string } }[] = [
  { value: "editorial_completo", label: { es: "Paquete Editorial Completo", en: "Complete Editorial Package" } },
  { value: "correccion_estilo", label: { es: "Corrección de Estilo", en: "Style Editing" } },
  { value: "diseno_portada", label: { es: "Diseño de Portada", en: "Cover Design" } },
  { value: "maquetacion", label: { es: "Maquetación", en: "Interior Layout" } },
  { value: "distribucion", label: { es: "Distribución", en: "Distribution" } },
  { value: "personalizado", label: { es: "Personalizado", en: "Custom" } },
];

const JURISDICTIONS: { value: ContractJurisdiction; label: { es: string; en: string } }[] = [
  { value: "usa", label: { es: "Estados Unidos (Ley de California)", en: "United States (California Law)" } },
  { value: "mexico", label: { es: "México (Ley Mexicana)", en: "Mexico (Mexican Law)" } },
  { value: "argentina", label: { es: "Argentina (Ley Argentina)", en: "Argentina (Argentine Law)" } },
];

const BOOK_FORMATS: { value: BookFormat; label: { es: string; en: string } }[] = [
  { value: "print", label: { es: "Impresión", en: "Print" } },
  { value: "ebook", label: { es: "eBook", en: "eBook" } },
  { value: "print_and_ebook", label: { es: "Impresión + eBook", en: "Print + eBook" } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ContractGenerator({
  locale = "es",
  prefillClient,
  prefillProject,
  prefillPricing,
}: ContractGeneratorProps) {
  const isES = locale === "es";

  const [form, setForm] = useState<ContractFormData>({
    type: "editorial_completo",
    locale,
    jurisdiction: "usa",
    clientName: prefillClient?.name ?? "",
    clientEmail: prefillClient?.email ?? "",
    clientAddress: prefillClient?.address ?? "",
    clientPhone: prefillClient?.phone ?? "",
    clientTaxId: prefillClient?.taxId ?? "",
    projectTitle: prefillProject?.title ?? "",
    authorName: prefillProject?.authorName ?? "",
    bookFormat: prefillProject?.bookFormat ?? "print",
    selectedServices: [],
    totalAmount: prefillPricing?.totalAmount ?? 0,
    currency: prefillPricing?.currency ?? "USD",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
    showDiscountInContract: !!prefillPricing?.discountAmount,
    discountLabel: prefillPricing?.discountLabel ?? "",
    discountAmount: prefillPricing?.discountAmount ?? 0,
    originalPrice: prefillPricing?.originalPrice ?? 0,
  });

  const [generating, setGenerating] = useState(false);
  const [contractHTML, setContractHTML] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const services = SERVICE_CATALOG[locale];

  const update = useCallback(
    <K extends keyof ContractFormData>(key: K, value: ContractFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleService = useCallback((serviceName: string) => {
    setForm((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceName)
        ? prev.selectedServices.filter((s) => s !== serviceName)
        : [...prev.selectedServices, serviceName],
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const contractServices = form.selectedServices.map((name) => ({
        name,
        amount: 0,
      }));

      const res = await fetch("/api/staff/oficina/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          locale: form.locale,
          jurisdiction: form.jurisdiction,
          client: {
            id: "temp",
            fullName: form.clientName,
            email: form.clientEmail,
            address: form.clientAddress || undefined,
            phone: form.clientPhone || undefined,
            taxId: form.clientTaxId || undefined,
          },
          projectTitle: form.projectTitle,
          authorName: form.authorName || undefined,
          bookFormat: form.bookFormat,
          services: contractServices,
          totalAmount: form.totalAmount,
          currency: form.currency,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar contrato");
      }

      const data = await res.json();
      setContractHTML(data.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }, [form]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: form.currency }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#C8A75B]">
          {isES ? "Generador de Contratos" : "Contract Generator"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isES
            ? "Genera contratos profesionales con soporte multi-jurisdicción"
            : "Generate professional contracts with multi-jurisdiction support"}
        </p>
      </div>

      {/* Contract Type & Jurisdiction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#162235] rounded-xl p-4 border border-white/5">
          <label className="text-xs text-slate-500 block mb-2 uppercase tracking-wider font-semibold">
            {isES ? "Tipo de Contrato" : "Contract Type"}
          </label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value as ContractType)}
            className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
          >
            {CONTRACT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label[locale]}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-[#162235] rounded-xl p-4 border border-white/5">
          <label className="text-xs text-slate-500 block mb-2 uppercase tracking-wider font-semibold">
            {isES ? "Jurisdicción" : "Jurisdiction"}
          </label>
          <select
            value={form.jurisdiction}
            onChange={(e) => update("jurisdiction", e.target.value as ContractJurisdiction)}
            className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
          >
            {JURISDICTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label[locale]}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-[#162235] rounded-xl p-4 border border-white/5">
          <label className="text-xs text-slate-500 block mb-2 uppercase tracking-wider font-semibold">
            {isES ? "Idioma" : "Language"}
          </label>
          <select
            value={form.locale}
            onChange={(e) => update("locale", e.target.value as ContractLocale)}
            className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
          >
            <option value="es">{isES ? "Español" : "Spanish"}</option>
            <option value="en">{isES ? "Inglés" : "English"}</option>
          </select>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {isES ? "Información del Cliente" : "Client Information"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Nombre completo" : "Full name"}
            </label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Email</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => update("clientEmail", e.target.value)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Dirección" : "Address"}
            </label>
            <input
              type="text"
              value={form.clientAddress}
              onChange={(e) => update("clientAddress", e.target.value)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Teléfono" : "Phone"}
            </label>
            <input
              type="tel"
              value={form.clientPhone}
              onChange={(e) => update("clientPhone", e.target.value)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {isES ? "Información del Proyecto" : "Project Information"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Título del libro" : "Book title"}
            </label>
            <input
              type="text"
              value={form.projectTitle}
              onChange={(e) => update("projectTitle", e.target.value)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Nombre del autor" : "Author name"}
            </label>
            <input
              type="text"
              value={form.authorName}
              onChange={(e) => update("authorName", e.target.value)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Formato" : "Format"}
            </label>
            <select
              value={form.bookFormat}
              onChange={(e) => update("bookFormat", e.target.value as BookFormat)}
              className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            >
              {BOOK_FORMATS.map((bf) => (
                <option key={bf.value} value={bf.value}>
                  {bf.label[locale]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Service Selection */}
      <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {isES ? "Servicios Contratados" : "Contracted Services"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {services.map((svc) => {
            const isSelected = form.selectedServices.includes(svc.name);
            return (
              <label
                key={svc.key}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#2F6FA3]/20 border border-[#2F6FA3]/40"
                    : "bg-[#0B1420]/50 border border-white/5 hover:border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleService(svc.name)}
                  className="w-4 h-4 rounded border-slate-600 text-[#2F6FA3] focus:ring-[#2F6FA3]"
                />
                <div>
                  <p className="text-sm text-white">{svc.name}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{svc.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Pricing & Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {isES ? "Precio" : "Pricing"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Monto total" : "Total amount"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => update("totalAmount", parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Moneda" : "Currency"}
              </label>
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value as "USD" | "MXN" | "ARS")}
                className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
                <option value="ARS">ARS</option>
              </select>
            </div>

            {/* Discount display in contract */}
            {form.discountAmount > 0 && (
              <div className="p-3 bg-[#C8A75B]/10 rounded-lg border border-[#C8A75B]/20">
                <p className="text-xs text-[#C8A75B] font-semibold mb-2">
                  {isES ? "Descuento del Motor de Precios" : "Pricing Engine Discount"}
                </p>
                <p className="text-xs text-slate-400">
                  {form.discountLabel}: -{fmt(form.discountAmount)}
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showDiscountInContract}
                    onChange={(e) => update("showDiscountInContract", e.target.checked)}
                    className="w-3 h-3 rounded border-slate-600 text-[#C8A75B] focus:ring-[#C8A75B]"
                  />
                  <span className="text-xs text-slate-400">
                    {isES
                      ? "Mostrar desglose de descuento en contrato"
                      : "Show discount breakdown in contract"}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4">
            {isES ? "Fechas y Notas" : "Dates & Notes"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Fecha de inicio" : "Start date"}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Fecha de finalización (opcional)" : "End date (optional)"}
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Notas adicionales" : "Additional notes"}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="w-full bg-[#0B1420] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating || !form.clientName || !form.projectTitle}
          className="flex-1 py-3 bg-[#2F6FA3] text-white font-bold text-sm rounded-lg hover:bg-[#2F6FA3]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating
            ? (isES ? "Generando..." : "Generating...")
            : (isES ? "Generar Contrato" : "Generate Contract")}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Contract Preview */}
      {contractHTML && (
        <div className="bg-white rounded-xl overflow-hidden border border-white/10">
          <div className="bg-[#162235] px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#C8A75B]">
              {isES ? "Vista Previa del Contrato" : "Contract Preview"}
            </h3>
            <button
              onClick={() => {
                const blob = new Blob([contractHTML], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `contrato-${form.clientName.replace(/\s+/g, "-")}.html`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 bg-[#C8A75B]/20 text-[#C8A75B] text-xs font-semibold rounded-lg hover:bg-[#C8A75B]/30 transition-colors"
            >
              {isES ? "Descargar HTML" : "Download HTML"}
            </button>
          </div>
          <iframe
            srcDoc={contractHTML}
            className="w-full h-[600px] border-0"
            title="Contract Preview"
          />
        </div>
      )}
    </div>
  );
}
