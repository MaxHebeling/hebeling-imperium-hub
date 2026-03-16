import Link from "next/link";
import {
  BookOpen,
  Zap,
  ArrowRight,
  Layers,
  FileText,
  CheckCircle,
  Globe,
  Palette,
  Building2,
  Sparkles,
  FileOutput,
  PenTool,
  Type,
  ShieldCheck,
  Send,
  FileSearch,
} from "lucide-react";

export default function EditorialPage() {
  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto">
      {/* Premium Header Section */}
      <section className="flex flex-col gap-6">
        {/* Logo + Title */}
        <div className="flex items-start gap-5">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl shrink-0 shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)",
            }}
          >
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: "var(--re-text)" }}
              >
                Editorial AI Engine
              </h1>
              <span className="re-badge re-badge-blue">
                <Sparkles className="w-3 h-3" />
                v2.0
              </span>
            </div>
            <p
              className="text-base max-w-xl"
              style={{ color: "var(--re-text-muted)" }}
            >
              Pipeline de produccion editorial inteligente con IA en cada fase del proceso.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="re-card p-4 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <stat.icon 
                  className="w-4 h-4" 
                  style={{ color: stat.color }}
                />
                <span 
                  className="text-xs font-medium"
                  style={{ color: "var(--re-text-muted)" }}
                >
                  {stat.label}
                </span>
              </div>
              <p 
                className="text-2xl font-bold"
                style={{ color: "var(--re-text)" }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Description Card */}
      <section
        className="re-card-blue p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap
            className="w-4 h-4"
            style={{ color: "var(--re-blue)" }}
          />
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--re-text)" }}
          >
            Pipeline Automatizado con n8n + IA
          </h2>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--re-text-muted)" }}
        >
          El flujo editorial es orquestado automaticamente por <strong>n8n</strong> a traves de 8 etapas secuenciales. 
          Cada etapa utiliza modelos de IA (GPT-4 y Claude) para analizar, corregir y mejorar el manuscrito. 
          El staff puede supervisar el progreso, ver los resultados de cada etapa y descargar reportes de correcciones.
        </p>
      </section>

      {/* Pipeline Visual */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--re-text)" }}
          >
            Pipeline Editorial
          </h2>
          <span 
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ 
              background: "var(--re-surface-2)",
              color: "var(--re-text-muted)" 
            }}
          >
            8 etapas automatizadas
          </span>
        </div>

        {/* Pipeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map((stage, index) => (
            <div
              key={stage.key}
              className="re-card re-lift p-5 flex flex-col gap-4 cursor-default"
            >
              {/* Stage Number + Icon */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold tabular-nums w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ 
                    background: "var(--re-surface-2)",
                    color: "var(--re-text-subtle)" 
                  }}
                >
                  {index + 1}
                </span>
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{
                    background: `${stage.color}15`,
                  }}
                >
                  <stage.icon
                    className="w-4.5 h-4.5"
                    style={{ color: stage.color }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--re-text)" }}
                >
                  {stage.label}
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--re-text-muted)" }}
                >
                  {stage.description}
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between gap-3">
                <div className="re-progress flex-1">
                  <div 
                    className="re-progress-bar" 
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
                <span 
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: stage.color }}
                >
                  {stage.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section
        className="re-card p-6"
      >
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
          <div>
            <p
              className="font-semibold text-base"
              style={{ color: "var(--re-text)" }}
            >
              Acciones Rapidas
            </p>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--re-text-muted)" }}
            >
              Accede a las funciones principales del motor editorial.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/app/editorial/projects"
              className="re-btn-primary inline-flex items-center gap-2"
            >
              Ver Proyectos
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/publica-tu-libro"
              className="re-btn-secondary inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Nuevo Manuscrito
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURE_CARDS.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="re-card re-lift p-5 flex flex-col gap-3 group"
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:scale-105"
              style={{
                background: feature.gradient,
              }}
            >
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--re-text)" }}
              >
                {feature.title}
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--re-text-muted)" }}
              >
                {feature.description}
              </p>
            </div>
            <div 
              className="flex items-center gap-1 text-xs font-medium mt-auto group-hover:gap-2 transition-all"
              style={{ color: "var(--re-blue)" }}
            >
              Acceder
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

const QUICK_STATS = [
  { label: "Etapas Pipeline", value: "8", icon: Layers, color: "var(--re-blue)" },
  { label: "Motor IA", value: "GPT + Claude", icon: Sparkles, color: "var(--re-cyan)" },
  { label: "Automatizacion", value: "n8n", icon: Zap, color: "var(--re-gold)" },
  { label: "Formatos Export", value: "PDF EPUB", icon: FileOutput, color: "var(--re-success)" },
];

const PIPELINE_STAGES = [
  {
    key: "ingesta",
    label: "Ingesta",
    icon: BookOpen,
    description: "Carga del manuscrito original y validacion de formato.",
    color: "var(--re-cyan)",
    progress: 10,
  },
  {
    key: "estructura",
    label: "Estructura",
    icon: FileSearch,
    description: "Analisis y reorganizacion de la estructura narrativa.",
    color: "var(--re-blue)",
    progress: 25,
  },
  {
    key: "estilo",
    label: "Estilo",
    icon: PenTool,
    description: "Mejora y homogeneizacion del estilo de escritura.",
    color: "var(--re-gold)",
    progress: 40,
  },
  {
    key: "ortotipografia",
    label: "Ortotipografia",
    icon: Type,
    description: "Correccion ortografica, gramatical y tipografica.",
    color: "var(--re-cyan)",
    progress: 55,
  },
  {
    key: "maquetacion",
    label: "Maquetacion",
    icon: Palette,
    description: "Diseno y composicion del interior del libro.",
    color: "var(--re-blue)",
    progress: 70,
  },
  {
    key: "revision_final",
    label: "Revision Final",
    icon: ShieldCheck,
    description: "Revision integral y aprobacion para exportacion.",
    color: "var(--re-gold)",
    progress: 85,
  },
  {
    key: "export",
    label: "Export",
    icon: FileOutput,
    description: "Generacion de PDF, EPUB y MOBI en alta calidad.",
    color: "var(--re-cyan)",
    progress: 95,
  },
  {
    key: "distribution",
    label: "Distribucion",
    icon: Send,
    description: "Amazon, Apple Books, Kobo y canales directos.",
    color: "var(--re-success)",
    progress: 100,
  },
];

const FEATURE_CARDS = [
  {
    title: "Portadas AI",
    description: "Genera portadas profesionales con DALL-E 3.",
    icon: Palette,
    href: "/app/editorial/portadas",
    gradient: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
  },
  {
    title: "Oficina Editorial",
    description: "Contratos, facturas y documentos administrativos.",
    icon: Building2,
    href: "/app/editorial/oficina",
    gradient: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)",
  },
];
