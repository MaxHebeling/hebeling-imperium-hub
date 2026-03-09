"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
// Configuracion de marcas disponibles
const BRAND_CONFIG: Record<string, { name: string; logo: string; color: string }> = {
  ikingdom: { name: "iKingdom", logo: "/logo-ikingdom.png", color: "amber" },
  editorialreino: { name: "Editorial Reino", logo: "/logo-editorialreino.png", color: "sky" },
  imperium: { name: "Imperium Group", logo: "/logo-imperium.png", color: "slate" },
  maxhebeling: { name: "Max Hebeling", logo: "/logo-maxhebeling.png", color: "orange" },
};

interface FormData {
  // Basic info
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  
  // Project details
  project_description: string;
  organization_type: string;
  website_url?: string;
  social_links: string;
  main_goal: string;
  expected_result: string;
  main_service: string;
  ideal_client: string;
  
  // Branding
  has_logo: string;
  has_brand_colors: string;
  visual_style: string;
  available_content: string;
  reference_websites: string;
  has_current_landing: string;
  
  // Project scope
  project_type: string;
  budget_range: string;
  timeline: string;
  preferred_contact_method: string;
  additional_notes: string;
}

const initialFormData: FormData = {
  full_name: "",
  company_name: "",
  email: "",
  whatsapp: "",
  country: "",
  city: "",
  project_description: "",
  organization_type: "",
  website_url: "",
  social_links: "",
  main_goal: "",
  expected_result: "",
  main_service: "",
  ideal_client: "",
  has_logo: "",
  has_brand_colors: "",
  visual_style: "",
  available_content: "",
  reference_websites: "",
  has_current_landing: "",
  project_type: "",
  budget_range: "",
  timeline: "",
  preferred_contact_method: "",
  additional_notes: "",
};

const STEPS = [
  { id: 1, title: "Informacion Basica", description: "Datos de contacto" },
  { id: 2, title: "Tu Proyecto", description: "Detalles del negocio" },
  { id: 3, title: "Branding", description: "Identidad visual" },
  { id: 4, title: "Alcance", description: "Presupuesto y tiempos" },
];

function ApplyPageContent() {
  const searchParams = useSearchParams();
  const brandParam = searchParams.get("brand") || "ikingdom";
  const brand = BRAND_CONFIG[brandParam] ? brandParam : "ikingdom";
  const brandConfig = BRAND_CONFIG[brand];
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [leadCode, setLeadCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          has_logo: formData.has_logo === "yes",
          has_brand_colors: formData.has_brand_colors === "yes",
          has_current_landing: formData.has_current_landing === "yes",
          source: "website",
          brand: brand,
          origin_page: `/apply?brand=${brand}`,
          form_type: "full_application",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application");
      }

      setLeadCode(data.leadCode || "");
      setStatus("success");
      setFormData(initialFormData);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.full_name && formData.email && formData.whatsapp;
    }
    if (currentStep === 2) {
      return formData.main_goal && formData.main_service;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={brandConfig.logo}
            alt={brandConfig.name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-xl font-semibold">{brandConfig.name}</span>
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="sm">Staff Login</Button>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {status === "success" ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Aplicacion Enviada</h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Gracias por tu interes en {brandConfig.name}. Hemos recibido tu aplicacion y nos pondremos en contacto contigo pronto.
                </p>
                {leadCode && (
                  <div className="bg-muted/50 rounded-lg px-6 py-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Tu codigo de referencia:</p>
                    <p className="text-xl font-mono font-semibold">{leadCode}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <Link href="/">
                    <Button variant="outline">Volver al inicio</Button>
                  </Link>
                  <Button onClick={() => { setStatus("idle"); setCurrentStep(1); }}>
                    Nueva aplicacion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Crown className="h-4 w-4" />
                Aplica para trabajar con nosotros
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">
                Formulario de Aplicacion {brandConfig.name}
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Cuentanos sobre tu proyecto y objetivos. Esta informacion nos ayudara a entender mejor tus necesidades.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-between mb-8 relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
              {STEPS.map((step) => (
                <div 
                  key={step.id} 
                  className={`flex flex-col items-center ${step.id <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${
                      step.id < currentStep 
                        ? "bg-primary text-primary-foreground" 
                        : step.id === currentStep 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{step.description}</span>
                </div>
              ))}
            </div>

            {/* Form Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmit} noValidate>
                                  {status === "error" && (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 mb-6">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Step 1: Basic Info */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Nombre completo *</Label>
                          <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Tu nombre completo"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Empresa / Marca</Label>
                          <Input
                            id="company_name"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            placeholder="Nombre de tu empresa"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp *</Label>
                          <Input
                            id="whatsapp"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            placeholder="+52 55 1234 5678"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Pais</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Mexico"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ciudad</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Ciudad de Mexico"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Project Details */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization_type">Tipo de organizacion</Label>
                        <Select 
                          value={formData.organization_type} 
                          onValueChange={(v) => handleSelectChange("organization_type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opcion" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="empresa">Empresa</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="freelancer">Freelancer / Consultor</SelectItem>
                            <SelectItem value="agencia">Agencia</SelectItem>
                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                            <SelectItem value="saas">SaaS</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project_description">Descripcion del proyecto</Label>
                        <Textarea
                          id="project_description"
                          name="project_description"
                          value={formData.project_description}
                          onChange={handleChange}
                          placeholder="Cuentanos brevemente sobre tu proyecto..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website_url">Sitio web actual</Label>
                          <Input
                            id="website_url"
                            name="website_url"
                            value={formData.website_url}
                            onChange={handleChange}
                            placeholder="https://tusitio.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_links">Redes sociales</Label>
                          <Input
                            id="social_links"
                            name="social_links"
                            value={formData.social_links}
                            onChange={handleChange}
                            placeholder="@tuinstagram, linkedin.com/in/tu"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="main_goal">Objetivo principal *</Label>
                        <Select 
                          value={formData.main_goal} 
                          onValueChange={(v) => handleSelectChange("main_goal", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Cual es tu objetivo principal?" />
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

                      <div className="space-y-2">
                        <Label htmlFor="expected_result">Resultado esperado</Label>
                        <Textarea
                          id="expected_result"
                          name="expected_result"
                          value={formData.expected_result}
                          onChange={handleChange}
                          placeholder="Que resultado esperas obtener con este proyecto?"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="main_service">Servicio principal de interes *</Label>
                        <Select 
                          value={formData.main_service} 
                          onValueChange={(v) => handleSelectChange("main_service", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Que servicio te interesa?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="landing_page">Landing Page</SelectItem>
                            <SelectItem value="sitio_web">Sitio Web Completo</SelectItem>
                            <SelectItem value="ecommerce">E-commerce / Tienda Online</SelectItem>
                            <SelectItem value="funnel">Funnel de Ventas</SelectItem>
                            <SelectItem value="branding">Branding / Identidad</SelectItem>
                            <SelectItem value="sistema_web">Sistema Web / App</SelectItem>
                            <SelectItem value="consultoria">Consultoria Digital</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ideal_client">Cliente ideal</Label>
                        <Textarea
                          id="ideal_client"
                          name="ideal_client"
                          value={formData.ideal_client}
                          onChange={handleChange}
                          placeholder="Describe a tu cliente ideal..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Branding */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label>Tienes logo?</Label>
                        <RadioGroup 
                          value={formData.has_logo} 
                          onValueChange={(v) => handleSelectChange("has_logo", v)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="logo_yes" />
                            <Label htmlFor="logo_yes" className="font-normal">Si</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="logo_no" />
                            <Label htmlFor="logo_no" className="font-normal">No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label>Tienes colores de marca definidos?</Label>
                        <RadioGroup 
                          value={formData.has_brand_colors} 
                          onValueChange={(v) => handleSelectChange("has_brand_colors", v)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="colors_yes" />
                            <Label htmlFor="colors_yes" className="font-normal">Si</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="colors_no" />
                            <Label htmlFor="colors_no" className="font-normal">No</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="visual_style">Estilo visual preferido</Label>
                        <Select 
                          value={formData.visual_style} 
                          onValueChange={(v) => handleSelectChange("visual_style", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Que estilo te atrae mas?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimalista">Minimalista / Clean</SelectItem>
                            <SelectItem value="moderno">Moderno / Tech</SelectItem>
                            <SelectItem value="elegante">Elegante / Premium</SelectItem>
                            <SelectItem value="colorido">Colorido / Vibrante</SelectItem>
                            <SelectItem value="corporativo">Corporativo / Profesional</SelectItem>
                            <SelectItem value="creativo">Creativo / Artistico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="available_content">Contenido disponible</Label>
                        <Textarea
                          id="available_content"
                          name="available_content"
                          value={formData.available_content}
                          onChange={handleChange}
                          placeholder="Que contenido tienes listo? (fotos, textos, videos, testimonios...)"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reference_websites">Sitios de referencia</Label>
                        <Textarea
                          id="reference_websites"
                          name="reference_websites"
                          value={formData.reference_websites}
                          onChange={handleChange}
                          placeholder="Sitios web que te gustan o sirven de inspiracion..."
                          rows={2}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Tienes landing page actualmente?</Label>
                        <RadioGroup 
                          value={formData.has_current_landing} 
                          onValueChange={(v) => handleSelectChange("has_current_landing", v)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="landing_yes" />
                            <Label htmlFor="landing_yes" className="font-normal">Si</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="landing_no" />
                            <Label htmlFor="landing_no" className="font-normal">No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Scope */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project_type">Tipo de proyecto</Label>
                        <Select 
                          value={formData.project_type} 
                          onValueChange={(v) => handleSelectChange("project_type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevo">Proyecto nuevo desde cero</SelectItem>
                            <SelectItem value="rediseno">Rediseno de sitio existente</SelectItem>
                            <SelectItem value="mejora">Mejora / Actualizacion</SelectItem>
                            <SelectItem value="mantenimiento">Mantenimiento continuo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget_range">Rango de presupuesto</Label>
                        <Select 
                          value={formData.budget_range} 
                          onValueChange={(v) => handleSelectChange("budget_range", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Cual es tu presupuesto aproximado?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="menos_500">Menos de $500 USD</SelectItem>
                            <SelectItem value="500_1000">$500 _ $1,000 USD</SelectItem>
                            <SelectItem value="1000_2500">$1,000 _ $2,500 USD</SelectItem>
                            <SelectItem value="2500_5000">$2,500 _ $5,000 USD</SelectItem>
                            <SelectItem value="5000_10000">$5,000 _ $10,000 USD</SelectItem>
                            <SelectItem value="mas_10000">Mas de $10,000 USD</SelectItem>
                            <SelectItem value="por_definir">Por definir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeline">Timeline deseado</Label>
                        <Select 
                          value={formData.timeline} 
                          onValueChange={(v) => handleSelectChange("timeline", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Para cuando lo necesitas?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgente">Urgente (1-2 semanas)</SelectItem>
                            <SelectItem value="pronto">Pronto (2-4 semanas)</SelectItem>
                            <SelectItem value="normal">Normal (1-2 meses)</SelectItem>
                            <SelectItem value="flexible">Flexible (sin prisa)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferred_contact_method">Metodo de contacto preferido</Label>
                        <Select 
                          value={formData.preferred_contact_method} 
                          onValueChange={(v) => handleSelectChange("preferred_contact_method", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Como prefieres que te contactemos?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="llamada">Llamada telefonica</SelectItem>
                            <SelectItem value="videollamada">Videollamada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="additional_notes">Notas adicionales</Label>
                        <Textarea
                          id="additional_notes"
                          name="additional_notes"
                          value={formData.additional_notes}
                          onChange={handleChange}
                          placeholder="Algo mas que quieras agregar..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>

                    {currentStep < 4 ? (
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        disabled={!canProceed()}
                      >
                        Siguiente
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={status === "loading"}
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar Aplicacion"
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>iKingdom by Hebeling Imperium Group</p>
      </footer>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyPageContent />
    </Suspense>
  );
}
