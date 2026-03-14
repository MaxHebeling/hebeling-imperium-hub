"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Briefcase,
  ArrowUpRight,
  BarChart3,
  Users,
  Zap,
  Globe,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Logo-derived palette                                               */
/* ------------------------------------------------------------------ */
const P = {
  navy: "#2a3a5c",
  navyLight: "#3a4f7a",
  gold: "#c5a55a",
  goldLight: "#d4b87a",
  goldDim: "#c5a55a15",
  burgundy: "#7a2040",
  burgundyLight: "#9a3060",
  cream: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e2d8",
  txt: "#1f2937",
  txtM: "#6b7280",
};

/* ------------------------------------------------------------------ */
/*  Business units                                                     */
/* ------------------------------------------------------------------ */
interface UnitStat { label: string; value: string }
interface BusinessUnit {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  editorialHref: string | null;
  oficinaHref: string | null;
  webProjectsHref: string | null;
  logo: string;
  logoBg: string;
  logoRounded: boolean;
  gradient: string;
  accent: string;
  stats: UnitStat[];
  featured: boolean;
}

const UNITS: BusinessUnit[] = [
  {
    slug: "reino-editorial",
    name: "Reino Editorial",
    tagline: "AI-Powered Publishing",
    description:
      "Pipeline editorial inteligente con IA en cada etapa. Desde la ingesta del manuscrito hasta la distribución global.",
    href: "/app/companies/reino-editorial",
    editorialHref: "/app/editorial",
    oficinaHref: "/app/editorial/oficina",
    webProjectsHref: null,
    logo: "/logo-reino-editorial.png",
    logoBg: "#ffffff",
    logoRounded: true,
    gradient: `linear-gradient(135deg, ${P.burgundy}, ${P.navyLight})`,
    accent: P.burgundy,
    stats: [
      { label: "Etapas AI", value: "8" },
      { label: "Formatos", value: "3" },
    ],
    featured: true,
  },
  {
    slug: "ikingdom",
    name: "iKingdom",
    tagline: "Digital Solutions",
    description:
      "Construcción de páginas web, aplicaciones digitales y soluciones tecnológicas para clientes.",
    href: "/app/companies/ikingdom",
    editorialHref: null,
    oficinaHref: null,
    webProjectsHref: "/app/ikingdom/projects",
    logo: "/logo-ikingdom.png",
    logoBg: "#ffffff",
    logoRounded: false,
    gradient: "linear-gradient(135deg, #1a1a1a, #444444)",
    accent: "#1a1a1a",
    stats: [
      { label: "Apps", value: "—" },
      { label: "Clientes", value: "—" },
    ],
    featured: false,
  },
  {
    slug: "imperium",
    name: "Imperium Group",
    tagline: "Operations & Strategy",
    description:
      "Gestión de operaciones, estrategia empresarial y administración global del grupo.",
    href: "/app/companies/imperium",
    editorialHref: null,
    oficinaHref: null,
    webProjectsHref: null,
    logo: "/logo-imperium.png",
    logoBg: "transparent",
    logoRounded: true,
    gradient: `linear-gradient(135deg, ${P.navy}, ${P.gold})`,
    accent: P.navy,
    stats: [
      { label: "Unidades", value: "4" },
      { label: "Países", value: "3" },
    ],
    featured: false,
  },
  {
    slug: "max-hebeling",
    name: "Max Hebeling",
    tagline: "Personal Brand",
    description: "Marca personal, consultoría y proyectos individuales.",
    href: "/app/companies/max-hebeling",
    editorialHref: null,
    oficinaHref: null,
    webProjectsHref: null,
    logo: "/logo-max-hebeling.png",
    logoBg: "#ffffff",
    logoRounded: false,
    gradient: "linear-gradient(135deg, #e8710a, #333333)",
    accent: "#e8710a",
    stats: [
      { label: "Proyectos", value: "—" },
      { label: "Servicios", value: "—" },
    ],
    featured: false,
  },
  {
    slug: "red-apostolica",
    name: "Red Apostólica",
    tagline: "Reino y Avivamiento",
    description:
      "Red apostólica internacional. Ministerio, comunidad y alcance global.",
    href: "/app/companies/red-apostolica",
    editorialHref: null,
    oficinaHref: null,
    webProjectsHref: null,
    logo: "/logo-red-apostolica.png",
    logoBg: "transparent",
    logoRounded: true,
    gradient: `linear-gradient(135deg, ${P.gold}, ${P.goldLight})`,
    accent: P.gold,
    stats: [
      { label: "Ministerio", value: "—" },
      { label: "Alcance", value: "Global" },
    ],
    featured: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CompaniesPage() {
  return (
    <div className="min-h-full" style={{ background: P.cream }}>

      {/* ── Hero header ──────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${P.navy} 0%, ${P.navyLight} 50%, ${P.burgundy} 100%)`,
        }}
      >
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${P.gold}, ${P.goldLight})`,
                boxShadow: `0 8px 32px ${P.gold}40`,
              }}
            >
              <Image
                src="/logo.png"
                alt="Hebeling OS"
                width={48}
                height={48}
                className="rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                HEBELING OS
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: `${P.goldLight}cc` }}
              >
                Enterprise Operating System &middot; Unidades de Negocio
              </p>
            </div>
          </div>

          {/* quick stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            {([
              { icon: Zap, label: "Unidades Activas", value: "5" },
              { icon: BarChart3, label: "Pipeline AI", value: "Activo" },
              { icon: Users, label: "Jurisdicciones", value: "USA · MX · AR" },
              { icon: Zap, label: "Motor", value: "OpenAI + Claude" },
            ] as const).map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <s.icon className="w-4 h-4" style={{ color: P.goldLight }} />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Business unit cards ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {UNITS.map((u) => (
              <div
                key={u.slug}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                style={{
                  background: P.surface,
                  border: `1px solid ${P.border}`,
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
                }}
              >
                {/* accent bar */}
                <div className="h-1 w-full" style={{ background: u.gradient }} />

                <div className="p-5">
                  {/* logo + name */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${u.logoRounded ? "rounded-full" : "rounded-xl"}`}
                      style={{ background: u.logoBg }}
                    >
                      <Image
                        src={u.logo}
                        alt={u.name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-lg font-bold tracking-tight"
                          style={{ color: P.txt }}
                        >
                          {u.name}
                        </h3>
                        {u.featured && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: P.goldDim,
                              color: P.gold,
                              border: `1px solid ${P.gold}30`,
                            }}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            AI
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs font-medium mt-0.5"
                        style={{ color: u.accent }}
                      >
                        {u.tagline}
                      </p>
                    </div>
                  </div>

                  {/* description */}
                  <p
                    className="text-sm leading-relaxed mt-3"
                    style={{ color: P.txtM }}
                  >
                    {u.description}
                  </p>

                  {/* mini stats */}
                  <div className="flex gap-4 mt-4">
                    {u.stats.map((st) => (
                      <div
                        key={st.label}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          background: `${u.accent}08`,
                          border: `1px solid ${u.accent}15`,
                        }}
                      >
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: u.accent }}
                        >
                          {st.value}
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: P.txtM }}
                        >
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* action buttons */}
                  <div
                    className="flex items-center gap-2 mt-5 pt-4"
                    style={{ borderTop: `1px solid ${P.border}` }}
                  >
                    <Link
                      href={u.href}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{
                        background: u.gradient,
                        color: "#ffffff",
                        boxShadow: `0 2px 8px ${u.accent}30`,
                      }}
                    >
                      Entrar
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    {u.editorialHref && (
                      <Link
                        href={u.editorialHref}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{
                          background: `${P.navy}08`,
                          color: P.navy,
                          border: `1px solid ${P.navy}20`,
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Editorial
                      </Link>
                    )}

                    {u.oficinaHref && (
                      <Link
                        href={u.oficinaHref}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{
                          background: `${P.gold}10`,
                          color: P.gold,
                          border: `1px solid ${P.gold}25`,
                        }}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        Oficina
                      </Link>
                    )}

                    {u.webProjectsHref && (
                      <Link
                        href={u.webProjectsHref}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{
                          background: "#00d4aa10",
                          color: "#00d4aa",
                          border: "1px solid #00d4aa25",
                        }}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Web Projects
                      </Link>
                    )}
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* footer */}
        <div className="text-center mt-8">
          <p
            className="text-xs font-medium"
            style={{ color: `${P.txtM}80` }}
          >
            HEBELING OS v1.0 &middot; Enterprise Operating System &middot;{" "}
            &copy; {new Date().getFullYear()} Max Hebeling
          </p>
        </div>
      </div>
    </div>
  );
}
