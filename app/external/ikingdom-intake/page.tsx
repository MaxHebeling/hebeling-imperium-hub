"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import dynamic from "next/dynamic"
// @ts-expect-error — optional deps: run npm install react-phone-number-input country-state-city
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
          function FallbackPhone({ value, onChange }: PhoneInputProps) {
            return (
              <Input
                placeholder="Phone / WhatsApp"
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

const PAGE_TYPES = [
  "Landing page for a service",
  "Landing page for a product",
  "Sales page",
  "Lead generation page",
  "I'm not sure, I need guidance",
]

const GOALS = [
  "Get contacted by clients",
  "Book appointments",
  "Sell a product",
  "Capture leads",
  "Present my company or service",
]

const MATERIALS = [
  { value: "Logo", label: "Logo" },
  { value: "Text content", label: "Text content" },
  { value: "Images", label: "Images" },
  { value: "Videos", label: "Videos" },
  { value: "None yet", label: "None yet" },
]

const BUDGETS = [
  "$500 – $1,000",
  "$1,000 – $3,000",
  "$3,000 – $7,000",
  "$7,000+",
  "Prefer to discuss first",
]

const TIMELINES = [
  "As soon as possible",
  "2–4 weeks",
  "1–2 months",
  "Flexible",
]

function LogoBlock({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center min-h-12 items-center ${className ?? ""}`}>
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
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")

  const states = useMemo((): StateItem[] => {
    if (!selectedCountryCode) return []
    return State.getStatesOfCountry(selectedCountryCode) as StateItem[]
  }, [selectedCountryCode])

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
      alert("Full Name and Email are required.")
      setLoading(false)
      return
    }
    if (!company) {
      alert("Company or Brand Name is required.")
      setLoading(false)
      return
    }
    if (!page_type || !business_description || !goal) {
      alert("Please complete all Project fields: page type, business description, and main goal.")
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.")
      setLoading(false)
      return
    }

    const website_url = String(formData.get("website_url") ?? "").trim()
    if (website_url && !/^https?:\/\/.+\..+/.test(website_url)) {
      alert("Please enter a valid website URL or leave it empty.")
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
        alert(json?.error ?? "Error submitting. Please try again.")
        return
      }
      setSuccess(true)
    } catch (error) {
      console.error(error)
      alert("Connection error. Please try again.")
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
          <h1 className={`text-2xl font-light tracking-tight ${theme.label}`}>
            Thank you for your request
          </h1>
          <p className={`mt-4 text-[15px] leading-relaxed ${theme.muted}`}>
            Your project information has been successfully submitted.
          </p>
          <p className={`mt-4 text-[15px] leading-relaxed ${theme.muted}`}>
            Our team will review your request and contact you shortly to schedule a discovery conversation.
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
      <header className="shrink-0 pt-14 pb-8 px-5 flex flex-col items-center text-center">
        <LogoBlock className="mb-8" />
        <h1 className={`text-[28px] sm:text-3xl font-light tracking-tight ${theme.label} max-w-md leading-tight`}>
          Start Your Landing Page Project
        </h1>
        <p className={`mt-4 text-base leading-relaxed ${theme.muted} max-w-lg`}>
          Tell us a little about your project and our team will contact you to discuss the best solution for your business.
        </p>
        <p className={`mt-3 text-sm ${theme.muted} max-w-lg`}>
          This short form helps our team understand your project and prepare the best strategy for your landing page.
        </p>
      </header>

      <main className="flex-1 flex items-start justify-center px-5 pb-28 pt-4">
        <div className="w-full max-w-[540px]">
          <div className={`rounded-2xl ${theme.card} border shadow-lg overflow-hidden`} style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
            <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
              {/* Section 1 — Contact */}
              <div className="space-y-5">
                <h2 className={theme.sectionTitle}>Contact</h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="full_name" className={theme.label}>Full Name</Label>
                    <Input id="full_name" name="full_name" placeholder="Full Name" required className={`mt-1.5 ${theme.input}`} />
                  </div>
                  <div>
                    <Label htmlFor="email" className={theme.label}>Email</Label>
                    <Input id="email" name="email" type="email" placeholder="Email" required className={`mt-1.5 ${theme.input}`} />
                  </div>
                  <div>
                    <Label className={theme.label}>Phone / WhatsApp</Label>
                    <div className="mt-1.5 [&_.PhoneInputInput]:h-12 [&_.PhoneInputInput]:rounded-xl [&_.PhoneInputInput]:border [&_.PhoneInputInput]:border-[#e5e3e0] [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:text-[#1a1a1a] [&_.PhoneInputInput]:bg-white [&_.PhoneInputCountrySelect]:rounded-l-xl [&_.PhoneInput]:flex [&_.PhoneInput]:rounded-xl [&_.PhoneInput]:border [&_.PhoneInput]:border-[#e5e3e0] dark:[&_.PhoneInputInput]:!bg-white dark:[&_.PhoneInputInput]:!border-[#e5e3e0]">
                      <PhoneInput
                        value={phoneValue}
                        onChange={setPhoneValue}
                        placeholder="Phone number"
                        defaultCountry="US"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company" className={theme.label}>Company or Brand Name</Label>
                    <Input id="company" name="company" placeholder="Company or Brand Name" required className={`mt-1.5 ${theme.input}`} />
                  </div>
                </div>
              </div>

              {/* Section 2 — Location */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>Location</h2>
                <div>
                  <Label htmlFor="country" className={theme.label}>Country</Label>
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
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="state_region" className={theme.label}>State / Province / Region</Label>
                  {states.length > 0 ? (
                    <select id="state_region" name="state_region" className={`mt-1.5 ${theme.select}`}>
                      <option value="">Select state / region</option>
                      {states.map((s) => (
                        <option key={s.isoCode} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <Input id="state_region" name="state_region" placeholder="State / Province / Region" className={`mt-1.5 ${theme.input}`} />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className={theme.label}>City</Label>
                    <Input id="city" name="city" placeholder="City" className={`mt-1.5 ${theme.input}`} />
                  </div>
                  <div>
                    <Label htmlFor="postal_code" className={theme.label}>Postal Code</Label>
                    <Input id="postal_code" name="postal_code" placeholder="Postal code" className={`mt-1.5 ${theme.input}`} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address_line_1" className={theme.label}>Address Line 1</Label>
                  <Input id="address_line_1" name="address_line_1" placeholder="Address line 1" className={`mt-1.5 ${theme.input}`} />
                </div>
                <div>
                  <Label htmlFor="address_line_2" className={theme.label}>Address Line 2 (optional)</Label>
                  <Input id="address_line_2" name="address_line_2" placeholder="Address line 2" className={`mt-1.5 ${theme.input}`} />
                </div>
              </div>

              {/* Section 3 — Project */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>Project</h2>
                <div>
                  <Label htmlFor="page_type" className={theme.label}>What type of page do you need?</Label>
                  <select id="page_type" name="page_type" required className={`mt-1.5 ${theme.select}`}>
                    <option value="">Select an option</option>
                    {PAGE_TYPES.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="business_description" className={theme.label}>Briefly describe your business</Label>
                  <Textarea id="business_description" name="business_description" placeholder="Briefly describe your business" required rows={3} className={`mt-1.5 min-h-[80px] rounded-xl resize-none ${theme.input}`} />
                </div>
                <div>
                  <Label htmlFor="goal" className={theme.label}>What is the main goal of your landing page?</Label>
                  <select id="goal" name="goal" required className={`mt-1.5 ${theme.select}`}>
                    <option value="">Select an option</option>
                    {GOALS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3 — Available Materials */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>Available Materials</h2>
                <p className={`text-sm ${theme.muted}`}>What materials do you already have?</p>
                <div className="flex flex-wrap gap-2">
                  {MATERIALS.map((m) => (
                    <label key={m.value} className={theme.checkboxWrap}>
                      <Checkbox name="materials" value={m.value} className="dark:!border-[#eae8e5] dark:data-[state=checked]:!bg-[#1c1c1c]" />
                      <span className={theme.radioLabel}>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 4 — Current Presence */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>Current Presence</h2>
                <div>
                  <Label className={theme.label}>Do you already have a website?</Label>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="has_website" value="Yes" className="w-4 h-4 border-[#eae8e5] text-[#1c1c1c] focus:ring-[#1c1c1c]/20" />
                      <span className={theme.radioLabel}>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="has_website" value="No" className="w-4 h-4 border-[#eae8e5] text-[#1c1c1c] focus:ring-[#1c1c1c]/20" />
                      <span className={theme.radioLabel}>No</span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="website_url" className={theme.label}>Website URL (only if applicable)</Label>
                  <Input id="website_url" name="website_url" type="url" placeholder="https://" className={`mt-1.5 ${theme.input}`} />
                </div>
                <div>
                  <Label htmlFor="reference_sites" className={theme.label}>Share 1 or 2 websites you like (optional)</Label>
                  <Textarea id="reference_sites" name="reference_sites" placeholder="URLs or names of sites you like" rows={2} className={`mt-1.5 min-h-[60px] rounded-xl resize-none ${theme.input}`} />
                </div>
              </div>

              {/* Section 5 — Budget & Timeline */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>Budget & Timeline</h2>
                <div>
                  <Label htmlFor="budget" className={theme.label}>Estimated budget</Label>
                  <select id="budget" name="budget" className={`mt-1.5 ${theme.select}`}>
                    <option value="">Select an option</option>
                    {BUDGETS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="timeline" className={theme.label}>Desired timeline</Label>
                  <select id="timeline" name="timeline" className={`mt-1.5 ${theme.select}`}>
                    <option value="">Select an option</option>
                    {TIMELINES.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 6 — Additional Details */}
              <div className={`space-y-5 pt-8 ${theme.sectionBorder}`}>
                <h2 className={theme.sectionTitle}>Additional Details</h2>
                <div>
                  <Label htmlFor="additional_info" className={theme.label}>Additional information</Label>
                  <Textarea id="additional_info" name="additional_info" placeholder="Anything else you'd like us to know" rows={3} className={`mt-1.5 min-h-[80px] rounded-xl resize-none ${theme.input}`} />
                </div>
              </div>

              <div className={`pt-8 ${theme.sectionBorder}`}>
                <p className={`text-sm ${theme.muted} mb-6`}>
                  Our team will review your request and contact you within 24–48 hours.
                </p>
                  <button type="submit" disabled={loading} className={theme.btn}>
                  {loading ? "Sending…" : "Submit Project Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
