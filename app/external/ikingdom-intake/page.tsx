"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import dynamic from "next/dynamic"
import { Country, State } from "country-state-city"
import "react-phone-number-input/style.css"

type PhoneInputProps = {
  value?: string
  onChange?: (v: string | undefined) => void
  placeholder?: string
  defaultCountry?: string
  className?: string
}

const PhoneInput = dynamic<PhoneInputProps>(
  () =>
    import("react-phone-number-input")
      .then((mod) => mod.default)
      .catch(
        () =>
          function FallbackPhone({ value, onChange, placeholder }: PhoneInputProps) {
            return (
              <Input
                placeholder={placeholder ?? "Phone / WhatsApp"}
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                className="h-12 rounded-xl border border-[#e5e3e0] bg-white text-[#1a1a1a] px-4 w-full"
              />
            )
          }
      ),
  { ssr: false }
)

interface CountryItem {
  isoCode: string
  name: string
}
interface StateItem {
  isoCode: string
  name: string
}

const COUNTRIES: CountryItem[] = Country.getAllCountries()

/* Tema claro premium: overrides para que esta ruta siempre se vea clara y elegante. */
const theme = {
  bg: "bg-[#F8F7F5] dark:!bg-[#F8F7F5]",
  card: "bg-white dark:!bg-white border-[#e5e3e0] dark:!border-[#e5e3e0]",
  label: "text-[#1a1a1a] dark:!text-[#1a1a1a] font-medium text-sm",
  muted: "text-[#5c5c5c] dark:!text-[#5c5c5c]",
  input:
    "h-12 rounded-xl border border-[#e5e3e0] bg-white text-[#1a1a1a] placeholder:text-[#9a9a9a] focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/12 focus-visible:border-[#1a1a1a]/30 transition-colors dark:!bg-white dark:!border-[#e5e3e0] dark:!text-[#1a1a1a] dark:placeholder:!text-[#9a9a9a]",
  select:
    "h-12 w-full rounded-xl border border-[#e5e3e0] bg-white text-[#1a1a1a] px-4 text-sm focus:ring-2 focus:ring-[#1a1a1a]/12 focus:border-[#1a1a1a]/30 dark:!bg-white dark:!border-[#e5e3e0] dark:!text-[#1a1a1a]",
  btn: "h-12 w-full rounded-xl bg-[#1a1a1a] text-white text-sm font-semibold tracking-wide transition-all hover:bg-[#2d2d2d] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed dark:!bg-[#1a1a1a] dark:!text-white dark:hover:!bg-[#2d2d2d]",
  sectionTitle: "text-[10px] uppercase tracking-[0.22em] text-[#6b6b6b] dark:!text-[#6b6b6b] font-semibold",
  sectionBorder: "border-t border-[#eae8e5] dark:!border-[#eae8e5]",
  radioLabel: "text-sm text-[#1a1a1a] dark:!text-[#1a1a1a] cursor-pointer font-medium",
  checkboxWrap: "flex items-center gap-3 rounded-xl border border-[#e5e3e0] dark:!border-[#e5e3e0] bg-[#fafaf8] dark:!bg-[#fafaf8] px-4 py-3 hover:border-[#1a1a1a]/20 transition-colors",
}

type Language = "en" | "es"

const COPY: Record<Language, {
  languageLabel: string
  languageShort: { en: string; es: string }
  title: string
  intro: string
  introSecondary: string
  sections: {
    contact: string
    location: string
    project: string
    materials: string
    presence: string
    budgetTimeline: string
    additional: string
  }
  fields: {
    fullName: string
    email: string
    phone: string
    phonePlaceholder: string
    company: string
    country: string
    countrySelect: string
    stateRegion: string
    stateRegionSelect: string
    city: string
    postalCode: string
    postalCodePlaceholder: string
    address1: string
    address1Placeholder: string
    address2: string
    address2Placeholder: string
    pageType: string
    pageTypeSelect: string
    businessDescription: string
    goal: string
    goalSelect: string
    materialsPrompt: string
    hasWebsite: string
    yes: string
    no: string
    websiteUrl: string
    referenceSites: string
    referenceSitesPlaceholder: string
    budget: string
    budgetSelect: string
    timeline: string
    timelineSelect: string
    additionalInfo: string
    additionalInfoPlaceholder: string
  }
  button: { submit: string; sending: string }
  footerSmall: string
  confirmation: { title: string; line1: string; line2: string }
  validation: {
    fullNameEmailRequired: string
    companyRequired: string
    projectFieldsRequired: string
    invalidEmail: string
    invalidWebsiteUrl: string
    submitError: string
    connectionError: string
  }
  options: {
    pageTypes: Array<{ value: string; label: string }>
    goals: Array<{ value: string; label: string }>
    materials: Array<{ value: string; label: string }>
    budgets: Array<{ value: string; label: string }>
    timelines: Array<{ value: string; label: string }>
  }
}> = {
  en: {
    languageLabel: "Language",
    languageShort: { en: "EN", es: "ES" },
    title: "Start Your Landing Page Project",
    intro:
      "Tell us a little about your project and our team will contact you to discuss the best solution for your business.",
    introSecondary:
      "This short form helps our team understand your project and prepare the best strategy for your landing page.",
    sections: {
      contact: "Contact",
      location: "Location",
      project: "Project",
      materials: "Available Materials",
      presence: "Current Presence",
      budgetTimeline: "Budget & Timeline",
      additional: "Additional Details",
    },
    fields: {
      fullName: "Full Name",
      email: "Email",
      phone: "Phone / WhatsApp",
      phonePlaceholder: "Phone number",
      company: "Company or Brand Name",
      country: "Country",
      countrySelect: "Select country",
      stateRegion: "State / Province / Region",
      stateRegionSelect: "Select state / region",
      city: "City",
      postalCode: "Postal Code",
      postalCodePlaceholder: "Postal code",
      address1: "Address Line 1",
      address1Placeholder: "Address line 1",
      address2: "Address Line 2 (optional)",
      address2Placeholder: "Address line 2",
      pageType: "What type of page do you need?",
      pageTypeSelect: "Select an option",
      businessDescription: "Briefly describe your business",
      goal: "What is the main goal of your landing page?",
      goalSelect: "Select an option",
      materialsPrompt: "What materials do you already have?",
      hasWebsite: "Do you already have a website?",
      yes: "Yes",
      no: "No",
      websiteUrl: "Website URL (only if applicable)",
      referenceSites: "Share 1 or 2 websites you like (optional)",
      referenceSitesPlaceholder: "URLs or names of sites you like",
      budget: "Estimated budget",
      budgetSelect: "Select an option",
      timeline: "Desired timeline",
      timelineSelect: "Select an option",
      additionalInfo: "Additional information",
      additionalInfoPlaceholder: "Anything else you'd like us to know",
    },
    button: { submit: "Submit Project Request", sending: "Sending…" },
    footerSmall: "Our team will review your request and contact you within 24–48 hours.",
    confirmation: {
      title: "Thank you for your request",
      line1: "Your project information has been successfully submitted.",
      line2: "Our team will review your request and contact you shortly to schedule a discovery conversation.",
    },
    validation: {
      fullNameEmailRequired: "Full Name and Email are required.",
      companyRequired: "Company or Brand Name is required.",
      projectFieldsRequired:
        "Please complete all Project fields: page type, business description, and main goal.",
      invalidEmail: "Please enter a valid email address.",
      invalidWebsiteUrl: "Please enter a valid website URL or leave it empty.",
      submitError: "Error submitting. Please try again.",
      connectionError: "Connection error. Please try again.",
    },
    options: {
      pageTypes: [
        { value: "Landing page for a service", label: "Landing page for a service" },
        { value: "Landing page for a product", label: "Landing page for a product" },
        { value: "Sales page", label: "Sales page" },
        { value: "Lead generation page", label: "Lead generation page" },
        { value: "I'm not sure, I need guidance", label: "I'm not sure, I need guidance" },
      ],
      goals: [
        { value: "Get contacted by clients", label: "Get contacted by clients" },
        { value: "Book appointments", label: "Book appointments" },
        { value: "Sell a product", label: "Sell a product" },
        { value: "Capture leads", label: "Capture leads" },
        { value: "Present my company or service", label: "Present my company or service" },
      ],
      materials: [
        { value: "Logo", label: "Logo" },
        { value: "Text content", label: "Text content" },
        { value: "Images", label: "Images" },
        { value: "Videos", label: "Videos" },
        { value: "None yet", label: "None yet" },
      ],
      budgets: [
        { value: "$500 – $1,000", label: "$500 – $1,000" },
        { value: "$1,000 – $3,000", label: "$1,000 – $3,000" },
        { value: "$3,000 – $7,000", label: "$3,000 – $7,000" },
        { value: "$7,000+", label: "$7,000+" },
        { value: "Prefer to discuss first", label: "Prefer to discuss first" },
      ],
      timelines: [
        { value: "As soon as possible", label: "As soon as possible" },
        { value: "2–4 weeks", label: "2–4 weeks" },
        { value: "1–2 months", label: "1–2 months" },
        { value: "Flexible", label: "Flexible" },
      ],
    },
  },
  es: {
    languageLabel: "Idioma",
    languageShort: { en: "EN", es: "ES" },
    title: "Comienza tu Proyecto de Landing Page",
    intro:
      "Cuéntanos un poco sobre tu proyecto y nuestro equipo te contactará para conversar sobre la mejor solución para tu negocio.",
    introSecondary:
      "Este breve formulario nos ayuda a entender tu proyecto y preparar la mejor estrategia para tu landing page.",
    sections: {
      contact: "Contacto",
      location: "Ubicación",
      project: "Proyecto",
      materials: "Materiales disponibles",
      presence: "Presencia actual",
      budgetTimeline: "Presupuesto y tiempos",
      additional: "Detalles adicionales",
    },
    fields: {
      fullName: "Nombre completo",
      email: "Correo electrónico",
      phone: "Teléfono / WhatsApp",
      phonePlaceholder: "Número de teléfono",
      company: "Nombre de la empresa o marca",
      country: "País",
      countrySelect: "Selecciona un país",
      stateRegion: "Estado / Provincia / Región",
      stateRegionSelect: "Selecciona estado / región",
      city: "Ciudad",
      postalCode: "Código postal",
      postalCodePlaceholder: "Código postal",
      address1: "Dirección línea 1",
      address1Placeholder: "Dirección línea 1",
      address2: "Dirección línea 2 (opcional)",
      address2Placeholder: "Dirección línea 2",
      pageType: "¿Qué tipo de página necesitas?",
      pageTypeSelect: "Selecciona una opción",
      businessDescription: "Cuéntanos brevemente a qué se dedica tu negocio",
      goal: "¿Cuál es el objetivo principal de tu landing page?",
      goalSelect: "Selecciona una opción",
      materialsPrompt: "¿Qué materiales ya tienes disponibles?",
      hasWebsite: "¿Ya tienes un sitio web?",
      yes: "Sí",
      no: "No",
      websiteUrl: "URL del sitio web (si aplica)",
      referenceSites: "Comparte 1 o 2 sitios web que te gusten (opcional)",
      referenceSitesPlaceholder: "URLs o nombres de sitios que te gusten",
      budget: "Presupuesto estimado",
      budgetSelect: "Selecciona una opción",
      timeline: "Tiempo estimado",
      timelineSelect: "Selecciona una opción",
      additionalInfo: "Información adicional",
      additionalInfoPlaceholder: "Cualquier cosa más que quieras contarnos",
    },
    button: { submit: "Enviar solicitud de proyecto", sending: "Enviando…" },
    footerSmall: "Nuestro equipo revisará tu solicitud y te contactará dentro de 24–48 horas.",
    confirmation: {
      title: "Gracias por tu solicitud",
      line1: "La información de tu proyecto fue enviada correctamente.",
      line2: "Nuestro equipo revisará tu solicitud y te contactará pronto para agendar una conversación inicial.",
    },
    validation: {
      fullNameEmailRequired: "Nombre completo y correo electrónico son requeridos.",
      companyRequired: "El nombre de la empresa o marca es requerido.",
      projectFieldsRequired:
        "Por favor completa todos los campos de Proyecto: tipo de página, descripción del negocio y objetivo principal.",
      invalidEmail: "Por favor ingresa un correo electrónico válido.",
      invalidWebsiteUrl: "Por favor ingresa una URL válida o déjala vacía.",
      submitError: "Error al enviar. Por favor intenta de nuevo.",
      connectionError: "Error de conexión. Por favor intenta de nuevo.",
    },
    options: {
      pageTypes: [
        { value: "Landing page for a service", label: "Landing page para un servicio" },
        { value: "Landing page for a product", label: "Landing page para un producto" },
        { value: "Sales page", label: "Página de ventas" },
        { value: "Lead generation page", label: "Página para captación de leads" },
        { value: "I'm not sure, I need guidance", label: "No estoy seguro, necesito asesoría" },
      ],
      goals: [
        { value: "Get contacted by clients", label: "Recibir contactos de clientes" },
        { value: "Book appointments", label: "Reservar citas" },
        { value: "Sell a product", label: "Vender un producto" },
        { value: "Capture leads", label: "Captar leads" },
        { value: "Present my company or service", label: "Presentar mi empresa o servicio" },
      ],
      materials: [
        { value: "Logo", label: "Logo" },
        { value: "Text content", label: "Textos" },
        { value: "Images", label: "Imágenes" },
        { value: "Videos", label: "Videos" },
        { value: "None yet", label: "Todavía no tengo nada" },
      ],
      budgets: [
        { value: "$500 – $1,000", label: "$500 – $1,000" },
        { value: "$1,000 – $3,000", label: "$1,000 – $3,000" },
        { value: "$3,000 – $7,000", label: "$3,000 – $7,000" },
        { value: "$7,000+", label: "$7,000+" },
        { value: "Prefer to discuss first", label: "Prefiero conversarlo primero" },
      ],
      timelines: [
        { value: "As soon as possible", label: "Lo antes posible" },
        { value: "2–4 weeks", label: "2–4 semanas" },
        { value: "1–2 months", label: "1–2 meses" },
        { value: "Flexible", label: "Flexible" },
      ],
    },
  },
}

function LogoBlock({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center min-h-12 items-center ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/ikingdom-logo-512.png"
        alt="iKingdom"
        className="h-10 w-auto object-contain"
      />
    </div>
  )
}

function buildProjectDescription(formData: FormData, whatsappValue?: string): string {
  const full_name = String(formData.get("full_name") ?? "")
  const email = String(formData.get("email") ?? "")
  const whatsapp = whatsappValue ?? String(formData.get("whatsapp") ?? "")
  const company = String(formData.get("company") ?? "")
  const country = String(formData.get("country") ?? "")
  const state_region = String(formData.get("state_region") ?? "")
  const city = String(formData.get("city") ?? "")
  const postal_code = String(formData.get("postal_code") ?? "")
  const address_line_1 = String(formData.get("address_line_1") ?? "")
  const address_line_2 = String(formData.get("address_line_2") ?? "")
  const page_type = String(formData.get("page_type") ?? "")
  const business_description = String(formData.get("business_description") ?? "")
  const goal = String(formData.get("goal") ?? "")
  const materials = formData.getAll("materials") as string[]
  const has_website = String(formData.get("has_website") ?? "")
  const website_url = String(formData.get("website_url") ?? "")
  const reference_sites = String(formData.get("reference_sites") ?? "")
  const budget = String(formData.get("budget") ?? "")
  const timeline = String(formData.get("timeline") ?? "")
  const additional_info = String(formData.get("additional_info") ?? "")

  const lines: string[] = []
  lines.push("--- CONTACT ---")
  lines.push(`Full Name: ${full_name}`)
  lines.push(`Email: ${email}`)
  lines.push(`Phone/WhatsApp: ${whatsapp}`)
  lines.push(`Company: ${company}`)
  if (country || state_region || city || postal_code || address_line_1 || address_line_2) {
    lines.push("")
    lines.push("--- LOCATION ---")
    if (country) lines.push(`Country: ${country}`)
    if (state_region) lines.push(`State/Region: ${state_region}`)
    if (city) lines.push(`City: ${city}`)
    if (postal_code) lines.push(`Postal Code: ${postal_code}`)
    if (address_line_1) lines.push(`Address Line 1: ${address_line_1}`)
    if (address_line_2) lines.push(`Address Line 2: ${address_line_2}`)
  }
  lines.push("")
  lines.push("--- PROJECT ---")
  lines.push(`Type of page: ${page_type || "(not selected)"}`)
  lines.push(`Business: ${business_description || "(empty)"}`)
  lines.push(`Main goal: ${goal || "(not selected)"}`)
  lines.push("")
  lines.push("--- MATERIALS ---")
  lines.push(materials.length ? materials.join(", ") : "None selected")
  lines.push("")
  lines.push("--- CURRENT PRESENCE ---")
  lines.push(`Has website: ${has_website || "(not selected)"}`)
  if (website_url) lines.push(`Website URL: ${website_url}`)
  if (reference_sites) lines.push(`Reference sites: ${reference_sites}`)
  lines.push("")
  lines.push("--- BUDGET & TIMELINE ---")
  lines.push(`Budget: ${budget || "(not selected)"}`)
  lines.push(`Timeline: ${timeline || "(not selected)"}`)
  if (additional_info) {
    lines.push("")
    lines.push("--- ADDITIONAL ---")
    lines.push(additional_info)
  }
  return lines.join("\n")
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [language, setLanguage] = useState<Language>("en")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")
  const t = COPY[language]

  const states = useMemo((): StateItem[] => {
    if (!selectedCountryCode) return []
    return State.getStatesOfCountry(selectedCountryCode) as StateItem[]
  }, [selectedCountryCode])

  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) {
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const full_name = String(formData.get("full_name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const company = String(formData.get("company") ?? "").trim()
    const page_type = String(formData.get("page_type") ?? "").trim()
    const business_description = String(formData.get("business_description") ?? "").trim()
    const goal = String(formData.get("goal") ?? "").trim()

    if (!full_name || !email) {
      alert(t.validation.fullNameEmailRequired)
      setLoading(false)
      return
    }
    if (!company) {
      alert(t.validation.companyRequired)
      setLoading(false)
      return
    }
    if (!page_type || !business_description || !goal) {
      alert(t.validation.projectFieldsRequired)
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert(t.validation.invalidEmail)
      setLoading(false)
      return
    }

    const website_url = String(formData.get("website_url") ?? "").trim()
    if (website_url && !/^https?:\/\/.+\..+/.test(website_url)) {
      alert(t.validation.invalidWebsiteUrl)
      setLoading(false)
      return
    }

    const project_description = buildProjectDescription(formData, phoneValue ?? undefined)

    // Teléfono: estado interno phoneValue se envía al backend como "whatsapp"
    const payload = {
      full_name,
      company,
      email,
      whatsapp: (phoneValue ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "").trim() || undefined,
      state_region: String(formData.get("state_region") ?? "").trim() || undefined,
      city: String(formData.get("city") ?? "").trim() || undefined,
      postal_code: String(formData.get("postal_code") ?? "").trim() || undefined,
      address_line_1: String(formData.get("address_line_1") ?? "").trim() || undefined,
      address_line_2: String(formData.get("address_line_2") ?? "").trim() || undefined,
      project_description,
    }

    try {
      const res = await fetch("/api/external/ikingdom-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json?.error ?? t.validation.submitError)
        return
      }
      setSuccess(true)
    } catch (error) {
      console.error(error)
      alert(t.validation.connectionError)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center px-5 py-20`}>
        <div className="w-full max-w-[420px] text-center">
          <LogoBlock className="mb-10" />
          <div className="rounded-full bg-[#1c1c1c] text-white w-14 h-14 flex items-center justify-center mx-auto mb-8">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={`text-2xl font-light tracking-tight ${theme.label}`}>{t.confirmation.title}</h1>
          <p className={`mt-4 text-[15px] leading-relaxed ${theme.muted}`}>
            {t.confirmation.line1}
          </p>
          <p className={`mt-4 text-[15px] leading-relaxed ${theme.muted}`}>
            {t.confirmation.line2}
          </p>
          <p className={`mt-14 text-[11px] uppercase tracking-[0.2em] ${theme.muted}`}>
            ikingdom.org
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col`}>
      <header className="shrink-0 pt-14 pb-8 px-5 flex flex-col items-center text-center relative">
        <div className="absolute top-4 right-5 text-[10px] tracking-[0.18em] uppercase text-[#9ca3af]">
          BUILD CHECK 2026-03-09
        </div>
        <div className="w-full max-w-[540px] flex items-center justify-end mb-4">
          <div className="inline-flex items-center rounded-full border border-[#e5e3e0] bg-white px-1 py-1 shadow-sm">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-colors ${
                language === "en" ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-[#1a1a1a]/5"
              }`}
              aria-label="Switch language to English"
            >
              {t.languageShort.en}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wide rounded-full transition-colors ${
                language === "es" ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-[#1a1a1a]/5"
              }`}
              aria-label="Cambiar idioma a Español"
            >
              {t.languageShort.es}
            </button>
          </div>
        </div>
        <LogoBlock className="mb-8" />
        <h1 className={`text-[28px] sm:text-3xl font-light tracking-tight ${theme.label} max-w-md leading-tight`}>
          {t.title}
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${theme.muted} max-w-lg`}>
          {t.intro}
        </p>
        <p className={`mt-3 text-sm ${theme.muted} max-w-lg`}>
          {t.introSecondary}
        </p>
      </header>

      <main className="flex-1 flex items-start justify-center px-5 pb-28 pt-4">
        <div className="w-full max-w-[540px]">
          <div className={`rounded-2xl ${theme.card} border shadow-lg overflow-hidden`} style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
              {/* Section 1 — Contact */}
              <div className="space-y-5">
                <h2 className={theme.sectionTitle}>{t.sections.contact}</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="full_name" className={theme.label}>{t.fields.fullName}</Label>
                    <Input id="full_name" name="full_name" placeholder={t.fields.fullName} required className={`mt-1.5 ${theme.input}`} />
                  </div>
                  <div>
                    <Label htmlFor="email" className={theme.label}>{t.fields.email}</Label>
                    <Input id="email" name="email" type="email" placeholder={t.fields.email} required className={`mt-1.5 ${theme.input}`} />
                  </div>
                  <div>
                    <Label className={theme.label}>{t.fields.phone}</Label>
                    <div className="mt-1.5 [&_.PhoneInputInput]:h-12 [&_.PhoneInputInput]:rounded-xl [&_.PhoneInputInput]:border [&_.PhoneInputInput]:border-[#e5e3e0] [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:text-[#1a1a1a] [&_.PhoneInputInput]:bg-white [&_.PhoneInputCountrySelect]:rounded-l-xl [&_.PhoneInput]:flex [&_.PhoneInput]:rounded-xl [&_.PhoneInput]:border [&_.PhoneInput]:border-[#e5e3e0] dark:[&_.PhoneInputInput]:!bg-white dark:[&_.PhoneInputInput]:!border-[#e5e3e0]">
                      <PhoneInput
                        value={phoneValue}
                        onChange={setPhoneValue}
                        placeholder={t.fields.phonePlaceholder}
                        defaultCountry="US"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company" className={theme.label}>{t.fields.company}</Label>
                    <Input id="company" name="company" placeholder={t.fields.company} required className={`mt-1.5 ${theme.input}`} />
                  </div>
                </div>
              </div>

              {/* Section 2 — Location */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>{t.sections.location}</h2>
                <div>
                  <Label htmlFor="country" className={theme.label}>{t.fields.country}</Label>
                  <input
                    type="hidden"
                    name="country"
                    value={COUNTRIES.find((c) => c.isoCode === selectedCountryCode)?.name ?? ""}
                  />
                  <select
                    id="country"
                    aria-label="Country"
                    className={`mt-1.5 ${theme.select}`}
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                  >
                    <option value="">{t.fields.countrySelect}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="state_region" className={theme.label}>{t.fields.stateRegion}</Label>
                  {states.length > 0 ? (
                    <select id="state_region" name="state_region" className={`mt-1.5 ${theme.select}`}>
                      <option value="">{t.fields.stateRegionSelect}</option>
                      {states.map((s) => (
                        <option key={s.isoCode} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <Input id="state_region" name="state_region" placeholder={t.fields.stateRegion} className={`mt-1.5 ${theme.input}`} />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className={theme.label}>{t.fields.city}</Label>
                    <Input id="city" name="city" placeholder={t.fields.city} className={`mt-1.5 ${theme.input}`} />
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className={theme.label}>{t.fields.postalCode}</Label>
                    <Input id="postal_code" name="postal_code" placeholder={t.fields.postalCodePlaceholder} className={`mt-1.5 ${theme.input}`} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address_line_1" className={theme.label}>{t.fields.address1}</Label>
                  <Input id="address_line_1" name="address_line_1" placeholder={t.fields.address1Placeholder} className={`mt-1.5 ${theme.input}`} />
                </div>
                <div>
                  <Label htmlFor="address_line_2" className={theme.label}>{t.fields.address2}</Label>
                  <Input id="address_line_2" name="address_line_2" placeholder={t.fields.address2Placeholder} className={`mt-1.5 ${theme.input}`} />
                </div>
              </div>

              {/* Section 3 — Project */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>{t.sections.project}</h2>
                <div>
                  <Label htmlFor="page_type" className={theme.label}>{t.fields.pageType}</Label>
                  <select id="page_type" name="page_type" required className={`mt-1.5 ${theme.select}`}>
                    <option value="">{t.fields.pageTypeSelect}</option>
                    {t.options.pageTypes.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="business_description" className={theme.label}>{t.fields.businessDescription}</Label>
                  <Textarea id="business_description" name="business_description" placeholder={t.fields.businessDescription} required rows={3} className={`mt-1.5 min-h-[80px] rounded-xl resize-none ${theme.input}`} />
                </div>
                <div>
                  <Label htmlFor="goal" className={theme.label}>{t.fields.goal}</Label>
                  <select id="goal" name="goal" required className={`mt-1.5 ${theme.select}`}>
                    <option value="">{t.fields.goalSelect}</option>
                    {t.options.goals.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3 — Available Materials */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>{t.sections.materials}</h2>
                <p className={`text-sm ${theme.muted}`}>{t.fields.materialsPrompt}</p>
                <div className="flex flex-wrap gap-2">
                  {t.options.materials.map((m) => (
                    <label key={m.value} className={theme.checkboxWrap}>
                      <Checkbox name="materials" value={m.value} className="dark:!border-[#eae8e5] dark:data-[state=checked]:!bg-[#1c1c1c]" />
                      <span className={theme.radioLabel}>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 4 — Current Presence */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>{t.sections.presence}</h2>
                <div>
                  <Label className={theme.label}>{t.fields.hasWebsite}</Label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="has_website" value="Yes" className="w-4 h-4 border-[#eae8e5] text-[#1c1c1c] focus:ring-[#1c1c1c]/20" />
                      <span className={theme.radioLabel}>{t.fields.yes}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="has_website" value="No" className="w-4 h-4 border-[#eae8e5] text-[#1c1c1c] focus:ring-[#1c1c1c]/20" />
                      <span className={theme.radioLabel}>{t.fields.no}</span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="website_url" className={theme.label}>{t.fields.websiteUrl}</Label>
                  <Input id="website_url" name="website_url" type="url" placeholder="https://" className={`mt-1.5 ${theme.input}`} />
                </div>
                <div>
                  <Label htmlFor="reference_sites" className={theme.label}>{t.fields.referenceSites}</Label>
                  <Textarea id="reference_sites" name="reference_sites" placeholder={t.fields.referenceSitesPlaceholder} rows={2} className={`mt-1.5 min-h-[60px] rounded-xl resize-none ${theme.input}`} />
                </div>
              </div>

              {/* Section 5 — Budget & Timeline */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>{t.sections.budgetTimeline}</h2>
                <div>
                  <Label htmlFor="budget" className={theme.label}>{t.fields.budget}</Label>
                  <select id="budget" name="budget" className={`mt-1.5 ${theme.select}`}>
                    <option value="">{t.fields.budgetSelect}</option>
                    {t.options.budgets.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="timeline" className={theme.label}>{t.fields.timeline}</Label>
                  <select id="timeline" name="timeline" className={`mt-1.5 ${theme.select}`}>
                    <option value="">{t.fields.timelineSelect}</option>
                    {t.options.timelines.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 6 — Additional Details */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>{t.sections.additional}</h2>
                <div>
                  <Label htmlFor="additional_info" className={theme.label}>{t.fields.additionalInfo}</Label>
                  <Textarea id="additional_info" name="additional_info" placeholder={t.fields.additionalInfoPlaceholder} rows={3} className={`mt-1.5 min-h-[80px] rounded-xl resize-none ${theme.input}`} />
                </div>
              </div>

              <div className={`pt-8 ${theme.sectionBorder}`}>
                <p className={`text-sm ${theme.muted} mb-6`}>
                  {t.footerSmall}
                </p>
                  <button type="submit" disabled={loading} className={theme.btn}>
                  {loading ? t.button.sending : t.button.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
