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
  BarChart3,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditorialPage() {
  return (
    <div className="flex flex-col gap-10 p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-6 pt-4">
        {/* Logo + title */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #1B40C0 0%, #2DD4D4 100%)",
              boxShadow: "0 0 24px #2DD4D440",
            }}
          >
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--re-text)" }}
            >
              Reino Editorial
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--re-text-muted)" }}
            >
              AI Engine · Pipeline de producción editorial inteligente
            </p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "8 Etapas", color: "var(--re-cyan)" },
            { label: "IA en cada fase", color: "var(--re-gold)" },
            { label: "Export multi-formato", color: "var(--re-blue-light)" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `${color}15`,
                color,
                border: `1px solid ${color}30`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Description card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--re-surface)",
          border: "1px solid var(--re-border-cyan)",
          boxShadow: "inset 0 1px 0 #2DD4D410",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap
            className="w-4 h-4"
            style={{ color: "var(--re-cyan)" }}
          />
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--re-text)" }}
          >
            Que es el Reino Editorial AI Engine?
          </h2>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--re-text-muted)" }}
        >
          Pipeline completo de produccion editorial desde la ingesta del manuscrito
          hasta la exportacion y distribucion final. Cada etapa es supervisada por
          inteligencia artificial y validada por el equipo editorial con puntos de
          aprobacion humana en momentos clave del proceso.
        </p>
      </div>

      {/* Pipeline grid */}
      <div>
        <h2
          className="text-lg font-semibold mb-5"
          style={{ color: "var(--re-text)" }}
        >
          Pipeline Editorial
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map((stage, index) => {
            const isActive = index === 0;
            return (
              <div
                key={stage.key}
                className="rounded-xl p-4 flex flex-col gap-3 transition-all"
                style={{
                  background: isActive ? "var(--re-blue-dim)" : "var(--re-surface-2)",
                  border: isActive
                    ? "1px solid var(--re-blue-light)"
                    : "1px solid var(--re-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: "var(--re-text-subtle)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{
                      background: stage.accent + "20",
                    }}
                  >
                    <stage.icon
                      className="w-4 h-4"
                      style={{ color: stage.accent }}
                    />
                  </div>
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--re-text)" }}
                  >
                    {stage.label}
                  </p>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--re-text-muted)" }}
                  >
                    {stage.description}
                  </p>
                </div>
                <div
                  className="text-xs font-medium px-2 py-0.5 rounded-full self-start"
                  style={{
                    background: stage.accent + "15",
                    color: stage.accent,
                  }}
                >
                  {stage.progress}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA row */}
      <div
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-2xl p-6"
        style={{
          background: "var(--re-surface-2)",
          border: "1px solid var(--re-border)",
        }}
      >
        <div>
          <p
            className="font-semibold text-base"
            style={{ color: "var(--re-text)" }}
          >
            Listo para comenzar?
          </p>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--re-text-muted)" }}
          >
            Revisa los proyectos activos o inicia un nuevo manuscrito.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/app/editorial/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--re-blue)",
              color: "#ffffff",
              boxShadow: "0 0 20px #1B40C040",
            }}
          >
            Ver Proyectos
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/submit-manuscript"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--re-cyan-dim)",
              color: "var(--re-cyan)",
              border: "1px solid var(--re-border-cyan)",
            }}
          >
            Nuevo Manuscrito
            <BookOpen className="w-4 h-4" />
          </Link>
          <Link
            href="/app/editorial/portadas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, #9333ea20, #ec489920)",
              color: "#9333ea",
              border: "1px solid #9333ea30",
            }}
          >
            Portadas AI
            <Palette className="w-4 h-4" />
          </Link>
          <Link
            href="/app/editorial/oficina"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "#1a3a6b10",
              color: "#1a3a6b",
              border: "1px solid #1a3a6b30",
            }}
          >
            Oficina
            <Building2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}

const PIPELINE_STAGES = [
  {
    key: "ingesta",
    label: "Ingesta",
    icon: FileText,
    description: "Carga del manuscrito original y validacion de formato.",
    accent: "#2DD4D4",
    progress: 10,
  },
  {
    key: "estructura",
    label: "Estructura",
    icon: Layers,
    description: "Analisis y reorganizacion de la estructura narrativa.",
    accent: "#2a56e8",
    progress: 25,
  },
  {
    key: "estilo",
    label: "Estilo",
    icon: Zap,
    description: "Mejora y homogeneizacion del estilo de escritura.",
    accent: "#F5C842",
    progress: 40,
  },
  {
    key: "ortotipografia",
    label: "Ortotipografia",
    icon: CheckCircle,
    description: "Correccion ortografica, gramatical y tipografica.",
    accent: "#2DD4D4",
    progress: 55,
  },
  {
    key: "maquetacion",
    label: "Maquetacion",
    icon: Palette,
    description: "Diseno y composicion del interior del libro.",
    accent: "#2a56e8",
    progress: 70,
  },
  {
    key: "revision_final",
    label: "Revision Final",
    icon: BarChart3,
    description: "Revision integral y aprobacion para exportacion.",
    accent: "#F5C842",
    progress: 85,
  },
  {
    key: "export",
    label: "Export",
    icon: BookOpen,
    description: "Generacion de PDF, EPUB y MOBI en alta calidad.",
    accent: "#2DD4D4",
    progress: 95,
  },
  {
    key: "distribution",
    label: "Distribucion",
    icon: Globe,
    description: "Amazon, Apple Books, Kobo y canales directos.",
    accent: "#F5C842",
    progress: 100,
  },
];
