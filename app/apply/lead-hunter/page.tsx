"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HardHat,
  Loader2,
  PhoneCall,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n";

const LEAD_HUNTER_BACKGROUND = "/lead-hunter-cinematic-luxury-v1.jpg";

interface LeadHunterFormData {
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  city: string;
  country: string;
  project_type: string;
  main_service: string;
  main_goal: string;
  timeline: string;
  budget_range: string;
  preferred_contact_method: string;
  project_description: string;
  additional_notes: string;
}

const initialFormData: LeadHunterFormData = {
  full_name: "",
  company_name: "",
  email: "",
  whatsapp: "",
  city: "",
  country: "",
  project_type: "",
  main_service: "",
  main_goal: "",
  timeline: "",
  budget_range: "",
  preferred_contact_method: "",
  project_description: "",
  additional_notes: "",
};

export default function LeadHunterApplyPage() {
  const { locale } = useLanguage();
  const isES = locale === "es";
  const [formData, setFormData] = useState<LeadHunterFormData>(initialFormData);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [leadCode, setLeadCode] = useState("");

  const handleFieldChange = (field: keyof LeadHunterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          language: locale,
          source: "website",
          brand: "lead_hunter",
          origin_page: "/apply/lead-hunter",
          form_type: "lead_hunter_intake",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || (isES ? "No se pudo enviar tu solicitud." : "Your request could not be submitted."));
      }

      setLeadCode(data.leadCode || "");
      setFormData(initialFormData);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : isES ? "Ocurrio un error inesperado." : "An unexpected error occurred."
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1420] text-[#E7ECF5]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-center bg-cover opacity-[0.22]"
          style={{
            backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,20,32,0.82) 0%, rgba(11,20,32,0.66) 20%, rgba(11,20,32,0.72) 48%, rgba(11,20,32,0.88) 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.36]"
          style={{
            background:
              "radial-gradient(circle at 20% 18%, rgba(201,111,45,0.24), transparent 28%), radial-gradient(circle at 82% 14%, rgba(225,162,74,0.2), transparent 24%), radial-gradient(circle at 54% 44%, rgba(159,178,204,0.12), transparent 30%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr]">
          <section className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#9FB2CC] hover:text-white">
              <HardHat className="h-4 w-4 text-[#E1A24A]" />
              Lead Hunter by HEBELING OS
            </Link>

            <div
              className="relative overflow-hidden rounded-3xl border border-[#C96F2D]/18 p-6 md:p-7"
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,27,45,0.94) 0%, rgba(22,34,53,0.86) 52%, rgba(201,111,45,0.12) 100%)",
                boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-[0.24]"
                style={{
                  backgroundImage: `url('${LEAD_HUNTER_BACKGROUND}')`,
                }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(11,20,32,0.94) 0%, rgba(11,20,32,0.82) 35%, rgba(11,20,32,0.48) 100%)",
                }}
              />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E1A24A]/20 bg-[#E1A24A]/10 px-3 py-1 text-xs font-medium text-[#F7D7AF]">
                  <Target className="h-3.5 w-3.5" />
                  {isES ? "Intake de leads para construccion" : "Construction Lead Intake"}
                </div>
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
                  {isES
                    ? "Captura oportunidades de construccion con una entrada clara y seria."
                    : "Capture construction opportunities with a clear and serious intake flow."}
                </h1>
                <p className="max-w-xl text-base leading-8 text-[#9FB2CC]">
                  {isES
                    ? "Este formulario abre el primer circuito real de Lead Hunter dentro de HEBELING OS. La informacion entra al CRM, se clasifica, y prepara el handoff para seguimiento humano o coordinacion con ANNA."
                    : "This form opens the first real Lead Hunter circuit inside HEBELING OS. The information enters the CRM, is classified, and prepares the handoff for human follow-up or coordination with ANNA."}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                isES ? "Captura datos clave de la oportunidad" : "Capture key opportunity data",
                isES ? "Clasifica intencion, alcance y urgencia" : "Classify intent, scope, and urgency",
                isES ? "Registra el lead dentro del CRM central" : "Register the lead inside the central CRM",
                isES ? "Prepara seguimiento por llamada o WhatsApp" : "Prepare follow-up by phone call or WhatsApp",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#1E3048] bg-[#162235]/75 px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E1A24A]" />
                  <p className="text-sm leading-6 text-[#D6DEEA]">{item}</p>
                </div>
              ))}
            </div>

            <Card className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5] backdrop-blur-[2px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhoneCall className="h-4 w-4 text-[#E1A24A]" />
                  {isES ? "Enfoque inicial" : "Initial focus"}
                </CardTitle>
                <CardDescription className="text-[#9FB2CC]">
                  {isES
                    ? "Esta primera version prioriza intake, calificacion y visibilidad operativa sobre automatizacion avanzada."
                    : "This first version prioritizes intake, qualification, and operational visibility over advanced automation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6 text-[#D6DEEA]">
                <p>
                  {isES
                    ? "Si la oportunidad es clara y completa, el equipo puede moverla rapidamente a llamada, reunion o seguimiento comercial."
                    : "If the opportunity is clear and complete, the team can quickly move it to a call, meeting, or commercial follow-up."}
                </p>
                <p>
                  {isES
                    ? "Si la solicitud es ambigua, el CRM conserva suficiente contexto para que ANNA o una persona continuen sin perder informacion."
                    : "If the request is ambiguous, the CRM preserves enough context for ANNA or a person to continue without losing information."}
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-[#1E3048] bg-[#162235]/88 text-[#E7ECF5] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
              <CardHeader>
                <CardTitle>{isES ? "Intake de Lead Hunter" : "Lead Hunter Intake"}</CardTitle>
                <CardDescription className="text-[#9FB2CC]">
                  {isES
                    ? "Completa la informacion esencial para abrir una oportunidad de construccion."
                    : "Complete the essential information to open a construction opportunity."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status === "success" ? (
                  <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-emerald-100">
                          {isES ? "Solicitud registrada" : "Request registered"}
                        </p>
                        <p className="text-sm text-emerald-200/80">
                          {isES
                            ? "El lead ya entro al CRM y quedo listo para seguimiento."
                            : "The lead has already entered the CRM and is ready for follow-up."}
                        </p>
                      </div>
                    </div>
                    {leadCode && (
                      <div className="rounded-xl border border-emerald-400/20 bg-[#0F1B2D]/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-emerald-200/70">
                          {isES ? "Codigo del lead" : "Lead code"}
                        </p>
                        <p className="mt-1 font-mono text-lg text-white">{leadCode}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95">
                        <Link href="/app/crm">{isES ? "Abrir CRM" : "Open CRM"}</Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#E7ECF5] hover:bg-[#0F1B2D]"
                        onClick={() => setStatus("idle")}
                      >
                        {isES ? "Registrar otro lead" : "Register another lead"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">{isES ? "Nombre completo *" : "Full name *"}</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleFieldChange("full_name", e.target.value)}
                          className="border-[#1E3048] bg-[#0F1B2D]/70"
                          placeholder={isES ? "Nombre del contacto" : "Contact name"}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company_name">{isES ? "Empresa" : "Company"}</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => handleFieldChange("company_name", e.target.value)}
                          className="border-[#1E3048] bg-[#0F1B2D]/70"
                          placeholder={isES ? "Nombre de la empresa o marca" : "Company or brand name"}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          className="border-[#1E3048] bg-[#0F1B2D]/70"
                          placeholder={isES ? "contacto@empresa.com" : "contact@company.com"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
                          className="border-[#1E3048] bg-[#0F1B2D]/70"
                          placeholder="+1 234 567 8900"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">{isES ? "Ciudad" : "City"}</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleFieldChange("city", e.target.value)}
                          className="border-[#1E3048] bg-[#0F1B2D]/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{isES ? "Pais" : "Country"}</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => handleFieldChange("country", e.target.value)}
                          className="border-[#1E3048] bg-[#0F1B2D]/70"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{isES ? "Tipo de proyecto *" : "Project type *"}</Label>
                        <Select value={formData.project_type} onValueChange={(value) => handleFieldChange("project_type", value)}>
                          <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70">
                            <SelectValue placeholder={isES ? "Selecciona el tipo de proyecto" : "Select the project type"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential_build">{isES ? "Construccion residencial" : "Residential construction"}</SelectItem>
                            <SelectItem value="commercial_build">{isES ? "Construccion comercial" : "Commercial construction"}</SelectItem>
                            <SelectItem value="remodeling">{isES ? "Remodelacion" : "Remodeling"}</SelectItem>
                            <SelectItem value="renovation">{isES ? "Renovacion" : "Renovation"}</SelectItem>
                            <SelectItem value="general_contracting">General contracting</SelectItem>
                            <SelectItem value="other">{isES ? "Otro" : "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{isES ? "Enfoque principal *" : "Primary focus *"}</Label>
                        <Select value={formData.main_service} onValueChange={(value) => handleFieldChange("main_service", value)}>
                          <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70">
                            <SelectValue placeholder={isES ? "Que tipo de oportunidad buscas?" : "What type of opportunity are you looking for?"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential_construction">{isES ? "Construccion residencial" : "Residential construction"}</SelectItem>
                            <SelectItem value="commercial_construction">{isES ? "Construccion comercial" : "Commercial construction"}</SelectItem>
                            <SelectItem value="remodeling_renovation">{isES ? "Remodelacion y renovacion" : "Remodeling and renovation"}</SelectItem>
                            <SelectItem value="general_contracting">General contracting</SelectItem>
                            <SelectItem value="specialty_trade">{isES ? "Especialidad o subcontracting" : "Specialty trade or subcontracting"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{isES ? "Objetivo *" : "Goal *"}</Label>
                      <Select value={formData.main_goal} onValueChange={(value) => handleFieldChange("main_goal", value)}>
                        <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70">
                          <SelectValue placeholder={isES ? "Que resultado quieres lograr?" : "What result do you want to achieve?"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fill_pipeline">{isES ? "Llenar pipeline de oportunidades" : "Fill the opportunity pipeline"}</SelectItem>
                          <SelectItem value="book_estimates">{isES ? "Agendar estimaciones o visitas" : "Book estimates or visits"}</SelectItem>
                          <SelectItem value="find_high_value_projects">{isES ? "Captar proyectos de mayor valor" : "Capture higher-value projects"}</SelectItem>
                          <SelectItem value="expand_new_market">{isES ? "Expandirse a otra zona o mercado" : "Expand into a new area or market"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Timeline</Label>
                        <Select value={formData.timeline} onValueChange={(value) => handleFieldChange("timeline", value)}>
                          <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70">
                            <SelectValue placeholder={isES ? "Selecciona" : "Select"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgente">{isES ? "Urgente" : "Urgent"}</SelectItem>
                            <SelectItem value="pronto">{isES ? "Pronto" : "Soon"}</SelectItem>
                            <SelectItem value="normal">{isES ? "Normal" : "Normal"}</SelectItem>
                            <SelectItem value="flexible">{isES ? "Flexible" : "Flexible"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{isES ? "Presupuesto" : "Budget"}</Label>
                        <Select value={formData.budget_range} onValueChange={(value) => handleFieldChange("budget_range", value)}>
                          <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70">
                            <SelectValue placeholder={isES ? "Selecciona" : "Select"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="menos_500">{isES ? "Menos de $500 USD" : "Less than $500 USD"}</SelectItem>
                            <SelectItem value="500_1000">$500 - $1,000 USD</SelectItem>
                            <SelectItem value="1000_2500">$1,000 - $2,500 USD</SelectItem>
                            <SelectItem value="2500_5000">$2,500 - $5,000 USD</SelectItem>
                            <SelectItem value="5000_10000">$5,000 - $10,000 USD</SelectItem>
                            <SelectItem value="mas_10000">{isES ? "Mas de $10,000 USD" : "More than $10,000 USD"}</SelectItem>
                            <SelectItem value="por_definir">{isES ? "Por definir" : "To be defined"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{isES ? "Contacto preferido" : "Preferred contact"}</Label>
                        <Select value={formData.preferred_contact_method} onValueChange={(value) => handleFieldChange("preferred_contact_method", value)}>
                          <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70">
                            <SelectValue placeholder={isES ? "Selecciona" : "Select"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="llamada">{isES ? "Llamada" : "Call"}</SelectItem>
                            <SelectItem value="videollamada">{isES ? "Videollamada" : "Video call"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project_description">
                        {isES ? "Describe la oportunidad *" : "Describe the opportunity *"}
                      </Label>
                      <Textarea
                        id="project_description"
                        value={formData.project_description}
                        onChange={(e) => handleFieldChange("project_description", e.target.value)}
                        className="min-h-[140px] border-[#1E3048] bg-[#0F1B2D]/70"
                        placeholder={
                          isES
                            ? "Cuentanos que tipo de proyecto, servicio o cliente estas buscando."
                            : "Tell us what kind of project, service, or client you are looking for."
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additional_notes">{isES ? "Notas adicionales" : "Additional notes"}</Label>
                      <Textarea
                        id="additional_notes"
                        value={formData.additional_notes}
                        onChange={(e) => handleFieldChange("additional_notes", e.target.value)}
                        className="min-h-[96px] border-[#1E3048] bg-[#0F1B2D]/70"
                        placeholder={
                          isES
                            ? "Contexto extra, zonas de interes, ticket promedio o cualquier detalle util."
                            : "Extra context, target areas, average ticket, or any useful detail."
                        }
                      />
                    </div>

                    {status === "error" && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {errorMessage}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-6 text-[#9FB2CC]">
                        {isES ? (
                          <>
                            Al enviar este formulario, la oportunidad entra al CRM de HEBELING OS como lead de <strong className="text-[#E7ECF5]">Lead Hunter</strong>.
                          </>
                        ) : (
                          <>
                            When you submit this form, the opportunity enters the HEBELING OS CRM as a <strong className="text-[#E7ECF5]">Lead Hunter</strong> lead.
                          </>
                        )}
                      </p>
                      <Button
                        type="submit"
                        disabled={
                          status === "loading" ||
                          !formData.full_name ||
                          !formData.whatsapp ||
                          !formData.project_type ||
                          !formData.main_service ||
                          !formData.main_goal ||
                          !formData.project_description
                        }
                        className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isES ? "Enviando" : "Sending"}
                          </>
                        ) : (
                          <>
                            {isES ? "Abrir oportunidad" : "Open opportunity"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
