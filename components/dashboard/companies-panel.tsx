"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface CompanyCardProps {
  name: string;
  href: string;
  tagline: string;
  activeProjects: number;
  leads: number;
  revenue: string;
  recentActivity: string;
  logo: string;
  accentBg: string;
  accentText: string;
}

function CompanyCard({
  name,
  href,
  tagline,
  activeProjects,
  leads,
  revenue,
  recentActivity,
  logo,
  accentBg,
  accentText,
}: CompanyCardProps) {
  return (
    <Link href={href} className="block h-full">
      <div
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 h-full transition-all duration-200 hover:border-primary/40 cursor-pointer"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
      >
        {/* Top accent line on hover */}
        <div className={`absolute top-0 left-0 right-0 h-px ${accentBg} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-background/60 border border-border/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src={logo}
                alt={`${name} logo`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h3>
              <p className="text-xs text-muted-foreground">{tagline}</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-background/60 px-3 py-2 text-center border border-border/60">
            <p className="text-lg font-bold text-foreground">{activeProjects}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Projects</p>
          </div>
          <div className="rounded-lg bg-background/60 px-3 py-2 text-center border border-border/60">
            <p className="text-lg font-bold text-foreground">{leads}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Leads</p>
          </div>
          <div className="rounded-lg bg-background/60 px-3 py-2 text-center border border-border/60">
            <p className={`text-lg font-bold ${accentText}`}>{revenue}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</p>
          </div>
        </div>

        {/* Recent activity */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3 truncate">{recentActivity}</p>
      </div>
    </Link>
  );
}

export function CompaniesPanel() {
  const companies: CompanyCardProps[] = [
    {
      name: "Red Apostólica",
      href: "/app/companies/red-apostolica",
      tagline: "Kingdom & revival movement",
      activeProjects: 3,
      leads: 18,
      revenue: "$45.2K",
      recentActivity: "New outreach program launched",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Copia%20de%20foto%20de%20perfil%20de%20LinkedIn%20creativo%20verde-5-nXFFuAeL3Evr2nHnLOKBY6m5JYgjI5.png",
      accentBg: "bg-amber-600",
      accentText: "text-amber-400",
    },
    {
      name: "Reino Editorial",
      href: "/app/companies/reino-editorial",
      tagline: "Publishing & distribution",
      activeProjects: 5,
      leads: 32,
      revenue: "$52.8K",
      recentActivity: "3 manuscripts entered production phase",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20Editorial%20Reino-vYSSKY658dA54Mv4uUGzRGJ6fj3Zwg.png",
      accentBg: "bg-primary",
      accentText: "text-primary",
    },
    {
      name: "iKingdom",
      href: "/app/companies/ikingdom",
      tagline: "Digital ventures & acquisitions",
      activeProjects: 2,
      leads: 12,
      revenue: "$18.5K",
      recentActivity: "New partnership agreement signed",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Favicon%20Ikingdom-dMRh22LB0rQrPr8EDc6nXwC40C72GQ.png",
      accentBg: "bg-secondary",
      accentText: "text-[#C8A84B]",
    },
    {
      name: "Imperium Group",
      href: "/app/companies/imperium",
      tagline: "Holding & strategic operations",
      activeProjects: 4,
      leads: 28,
      revenue: "$61.3K",
      recentActivity: "Q1 expansion strategy initiated",
      logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Oficial%20IG-0bGM4ryVIortfYBXZmEkv08Q9UtgJb.png",
      accentBg: "bg-emerald-600",
      accentText: "text-emerald-400",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Portfolio Companies</h3>
          <p className="text-xs text-muted-foreground mt-0.5">4 active entities</p>
        </div>
        <Link href="/app/companies" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <CompanyCard key={company.name} {...company} />
        ))}
      </div>
    </div>
  );
}
