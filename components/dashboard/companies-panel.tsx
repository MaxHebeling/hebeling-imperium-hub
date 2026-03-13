"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CompanyCardProps {
  name: string;
  href: string;
  tagline: string;
  activeProjects: number;
  leads: number;
  revenue: string;
  recentActivity: string;
  initials: string;
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
  initials,
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
            <div className={`h-9 w-9 rounded-lg ${accentBg} flex items-center justify-center text-sm font-bold text-card`}>
              {initials}
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
      name: "Max Hebeling",
      href: "/app/companies/max-hebeling",
      tagline: "Personal brand & consulting",
      activeProjects: 3,
      leads: 18,
      revenue: "$45.2K",
      recentActivity: "New enterprise deal closed with Apex Corp",
      initials: "MH",
      accentBg: "bg-[#4A7FB5]",
      accentText: "text-[#7EB3E8]",
    },
    {
      name: "Reino Editorial",
      href: "/app/companies/reino-editorial",
      tagline: "Publishing & distribution",
      activeProjects: 5,
      leads: 32,
      revenue: "$52.8K",
      recentActivity: "3 manuscripts entered production phase",
      initials: "RE",
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
      initials: "iK",
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
      initials: "IG",
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
