"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";

const translations = {
  en: {
    title: "Start Your Landing Page Project",
    subtitle: "Tell us a little about your project and our team will contact you to discuss the best solution for your business.",
    description: "This short form helps our team understand your project and prepare the best strategy for your landing page.",
    contact: "Contact",
    fullName: "Full Name",
    email: "Email",
    phoneWhatsApp: "Phone / WhatsApp",
    companyOrBrand: "Company or Brand Name",
    location: "Location",
    country: "Country",
    selectCountry: "Select country",
    state: "State / Province / Region",
    city: "City",
    postalCode: "Postal Code",
    address1: "Address Line 1",
    address2: "Address Line 2 (optional)",
    project: "Project",
    pageType: "What type of page do you need?",
    selectOption: "Select an option",
    pageTypes: {
      landing_service: "Landing page for a service",
      landing_product: "Landing page for a product",
      sales: "Sales page",
      lead_gen: "Lead generation page",
      guidance: "I'm not sure, I need guidance"
    },
    businessDescription: "Briefly describe your business",
    mainGoal: "What is the main goal of your landing page?",
    goals: {
      contact: "Get contacted by clients",
      appointments: "Book appointments",
      sell: "Sell a product",
      leads: "Capture leads",
      present: "Present my company or service"
    },
    materials: "Available Materials",
    materialsQuestion: "What materials do you already have?",
    materialOptions: {
      logo: "Logo",
      text: "Text content",
      images: "Images",
      videos: "Videos",
      none: "None yet"
    },
    presence: "Current Presence",
    hasWebsite: "Do you already have a website?",
    yes: "Yes",
    no: "No",
    websiteUrl: "Website URL (only if applicable)",
    inspirationSites: "Share 1 or 2 websites you like (optional)",
    budgetTimeline: "Budget & Timeline",
    budget: "Estimated budget",
    budgets: {
      low: "$500 – $1,000",
      mid: "$1,000 – $3,000",
      high: "$3,000 – $7,000",
      premium: "$7,000+",
      discuss: "Prefer to discuss first"
    },
    timeline: "Desired timeline",
    timelines: {
      asap: "As soon as possible",
      short: "2–4 weeks",
      medium: "1–2 months",
      flexible: "Flexible"
    },
    additionalDetails: "Additional Details",
    additionalInfo: "Additional information",
    reviewNote: "Our team will review your request and contact you within 24–48 hours.",
    submit: "Submit Project Request",
    submitting: "Submitting...",
    successTitle: "Thank you!",
    successMessage: "Your project request has been received. Our team will contact you within 24-48 hours.",
    errorMessage: "There was an error submitting your request. Please try again."
  },
  es: {
    title: "Comienza Tu Proyecto de Landing Page",
    subtitle: "Cuéntanos un poco sobre tu proyecto y nuestro equipo se pondrá en contacto contigo para discutir la mejor solución para tu negocio.",
    description: "Este breve formulario ayuda a nuestro equipo a entender tu proyecto y preparar la mejor estrategia para tu landing page.",
    contact: "Contacto",
    fullName: "Nombre Completo",
    email: "Correo Electrónico",
    phoneWhatsApp: "Teléfono / WhatsApp",
    companyOrBrand: "Nombre de Empresa o Marca",
    location: "Ubicación",
    country: "País",
    selectCountry: "Selecciona país",
    state: "Estado / Provincia / Región",
    city: "Ciudad",
    postalCode: "Código Postal",
    address1: "Dirección Línea 1",
    address2: "Dirección Línea 2 (opcional)",
    project: "Proyecto",
    pageType: "¿Qué tipo de página necesitas?",
    selectOption: "Selecciona una opción",
    pageTypes: {
      landing_service: "Landing page para un servicio",
      landing_product: "Landing page para un producto",
      sales: "Página de ventas",
      lead_gen: "Página de generación de leads",
      guidance: "No estoy seguro, necesito orientación"
    },
    businessDescription: "Describe brevemente tu negocio",
    mainGoal: "¿Cuál es el objetivo principal de tu landing page?",
    goals: {
      contact: "Que me contacten clientes",
      appointments: "Agendar citas",
      sell: "Vender un producto",
      leads: "Capturar leads",
      present: "Presentar mi empresa o servicio"
    },
    materials: "Materiales Disponibles",
    materialsQuestion: "¿Qué materiales tienes disponibles?",
    materialOptions: {
      logo: "Logo",
      text: "Contenido de texto",
      images: "Imágenes",
      videos: "Videos",
      none: "Ninguno todavía"
    },
    presence: "Presencia Actual",
    hasWebsite: "¿Ya tienes un sitio web?",
    yes: "Sí",
    no: "No",
    websiteUrl: "URL del sitio web (solo si aplica)",
    inspirationSites: "Comparte 1 o 2 sitios web que te gusten (opcional)",
    budgetTimeline: "Presupuesto y Tiempo",
    budget: "Presupuesto estimado",
    budgets: {
      low: "$500 – $1,000",
      mid: "$1,000 – $3,000",
      high: "$3,000 – $7,000",
      premium: "$7,000+",
      discuss: "Prefiero discutirlo primero"
    },
    timeline: "Tiempo deseado",
    timelines: {
      asap: "Lo antes posible",
      short: "2–4 semanas",
      medium: "1–2 meses",
      flexible: "Flexible"
    },
    additionalDetails: "Detalles Adicionales",
    additionalInfo: "Información adicional",
    reviewNote: "Nuestro equipo revisará tu solicitud y te contactará en 24–48 horas.",
    submit: "Enviar Solicitud de Proyecto",
    submitting: "Enviando...",
    successTitle: "¡Gracias!",
    successMessage: "Tu solicitud de proyecto ha sido recibida. Nuestro equipo te contactará en 24-48 horas.",
    errorMessage: "Hubo un error al enviar tu solicitud. Por favor intenta de nuevo."
  }
};

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function IKingdomIntakePage() {
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    address1: "",
    address2: "",
    pageType: "",
    businessDescription: "",
    mainGoal: "",
    materials: [] as string[],
    hasWebsite: "",
    websiteUrl: "",
    inspirationSites: "",
    budget: "",
    timeline: "",
    additionalInfo: ""
  });

  const t = translations[language];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialToggle = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter(m => m !== material)
        : [...prev.materials, material]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/external/ikingdom-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          language,
          source: "ikingdom-intake",
          submittedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setSubmitted(true);
    } catch {
      setError(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black border-[#C89A0F]">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-[#E1B61A] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-[#E1B61A]">{t.successTitle}</h2>
            <p className="text-[#D9D9D9]">{t.successMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo-imperium.png"
            alt="Imperium Group"
            width={48}
            height={48}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-semibold text-[#E1B61A] mb-3">
            {t.title}
          </h1>
          <p className="text-[#D9D9D9] mb-2">{t.subtitle}</p>
          <p className="text-sm text-[#D9D9D9]/70">{t.description}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-[#C89A0F] bg-black p-1">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                language === "en"
                  ? "bg-[#E1B61A] text-black"
                  : "text-[#D9D9D9] hover:bg-[#C89A0F]/20"
              }`}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                language === "es"
                  ? "bg-[#E1B61A] text-black"
                  : "text-[#D9D9D9] hover:bg-[#C89A0F]/20"
              }`}
              onClick={() => setLanguage("es")}
            >
              ES
            </button>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-black border-[#C89A0F]">
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit} className="ikingdom-form space-y-8">
              
              {/* Contact Section */}
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                  {t.contact}
                </h2>
                
                <div>
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <Input
                    id="fullName"
                    placeholder={t.fullName}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.email}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t.phoneWhatsApp}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="company">{t.companyOrBrand}</Label>
                  <Input
                    id="company"
                    placeholder={t.companyOrBrand}
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <div className="border-t border-[#C89A0F]/30 pt-6">
                  <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                    {t.location}
                  </h2>
                </div>

                <div>
                  <Label>{t.country}</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange("country", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t.selectCountry} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="state">{t.state}</Label>
                  <Input
                    id="state"
                    placeholder={t.state}
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t.city}</Label>
                  <Input
                    id="city"
                    placeholder={t.city}
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">{t.postalCode}</Label>
                  <Input
                    id="postalCode"
                    placeholder={t.postalCode}
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address1">{t.address1}</Label>
                  <Input
                    id="address1"
                    placeholder={t.address1}
                    value={formData.address1}
                    onChange={(e) => handleInputChange("address1", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address2">{t.address2}</Label>
                  <Input
                    id="address2"
                    placeholder={t.address2}
                    value={formData.address2}
                    onChange={(e) => handleInputChange("address2", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Project Section */}
              <div className="space-y-4">
                <div className="border-t border-[#C89A0F]/30 pt-6">
                  <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                    {t.project}
                  </h2>
                </div>

                <div>
                  <Label>{t.pageType}</Label>
                  <Select
                    value={formData.pageType}
                    onValueChange={(value) => handleInputChange("pageType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t.selectOption} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landing_service">{t.pageTypes.landing_service}</SelectItem>
                      <SelectItem value="landing_product">{t.pageTypes.landing_product}</SelectItem>
                      <SelectItem value="sales">{t.pageTypes.sales}</SelectItem>
                      <SelectItem value="lead_gen">{t.pageTypes.lead_gen}</SelectItem>
                      <SelectItem value="guidance">{t.pageTypes.guidance}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessDescription">{t.businessDescription}</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder={t.businessDescription}
                    value={formData.businessDescription}
                    onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>{t.mainGoal}</Label>
                  <Select
                    value={formData.mainGoal}
                    onValueChange={(value) => handleInputChange("mainGoal", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t.selectOption} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">{t.goals.contact}</SelectItem>
                      <SelectItem value="appointments">{t.goals.appointments}</SelectItem>
                      <SelectItem value="sell">{t.goals.sell}</SelectItem>
                      <SelectItem value="leads">{t.goals.leads}</SelectItem>
                      <SelectItem value="present">{t.goals.present}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Materials Section */}
              <div className="space-y-4">
                <div className="border-t border-[#C89A0F]/30 pt-6">
                  <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                    {t.materials}
                  </h2>
                </div>

                <div>
                  <Label className="mb-3 block">{t.materialsQuestion}</Label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(t.materialOptions).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.materials.includes(key)}
                          onCheckedChange={() => handleMaterialToggle(key)}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Presence Section */}
              <div className="space-y-4">
                <div className="border-t border-[#C89A0F]/30 pt-6">
                  <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                    {t.presence}
                  </h2>
                </div>

                <div>
                  <Label className="mb-3 block">{t.hasWebsite}</Label>
                  <RadioGroup
                    value={formData.hasWebsite}
                    onValueChange={(value) => handleInputChange("hasWebsite", value)}
                    className="flex gap-6"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="yes" />
                      <span>{t.yes}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="no" />
                      <span>{t.no}</span>
                    </label>
                  </RadioGroup>
                </div>

                {formData.hasWebsite === "yes" && (
                  <div>
                    <Label htmlFor="websiteUrl">{t.websiteUrl}</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://..."
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="inspirationSites">{t.inspirationSites}</Label>
                  <Input
                    id="inspirationSites"
                    placeholder="https://..."
                    value={formData.inspirationSites}
                    onChange={(e) => handleInputChange("inspirationSites", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Budget & Timeline Section */}
              <div className="space-y-4">
                <div className="border-t border-[#C89A0F]/30 pt-6">
                  <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                    {t.budgetTimeline}
                  </h2>
                </div>

                <div>
                  <Label>{t.budget}</Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => handleInputChange("budget", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t.selectOption} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t.budgets.low}</SelectItem>
                      <SelectItem value="mid">{t.budgets.mid}</SelectItem>
                      <SelectItem value="high">{t.budgets.high}</SelectItem>
                      <SelectItem value="premium">{t.budgets.premium}</SelectItem>
                      <SelectItem value="discuss">{t.budgets.discuss}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t.timeline}</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => handleInputChange("timeline", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t.selectOption} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">{t.timelines.asap}</SelectItem>
                      <SelectItem value="short">{t.timelines.short}</SelectItem>
                      <SelectItem value="medium">{t.timelines.medium}</SelectItem>
                      <SelectItem value="flexible">{t.timelines.flexible}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className="space-y-4">
                <div className="border-t border-[#C89A0F]/30 pt-6">
                  <h2 className="text-xs font-semibold text-[#E1B61A] uppercase tracking-wider">
                    {t.additionalDetails}
                  </h2>
                </div>

                <div>
                  <Label htmlFor="additionalInfo">{t.additionalInfo}</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder={t.additionalInfo}
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </div>

              {/* Note & Submit */}
              <div className="pt-4">
                <p className="text-sm text-[#D9D9D9]/70 mb-6 text-center">
                  {t.reviewNote}
                </p>

                {error && (
                  <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#E1B61A] hover:bg-[#C89A0F] text-black font-semibold focus:ring-[#F2F500]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
