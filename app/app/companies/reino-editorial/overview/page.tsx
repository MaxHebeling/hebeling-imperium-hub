import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Users,
  BarChart3,
  Globe2,
  Settings2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const PIPELINE_STAGES = [
  { name: "Ingesta", desc: "Recepcion y validacion del manuscrito" },
  { name: "Estructura", desc: "Analisis de estructura narrativa" },
  { name: "Estilo", desc: "Revision de estilo y voz del autor" },
  { name: "Ortotipografia", desc: "Correccion ortografica y tipografica" },
  { name: "Maquetacion", desc: "Diseno y composicion del libro" },
  { name: "Revision Final", desc: "Aprobacion editorial definitiva" },
];

const QUICK_ACCESS = [
  {
    href: "/app/companies/reino-editorial/projects",
    icon: LayoutDashboard,
    label: "Projects",
    desc: "Gestiona todos los proyectos en pipeline",
    accent: "blue",
  },
  {
    href: "/app/companies/reino-editorial/ai",
    icon: Sparkles,
    label: "AI Review",
    desc: "Analisis automatico con inteligencia artificial",
    accent: "cyan",
  },
  {
    href: "/app/companies/reino-editorial/authors",
    icon: Users,
    label: "Authors",
    desc: "Base de datos de autores y contratos",
    accent: "gold",
  },
  {
    href: "/app/companies/reino-editorial/operations",
    icon: Settings2,
    label: "Operations",
    desc: "Flujos operativos y configuracion",
    accent: "blue",
  },
  {
    href: "/app/companies/reino-editorial/distribution",
    icon: Globe2,
    label: "Distribution",
    desc: "Canales de venta y distribucion global",
    accent: "cyan",
  },
  {
    href: "/app/companies/reino-editorial/reports",
    icon: BarChart3,
    label: "Reports",
    desc: "Metricas, KPIs y analisis de rendimiento",
    accent: "gold",
  },
];

const ACCENT_STYLES: Record<string, React.CSSProperties> = {
  blue: {
    background: "var(--re-blue-pale)",
    color: "var(--re-blue)",
    borderColor: "var(--re-border-blue)",
  },
  cyan: {
    background: "var(--re-cyan-pale)",
    color: "var(--re-cyan)",
    borderColor: "var(--re-border-cyan)",
  },
  gold: {
    background: "var(--re-gold-pale)",
    color: "var(--re-gold)",
    borderColor: "var(--re-border-gold)",
  },
};

export default function ReinoEditorialOverviewPage() {
  return (
    <div
      className="min-h-full"
      style={{ backgroundColor: "var(--re-bg)" }}
    >
      {/* Hero banner */}
      <div
        className="relative overflow-hidden px-8 py-10"
        style={{
          background: "linear-gradient(135deg, var(--re-blue) 0%, #2248D8 60%, #1a9cbc 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "var(--re-gold-bright)" }}
        />
        <div
          className="absolute -bottom-8 right-32 w-32 h-32 rounded-full opacity-10"
          style={{ background: "var(--re-cyan-bright)" }}
        />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(232,160,32,0.2)",
                color: "#FFD060",
                border: "1px solid rgba(232,160,32,0.3)",
              }}
            >
              <BookOpen className="w-3 h-3" />
              Pipeline Editorial Activo
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-balance">
            Reino Editorial
          </h1>
          <p className="mt-2 text-blue-100 text-sm leading-relaxed max-w-xl">
            Plataforma editorial inteligente con IA integrada. Desde la ingesta del manuscrito
            hasta la distribucion global, todo en un solo lugar.
          </p>
        </div>
      </div>

      <div className="px-8 py-8 space-y-10">
        {/* Quick access grid */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--re-text)" }}
              >
                Modulos
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--re-text-muted)" }}
              >
                Acceso rapido a todas las superficies operativas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACCESS.map(({ href, icon: Icon, label, desc, accent }) => (
              <Link
                key={href}
                href={href}
                className="group block rounded-2xl p-5 transition-all duration-200"
                style={{
                  backgroundColor: "var(--re-surface)",
                  border: "1px solid var(--re-border)",
                  boxShadow: "var(--re-shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--re-shadow-md)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--re-shadow-sm)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={ACCENT_STYLES[accent]}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--re-text-subtle)" }}
                  />
                </div>
                <div className="mt-3">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--re-text)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--re-text-muted)" }}
                  >
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pipeline stages */}
        <section>
          <div className="mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--re-text)" }}
            >
              Pipeline de Produccion
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--re-text-muted)" }}
            >
              Las seis etapas del flujo editorial con IA
            </p>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--re-surface)",
              border: "1px solid var(--re-border)",
              boxShadow: "var(--re-shadow-sm)",
            }}
          >
            {PIPELINE_STAGES.map((stage, i) => (
              <div
                key={stage.name}
                className="flex items-center gap-4 px-6 py-4 transition-colors"
                style={{
                  borderBottom:
                    i < PIPELINE_STAGES.length - 1
                      ? "1px solid var(--re-border)"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor =
                    "var(--re-surface-2)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent")
                }
              >
                {/* Step number */}
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
                  style={{
                    background:
                      i === 0
                        ? "linear-gradient(135deg, var(--re-blue) 0%, var(--re-cyan) 100%)"
                        : "var(--re-surface-2)",
                    color: i === 0 ? "#ffffff" : "var(--re-text-muted)",
                    border:
                      i === 0
                        ? "none"
                        : "1px solid var(--re-border)",
                  }}
                >
                  {i + 1}
                </div>

                {/* Connector line */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--re-text)" }}
                  >
                    {stage.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--re-text-muted)" }}
                  >
                    {stage.desc}
                  </p>
                </div>

                {i < PIPELINE_STAGES.length - 1 ? (
                  <ArrowRight
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "var(--re-border)" }}
                  />
                ) : (
                  <CheckCircle2
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--re-success)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div
          className="rounded-xl px-5 py-4"
          style={{
            backgroundColor: "var(--re-blue-pale)",
            border: "1px solid var(--re-border-blue)",
          }}
        >
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--re-blue)" }}
          >
            Los modulos clave de esta unidad (Projects, AI Review, Operations) operan bajo
            la arquitectura company-first de Hebeling OS. Las rutas legacy siguen activas
            durante la transicion.
          </p>
        </div>
      </div>
    </div>
  );
}
