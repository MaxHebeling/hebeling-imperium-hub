"use client";

import Link from "next/link";
import { ArrowUpRight, Users, Zap, BarChart3 } from "lucide-react";

interface CompanyCardProps {
  name: string;
  href: string;
  activeProjects: number;
  leads: number;
  revenue: string;
  recentActivity: string;
  icon: React.ReactNode;
  color: string;
  accentColor: string;
}

function CompanyCard({
  name,
  href,
  activeProjects,
  leads,
  revenue,
  recentActivity,
  icon,
  color,
  accentColor,
}: CompanyCardProps) {
  return (
    <Link href={href}>
      <div className="group relative overflow-hidden rounded-lg border border-border/40 bg-card/50 p-6 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 cursor-pointer h-full">
        {/* Accent gradient on hover */}
        <div
          className={`absolute inset-0 ${accentColor} opacity-0 group-hover:opacity-5 transition-all duration-300`}
        />

        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} opacity-0 group-hover:opacity-100 transition-all duration-300`} />

        <div className="relative z-10 space-y-4">
          {/* Header with Icon */}
          <div className="flex items-start justify-between">
            <div className={`${color} text-2xl`}>{icon}</div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:text-amber-400/80" />
          </div>

          {/* Company Name */}
          <h3 className="text-lg font-semibold text-foreground group-hover:text-amber-400/90 transition-colors">
            {name}
          </h3>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground/70">Active Projects</p>
              <p className="text-xl font-bold text-foreground mt-1">{activeProjects}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70">Leads</p>
              <p className="text-xl font-bold text-foreground mt-1">{leads}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70">Revenue</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{revenue}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground/70">Recent Activity</p>
            <p className="text-sm text-muted-foreground mt-1">{recentActivity}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CompaniesPanel() {
  const companies: CompanyCardProps[] = [
    {
      name: "Max Hebeling",
      href: "/app/companies/max-hebeling",
      activeProjects: 3,
      leads: 18,
      revenue: "$45.2K",
      recentActivity: "New deal closed with Enterprise client",
      icon: "👤",
      color: "text-blue-400",
      accentColor: "bg-blue-400",
    },
    {
      name: "Reino Editorial",
      href: "/app/companies/reino-editorial",
      activeProjects: 5,
      leads: 32,
      revenue: "$52.8K",
      recentActivity: "3 manuscripts in production phase",
      icon: "📚",
      color: "text-amber-400",
      accentColor: "bg-amber-400",
    },
    {
      name: "iKingdom",
      href: "/app/companies/ikingdom",
      activeProjects: 2,
      leads: 12,
      revenue: "$18.5K",
      recentActivity: "New partnership agreement signed",
      icon: "👑",
      color: "text-cyan-400",
      accentColor: "bg-cyan-400",
    },
    {
      name: "Imperium Group",
      href: "/app/companies/imperium",
      activeProjects: 4,
      leads: 28,
      revenue: "$61.3K",
      recentActivity: "Q1 expansion strategy initiated",
      icon: "🏢",
      color: "text-emerald-400",
      accentColor: "bg-emerald-400",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Companies</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((company) => (
          <CompanyCard key={company.name} {...company} />
        ))}
      </div>
    </div>
  );
}
