"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface DiagnosisFormData {
  // Section 1: Basic Info
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;

  // Section 2: Business Model
  organization_type: string;
  main_service: string;
  website_url: string;
  social_links: string;

  // Section 3: Target Market
  ideal_client: string;
  main_goal: string;
  expected_result: string;

  // Section 4: Current Digital Presence
  has_current_landing: string;
  has_logo: string;
  has_brand_colors: string;
  visual_style: string;

  // Section 5: Content & Resources
  available_content: string;
  reference_websites: string;

  // Section 6: Project Vision
  project_description: string;

  // Section 7: Timeline & Budget
  timeline: string;
  budget_range: string;

  // Section 8: Specifics
  project_type: string;
  preferred_contact_method: string;

  // Section 9: Additional Notes
  additional_notes: string;
}

const initialFormData: DiagnosisFormData = {
  full_name: "",
  company_name: "",
  email: "",
  whatsapp: "",
  country: "",
  city: "",
  organization_type: "",
  main_service: "",
  website_url: "",
  social_links: "",
  ideal_client: "",
  main_goal: "",
  expected_result: "",
  has_current_landing: "",
  has_logo: "",
  has_brand_colors: "",
  visual_style: "",
  available_content: "",
  reference_websites: "",
  project_description: "",
  timeline: "",
  budget_range: "",
  project_type: "",
  preferred_contact_method: "",
  additional_notes: "",
};

const STEPS = [
  { id: 1, title: "Información Básica", description: "Datos de contacto" },
  { id: 2, title: "Modelo de Negocio", description: "Tu empresa" },
  { id: 3, title: "Mercado Objetivo", description: "A quién sirves" },
  { id: 4, title: "Presencia Digital", description: "Tu identidad actual" },
  { id: 5, title: "Contenido", description: "Recursos disponibles" },
  { id: 6, title: "Visión del Proyecto", description: "Descripción general" },
  { id: 7, title: "Tiempos y Budget", description: "Plazo y presupuesto" },
  { id: 8, title: "Especificidades", description: "Detalles técnicos" },
  { id: 9, title: "Notas Finales", description: "Comentarios adicionales" },
];

const STORAGE_KEY = "ikingdom_diagnosis_form";

export default function iKingdomDiagnosisPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DiagnosisFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadCode, setLeadCode] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

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
    field: keyof DiagnosisFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        full_name: formData.full_name,
        company_name: formData.company_name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        country: formData.country,
        city: formData.city,
        organization_type: formData.organization_type,
        main_service: formData.main_service,
        website_url: formData.website_url,
        social_links: formData.social_links,
        ideal_client: formData.ideal_client,
        main_goal: formData.main_goal,
        expected_result: formData.expected_result,
        has_current_landing: formData.has_current_landing === "si",
        has_logo: formData.has_logo === "si",
        has_brand_colors: formData.has_brand_colors === "si",
        visual_style: formData.visual_style,
        available_content: formData.available_content,
        reference_websites: formData.reference_websites,
        project_description: formData.project_description,
        timeline: formData.timeline,
        budget_range: formData.budget_range,
        project_type: formData.project_type,
        preferred_contact_method: formData.preferred_contact_method,
        additional_notes: formData.additional_notes,
        source: "ikingdom-diagnosis",
        brand: "ikingdom",
        origin_page: "/apply/ikingdom-diagnosis",
        form_type: "diagnosis",
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al enviar el formulario");
      }

      const data = await response.json();
      setLeadCode(data.leadCode);
      localStorage.removeItem(STORAGE_KEY); // Clear form after successful submission
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Error desconocido"
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
            <CardTitle style={{ color: "#D4AF37" }}>¡Gracias!</CardTitle>
            <CardDescription style={{ color: "#A0AEC0" }}>Tu diagnóstico ha sido recibido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p style={{ color: "#E2E8F0" }} className="text-sm">
                Tu código de referencia:
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
                Nos pondremos en contacto con usted próximamente a través del canal preferido que seleccionó. Puede esperar una respuesta dentro de 24-48 horas.
              </p>
              <p style={{ color: "#A0AEC0" }} className="text-xs">
                Guarde su código de referencia para futuras consultas sobre su diagnóstico.
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <Link href="/">
                <Button
                  className="w-full"
                  style={{ backgroundColor: "#D4AF37", color: "#0F172A" }}
                >
                  Volver al Inicio
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
                Nuevo Diagnóstico
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
    <div style={{ backgroundColor: "#0F172A", minHeight: "100vh" }} className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" style={{ color: "#D4AF37" }} />
            <span style={{ color: "#E5E7EB" }} className="text-sm font-medium">Volver</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8" style={{ color: "#D4AF37" }} />
            <h1 style={{ color: "#FFFFFF" }} className="text-3xl font-bold">Diagnóstico Estratégico</h1>
          </div>
          <p style={{ color: "#9CA3AF" }} className="text-lg">
            Análisis de tu arquitectura digital y posicionamiento
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex-1 h-1 mx-1 rounded-full transition-colors ${
                  s.id <= step ? "opacity-100" : "opacity-30"
                }`}
                style={{
                  backgroundColor: s.id <= step ? "#D4AF37" : "rgba(212, 175, 55, 0.2)",
                }}
              />
            ))}
          </div>
          <div className="text-sm" style={{ color: "#A0AEC0" }}>
            Paso {step} de {STEPS.length}
          </div>
        </div>

        {/* Form Card */}
        <Card style={{ backgroundColor: "#111827", borderColor: "rgba(212, 175, 55, 0.2)" }}>
          <CardHeader>
            <CardTitle style={{ color: "#E2E8F0" }}>{STEPS[step - 1].title}</CardTitle>
            <CardDescription style={{ color: "#A0AEC0" }}>
              {STEPS[step - 1].description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="full_name" style={{ color: "#E2E8F0" }}>
                      Nombre Completo *
                    </Label>
                    <Input
                      id="full_name"
                      placeholder="Tu nombre"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      required
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_name" style={{ color: "#E2E8F0" }}>
                      Nombre de la Empresa
                    </Label>
                    <Input
                      id="company_name"
                      placeholder="Tu empresa"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" style={{ color: "#E2E8F0" }}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp" style={{ color: "#E2E8F0" }}>
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      placeholder="+34 XXX XXX XXX"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country" style={{ color: "#E2E8F0" }}>
                        País
                      </Label>
                      <Input
                        id="country"
                        placeholder="España"
                        value={formData.country}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        style={{
                          backgroundColor: "rgba(212, 175, 55, 0.05)",
                          borderColor: "rgba(212, 175, 55, 0.3)",
                          color: "#E2E8F0",
                        }}
                        className="placeholder:text-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" style={{ color: "#E2E8F0" }}>
                        Ciudad
                      </Label>
                      <Input
                        id="city"
                        placeholder="Madrid"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        style={{
                          backgroundColor: "rgba(212, 175, 55, 0.05)",
                          borderColor: "rgba(212, 175, 55, 0.3)",
                          color: "#E2E8F0",
                        }}
                        className="placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Business Model */}
              {step === 2 && (
                <>
                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Tipo de Organización *</Label>
                    <Select value={formData.organization_type} onValueChange={(value) => handleInputChange("organization_type", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="Selecciona tu tipo de organización" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="autónomo">Autónomo / Freelancer</SelectItem>
                        <SelectItem value="pyme">Pyme</SelectItem>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="ong">ONG / Asociación</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Servicio Principal *</Label>
                    <Select value={formData.main_service} onValueChange={(value) => handleInputChange("main_service", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="¿Qué servicio ofreces?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landing_page">Landing Page</SelectItem>
                        <SelectItem value="sitio_web">Sitio Web Completo</SelectItem>
                        <SelectItem value="ecommerce">E-commerce / Tienda Online</SelectItem>
                        <SelectItem value="funnel">Funnel de Ventas</SelectItem>
                        <SelectItem value="branding">Branding / Identidad</SelectItem>
                        <SelectItem value="sistema_web">Sistema Web / App</SelectItem>
                        <SelectItem value="consultoria">Consultoría Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="website_url" style={{ color: "#E2E8F0" }}>
                      URL del Sitio Web Actual
                    </Label>
                    <Input
                      id="website_url"
                      placeholder="https://miempresa.com"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange("website_url", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="social_links" style={{ color: "#E2E8F0" }}>
                      Enlaces a Redes Sociales
                    </Label>
                    <Input
                      id="social_links"
                      placeholder="Instagram, LinkedIn, Facebook, etc."
                      value={formData.social_links}
                      onChange={(e) => handleInputChange("social_links", e.target.value)}
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                      className="placeholder:text-gray-600"
                    />
                  </div>
                </>
              )}

              {/* Step 3: Target Market */}
              {step === 3 && (
                <>
                  <div>
                    <Label htmlFor="ideal_client" style={{ color: "#E2E8F0" }}>
                      ¿Cuál es tu cliente ideal? *
                    </Label>
                    <Textarea
                      id="ideal_client"
                      placeholder="Describe quién es tu cliente ideal..."
                      value={formData.ideal_client}
                      onChange={(e) => handleInputChange("ideal_client", e.target.value)}
                      className="h-24"
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                    />
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Objetivo Principal *</Label>
                    <Select value={formData.main_goal} onValueChange={(value) => handleInputChange("main_goal", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="¿Cuál es tu objetivo principal?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generar_leads">Generar leads / prospectos</SelectItem>
                        <SelectItem value="vender_productos">Vender productos online</SelectItem>
                        <SelectItem value="captar_clientes">Captar nuevos clientes</SelectItem>
                        <SelectItem value="construir_marca">Construir presencia de marca</SelectItem>
                        <SelectItem value="lanzar_producto">Lanzar nuevo producto/servicio</SelectItem>
                        <SelectItem value="escalar_negocio">Escalar mi negocio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expected_result" style={{ color: "#E2E8F0" }}>
                      ¿Cuál es el resultado esperado?
                    </Label>
                    <Textarea
                      id="expected_result"
                      placeholder="Describe qué esperas lograr..."
                      value={formData.expected_result}
                      onChange={(e) => handleInputChange("expected_result", e.target.value)}
                      className="h-24"
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                    />
                  </div>
                </>
              )}

              {/* Step 4: Digital Presence */}
              {step === 4 && (
                <>
                  <div>
                    <Label style={{ color: "#E2E8F0" }}>¿Tienes un landing page o sitio web actual?</Label>
                    <RadioGroup value={formData.has_current_landing} onValueChange={(value) => handleInputChange("has_current_landing", value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="landing_si" style={{ borderColor: "#D4AF37" }} />
                        <Label htmlFor="landing_si" style={{ color: "#E2E8F0" }} className="ml-2 cursor-pointer">Sí, tengo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="landing_no" style={{ borderColor: "#D4AF37" }} />
                        <Label htmlFor="landing_no" style={{ color: "#E2E8F0" }} className="ml-2 cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>¿Tienes un logo?</Label>
                    <RadioGroup value={formData.has_logo} onValueChange={(value) => handleInputChange("has_logo", value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="logo_si" style={{ borderColor: "#D4AF37" }} />
                        <Label htmlFor="logo_si" style={{ color: "#E2E8F0" }} className="ml-2 cursor-pointer">Sí, tengo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="logo_no" style={{ borderColor: "#D4AF37" }} />
                        <Label htmlFor="logo_no" style={{ color: "#E2E8F0" }} className="ml-2 cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>¿Tienes colores de marca definidos?</Label>
                    <RadioGroup value={formData.has_brand_colors} onValueChange={(value) => handleInputChange("has_brand_colors", value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="colors_si" style={{ borderColor: "#D4AF37" }} />
                        <Label htmlFor="colors_si" style={{ color: "#E2E8F0" }} className="ml-2 cursor-pointer">Sí, tengo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="colors_no" style={{ borderColor: "#D4AF37" }} />
                        <Label htmlFor="colors_no" style={{ color: "#E2E8F0" }} className="ml-2 cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="visual_style" style={{ color: "#E2E8F0" }}>
                      Describe tu estilo visual actual
                    </Label>
                    <Textarea
                      id="visual_style"
                      placeholder="Ej: moderno, minimalista, corporativo, creativo, etc."
                      value={formData.visual_style}
                      onChange={(e) => handleInputChange("visual_style", e.target.value)}
                      className="h-20"
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                    />
                  </div>
                </>
              )}

              {/* Step 5: Content & Resources */}
              {step === 5 && (
                <>
                  <div>
                    <Label htmlFor="available_content" style={{ color: "#E2E8F0" }}>
                      ¿Qué contenido tienes disponible?
                    </Label>
                    <Textarea
                      id="available_content"
                      placeholder="Ej: textos, fotos, videos, testimonios, etc."
                      value={formData.available_content}
                      onChange={(e) => handleInputChange("available_content", e.target.value)}
                      className="h-24"
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reference_websites" style={{ color: "#E2E8F0" }}>
                      Comparte referencias de sitios web que te gusten
                    </Label>
                    <Textarea
                      id="reference_websites"
                      placeholder="URL de sitios que te inspiren"
                      value={formData.reference_websites}
                      onChange={(e) => handleInputChange("reference_websites", e.target.value)}
                      className="h-24"
                      style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}
                    />
                  </div>
                </>
              )}

              {/* Step 6: Project Vision */}
              {step === 6 && (
                <div>
                  <Label htmlFor="project_description" style={{ color: "#E2E8F0" }}>
                    Describe tu visión del proyecto *
                  </Label>
                  <Textarea
                    id="project_description"
                    placeholder="Cuéntanos con detalle qué proyecto tienes en mente..."
                    value={formData.project_description}
                    onChange={(e) => handleInputChange("project_description", e.target.value)}
                    className="h-32"
                    style={{
                      backgroundColor: "rgba(33, 209, 172, 0.05)",
                      borderColor: "rgba(33, 209, 172, 0.3)",
                      color: "#E2E8F0",
                    }}
                  />
                </div>
              )}

              {/* Step 7: Timeline & Budget */}
              {step === 7 && (
                <>
                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Plazo del Proyecto *</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="¿Cuál es tu plazo?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgente">Urgente (1-2 semanas)</SelectItem>
                        <SelectItem value="pronto">Pronto (2-4 semanas)</SelectItem>
                        <SelectItem value="normal">Normal (1-2 meses)</SelectItem>
                        <SelectItem value="flexible">Flexible (sin prisa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Rango de Presupuesto *</Label>
                    <Select value={formData.budget_range} onValueChange={(value) => handleInputChange("budget_range", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="¿Cuál es tu presupuesto?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="menos_500">Menos de $500 USD</SelectItem>
                        <SelectItem value="500_1000">$500 - $1,000 USD</SelectItem>
                        <SelectItem value="1000_2500">$1,000 - $2,500 USD</SelectItem>
                        <SelectItem value="2500_5000">$2,500 - $5,000 USD</SelectItem>
                        <SelectItem value="5000_10000">$5,000 - $10,000 USD</SelectItem>
                        <SelectItem value="mas_10000">Más de $10,000 USD</SelectItem>
                        <SelectItem value="por_definir">Por definir</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Step 8: Specifics */}
              {step === 8 && (
                <>
                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Tipo de Proyecto *</Label>
                    <Select value={formData.project_type} onValueChange={(value) => handleInputChange("project_type", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="¿Qué tipo de proyecto es?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Proyecto Nuevo</SelectItem>
                        <SelectItem value="rediseño">Rediseño</SelectItem>
                        <SelectItem value="optimizacion">Optimización</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label style={{ color: "#E2E8F0" }}>Método de Contacto Preferido *</Label>
                    <Select value={formData.preferred_contact_method} onValueChange={(value) => handleInputChange("preferred_contact_method", value)}>
                      <SelectTrigger style={{
                        backgroundColor: "rgba(212, 175, 55, 0.05)",
                        borderColor: "rgba(212, 175, 55, 0.3)",
                        color: "#E2E8F0",
                      }}>
                        <SelectValue placeholder="¿Cómo prefieres que te contactemos?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="llamada">Llamada telefónica</SelectItem>
                        <SelectItem value="videollamada">Videollamada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Step 9: Additional Notes */}
              {step === 9 && (
                <div>
                  <Label htmlFor="additional_notes" style={{ color: "#E2E8F0" }}>
                    Notas Adicionales
                  </Label>
                  <Textarea
                    id="additional_notes"
                    placeholder="Comparte cualquier otra información que consideres importante..."
                    value={formData.additional_notes}
                    onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                    className="h-32"
                    style={{
                      backgroundColor: "rgba(33, 209, 172, 0.05)",
                      borderColor: "rgba(33, 209, 172, 0.3)",
                      color: "#E2E8F0",
                    }}
                  />
                </div>
              )}

              {/* Error message */}
              {submitError && (
                <div className="p-4 rounded-lg flex gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", border: "1px solid" }}>
                  <AlertCircle size={20} style={{ color: "#EF4444" }} />
                  <p style={{ color: "#FCA5A5" }}>{submitError}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
            style={{
              backgroundColor: step === 1 ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.2)",
              color: "#D4AF37",
              border: "1px solid rgba(212, 175, 55, 0.3)",
            }}
          >
            <ArrowLeft size={18} />
            Atrás
          </button>

          {step === STEPS.length ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.full_name}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              style={{
                backgroundColor: "#D4AF37",
                color: "#0F172A",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Enviar Diagnóstico
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition"
              style={{
                backgroundColor: "#D4AF37",
                color: "#0F172A",
              }}
            >
              Siguiente
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
