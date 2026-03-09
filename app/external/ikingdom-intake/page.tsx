"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Language = "en" | "es";

interface IntakeFormData {
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  project_type: string;
  project_description: string;
  timeline: string;
  budget_range: string;
  preferred_contact_method: string;
}

const initialFormData: IntakeFormData = {
  full_name: "",
  company_name: "",
  email: "",
  whatsapp: "",
  country: "",
  city: "",
  project_type: "",
  project_description: "",
  timeline: "",
  budget_range: "",
  preferred_contact_method: "",
};

const translations = {
  en: {
    pageTitle: "Start Your Landing Page Project",
    pageDescription: "Tell us about your project and we'll get back to you within 24-48 hours",
    formTitle: "Project Intake Form",
    formDescription: "Fill out the details below to get started",
    fullName: "Full Name",
    fullNamePlaceholder: "Your name",
    companyName: "Company Name",
    companyNamePlaceholder: "Your company",
    email: "Email",
    emailPlaceholder: "you@email.com",
    whatsapp: "WhatsApp",
    whatsappPlaceholder: "+1 XXX XXX XXXX",
    country: "Country",
    countryPlaceholder: "United States",
    city: "City",
    cityPlaceholder: "New York",
    projectType: "Project Type",
    projectTypePlaceholder: "Select project type",
    projectTypeOptions: {
      landing_page: "Landing Page",
      website: "Full Website",
      ecommerce: "E-commerce / Online Store",
      funnel: "Sales Funnel",
      branding: "Branding / Identity",
      webapp: "Web App / System",
      consulting: "Digital Consulting",
    },
    projectDescription: "Project Description",
    projectDescriptionPlaceholder: "Describe your project, goals, and any specific requirements...",
    timeline: "Timeline",
    timelinePlaceholder: "Select timeline",
    timelineOptions: {
      urgent: "Urgent (< 1 week)",
      short: "Short (1-2 weeks)",
      medium: "Medium (2-4 weeks)",
      flexible: "Flexible",
    },
    budgetRange: "Budget Range",
    budgetRangePlaceholder: "Select budget range",
    budgetOptions: {
      starter: "$500 - $1,000",
      basic: "$1,000 - $2,500",
      professional: "$2,500 - $5,000",
      enterprise: "$5,000+",
      discuss: "Let's discuss",
    },
    contactMethod: "Preferred Contact Method",
    contactMethodPlaceholder: "Select contact method",
    contactOptions: {
      email: "Email",
      whatsapp: "WhatsApp",
      call: "Phone Call",
    },
    submit: "Submit Project Request",
    submitting: "Submitting...",
    back: "Back",
    successTitle: "Thank You!",
    successDescription: "Your project request has been received",
    referenceCode: "Your reference code:",
    successMessage: "We will contact you shortly through your preferred contact method. You can expect a response within 24-48 hours.",
    saveCode: "Save your reference code for future inquiries about your project.",
    backToHome: "Back to Home",
    newRequest: "New Request",
    required: "required",
    emailRequired: "Email is required to contact you",
    nameRequired: "Full name is required",
    invalidEmail: "Please enter a valid email",
    submitError: "Error submitting form. Please try again.",
  },
  es: {
    pageTitle: "Inicia Tu Proyecto de Landing Page",
    pageDescription: "Cuéntanos sobre tu proyecto y te responderemos en 24-48 horas",
    formTitle: "Formulario de Intake",
    formDescription: "Completa los detalles a continuación para comenzar",
    fullName: "Nombre Completo",
    fullNamePlaceholder: "Tu nombre",
    companyName: "Nombre de la Empresa",
    companyNamePlaceholder: "Tu empresa",
    email: "Email",
    emailPlaceholder: "tu@email.com",
    whatsapp: "WhatsApp",
    whatsappPlaceholder: "+34 XXX XXX XXX",
    country: "País",
    countryPlaceholder: "España",
    city: "Ciudad",
    cityPlaceholder: "Madrid",
    projectType: "Tipo de Proyecto",
    projectTypePlaceholder: "Selecciona el tipo de proyecto",
    projectTypeOptions: {
      landing_page: "Landing Page",
      website: "Sitio Web Completo",
      ecommerce: "E-commerce / Tienda Online",
      funnel: "Funnel de Ventas",
      branding: "Branding / Identidad",
      webapp: "Sistema Web / App",
      consulting: "Consultoría Digital",
    },
    projectDescription: "Descripción del Proyecto",
    projectDescriptionPlaceholder: "Describe tu proyecto, objetivos y cualquier requisito específico...",
    timeline: "Plazo",
    timelinePlaceholder: "Selecciona el plazo",
    timelineOptions: {
      urgent: "Urgente (< 1 semana)",
      short: "Corto (1-2 semanas)",
      medium: "Medio (2-4 semanas)",
      flexible: "Flexible",
    },
    budgetRange: "Rango de Presupuesto",
    budgetRangePlaceholder: "Selecciona el rango de presupuesto",
    budgetOptions: {
      starter: "$500 - $1,000",
      basic: "$1,000 - $2,500",
      professional: "$2,500 - $5,000",
      enterprise: "$5,000+",
      discuss: "Hablemos",
    },
    contactMethod: "Método de Contacto Preferido",
    contactMethodPlaceholder: "Selecciona el método de contacto",
    contactOptions: {
      email: "Email",
      whatsapp: "WhatsApp",
      call: "Llamada Telefónica",
    },
    submit: "Enviar Solicitud de Proyecto",
    submitting: "Enviando...",
    back: "Volver",
    successTitle: "¡Gracias!",
    successDescription: "Tu solicitud de proyecto ha sido recibida",
    referenceCode: "Tu código de referencia:",
    successMessage: "Nos pondremos en contacto contigo próximamente a través de tu método de contacto preferido. Puedes esperar una respuesta en 24-48 horas.",
    saveCode: "Guarda tu código de referencia para futuras consultas sobre tu proyecto.",
    backToHome: "Volver al Inicio",
    newRequest: "Nueva Solicitud",
    required: "requerido",
    emailRequired: "El email es requerido para contactarte",
    nameRequired: "El nombre completo es requerido",
    invalidEmail: "Por favor, ingresa un email válido",
    submitError: "Error al enviar el formulario. Intenta de nuevo.",
  },
};

const STORAGE_KEY = "ikingdom_intake_form";

export default function IKingdomIntakePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadCode, setLeadCode] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const t = translations[language];

  // Load form from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setFormData(parsedData);
      } catch (e) {
        console.error("Error parsing saved form data:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save form to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isLoaded]);

  const handleInputChange = (
    field: keyof IntakeFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    // Validate required fields
    if (!formData.full_name || !formData.full_name.trim()) {
      setSubmitError(t.nameRequired);
      setIsSubmitting(false);
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      setSubmitError(t.emailRequired);
      setIsSubmitting(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitError(t.invalidEmail);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        full_name: formData.full_name,
        company_name: formData.company_name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        country: formData.country,
        city: formData.city,
        project_type: formData.project_type,
        project_description: formData.project_description,
        timeline: formData.timeline,
        budget_range: formData.budget_range,
        preferred_contact_method: formData.preferred_contact_method,
        source: "ikingdom-intake",
        brand: "ikingdom",
        origin_page: "/external/ikingdom-intake",
        form_type: "intake",
      };

      const response = await fetch("/api/external/ikingdom-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.submitError);
      }

      setLeadCode(data.leadCode);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : t.submitError
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (leadCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0F172A" }}>
        <Card className="w-full max-w-md" style={{ backgroundColor: "#0F172A", borderColor: "#D4AF37" }}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 size={64} style={{ color: "#D4AF37" }} />
            </div>
            <CardTitle style={{ color: "#D4AF37" }}>{t.successTitle}</CardTitle>
            <CardDescription style={{ color: "#A0AEC0" }}>{t.successDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p style={{ color: "#E2E8F0" }} className="text-sm">
                {t.referenceCode}
              </p>
              <div
                className="p-4 rounded-lg text-center font-mono text-lg font-bold"
                style={{ backgroundColor: "rgba(212, 175, 55, 0.1)", color: "#D4AF37" }}
              >
                {leadCode}
              </div>
            </div>

            <div className="space-y-3">
              <p style={{ color: "#E2E8F0" }} className="text-sm">
                {t.successMessage}
              </p>
              <p style={{ color: "#A0AEC0" }} className="text-xs">
                {t.saveCode}
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <Link href="/">
                <Button
                  className="w-full"
                  style={{ backgroundColor: "#D4AF37", color: "#0F172A" }}
                >
                  {t.backToHome}
                </Button>
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "rgba(212, 175, 55, 0.1)",
                  color: "#D4AF37",
                  border: "1px solid #D4AF37",
                }}
              >
                {t.newRequest}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0F172A" }}>
        <Loader2 className="animate-spin" style={{ color: "#D4AF37" }} size={48} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0F172A", minHeight: "100vh" }} className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" style={{ color: "#D4AF37" }} />
            <span style={{ color: "#E5E7EB" }} className="text-sm font-medium">{t.back}</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Image src="/ikingdom-logo.png" alt="iKingdom" width={40} height={40} />
            <h1 style={{ color: "#FFFFFF" }} className="text-2xl md:text-3xl font-bold text-balance">{t.pageTitle}</h1>
          </div>
          <p style={{ color: "#9CA3AF" }} className="text-base md:text-lg">
            {t.pageDescription}
          </p>
        </div>

        {/* Language Toggle - Centered above the form card */}
        <div className="flex justify-center mt-6 mb-8">
          <div className="flex rounded-full border border-neutral-300 bg-white shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                language === "en"
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                language === "es"
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              ES
            </button>
          </div>
        </div>

        {/* Form Card */}
        <Card style={{ backgroundColor: "#111827", borderColor: "rgba(212, 175, 55, 0.2)" }}>
          <CardHeader>
            <CardTitle style={{ color: "#E2E8F0" }}>{t.formTitle}</CardTitle>
            <CardDescription style={{ color: "#A0AEC0" }}>
              {t.formDescription}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" style={{ color: "#E2E8F0" }}>
                    {t.fullName} *
                  </Label>
                  <Input
                    id="full_name"
                    placeholder={t.fullNamePlaceholder}
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    required
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}
                    className="placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="company_name" style={{ color: "#E2E8F0" }}>
                    {t.companyName}
                  </Label>
                  <Input
                    id="company_name"
                    placeholder={t.companyNamePlaceholder}
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}
                    className="placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" style={{ color: "#E2E8F0" }}>
                    {t.email} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}
                    className="placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" style={{ color: "#E2E8F0" }}>
                    {t.whatsapp}
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder={t.whatsappPlaceholder}
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}
                    className="placeholder:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country" style={{ color: "#E2E8F0" }}>
                      {t.country}
                    </Label>
                    <Input
                      id="country"
                      placeholder={t.countryPlaceholder}
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" style={{ color: "#E2E8F0" }}>
                      {t.city}
                    </Label>
                    <Input
                      id="city"
                      placeholder={t.cityPlaceholder}
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <div>
                  <Label style={{ color: "#E2E8F0" }}>{t.projectType}</Label>
                  <Select value={formData.project_type} onValueChange={(value) => handleInputChange("project_type", value)}>
                    <SelectTrigger style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}>
                      <SelectValue placeholder={t.projectTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landing_page">{t.projectTypeOptions.landing_page}</SelectItem>
                      <SelectItem value="website">{t.projectTypeOptions.website}</SelectItem>
                      <SelectItem value="ecommerce">{t.projectTypeOptions.ecommerce}</SelectItem>
                      <SelectItem value="funnel">{t.projectTypeOptions.funnel}</SelectItem>
                      <SelectItem value="branding">{t.projectTypeOptions.branding}</SelectItem>
                      <SelectItem value="webapp">{t.projectTypeOptions.webapp}</SelectItem>
                      <SelectItem value="consulting">{t.projectTypeOptions.consulting}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project_description" style={{ color: "#E2E8F0" }}>
                    {t.projectDescription}
                  </Label>
                  <Textarea
                    id="project_description"
                    placeholder={t.projectDescriptionPlaceholder}
                    value={formData.project_description}
                    onChange={(e) => handleInputChange("project_description", e.target.value)}
                    rows={4}
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}
                    className="placeholder:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label style={{ color: "#E2E8F0" }}>{t.timeline}</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder={t.timelinePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">{t.timelineOptions.urgent}</SelectItem>
                        <SelectItem value="short">{t.timelineOptions.short}</SelectItem>
                        <SelectItem value="medium">{t.timelineOptions.medium}</SelectItem>
                        <SelectItem value="flexible">{t.timelineOptions.flexible}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>{t.budgetRange}</Label>
                    <Select value={formData.budget_range} onValueChange={(value) => handleInputChange("budget_range", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder={t.budgetRangePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">{t.budgetOptions.starter}</SelectItem>
                        <SelectItem value="basic">{t.budgetOptions.basic}</SelectItem>
                        <SelectItem value="professional">{t.budgetOptions.professional}</SelectItem>
                        <SelectItem value="enterprise">{t.budgetOptions.enterprise}</SelectItem>
                        <SelectItem value="discuss">{t.budgetOptions.discuss}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label style={{ color: "#E2E8F0" }}>{t.contactMethod}</Label>
                  <Select value={formData.preferred_contact_method} onValueChange={(value) => handleInputChange("preferred_contact_method", value)}>
                    <SelectTrigger style={{
                      backgroundColor: "rgba(212, 175, 55, 0.05)",
                      borderColor: "rgba(212, 175, 55, 0.3)",
                      color: "#E2E8F0",
                    }}>
                      <SelectValue placeholder={t.contactMethodPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">{t.contactOptions.email}</SelectItem>
                      <SelectItem value="whatsapp">{t.contactOptions.whatsapp}</SelectItem>
                      <SelectItem value="call">{t.contactOptions.call}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                >
                  <AlertCircle className="w-5 h-5" style={{ color: "#EF4444" }} />
                  <span style={{ color: "#EF4444" }} className="text-sm">{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                style={{ backgroundColor: "#D4AF37", color: "#0F172A" }}
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
