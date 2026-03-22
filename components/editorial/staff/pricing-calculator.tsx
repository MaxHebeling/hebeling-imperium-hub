"use client";

import { useState, useMemo, useCallback } from "react";
import {
  getServicesByCategory,
  COUNTRY_PRICING,
  COMPLEXITY_LEVELS,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_REASON_PRESETS,
  calculatePriceEstimate,
  suggestDiscountFromCRM,
  detectComplexity,
} from "@/lib/editorial/oficina/pricing";
import type {
  ServiceKey,
  PredefinedCountry,
  BookComplexity,
  DiscountType,
  DiscountMode,
  PriceEstimateInput,
  PriceEstimateBreakdown,
  CRMClientTag,
  CustomCountryPricing,
} from "@/lib/editorial/oficina/pricing";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface PricingCalculatorProps {
  locale?: "es" | "en";
  clientTags?: CRMClientTag[];
  onEstimateReady?: (breakdown: PriceEstimateBreakdown, input: PriceEstimateInput) => void;
}

export function PricingCalculator({
  locale = "es",
  clientTags = [],
  onEstimateReady,
}: PricingCalculatorProps) {
  const isES = locale === "es";

  // --- State ---
  const [selectedServices, setSelectedServices] = useState<ServiceKey[]>([]);
  const [country, setCountry] = useState<PredefinedCountry | "custom">("usa");
  const [customCountry, setCustomCountry] = useState<CustomCountryPricing>({
    countryName: "",
    multiplier: 1.0,
    currency: "USD",
  });
  const [complexity, setComplexity] = useState<BookComplexity>("standard");
  const [pageCount, setPageCount] = useState<number>(150);

  // Discount state
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("pastor");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState("");
  const [discountApprovedBy, setDiscountApprovedBy] = useState("");

  // CRM suggestion
  const crmSuggestion = useMemo(
    () => suggestDiscountFromCRM(clientTags),
    [clientTags]
  );

  // Service categories
  const categories = useMemo(() => getServicesByCategory(locale), [locale]);

  // Toggle service
  const toggleService = useCallback((key: ServiceKey) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  // Auto-detect complexity from page count
  const handlePageCountChange = useCallback((pages: number) => {
    setPageCount(pages);
    setComplexity(detectComplexity(pages));
  }, []);

  // Build discount object
  // Calculate estimate
  const input: PriceEstimateInput = useMemo(
    () => ({
      selectedServices,
      country,
      customCountry: country === "custom" ? customCountry : undefined,
      complexity,
      pageCount,
      discount: discountEnabled
        ? {
            type: discountType,
            mode: discountMode,
            value: discountValue,
            reason: discountReason,
            approvedBy: discountApprovedBy,
            suggestedByCRM:
              crmSuggestion.suggested &&
              crmSuggestion.discountType === discountType,
          }
        : undefined,
      locale,
    }),
    [
      selectedServices,
      country,
      customCountry,
      complexity,
      pageCount,
      discountEnabled,
      discountType,
      discountMode,
      discountValue,
      discountReason,
      discountApprovedBy,
      crmSuggestion.suggested,
      crmSuggestion.discountType,
      locale,
    ]
  );

  const breakdown = useMemo(() => {
    if (selectedServices.length === 0) return null;
    return calculatePriceEstimate(input);
  }, [input, selectedServices.length]);

  // Apply CRM suggestion
  const applyCRMSuggestion = useCallback(() => {
    if (crmSuggestion.suggested && crmSuggestion.discountType) {
      setDiscountEnabled(true);
      setDiscountType(crmSuggestion.discountType);
      setDiscountMode("percentage");
      setDiscountValue(crmSuggestion.defaultPercentage);
      setDiscountReason(crmSuggestion.reason[locale]);
    }
  }, [crmSuggestion, locale]);

  // Confirm estimate
  const handleConfirm = useCallback(() => {
    if (breakdown && onEstimateReady) {
      onEstimateReady(breakdown, input);
    }
  }, [breakdown, input, onEstimateReady]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#C8A75B]">
          {isES ? "Motor de Precios" : "Pricing Engine"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isES
            ? "Calcula el precio estimado del proyecto editorial"
            : "Calculate the estimated price for the editorial project"}
        </p>
      </div>

      {/* CRM Suggestion Banner */}
      {crmSuggestion.suggested && !discountEnabled && (
        <div className="bg-[#162235] border border-[#C8A75B]/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#C8A75B]">
              {isES ? "Sugerencia de CRM" : "CRM Suggestion"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {crmSuggestion.reason[locale]} &mdash;{" "}
              {crmSuggestion.label[locale]} ({crmSuggestion.defaultPercentage}%)
            </p>
          </div>
          <button
            onClick={applyCRMSuggestion}
            className="px-4 py-2 bg-[#C8A75B]/20 text-[#C8A75B] text-xs font-semibold rounded-lg hover:bg-[#C8A75B]/30 transition-colors"
          >
            {isES ? "Aplicar Sugerencia" : "Apply Suggestion"}
          </button>
        </div>
      )}

      {/* Service Selection */}
      <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">
          {isES ? "Servicios" : "Services"}
        </h3>
        {Object.entries(categories).map(([catKey, cat]) => (
          <div key={catKey} className="mb-4 last:mb-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">
              {cat.label}
            </p>
            <div className="space-y-2">
              {cat.services.map((svc) => {
                const isSelected = selectedServices.includes(svc.key);
                return (
                  <label
                    key={svc.key}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#2F6FA3]/20 border border-[#2F6FA3]/40"
                        : "bg-[#0B1420]/50 border border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(svc.key)}
                        className="w-4 h-4 rounded border-slate-600 text-[#2F6FA3] focus:ring-[#2F6FA3]"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">
                          {svc.name[locale]}
                        </p>
                        <p className="text-xs text-slate-500">
                          {svc.description[locale]}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#C8A75B]">
                      {fmt(svc.basePrice)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Country & Complexity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country */}
        <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-3">
            {isES ? "País del Cliente" : "Client Country"}
          </h3>
          <div className="space-y-2">
            {(Object.entries(COUNTRY_PRICING) as [PredefinedCountry, typeof COUNTRY_PRICING["usa"]][]).map(
              ([key, cp]) => (
                <label
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    country === key
                      ? "bg-[#2F6FA3]/20 border border-[#2F6FA3]/40"
                      : "bg-[#0B1420]/50 border border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="country"
                      checked={country === key}
                      onChange={() => setCountry(key)}
                      className="w-4 h-4 text-[#2F6FA3] focus:ring-[#2F6FA3]"
                    />
                    <span className="text-sm text-white">{cp.label[locale]}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    x{cp.multiplier} &middot; {cp.currency}
                  </span>
                </label>
              )
            )}
            <label
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                country === "custom"
                  ? "bg-[#2F6FA3]/20 border border-[#2F6FA3]/40"
                  : "bg-[#0B1420]/50 border border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="country"
                  checked={country === "custom"}
                  onChange={() => setCountry("custom")}
                  className="w-4 h-4 text-[#2F6FA3] focus:ring-[#2F6FA3]"
                />
                <span className="text-sm text-white">
                  {isES ? "Otro país (manual)" : "Other country (manual)"}
                </span>
              </div>
            </label>

            {country === "custom" && (
              <div className="mt-3 space-y-3 p-3 bg-[#0B1420]/50 rounded-lg border border-white/5">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {isES ? "Nombre del país" : "Country name"}
                  </label>
                  <input
                    type="text"
                    value={customCountry.countryName}
                    onChange={(e) =>
                      setCustomCountry({ ...customCountry, countryName: e.target.value })
                    }
                    className="w-full bg-[#162235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                    placeholder={isES ? "Ej: Colombia" : "E.g.: Colombia"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      {isES ? "Multiplicador" : "Multiplier"}
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="2.0"
                      value={customCountry.multiplier}
                      onChange={(e) =>
                        setCustomCountry({
                          ...customCountry,
                          multiplier: parseFloat(e.target.value) || 1.0,
                        })
                      }
                      className="w-full bg-[#162235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">
                      {isES ? "Moneda" : "Currency"}
                    </label>
                    <input
                      type="text"
                      value={customCountry.currency}
                      onChange={(e) =>
                        setCustomCountry({ ...customCountry, currency: e.target.value })
                      }
                      className="w-full bg-[#162235] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
                      placeholder="USD"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complexity */}
        <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-3">
            {isES ? "Complejidad del Libro" : "Book Complexity"}
          </h3>

          <div className="mb-3">
            <label className="text-xs text-slate-500 block mb-1">
              {isES ? "Páginas estimadas" : "Estimated pages"}
            </label>
            <input
              type="number"
              min="1"
              value={pageCount}
              onChange={(e) => handlePageCountChange(parseInt(e.target.value) || 1)}
              className="w-full bg-[#0B1420]/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F6FA3] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {(Object.entries(COMPLEXITY_LEVELS) as [BookComplexity, typeof COMPLEXITY_LEVELS["standard"]][]).map(
              ([key, cl]) => (
                <label
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    complexity === key
                      ? "bg-[#2F6FA3]/20 border border-[#2F6FA3]/40"
                      : "bg-[#0B1420]/50 border border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="complexity"
                      checked={complexity === key}
                      onChange={() => setComplexity(key)}
                      className="w-4 h-4 text-[#2F6FA3] focus:ring-[#2F6FA3]"
                    />
                    <div>
                      <span className="text-sm text-white">{cl.label[locale]}</span>
                      <p className="text-xs text-slate-500">{cl.description[locale]}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">x{cl.multiplier}</span>
                </label>
              )
            )}
          </div>
        </div>
      </div>

      {/* Special Discount Section */}
      <div className="bg-[#162235] rounded-xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">
            {isES ? "Descuento Especial" : "Special Discount"}
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={discountEnabled}
              onChange={(e) => setDiscountEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-[#C8A75B] focus:ring-[#C8A75B]"
            />
            <span className="text-xs text-slate-400">
              {isES ? "Aplicar descuento" : "Apply discount"}
            </span>
          </label>
        </div>

        {discountEnabled && (
          <div className="space-y-4">
            {/* Discount Type */}
            <div>
              <label className="text-xs text-slate-500 block mb-2">
                {isES ? "Tipo de Descuento" : "Discount Type"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(DISCOUNT_TYPE_LABELS) as [DiscountType, { es: string; en: string }][]).map(
                  ([key, labels]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-xs ${
                        discountType === key
                          ? "bg-[#C8A75B]/20 border border-[#C8A75B]/40 text-[#C8A75B]"
                          : "bg-[#0B1420]/50 border border-white/5 text-slate-400 hover:border-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="discountType"
                        checked={discountType === key}
                        onChange={() => setDiscountType(key)}
                        className="w-3 h-3 text-[#C8A75B] focus:ring-[#C8A75B]"
                      />
                      {labels[locale]}
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Discount Mode & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  {isES ? "Modo" : "Mode"}
                </label>
                <select
                  value={discountMode}
                  onChange={(e) => setDiscountMode(e.target.value as DiscountMode)}
                  className="w-full bg-[#0B1420]/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
                >
                  <option value="percentage">{isES ? "Porcentaje (%)" : "Percentage (%)"}</option>
                  <option value="fixed">{isES ? "Monto fijo ($)" : "Fixed amount ($)"}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  {isES ? "Valor" : "Value"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={discountMode === "percentage" ? 100 : 99999}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0B1420]/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
                  placeholder={discountMode === "percentage" ? "10" : "100"}
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Razón del descuento" : "Discount reason"}
              </label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full bg-[#0B1420]/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
                placeholder={isES ? "Describe la razón..." : "Describe the reason..."}
                list="discount-reasons"
              />
              <datalist id="discount-reasons">
                {DISCOUNT_REASON_PRESETS.map((r, i) => (
                  <option key={i} value={r[locale]} />
                ))}
              </datalist>
            </div>

            {/* Approved By */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {isES ? "Aprobado por" : "Approved by"}
              </label>
              <input
                type="text"
                value={discountApprovedBy}
                onChange={(e) => setDiscountApprovedBy(e.target.value)}
                className="w-full bg-[#0B1420]/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C8A75B] focus:outline-none"
                placeholder={isES ? "Nombre del aprobador" : "Approver name"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Price Summary */}
      {breakdown && (
        <div className="bg-[#162235] rounded-xl border border-[#C8A75B]/20 overflow-hidden">
          <div className="bg-[#C8A75B]/10 px-5 py-3 border-b border-[#C8A75B]/20">
            <h3 className="text-sm font-bold text-[#C8A75B]">
              {isES ? "Resumen de Precio" : "Price Summary"}
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {/* Services breakdown */}
            <div className="space-y-1">
              {breakdown.servicesBreakdown.map((s) => (
                <div key={s.key} className="flex justify-between text-xs">
                  <span className="text-slate-400">{s.name}</span>
                  <span className="text-white">{fmt(s.basePrice)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {isES ? "Total servicios base" : "Base services total"}
                </span>
                <span className="text-white font-semibold">
                  {fmt(breakdown.baseServicesTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {isES ? "Multiplicador país" : "Country multiplier"} ({breakdown.countryName})
                </span>
                <span className="text-white">x{breakdown.countryMultiplier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {isES ? "Multiplicador complejidad" : "Complexity multiplier"} ({breakdown.complexityLabel})
                </span>
                <span className="text-white">x{breakdown.complexityMultiplier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white font-semibold">
                  {fmt(breakdown.afterComplexityAdjustment)}
                </span>
              </div>

              {breakdown.discountApplied && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>
                    {isES ? "Descuento" : "Discount"}: {breakdown.discountLabel}
                  </span>
                  <span>-{fmt(breakdown.discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-[#C8A75B]/20 pt-3">
              <div className="flex justify-between">
                <span className="text-base font-bold text-[#C8A75B]">
                  {isES ? "Precio Final" : "Final Price"}
                </span>
                <span className="text-xl font-bold text-[#C8A75B]">
                  {fmt(breakdown.finalPrice)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isES ? "Moneda" : "Currency"}: {breakdown.currency}
              </p>
            </div>

            {/* Confirm button */}
            {onEstimateReady && (
              <button
                onClick={handleConfirm}
                className="w-full mt-3 py-3 bg-[#C8A75B] text-[#0B1420] font-bold text-sm rounded-lg hover:bg-[#C8A75B]/90 transition-colors"
              >
                {isES ? "Confirmar Estimado" : "Confirm Estimate"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {selectedServices.length === 0 && (
        <div className="bg-[#162235] rounded-xl p-8 border border-white/5 text-center">
          <p className="text-slate-500 text-sm">
            {isES
              ? "Selecciona al menos un servicio para calcular el precio"
              : "Select at least one service to calculate the price"}
          </p>
        </div>
      )}
    </div>
  );
}
