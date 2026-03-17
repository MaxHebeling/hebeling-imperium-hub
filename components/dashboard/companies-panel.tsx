"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Network, Users, Sparkles } from "lucide-react";

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

// Premium Covenant Core Card - Central Intelligence Layer
function CovenantCoreCard() {
  return (
    <Link href="/covenant" className="block col-span-full">
      <div
        className="group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:translate-y-[-2px]"
        style={{
          background: "linear-gradient(135deg, #0B1420 0%, #132033 50%, #1B2430 100%)",
          border: "1px solid #21D1AC40",
          boxShadow: "0 4px 24px rgba(33, 209, 172, 0.1), 0 2px 12px rgba(0,0,0,0.2)",
        }}
      >
        {/* Animated gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, #21D1AC, #C9A96E, transparent)",
          }}
        />
        
        {/* Subtle glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 30% 50%, rgba(33, 209, 172, 0.1) 0%, transparent 50%)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Premium Logo */}
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #21D1AC 0%, #1a9f85 100%)",
                boxShadow: "0 4px 20px rgba(33, 209, 172, 0.3)",
              }}
            >
              <Network className="h-7 w-7 text-white" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }}
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white group-hover:text-[#21D1AC] transition-colors">
                  Covenant Core
                </h3>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: "linear-gradient(135deg, #C9A96E 0%, #a88a5a 100%)",
                    color: "#0B1420",
                  }}
                >
                  Intelligence
                </span>
              </div>
              <p className="text-sm text-[#C7CED8]">
                Relationship Intelligence Platform
              </p>
              <p className="text-xs text-[#8A95A5] mt-1">
                Unified CRM across Editorial, iKingdom, Imperium & Ministerio
              </p>
            </div>
          </div>

          {/* Stats & CTA */}
          <div className="flex items-center gap-6">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#21D1AC]" />
                  <span className="text-lg font-bold text-white">2,847</span>
                </div>
                <p className="text-[10px] text-[#8A95A5] uppercase tracking-wide">People</p>
              </div>
              <div className="w-px h-8 bg-[#1E3048]" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A96E]" />
                  <span className="text-lg font-bold text-white">47</span>
                </div>
                <p className="text-[10px] text-[#8A95A5] uppercase tracking-wide">Insights</p>
              </div>
            </div>

            <ArrowUpRight className="w-5 h-5 text-[#8A95A5] group-hover:text-[#21D1AC] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
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
      logo: "/logo-red-apostolica.png",
      accentBg: "bg-amber-600",
      accentText: "text-amber-400",
    },
    {
      name: "Reino Editorial",
      href: "/app/editorial",
      tagline: "Publishing & distribution",
      activeProjects: 5,
      leads: 32,
      revenue: "$52.8K",
      recentActivity: "3 manuscripts entered production phase",
      logo: "/logo-reino-editorial.png",
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
      logo: "/logo-ikingdom.png",
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
      logo: "/logo-imperium.png",
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
        {/* Covenant Core - Central Intelligence Layer */}
        <CovenantCoreCard />
        
        {/* Portfolio Companies */}
        {companies.map((company) => (
          <CompanyCard key={company.name} {...company} />
        ))}
      </div>
    </div>
  );
}
