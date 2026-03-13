"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Receipt,
  Building2,
  Download,
  Plus,
  Trash2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICE_CATALOG } from "@/lib/editorial/oficina/company-config";
import type {
  ContractJurisdiction,
  ContractLocale,
  ContractService,
  InvoiceItem,
} from "@/lib/editorial/oficina/types";

/* ------------------------------------------------------------------ */
/*  Main Oficina Page                                                 */
/* ------------------------------------------------------------------ */
export default function OficinaPage() {
  const [activeTab, setActiveTab] = useState<"contracts" | "invoices">("contracts");

  return (
    <div className="flex flex-col gap-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #1a3a6b 0%, #2a5a9b 100%)",
              boxShadow: "0 0 24px #1a3a6b40",
            }}
          >
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1a3a6b" }}>
              Oficina de Reino Editorial
            </h1>
            <p className="text-sm mt-0.5 text-gray-500">
              Contratos, presupuestos, facturas y recibos
            </p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        <button
          onClick={() => setActiveTab("contracts")}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all rounded-t-lg"
          style={{
            color: activeTab === "contracts" ? "#1a3a6b" : "#6b7280",
            background: activeTab === "contracts" ? "#f0f4ff" : "transparent",
            borderBottom: activeTab === "contracts" ? "2px solid #1a3a6b" : "2px solid transparent",
          }}
        >
          <FileText className="w-4 h-4" />
          Contratos
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all rounded-t-lg"
          style={{
            color: activeTab === "invoices" ? "#1a3a6b" : "#6b7280",
            background: activeTab === "invoices" ? "#f0f4ff" : "transparent",
            borderBottom: activeTab === "invoices" ? "2px solid #1a3a6b" : "2px solid transparent",
          }}
        >
          <Receipt className="w-4 h-4" />
          Facturas / Recibos
        </button>
      </div>

      {/* Content */}
      {activeTab === "contracts" ? <ContractForm /> : <InvoiceForm />}
    </div>
  );
}

/* ================================================================== */
/*  CONTRACT FORM                                                     */
/* ================================================================== */
function ContractForm() {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [htmlResult, setHtmlResult] = useState<string | null>(null);

  // Form state
  const [jurisdiction, setJurisdiction] = useState<ContractJurisdiction>("usa");
  const [locale, setLocale] = useState<ContractLocale>("es");
  const [currency, setCurrency] = useState<"USD" | "MXN" | "ARS">("USD");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<ContractService[]>([
    { name: "", description: "", amount: 0 },
  ]);

  // Sync currency with jurisdiction
  const handleJurisdiction = (j: ContractJurisdiction) => {
    setJurisdiction(j);
    if (j === "mexico") { setCurrency("MXN"); setLocale("es"); }
    else if (j === "argentina") { setCurrency("ARS"); setLocale("es"); }
    else { setCurrency("USD"); }
  };

  const catalog = SERVICE_CATALOG[locale === "en" ? "en" : "es"];

  const addServiceFromCatalog = (key: string) => {
    const svc = catalog.find((s) => s.key === key);
    if (!svc) return;
    setServices((prev) => [
      ...prev.filter((s) => s.name !== ""),
      { name: svc.name, description: svc.description, amount: svc.defaultPrice },
    ]);
  };

  const updateService = (i: number, field: keyof ContractService, value: string | number) => {
    setServices((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );
  };

  const removeService = (i: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  };

  const total = services.reduce((s, svc) => s + (Number(svc.amount) || 0), 0);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/oficina/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurisdiction,
          locale,
          currency,
          type: "personalizado" as const,
          client: {
            id: "",
            fullName: clientName,
            email: clientEmail,
            address: clientAddress || undefined,
            taxId: clientTaxId || undefined,
          },
          projectTitle,
          services: services.filter((s) => s.name),
          totalAmount: total,
          startDate: new Date().toISOString(),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtmlResult(data.html);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const printDoc = () => {
    if (!previewRef.current?.contentWindow) return;
    previewRef.current.contentWindow.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Jurisdiction selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {JURISDICTIONS.map((j) => (
          <button
            key={j.value}
            onClick={() => handleJurisdiction(j.value)}
            className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left"
            style={{
              borderColor: jurisdiction === j.value ? "#1a3a6b" : "#e5e7eb",
              background: jurisdiction === j.value ? "#f0f4ff" : "white",
            }}
          >
            <span className="text-2xl">{j.flag}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#1a3a6b" }}>{j.label}</p>
              <p className="text-xs text-gray-500">{j.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Language (only for USA) */}
      {jurisdiction === "usa" && (
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Idioma:</span>
          <button
            onClick={() => setLocale("es")}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: locale === "es" ? "#1a3a6b" : "#f3f4f6",
              color: locale === "es" ? "white" : "#6b7280",
            }}
          >
            Espanol
          </button>
          <button
            onClick={() => setLocale("en")}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: locale === "en" ? "#1a3a6b" : "#f3f4f6",
              color: locale === "en" ? "white" : "#6b7280",
            }}
          >
            English
          </button>
        </div>
      )}

      {/* Client info */}
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Datos del Cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre completo *" value={clientName} onChange={setClientName} placeholder="Juan Perez" />
          <Input label="Email *" value={clientEmail} onChange={setClientEmail} placeholder="juan@email.com" />
          <Input label="Direccion" value={clientAddress} onChange={setClientAddress} placeholder="Ciudad, Pais" />
          <Input label={jurisdiction === "mexico" ? "RFC" : jurisdiction === "argentina" ? "CUIT" : "Tax ID"} value={clientTaxId} onChange={setClientTaxId} placeholder="" />
        </div>
      </div>

      {/* Project */}
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Proyecto</h3>
        <Input label="Titulo de la obra *" value={projectTitle} onChange={setProjectTitle} placeholder="Mi Gran Libro" />
      </div>

      {/* Services */}
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Servicios</h3>
          <select
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
            value=""
            onChange={(e) => { addServiceFromCatalog(e.target.value); e.target.value = ""; }}
          >
            <option value="">+ Agregar servicio del catalogo</option>
            {catalog.map((s) => (
              <option key={s.key} value={s.key}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3">
          {services.map((svc, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex-1 flex flex-col gap-2">
                <input
                  className="text-sm font-semibold bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none py-1 text-gray-900"
                  placeholder="Nombre del servicio"
                  value={svc.name}
                  onChange={(e) => updateService(i, "name", e.target.value)}
                />
                <input
                  className="text-xs bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none py-1 text-gray-500"
                  placeholder="Descripcion"
                  value={svc.description || ""}
                  onChange={(e) => updateService(i, "description", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{currency}</span>
                <input
                  type="number"
                  className="w-24 text-sm font-semibold text-right bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                  value={svc.amount || ""}
                  onChange={(e) => updateService(i, "amount", Number(e.target.value))}
                  placeholder="0.00"
                />
                <button onClick={() => removeService(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setServices((p) => [...p, { name: "", description: "", amount: 0 }])}
            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 py-2"
          >
            <Plus className="w-3 h-3" /> Agregar servicio manual
          </button>
        </div>

        {/* Total */}
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
          <div className="text-right">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
            <p className="text-xl font-bold" style={{ color: "#1a3a6b" }}>
              {new Intl.NumberFormat(currency === "USD" ? "en-US" : currency === "ARS" ? "es-AR" : "es-MX", { style: "currency", currency }).format(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Notas adicionales</h3>
        <textarea
          className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 resize-none text-gray-700"
          rows={3}
          placeholder="Notas o condiciones especiales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={loading || !clientName || !clientEmail || !projectTitle}
        className="py-6 text-base font-bold rounded-xl"
        style={{ background: "#1a3a6b" }}
      >
        {loading ? "Generando..." : "Generar Contrato"}
      </Button>

      {/* Preview */}
      {htmlResult && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Vista previa</h3>
            <Button onClick={printDoc} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Descargar PDF
            </Button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ height: 700 }}>
            <iframe
              ref={previewRef}
              srcDoc={htmlResult}
              className="w-full h-full"
              title="Contract Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  INVOICE FORM                                                      */
/* ================================================================== */
function InvoiceForm() {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);
  const [htmlResult, setHtmlResult] = useState<string | null>(null);
  const [docType, setDocType] = useState<"invoice" | "receipt">("invoice");

  // Form state
  const [locale, setLocale] = useState<ContractLocale>("es");
  const [currency, setCurrency] = useState<"USD" | "MXN" | "ARS">("USD");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Transferencia bancaria");
  const [invoiceNumberForReceipt, setInvoiceNumberForReceipt] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const catalog = SERVICE_CATALOG[locale === "en" ? "en" : "es"];

  const addItemFromCatalog = (key: string) => {
    const svc = catalog.find((s) => s.key === key);
    if (!svc) return;
    setItems((prev) => [
      ...prev.filter((it) => it.description !== ""),
      { description: svc.name, quantity: 1, unitPrice: svc.defaultPrice, amount: svc.defaultPrice },
    ]);
  };

  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== i) return it;
        const updated = { ...it, [field]: value };
        updated.amount = Number(updated.quantity) * Number(updated.unitPrice);
        return updated;
      }),
    );
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const subtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + taxAmount;
  const balanceDue = total - amountPaid;

  const generate = async () => {
    setLoading(true);
    try {
      const client = {
        id: "",
        fullName: clientName,
        email: clientEmail,
        address: clientAddress || undefined,
        taxId: clientTaxId || undefined,
      };

      let body: Record<string, unknown>;

      if (docType === "receipt") {
        body = {
          type: "receipt",
          locale,
          client,
          invoiceNumber: invoiceNumberForReceipt,
          amount: total,
          currency,
          paymentMethod,
          paymentDate: new Date().toISOString(),
          notes: notes || undefined,
        };
      } else {
        body = {
          type: "invoice",
          locale,
          client,
          projectTitle,
          items: items.filter((it) => it.description),
          subtotal,
          taxRate: taxRate / 100,
          taxAmount,
          total,
          discount,
          amountPaid,
          currency,
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: "draft" as const,
          notes: notes || undefined,
        };
      }

      const res = await fetch("/api/staff/oficina/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHtmlResult(data.html);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const printDoc = () => {
    if (!previewRef.current?.contentWindow) return;
    previewRef.current.contentWindow.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Doc type selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setDocType("invoice")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: docType === "invoice" ? "#1a3a6b" : "#f3f4f6",
            color: docType === "invoice" ? "white" : "#6b7280",
          }}
        >
          <Receipt className="w-4 h-4" /> Factura / Estimate
        </button>
        <button
          onClick={() => setDocType("receipt")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: docType === "receipt" ? "#059669" : "#f3f4f6",
            color: docType === "receipt" ? "white" : "#6b7280",
          }}
        >
          <FileText className="w-4 h-4" /> Recibo de pago
        </button>
      </div>

      {/* Language & Currency */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <button onClick={() => setLocale("es")} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: locale === "es" ? "#1a3a6b" : "#f3f4f6", color: locale === "es" ? "white" : "#6b7280" }}>ES</button>
          <button onClick={() => setLocale("en")} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: locale === "en" ? "#1a3a6b" : "#f3f4f6", color: locale === "en" ? "white" : "#6b7280" }}>EN</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Moneda:</span>
          {(["USD", "MXN", "ARS"] as const).map((c) => (
            <button key={c} onClick={() => setCurrency(c)} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: currency === c ? "#1a3a6b" : "#f3f4f6", color: currency === c ? "white" : "#6b7280" }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Client info */}
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Datos del Cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre completo *" value={clientName} onChange={setClientName} placeholder="Juan Perez" />
          <Input label="Email *" value={clientEmail} onChange={setClientEmail} placeholder="juan@email.com" />
          <Input label="Direccion" value={clientAddress} onChange={setClientAddress} placeholder="Ciudad, Pais" />
          <Input label="RFC / Tax ID" value={clientTaxId} onChange={setClientTaxId} placeholder="" />
        </div>
      </div>

      {/* Invoice items */}
      {docType === "invoice" && (
        <>
          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Proyecto</h3>
            <Input label="Titulo de la obra" value={projectTitle} onChange={setProjectTitle} placeholder="Mi Gran Libro" />
          </div>

          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Conceptos</h3>
              <select
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
                value=""
                onChange={(e) => { addItemFromCatalog(e.target.value); e.target.value = ""; }}
              >
                <option value="">+ Agregar del catalogo</option>
                {catalog.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_60px_100px_100px_32px] gap-2 mb-2 px-3">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Descripcion</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold text-center">Cant.</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold text-right">P. Unit.</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold text-right">Importe</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_60px_100px_100px_32px] gap-2 items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <input
                    className="text-sm bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none py-1 text-gray-900"
                    placeholder="Descripcion del concepto"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-full text-sm text-center bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="w-full text-sm text-right bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                    placeholder="0.00"
                  />
                  <p className="text-sm font-semibold text-right text-gray-700">
                    {new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-MX", { style: "currency", currency }).format(item.amount)}
                  </p>
                  <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 transition-colors justify-self-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setItems((p) => [...p, { description: "", quantity: 1, unitPrice: 0, amount: 0 }])}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 py-2"
              >
                <Plus className="w-3 h-3" /> Agregar concepto
              </button>
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end mt-4 pt-3 border-t border-gray-200 gap-2">
              <div className="grid grid-cols-[160px_120px] gap-2 text-sm">
                <span className="text-gray-500 text-right">Subtotal:</span>
                <span className="text-right font-semibold text-gray-700">
                  {new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-MX", { style: "currency", currency }).format(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-[160px_120px] gap-2 text-sm items-center">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-gray-500">Descuento:</span>
                </div>
                <input
                  type="number"
                  className="w-full text-sm text-right bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-[160px_120px] gap-2 text-sm items-center">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-gray-500">IVA / Tax (%):</span>
                </div>
                <input
                  type="number"
                  className="w-full text-sm text-right bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                  value={taxRate || ""}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              {taxRate > 0 && (
                <div className="grid grid-cols-[160px_120px] gap-2 text-sm">
                  <span className="text-gray-500 text-right">IVA ({taxRate}%):</span>
                  <span className="text-right text-gray-700">
                    {new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-MX", { style: "currency", currency }).format(taxAmount)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-[160px_120px] gap-2 text-sm pt-2 border-t border-gray-300">
                <span className="text-right font-bold" style={{ color: "#1a3a6b" }}>Total:</span>
                <span className="text-right font-bold text-lg" style={{ color: "#1a3a6b" }}>
                  {new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-MX", { style: "currency", currency }).format(total)}
                </span>
              </div>
              <div className="grid grid-cols-[160px_120px] gap-2 text-sm items-center">
                <span className="text-gray-500 text-right">Monto pagado:</span>
                <input
                  type="number"
                  className="w-full text-sm text-right bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              {amountPaid > 0 && (
                <div className="grid grid-cols-[160px_120px] gap-2 text-sm pt-1 border-t border-gray-200">
                  <span className="text-right font-bold text-red-600">Saldo pendiente:</span>
                  <span className="text-right font-bold text-red-600">
                    {new Intl.NumberFormat(currency === "USD" ? "en-US" : "es-MX", { style: "currency", currency }).format(balanceDue)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Receipt-specific fields */}
      {docType === "receipt" && (
        <div className="rounded-xl border border-gray-200 p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Datos del Recibo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="No. de factura relacionada" value={invoiceNumberForReceipt} onChange={setInvoiceNumberForReceipt} placeholder="RE-INV-XXXXX" />
            <Input label="Metodo de pago" value={paymentMethod} onChange={setPaymentMethod} placeholder="Transferencia bancaria" />
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">Monto recibido *</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{currency}</span>
                <input
                  type="number"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  value={total || ""}
                  readOnly
                  placeholder="Se calcula del invoice"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Notas</h3>
        <textarea
          className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 resize-none text-gray-700"
          rows={3}
          placeholder="Notas adicionales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={loading || !clientName || !clientEmail}
        className="py-6 text-base font-bold rounded-xl"
        style={{ background: docType === "receipt" ? "#059669" : "#1a3a6b" }}
      >
        {loading ? "Generando..." : docType === "invoice" ? "Generar Factura / Estimate" : "Generar Recibo de Pago"}
      </Button>

      {/* Preview */}
      {htmlResult && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Vista previa</h3>
            <Button onClick={printDoc} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Descargar PDF
            </Button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ height: 700 }}>
            <iframe
              ref={previewRef}
              srcDoc={htmlResult}
              className="w-full h-full"
              title="Invoice Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Shared helpers                                                    */
/* ================================================================== */

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1 font-semibold">
        {label}
      </label>
      <input
        type="text"
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-gray-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

const JURISDICTIONS: { value: ContractJurisdiction; label: string; sub: string; flag: string }[] = [
  { value: "usa", label: "Estados Unidos", sub: "California / Common Law", flag: "\u{1F1FA}\u{1F1F8}" },
  { value: "mexico", label: "Mexico", sub: "Codigo Civil Federal", flag: "\u{1F1F2}\u{1F1FD}" },
  { value: "argentina", label: "Argentina", sub: "Codigo Civil y Comercial", flag: "\u{1F1E6}\u{1F1F7}" },
];
