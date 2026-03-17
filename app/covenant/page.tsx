"use client";

import { Users, Briefcase, TrendingUp, BookOpen, Church, Target, ArrowUpRight, ArrowDownRight, Sparkles, Activity, Building2, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   COVENANT CORE — Overview Dashboard
   Premium Relationship Intelligence Platform
   ═══════════════════════════════════════════════════════════════ */

// KPI Card Component
function KPICard({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  accentColor = "var(--covenant-accent)",
}: {
  title: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ElementType;
  accentColor?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px] group"
      style={{
        backgroundColor: "var(--covenant-card)",
        border: "1px solid var(--covenant-border)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* Subtle glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accentColor}10 0%, transparent 70%)`,
        }}
      />
      
      <div className="flex items-start justify-between relative">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-2"
            style={{ color: "var(--covenant-text-muted)" }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--covenant-text)" }}
          >
            {value}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            ) : null}
            <span
              className="text-xs font-medium"
              style={{
                color: trend === "up" ? "#34d399" : trend === "down" ? "#f87171" : "var(--covenant-text-muted)",
              }}
            >
              {trendValue}
            </span>
          </div>
        </div>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: `${accentColor}15`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}

// Relationship Network Card
function RelationshipCard({
  name,
  roles,
}: {
  name: string;
  roles: { company: string; role: string; color: string }[];
}) {
  return (
    <div
      className="p-4 rounded-xl transition-all duration-200 hover:translate-y-[-1px]"
      style={{
        backgroundColor: "var(--covenant-bg-secondary)",
        border: "1px solid var(--covenant-border-subtle)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, var(--covenant-accent), var(--covenant-gold))",
            color: "var(--covenant-bg)",
          }}
        >
          {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="font-medium" style={{ color: "var(--covenant-text)" }}>{name}</p>
          <p className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
            {roles.length} ecosystem connections
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role, i) => (
          <span
            key={i}
            className="text-[10px] font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${role.color}20`,
              color: role.color,
              border: `1px solid ${role.color}30`,
            }}
          >
            {role.role} in {role.company}
          </span>
        ))}
      </div>
    </div>
  );
}

// Activity Item
function ActivityItem({
  type,
  message,
  time,
  icon: Icon,
  iconColor,
}: {
  type: string;
  message: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--covenant-text)" }}
        >
          {message}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--covenant-text-muted)" }}>
          {time}
        </p>
      </div>
    </div>
  );
}

// AI Insight Card
function AIInsightCard({
  insight,
  confidence,
  action,
}: {
  insight: string;
  confidence: "high" | "medium";
  action: string;
}) {
  return (
    <div
      className="p-4 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-200 hover:translate-y-[-1px]"
      style={{
        backgroundColor: "var(--covenant-bg-secondary)",
        border: "1px solid var(--covenant-gold)20",
      }}
    >
      {/* Gold accent glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, var(--covenant-gold), transparent)",
        }}
      />
      
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--covenant-gold-glow)" }}
        >
          <Sparkles className="h-4 w-4" style={{ color: "var(--covenant-gold)" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm" style={{ color: "var(--covenant-text)" }}>
            {insight}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: confidence === "high" ? "rgba(52, 211, 153, 0.15)" : "rgba(251, 191, 36, 0.15)",
                color: confidence === "high" ? "#34d399" : "#fbbf24",
              }}
            >
              {confidence === "high" ? "High confidence" : "Medium confidence"}
            </span>
            <span className="text-xs" style={{ color: "var(--covenant-accent)" }}>
              {action}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Opportunity Row
function OpportunityRow({
  name,
  company,
  type,
  value,
  status,
  nextStep,
}: {
  name: string;
  company: string;
  type: string;
  value: string;
  status: "hot" | "warm" | "cold";
  nextStep: string;
}) {
  const statusColors = {
    hot: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", label: "Hot" },
    warm: { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24", label: "Warm" },
    cold: { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af", label: "Cold" },
  };

  return (
    <div
      className="flex items-center gap-4 py-3 px-4 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-[var(--covenant-bg-secondary)]"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" style={{ color: "var(--covenant-text)" }}>
          {name}
        </p>
        <p className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
          {company}
        </p>
      </div>
      <div className="hidden sm:block w-24">
        <span className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
          {type}
        </span>
      </div>
      <div className="w-20 text-right">
        <span
          className="font-semibold text-sm"
          style={{ color: "var(--covenant-gold)" }}
        >
          {value}
        </span>
      </div>
      <div className="w-16">
        <span
          className="text-[10px] font-medium px-2 py-1 rounded-full"
          style={{
            backgroundColor: statusColors[status].bg,
            color: statusColors[status].text,
          }}
        >
          {statusColors[status].label}
        </span>
      </div>
      <div className="hidden md:block w-36">
        <span className="text-xs truncate" style={{ color: "var(--covenant-text-muted)" }}>
          {nextStep}
        </span>
      </div>
      <ExternalLink className="h-4 w-4" style={{ color: "var(--covenant-text-muted)" }} />
    </div>
  );
}

export default function CovenantOverviewPage() {
  const kpis = [
    { title: "People in Ecosystem", value: "2,847", trend: "up" as const, trendValue: "+12% this month", icon: Users, accentColor: "var(--covenant-accent)" },
    { title: "Active Clients", value: "342", trend: "up" as const, trendValue: "+8% this quarter", icon: Briefcase, accentColor: "#3b82f6" },
    { title: "Investors", value: "156", trend: "up" as const, trendValue: "+23% YoY", icon: TrendingUp, accentColor: "var(--covenant-gold)" },
    { title: "Authors", value: "89", trend: "neutral" as const, trendValue: "Stable", icon: BookOpen, accentColor: "#8b5cf6" },
    { title: "Ministry Leaders", value: "234", trend: "up" as const, trendValue: "+5 this week", icon: Church, accentColor: "#ec4899" },
    { title: "High-Value Opportunities", value: "47", trend: "up" as const, trendValue: "$2.4M pipeline", icon: Target, accentColor: "#f59e0b" },
  ];

  const relationshipExamples = [
    {
      name: "Juan Pérez",
      roles: [
        { company: "Editorial", role: "Author", color: "#3b82f6" },
        { company: "iKingdom", role: "Client", color: "#8b5cf6" },
        { company: "Imperium", role: "Gold Investor", color: "#f59e0b" },
        { company: "Ministerio", role: "Leader", color: "#ec4899" },
      ],
    },
    {
      name: "María González",
      roles: [
        { company: "Editorial", role: "Author", color: "#3b82f6" },
        { company: "Ministerio", role: "Speaker", color: "#ec4899" },
      ],
    },
    {
      name: "Carlos Rodríguez",
      roles: [
        { company: "Imperium", role: "Platinum Investor", color: "#f59e0b" },
        { company: "iKingdom", role: "Strategic Partner", color: "#8b5cf6" },
      ],
    },
  ];

  const activities = [
    { type: "author", message: "New author registered: Ana Martínez", time: "2 minutes ago", icon: BookOpen, iconColor: "#3b82f6" },
    { type: "prospect", message: "iKingdom prospect qualified: Tech Solutions Corp", time: "15 minutes ago", icon: Building2, iconColor: "#8b5cf6" },
    { type: "investor", message: "New Gold investor: Roberto Silva", time: "1 hour ago", icon: TrendingUp, iconColor: "#f59e0b" },
    { type: "ministry", message: "Ministry member updated: Pastor García", time: "2 hours ago", icon: Church, iconColor: "#ec4899" },
    { type: "ai", message: "AI recommendation created for 5 contacts", time: "3 hours ago", icon: Sparkles, iconColor: "var(--covenant-gold)" },
  ];

  const aiInsights = [
    { insight: "Juan Pérez shows cross-ecosystem potential. Active engagement across 4 business units suggests readiness for premium tier upgrade.", confidence: "high" as const, action: "Schedule review" },
    { insight: "3 Editorial authors may qualify for iKingdom digital services based on recent publishing performance.", confidence: "high" as const, action: "View matches" },
    { insight: "2 Imperium investors should be invited to the next private event based on portfolio growth.", confidence: "medium" as const, action: "Add to event" },
    { insight: "5 ministry leaders match upcoming publishing opportunities in Q2 catalog.", confidence: "high" as const, action: "Create proposals" },
  ];

  const opportunities = [
    { name: "Enterprise Deal - TechCorp", company: "iKingdom", type: "Service", value: "$125K", status: "hot" as const, nextStep: "Contract review" },
    { name: "Publishing Package - Dr. Ruiz", company: "Editorial", type: "Publishing", value: "$45K", status: "warm" as const, nextStep: "Manuscript delivery" },
    { name: "Investment Round - Silva Family", company: "Imperium", type: "Investment", value: "$500K", status: "hot" as const, nextStep: "Due diligence" },
    { name: "Conference Sponsorship", company: "Ministerio", type: "Event", value: "$35K", status: "warm" as const, nextStep: "Proposal sent" },
    { name: "Digital Transformation", company: "iKingdom", type: "Project", value: "$85K", status: "cold" as const, nextStep: "Follow-up call" },
  ];

  return (
    <div
      className="min-h-screen p-6 md:p-8 space-y-8"
      style={{ backgroundColor: "var(--covenant-bg)" }}
    >
      {/* Hero Header */}
      <div className="mb-2">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
          style={{ color: "var(--covenant-accent)" }}
        >
          Covenant Core
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight text-balance"
          style={{ color: "var(--covenant-text)" }}
        >
          Welcome back, Max
        </h1>
        <p
          className="text-base mt-2 max-w-2xl"
          style={{ color: "var(--covenant-text-muted)" }}
        >
          Unified relationship intelligence across Editorial, iKingdom, Imperium and Ministerio.
        </p>
      </div>

      {/* Executive KPI Cards */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relationship Network Section */}
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{
            backgroundColor: "var(--covenant-card)",
            border: "1px solid var(--covenant-border)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--covenant-text)" }}
              >
                Relationship Network
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--covenant-text-muted)" }}>
                Cross-company relationship intelligence
              </p>
            </div>
            <Link
              href="/app/covenant/relationships"
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "var(--covenant-accent)" }}
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relationshipExamples.map((rel) => (
              <RelationshipCard key={rel.name} {...rel} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--covenant-card)",
            border: "1px solid var(--covenant-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--covenant-text)" }}
            >
              Recent Activity
            </h2>
            <Activity className="h-4 w-4" style={{ color: "var(--covenant-text-muted)" }} />
          </div>
          <div className="divide-y" style={{ borderColor: "var(--covenant-border)" }}>
            {activities.map((activity, i) => (
              <ActivityItem key={i} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <section
        className="rounded-xl p-6 relative overflow-hidden"
        style={{
          backgroundColor: "var(--covenant-card)",
          border: "1px solid var(--covenant-gold)30",
        }}
      >
        {/* Premium gold gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--covenant-gold), transparent)",
          }}
        />
        
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--covenant-gold-glow)" }}
            >
              <Sparkles className="h-5 w-5" style={{ color: "var(--covenant-gold)" }} />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--covenant-text)" }}
              >
                AI Insights
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--covenant-text-muted)" }}>
                Executive intelligence powered by relationship data
              </p>
            </div>
          </div>
          <Link
            href="/app/covenant/ai-insights"
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: "var(--covenant-gold)" }}
          >
            View all insights <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, i) => (
            <AIInsightCard key={i} {...insight} />
          ))}
        </div>
      </section>

      {/* Priority Opportunities */}
      <section
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--covenant-card)",
          border: "1px solid var(--covenant-border)",
        }}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--covenant-text)" }}
            >
              Priority Opportunities
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--covenant-text-muted)" }}>
              High-value deals requiring attention
            </p>
          </div>
          <Link
            href="/app/covenant/opportunities"
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: "var(--covenant-accent)" }}
          >
            View pipeline <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        
        {/* Table Header */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider border-y"
          style={{
            backgroundColor: "var(--covenant-bg-secondary)",
            borderColor: "var(--covenant-border)",
            color: "var(--covenant-text-muted)",
          }}
        >
          <div className="flex-1">Name</div>
          <div className="hidden sm:block w-24">Type</div>
          <div className="w-20 text-right">Value</div>
          <div className="w-16">Status</div>
          <div className="hidden md:block w-36">Next Step</div>
          <div className="w-4" />
        </div>
        
        {/* Table Body */}
        <div className="divide-y" style={{ borderColor: "var(--covenant-border)" }}>
          {opportunities.map((opp, i) => (
            <OpportunityRow key={i} {...opp} />
          ))}
        </div>
      </section>
    </div>
  );
}
