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
/*  Hebeling OS — Dark Elegant Palette                                  */
/* ------------------------------------------------------------------ */
const P = {
  bg: "#0B1420",
  bgSecondary: "#0F1B2D",
  card: "#162235",
  cardHover: "#1C2D44",
  gold: "#C8A75B",
  goldLight: "#E4C98A",
  goldDim: "#C8A75B15",
  maroon: "#6E1F2F",
  border: "#1E3048",
  txt: "#E7ECF5",
  txtM: "#9FB2CC",
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
    href: "/app/editorial",
    editorialHref: null,
    oficinaHref: "/app/editorial/oficina",
    webProjectsHref: null,
    logo: "/logo-reino-editorial.png",
    logoBg: "#ffffff",
    logoRounded: true,
    gradient: `linear-gradient(135deg, ${P.maroon}, #2F6FA3)`,
    accent: "#2F6FA3",
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
    gradient: `linear-gradient(135deg, ${P.gold}, #8B7A3D)`,
    accent: P.gold,
    stats: [
      { label: "Apps", value: "—" },
      { label: "Clientes", value: "—" },
    ],
    featured: false,
  },
  {
    slug: "lead-hunter",
    name: "Lead Hunter",
    tagline: "Leads de construccion con ANNA",
    description:
      "Motor comercial para captacion, calificacion y seguimiento de oportunidades en la industria de la construccion.",
    href: "/app/companies/lead-hunter",
    editorialHref: null,
    oficinaHref: null,
    webProjectsHref: null,
    logo: "/logo-lead-hunter.svg",
    logoBg: "#0F1B2D",
    logoRounded: false,
    gradient: "linear-gradient(135deg, #C96F2D, #E1A24A)",
    accent: "#E1A24A",
    stats: [
      { label: "Canales", value: "2" },
      { label: "CRM Native", value: "ANNA" },
    ],
    featured: true,
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
    gradient: `linear-gradient(135deg, #0B1C2E, ${P.gold})`,
    accent: "#0B1C2E",
    stats: [
      { label: "Unidades", value: "6" },
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
    gradient: "linear-gradient(135deg, #F0652A, #8B3A15)",
    accent: "#F0652A",
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
    gradient: `linear-gradient(135deg, #D6C28A, ${P.gold})`,
    accent: "#D6C28A",
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
    <div className="min-h-full" style={{ background: P.bg }}>

      {/* ── Hero header ──────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${P.bgSecondary} 0%, ${P.card} 50%, ${P.maroon}30 100%)`,
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
                boxShadow: `0 8px 32px ${P.gold}25`,
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
              <h1 className="text-2xl font-bold tracking-tight text-[#E7ECF5]">
                HEBELING OS
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: `${P.gold}cc` }}
              >
                Enterprise Operating System &middot; Unidades de Negocio
              </p>
            </div>
          </div>

          {/* quick stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            {([
              { icon: Zap, label: "Unidades Activas", value: "6" },
              { icon: BarChart3, label: "Pipeline AI", value: "Activo" },
              { icon: Users, label: "Jurisdicciones", value: "USA · MX · AR" },
              { icon: Zap, label: "Motor", value: "OpenAI + Claude" },
            ] as const).map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${P.card}80` }}
                >
                  <s.icon className="w-4 h-4" style={{ color: P.gold }} />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: P.txtM }}
                  >
                    {s.label}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: P.txt }}>{s.value}</p>
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
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hos-card-hover"
                style={{
                  background: P.card,
                  border: `1px solid ${P.border}`,
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.15)",
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
                          className="text-lg font-bold tracking-tight text-[#E7ECF5]"
                        >
                          {u.name}
                        </h3>
                        {u.featured && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse-gold"
                            style={{
                              background: `${P.gold}15`,
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
                    className="text-sm leading-relaxed mt-3 text-[#9FB2CC]"
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
                          className="text-[10px] font-medium text-[#9FB2CC]/70"
                        >
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* action buttons */}
                  <div
                    className="flex items-center gap-2 mt-5 pt-4"
                    style={{ borderTop: `1px solid ${P.border}60` }}
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
                          background: `${P.maroon}20`,
                          color: "#E7ECF5",
                          border: `1px solid ${P.maroon}40`,
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
                          background: `${P.gold}15`,
                          color: P.gold,
                          border: `1px solid ${P.gold}30`,
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
            style={{ color: `${P.txtM}60` }}
          >
            HEBELING OS v1.0 &middot; Enterprise Operating System &middot;{" "}
            &copy; {new Date().getFullYear()} Max Hebeling
          </p>
        </div>
      </div>
    </div>
  );
}
