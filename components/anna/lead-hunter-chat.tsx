"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  HardHat,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n";

type QuestionType = "text" | "email" | "phone" | "textarea" | "choice";

interface QuestionChoice {
  label: string;
  value: string;
}

interface ChatQuestion {
  id:
    | "full_name"
    | "company_name"
    | "whatsapp"
    | "email"
    | "project_type"
    | "main_service"
    | "main_goal"
    | "city"
    | "country"
    | "timeline"
    | "budget_range"
    | "project_description";
  label: string;
  prompt: string;
  placeholder?: string;
  type: QuestionType;
  required?: boolean;
  choices?: QuestionChoice[];
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
}

type AnswerMap = Partial<Record<ChatQuestion["id"], string>>;

function getQuestions(locale: "es" | "en"): ChatQuestion[] {
  const isES = locale === "es";

  return [
    {
      id: "full_name",
      label: isES ? "Nombre completo" : "Full name",
      prompt: isES ? "Empecemos por lo básico. ¿Cómo te llamas?" : "Let’s start with the basics. What is your name?",
      placeholder: isES ? "Tu nombre" : "Your name",
      type: "text",
      required: true,
    },
    {
      id: "company_name",
      label: isES ? "Empresa" : "Company",
      prompt: isES
        ? "¿Qué empresa, marca o despacho representa esta oportunidad?"
        : "What company, brand, or office represents this opportunity?",
      placeholder: isES ? "Nombre de la empresa" : "Company name",
      type: "text",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      prompt: isES
        ? "Necesito un WhatsApp para que el equipo pueda hacer handoff rápido. ¿Cuál es?"
        : "I need a WhatsApp number so the team can hand off quickly. What is it?",
      placeholder: "+1 234 567 8900",
      type: "phone",
      required: true,
    },
    {
      id: "email",
      label: "Email",
      prompt: isES
        ? "Si quieres, déjame también tu email. Si prefieres omitirlo, lo puedes saltar."
        : "If you want, leave your email too. If you prefer to skip it, you can.",
      placeholder: isES ? "contacto@empresa.com" : "contact@company.com",
      type: "email",
    },
    {
      id: "project_type",
      label: isES ? "Tipo de proyecto" : "Project type",
      prompt: isES ? "¿Qué tipo de proyecto o lead estás buscando?" : "What type of project or lead are you looking for?",
      type: "choice",
      required: true,
      choices: [
        { label: isES ? "Construcción residencial" : "Residential construction", value: "residential_build" },
        { label: isES ? "Construcción comercial" : "Commercial construction", value: "commercial_build" },
        { label: isES ? "Remodelación" : "Remodeling", value: "remodeling" },
        { label: isES ? "Renovación" : "Renovation", value: "renovation" },
        { label: "General contracting", value: "general_contracting" },
        { label: isES ? "Otro" : "Other", value: "other" },
      ],
    },
    {
      id: "main_service",
      label: isES ? "Enfoque principal" : "Primary focus",
      prompt: isES ? "¿Cuál es el enfoque principal de esta oportunidad?" : "What is the main focus of this opportunity?",
      type: "choice",
      required: true,
      choices: [
        { label: isES ? "Construcción residencial" : "Residential construction", value: "residential_construction" },
        { label: isES ? "Construcción comercial" : "Commercial construction", value: "commercial_construction" },
        { label: isES ? "Remodelación y renovación" : "Remodeling and renovation", value: "remodeling_renovation" },
        { label: "General contracting", value: "general_contracting" },
        { label: isES ? "Especialidad o subcontracting" : "Specialty trade or subcontracting", value: "specialty_trade" },
      ],
    },
    {
      id: "main_goal",
      label: isES ? "Objetivo" : "Goal",
      prompt: isES ? "¿Qué resultado quieres lograr con esta oportunidad?" : "What result do you want to achieve with this opportunity?",
      type: "choice",
      required: true,
      choices: [
        { label: isES ? "Llenar pipeline de oportunidades" : "Fill the opportunity pipeline", value: "fill_pipeline" },
        { label: isES ? "Agendar estimaciones o visitas" : "Book estimates or visits", value: "book_estimates" },
        { label: isES ? "Captar proyectos de mayor valor" : "Capture higher-value projects", value: "find_high_value_projects" },
        { label: isES ? "Expandirse a una nueva zona o mercado" : "Expand into a new area or market", value: "expand_new_market" },
      ],
    },
    {
      id: "city",
      label: isES ? "Ciudad" : "City",
      prompt: isES ? "¿En qué ciudad se mueve principalmente esta oportunidad?" : "In which city does this opportunity mainly operate?",
      placeholder: isES ? "Ciudad" : "City",
      type: "text",
    },
    {
      id: "country",
      label: isES ? "País" : "Country",
      prompt: isES ? "¿Y en qué país?" : "And in which country?",
      placeholder: isES ? "País" : "Country",
      type: "text",
    },
    {
      id: "timeline",
      label: "Timeline",
      prompt: isES ? "¿Qué urgencia tiene esto?" : "How urgent is this?",
      type: "choice",
      choices: [
        { label: isES ? "Urgente" : "Urgent", value: "urgente" },
        { label: isES ? "Pronto" : "Soon", value: "pronto" },
        { label: isES ? "Normal" : "Normal", value: "normal" },
        { label: isES ? "Flexible" : "Flexible", value: "flexible" },
      ],
    },
    {
      id: "budget_range",
      label: isES ? "Presupuesto" : "Budget",
      prompt: isES ? "¿Qué rango de presupuesto ves para esta oportunidad?" : "What budget range do you see for this opportunity?",
      type: "choice",
      choices: [
        { label: isES ? "Menos de $500 USD" : "Less than $500 USD", value: "menos_500" },
        { label: "$500 - $1,000 USD", value: "500_1000" },
        { label: "$1,000 - $2,500 USD", value: "1000_2500" },
        { label: "$2,500 - $5,000 USD", value: "2500_5000" },
        { label: "$5,000 - $10,000 USD", value: "5000_10000" },
        { label: isES ? "Más de $10,000 USD" : "More than $10,000 USD", value: "mas_10000" },
        { label: isES ? "Por definir" : "To be defined", value: "por_definir" },
      ],
    },
    {
      id: "project_description",
      label: isES ? "Descripción" : "Description",
      prompt: isES
        ? "Perfecto. Ahora cuéntame brevemente qué oportunidad, proyecto o lead quieres abrir."
        : "Perfect. Now tell me briefly what opportunity, project, or lead you want to open.",
      placeholder: isES
        ? "Describe el contexto, el servicio o el tipo de cliente que estás buscando."
        : "Describe the context, service, or type of client you are looking for.",
      type: "textarea",
      required: true,
    },
  ];
}

function getChoiceLabel(question: ChatQuestion, value: string | undefined, locale: "es" | "en"): string {
  if (!value) return locale === "es" ? "No especificado" : "Not specified";
  return question.choices?.find((choice) => choice.value === value)?.label || value;
}

function buildSummary(answers: AnswerMap, questions: ChatQuestion[], locale: "es" | "en"): string {
  return questions.map((question) => {
    const answer = answers[question.id];
    if (!answer) return `${question.label}: ${locale === "es" ? "No especificado" : "Not specified"}`;
    if (question.type === "choice") {
      return `${question.label}: ${getChoiceLabel(question, answer, locale)}`;
    }
    return `${question.label}: ${answer}`;
  }).join("\n");
}

function inferPriority(timeline?: string): "low" | "medium" | "high" {
  if (timeline === "urgente" || timeline === "pronto") return "high";
  if (timeline === "normal") return "medium";
  return "low";
}

function initialMessages(locale: "es" | "en", questions: ChatQuestion[]): ChatMessage[] {
  return [
    {
      id: "intro-1",
      role: "assistant",
      content:
        locale === "es"
          ? "Soy ANNA. Voy a ayudarte a abrir una oportunidad de Lead Hunter dentro de HEBELING OS."
          : "I am ANNA. I am going to help you open a Lead Hunter opportunity inside HEBELING OS.",
    },
    {
      id: "intro-2",
      role: "assistant",
      content:
        locale === "es"
          ? "Te haré unas preguntas cortas para calificar el lead y dejarlo listo para seguimiento humano."
          : "I will ask you a few short questions to qualify the lead and leave it ready for human follow-up.",
    },
    {
      id: "question-0",
      role: "assistant",
      content: questions[0].prompt,
    },
  ];
}

function nextMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LeadHunterChat({
  inline = true,
  floating = true,
}: {
  inline?: boolean;
  floating?: boolean;
}) {
  const { locale } = useLanguage();
  const questions = useMemo(() => getQuestions(locale), [locale]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages(locale, questions));
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [leadCode, setLeadCode] = useState("");
  const [completed, setCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = questions[currentStep];
  const completionRatio = useMemo(() => {
    if (completed) return 100;
    return Math.round((currentStep / questions.length) * 100);
  }, [completed, currentStep, questions.length]);

  useEffect(() => {
    setMessages(initialMessages(locale, questions));
    setAnswers({});
    setCurrentStep(0);
    setInputValue("");
    setIsSubmitting(false);
    setSubmissionError("");
    setLeadCode("");
    setCompleted(false);
  }, [locale, questions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const resetConversation = () => {
    setMessages(initialMessages(locale, questions));
    setAnswers({});
    setCurrentStep(0);
    setInputValue("");
    setIsSubmitting(false);
    setSubmissionError("");
    setLeadCode("");
    setCompleted(false);
  };

  const appendAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextMessageId(),
        role: "assistant",
        content,
      },
    ]);
  };

  const submitLead = async (collectedAnswers: AnswerMap) => {
    setIsSubmitting(true);
    setSubmissionError("");
    appendAssistantMessage(
      locale === "es"
        ? "Estoy estructurando la oportunidad y enviándola al CRM de Lead Hunter."
        : "I am structuring the opportunity and sending it to the Lead Hunter CRM."
    );

    try {
      const response = await fetch("/api/anna/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "web_chat",
          language: locale,
          brand: "lead_hunter",
          source: "anna_web_chat",
          origin_page: "/apply/lead-hunter",
          form_type: "anna_lead_hunter_chat",
          message: collectedAnswers.project_description,
          conversation_summary: buildSummary(collectedAnswers, questions, locale),
          contact: {
            full_name: collectedAnswers.full_name,
            company_name: collectedAnswers.company_name,
            email: collectedAnswers.email,
            whatsapp: collectedAnswers.whatsapp,
            city: collectedAnswers.city,
            country: collectedAnswers.country,
            preferred_contact_method: collectedAnswers.whatsapp ? "whatsapp" : "email",
          },
          qualification: {
            project_type: collectedAnswers.project_type,
            main_service: collectedAnswers.main_service,
            main_goal: collectedAnswers.main_goal,
            budget_range: collectedAnswers.budget_range,
            timeline: collectedAnswers.timeline,
            priority: inferPriority(collectedAnswers.timeline),
          },
          metadata: {
            assistant: "ANNA",
            flow: "lead_hunter_guided_chat",
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || (locale === "es" ? "No se pudo registrar la oportunidad." : "The opportunity could not be registered."));
      }

      setLeadCode(payload.leadCode || "");
      setCompleted(true);
      appendAssistantMessage(
        payload.action === "updated"
          ? locale === "es"
            ? `Actualicé una oportunidad existente en el CRM. Código de referencia: ${payload.leadCode}.`
            : `I updated an existing opportunity in the CRM. Reference code: ${payload.leadCode}.`
          : locale === "es"
            ? `La oportunidad ya quedó abierta en el CRM. Código de referencia: ${payload.leadCode}.`
            : `The opportunity has already been opened in the CRM. Reference code: ${payload.leadCode}.`
      );
      appendAssistantMessage(
        locale === "es"
          ? "El equipo puede tomar este lead desde Lead Hunter y continuar el seguimiento sin perder contexto."
          : "The team can take this lead from Lead Hunter and continue the follow-up without losing context."
      );
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? locale === "es"
            ? `Tuve un problema al registrar el lead: ${error.message}`
            : `I had a problem registering the lead: ${error.message}`
          : locale === "es"
            ? "Tuve un problema inesperado al registrar el lead."
            : "I had an unexpected problem registering the lead.";
      setSubmissionError(message);
      appendAssistantMessage(
        message
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = async (value: string, displayValue?: string) => {
    if (!currentQuestion || isSubmitting) return;
    const normalizedValue = value.trim();

    if (!normalizedValue && currentQuestion.required) {
      return;
    }

    const fallbackAnswer = locale === "es" ? "Prefiero omitirlo por ahora" : "I prefer to skip this for now";
    const answerLabel = displayValue || normalizedValue || fallbackAnswer;

    setMessages((prev) => [
      ...prev,
      {
        id: nextMessageId(),
        role: "user",
        content: answerLabel,
      },
    ]);

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: normalizedValue,
    };
    setAnswers(updatedAnswers);
    setInputValue("");

    const nextStep = currentStep + 1;
    if (nextStep >= questions.length) {
      const success = await submitLead(updatedAnswers);
      if (success) {
        setCurrentStep(nextStep);
      }
      return;
    }

    setCurrentStep(nextStep);
    appendAssistantMessage(questions[nextStep].prompt);
  };

  const renderComposer = () => {
    if (completed) {
      return (
        <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <Sparkles className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-100">
                {locale === "es" ? "Oportunidad registrada" : "Opportunity registered"}
              </p>
              <p className="mt-1 text-xs leading-6 text-emerald-200/80">
                {leadCode
                  ? locale === "es"
                    ? `Código generado: ${leadCode}`
                    : `Generated code: ${leadCode}`
                  : locale === "es"
                    ? "La conversación quedó guardada y lista para seguimiento."
                    : "The conversation was saved and is ready for follow-up."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={resetConversation}
              className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {locale === "es" ? "Abrir otra oportunidad" : "Open another opportunity"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/apply/lead-hunter">
                {locale === "es" ? "Ver formulario completo" : "View full form"}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-100">
            {submissionError || (locale === "es" ? "No pude cerrar el registro del lead." : "I could not complete the lead registration.")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => submitLead(answers)}
              disabled={isSubmitting}
              className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {locale === "es" ? "Reintentar envío" : "Retry submission"}
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={resetConversation}>
              {locale === "es" ? "Reiniciar conversación" : "Restart conversation"}
            </Button>
          </div>
        </div>
      );
    }

    if (currentQuestion.type === "choice") {
      return (
        <div className="space-y-3">
          <div className="grid gap-2">
            {currentQuestion.choices?.map((choice) => (
              <Button
                key={choice.value}
                type="button"
                variant="outline"
                className="justify-start border-[#29405F] bg-[#142033] text-left text-[#E7ECF5] hover:bg-[#1A2A42]"
                onClick={() => handleAnswer(choice.value, choice.label)}
                disabled={isSubmitting}
              >
                {choice.label}
              </Button>
            ))}
          </div>
          {!currentQuestion.required && (
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-[#9FB2CC]"
              onClick={() => handleAnswer("", locale === "es" ? "Prefiero omitirlo por ahora" : "I prefer to skip this for now")}
              disabled={isSubmitting}
            >
              {locale === "es" ? "Omitir" : "Skip"}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {currentQuestion.type === "textarea" ? (
          <Textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={currentQuestion.placeholder}
            className="min-h-[120px] border-[#29405F] bg-[#101A2B] text-[#E7ECF5]"
            disabled={isSubmitting}
          />
        ) : (
          <Input
            type={currentQuestion.type === "email" ? "email" : "text"}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAnswer(inputValue);
              }
            }}
            placeholder={currentQuestion.placeholder}
            className="border-[#29405F] bg-[#101A2B] text-[#E7ECF5]"
            disabled={isSubmitting}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {!currentQuestion.required ? (
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-[#9FB2CC]"
              onClick={() => handleAnswer("", locale === "es" ? "Prefiero omitirlo por ahora" : "I prefer to skip this for now")}
              disabled={isSubmitting}
            >
              {locale === "es" ? "Omitir" : "Skip"}
            </Button>
          ) : (
            <span className="text-xs text-[#9FB2CC]">{locale === "es" ? "Campo requerido" : "Required field"}</span>
          )}

          <Button
            type="button"
            onClick={() => handleAnswer(inputValue)}
            disabled={isSubmitting || (!inputValue.trim() && !!currentQuestion.required)}
            className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {locale === "es" ? "Enviar" : "Send"}
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {inline && (
        <Card className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C96F2D]/12 ring-1 ring-[#C96F2D]/20">
                <Bot className="h-5 w-5 text-[#E1A24A]" />
              </div>
              <div>
                <CardTitle className="text-base">{locale === "es" ? "Chat web de ANNA" : "ANNA Web Chat"}</CardTitle>
                <CardDescription className="text-[#9FB2CC]">
                  {locale === "es"
                    ? "Conversación guiada para abrir la oportunidad sin llenar todo el formulario manualmente."
                    : "Guided conversation to open the opportunity without filling the entire form manually."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-[#C96F2D]/20 bg-[#C96F2D]/8 p-4 text-sm leading-7 text-[#F7E6CE]">
              {locale === "es"
                ? "ANNA captura el contexto, lo resume y lo manda al CRM de Lead Hunter listo para handoff."
                : "ANNA captures the context, summarizes it, and sends it to the Lead Hunter CRM ready for handoff."}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => setOpen(true)}
                className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
              >
                {locale === "es" ? "Hablar con ANNA" : "Talk to ANNA"}
                <MessageSquare className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#29405F] bg-[#101A2B] text-[#E7ECF5] hover:bg-[#142033]"
                onClick={resetConversation}
              >
                {locale === "es" ? "Reiniciar flujo" : "Restart flow"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {floating && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 rounded-full bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] px-5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] hover:opacity-95"
        >
          <Bot className="mr-2 h-5 w-5" />
          ANNA
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full border-l border-[#23344E] bg-[#0B1420] p-0 text-[#E7ECF5] sm:max-w-xl"
        >
          <SheetHeader className="border-b border-[#1E3048] bg-[linear-gradient(135deg,#0F1B2D,#162235)] pr-12">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C96F2D]/12 ring-1 ring-[#C96F2D]/20">
                <HardHat className="h-5 w-5 text-[#E1A24A]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="text-[#E7ECF5]">
                    {locale === "es" ? "ANNA para Lead Hunter" : "ANNA for Lead Hunter"}
                  </SheetTitle>
                  <Badge className="border-[#E1A24A]/30 bg-[#E1A24A]/10 text-[#E1A24A] hover:bg-[#E1A24A]/10">
                    {locale === "es" ? "Chat web" : "Web Chat"}
                  </Badge>
                </div>
                <SheetDescription className="text-[#9FB2CC]">
                  {locale === "es"
                    ? "Calificación guiada para oportunidades de construcción."
                    : "Guided qualification for construction opportunities."}
                </SheetDescription>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#9FB2CC]">
              <span>
                {locale === "es" ? "Progreso" : "Progress"} {Math.min(currentStep + 1, questions.length)}/{questions.length}
              </span>
              <span>{completionRatio}%</span>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-4 px-4 py-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white"
                        : message.role === "system"
                          ? "border border-[#29405F] bg-[#101A2B] text-[#9FB2CC]"
                          : "border border-[#1E3048] bg-[#162235] text-[#E7ECF5]"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-[#1E3048] bg-[#0F1B2D] p-4">
            {renderComposer()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
