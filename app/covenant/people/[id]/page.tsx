"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Star,
  Building2,
  FileText,
  Sparkles,
  ExternalLink,
  Edit2,
  MoreHorizontal,
  Clock,
  TrendingUp,
  Target,
  Users,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/* ═══════════════════════════════════════════════════════════════
   COVENANT CORE — Person Profile Detail View
   Premium profile page with complete relationship intelligence
   ═══════════════════════════════════════════════════════════════ */

// Sample person data (in real app, would fetch from database)
const peopleData: Record<string, {
  id: string;
  name: string;
  profession: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  opportunityScore: number;
  tags: { label: string; color: string }[];
  linkedCompanies: { name: string; role: string; color: string; since: string }[];
  notes: string;
  projects: { name: string; company: string; status: string; color: string }[];
  timeline: { date: string; event: string; type: string }[];
  aiRecommendations: { insight: string; action: string; confidence: "high" | "medium" }[];
}> = {
  "1": {
    id: "1",
    name: "Juan Pérez",
    profession: "Business Executive & Author",
    location: "Madrid, Spain",
    email: "juan.perez@email.com",
    phone: "+34 612 345 678",
    whatsapp: "+34 612 345 678",
    opportunityScore: 95,
    tags: [
      { label: "Author", color: "#3b82f6" },
      { label: "Client", color: "#8b5cf6" },
      { label: "Gold Investor", color: "#f59e0b" },
      { label: "Leader", color: "#ec4899" },
    ],
    linkedCompanies: [
      { name: "Editorial", role: "Author", color: "#3b82f6", since: "2021" },
      { name: "iKingdom", role: "Enterprise Client", color: "#8b5cf6", since: "2022" },
      { name: "Imperium", role: "Gold Investor", color: "#f59e0b", since: "2023" },
      { name: "Ministerio", role: "Regional Leader", color: "#ec4899", since: "2020" },
    ],
    notes: "Key relationship across all business units. Has expressed interest in expanding investment portfolio and publishing a second book in 2024. Prefers communication via WhatsApp. Very responsive and engaged with all ecosystem activities.",
    projects: [
      { name: "Leadership Principles Book", company: "Editorial", status: "Published", color: "#22c55e" },
      { name: "Digital Transformation Project", company: "iKingdom", status: "In Progress", color: "#3b82f6" },
      { name: "Gold Investment Portfolio", company: "Imperium", status: "Active", color: "#f59e0b" },
      { name: "Madrid Leadership Summit", company: "Ministerio", status: "Upcoming", color: "#8b5cf6" },
    ],
    timeline: [
      { date: "2 hours ago", event: "Joined Gold Investor program at Imperium", type: "milestone" },
      { date: "1 week ago", event: "Completed iKingdom digital audit", type: "project" },
      { date: "2 weeks ago", event: "Book reached 5,000 copies sold", type: "achievement" },
      { date: "1 month ago", event: "Attended annual leadership conference", type: "event" },
      { date: "2 months ago", event: "Started second book manuscript", type: "project" },
      { date: "6 months ago", event: "Referred 3 new authors to Editorial", type: "referral" },
    ],
    aiRecommendations: [
      { insight: "Cross-selling opportunity: Based on iKingdom engagement, recommend Premium Support tier upgrade worth $25K annually.", action: "Schedule review call", confidence: "high" },
      { insight: "Juan's second book manuscript is 60% complete. Consider fast-tracking editorial review to maintain momentum.", action: "Assign editor", confidence: "high" },
      { insight: "Investor profile suggests readiness for Platinum tier ($100K+). Recent liquidity event confirmed.", action: "Send invitation", confidence: "medium" },
    ],
  },
};

// Default person for IDs not in our sample data
const defaultPerson = {
  id: "default",
  name: "Contact Profile",
  profession: "Professional",
  location: "Location",
  email: "contact@email.com",
  phone: "+1 234 567 890",
  whatsapp: "+1 234 567 890",
  opportunityScore: 75,
  tags: [{ label: "Contact", color: "#6b7280" }],
  linkedCompanies: [],
  notes: "No additional notes available.",
  projects: [],
  timeline: [],
  aiRecommendations: [],
};

// Timeline Event Component
function TimelineEvent({
  date,
  event,
  type,
  isLast,
}: {
  date: string;
  event: string;
  type: string;
  isLast: boolean;
}) {
  const typeIcons: Record<string, { icon: React.ElementType; color: string }> = {
    milestone: { icon: Star, color: "#f59e0b" },
    project: { icon: Briefcase, color: "#3b82f6" },
    achievement: { icon: TrendingUp, color: "#22c55e" },
    event: { icon: Calendar, color: "#8b5cf6" },
    referral: { icon: Users, color: "#ec4899" },
  };

  const { icon: Icon, color } = typeIcons[type] || { icon: Clock, color: "var(--covenant-text-muted)" };

  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 my-1"
            style={{ backgroundColor: "var(--covenant-border)" }}
          />
        )}
      </div>
      
      {/* Event content */}
      <div className="pb-4">
        <p className="text-sm" style={{ color: "var(--covenant-text)" }}>
          {event}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--covenant-text-muted)" }}>
          {date}
        </p>
      </div>
    </div>
  );
}

// AI Recommendation Card
function AIRecommendationCard({
  insight,
  action,
  confidence,
}: {
  insight: string;
  action: string;
  confidence: "high" | "medium";
}) {
  return (
    <div
      className="p-4 rounded-xl relative overflow-hidden"
      style={{
        backgroundColor: "var(--covenant-bg-secondary)",
        border: "1px solid var(--covenant-gold)20",
      }}
    >
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
          <div className="flex items-center gap-3 mt-3">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: confidence === "high" ? "rgba(52, 211, 153, 0.15)" : "rgba(251, 191, 36, 0.15)",
                color: confidence === "high" ? "#34d399" : "#fbbf24",
              }}
            >
              {confidence === "high" ? "High confidence" : "Medium confidence"}
            </span>
            <Button
              size="sm"
              className="h-7 text-xs"
              style={{
                backgroundColor: "var(--covenant-accent)",
                color: "var(--covenant-bg)",
              }}
            >
              {action}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const person = peopleData[resolvedParams.id] || defaultPerson;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399", label: "Excellent" };
    if (score >= 60) return { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24", label: "Good" };
    return { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af", label: "Average" };
  };

  const scoreStyle = getScoreColor(person.opportunityScore);

  return (
    <div
      className="min-h-screen p-6 md:p-8 space-y-6"
      style={{ backgroundColor: "var(--covenant-bg)" }}
    >
      {/* Back Navigation */}
      <Link
        href="/app/covenant/people"
        className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[var(--covenant-accent)]"
        style={{ color: "var(--covenant-text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to People
      </Link>

      {/* Profile Header */}
      <div
        className="rounded-xl p-6 relative overflow-hidden"
        style={{
          backgroundColor: "var(--covenant-card)",
          border: "1px solid var(--covenant-border)",
        }}
      >
        {/* Background gradient accent */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 100% 0%, var(--covenant-accent-glow) 0%, transparent 50%)",
          }}
        />
        
        <div className="relative flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-4 flex-1">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--covenant-accent), var(--covenant-gold))",
                color: "var(--covenant-bg)",
                boxShadow: "0 8px 32px var(--covenant-accent-glow)",
              }}
            >
              {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--covenant-text)" }}
                  >
                    {person.name}
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: "var(--covenant-text-muted)" }}>
                    {person.profession}
                  </p>
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="h-4 w-4" style={{ color: "var(--covenant-text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--covenant-text-muted)" }}>
                  {person.location}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {person.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      border: `1px solid ${tag.color}30`,
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Score */}
          <div className="flex flex-col items-end gap-4">
            {/* Opportunity Score */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: scoreStyle.bg }}
            >
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: scoreStyle.text }}>
                  Opportunity Score
                </p>
                <p className="text-xs" style={{ color: scoreStyle.text }}>
                  {scoreStyle.label}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5" style={{ color: scoreStyle.text }} />
                <span className="text-2xl font-bold" style={{ color: scoreStyle.text }}>
                  {person.opportunityScore}
                </span>
              </div>
            </div>

            {/* Quick Contact Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2"
                style={{
                  backgroundColor: "var(--covenant-accent)",
                  color: "var(--covenant-bg)",
                }}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                style={{
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                  backgroundColor: "transparent",
                }}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                style={{
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                  backgroundColor: "transparent",
                }}
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    style={{
                      borderColor: "var(--covenant-border)",
                      color: "var(--covenant-text)",
                      backgroundColor: "transparent",
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  style={{
                    backgroundColor: "var(--covenant-card)",
                    borderColor: "var(--covenant-border)",
                  }}
                >
                  <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>
                    <FileText className="h-4 w-4 mr-2" /> Add Note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: "var(--covenant-border)" }} />
                  <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>
                    <Target className="h-4 w-4 mr-2" /> Create Opportunity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--covenant-card)",
              border: "1px solid var(--covenant-border)",
            }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" style={{ color: "var(--covenant-accent)" }} />
                  <span className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>Email</span>
                </div>
                <a
                  href={`mailto:${person.email}`}
                  className="text-sm font-medium hover:text-[var(--covenant-accent)] transition-colors"
                  style={{ color: "var(--covenant-text)" }}
                >
                  {person.email}
                </a>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" style={{ color: "var(--covenant-accent)" }} />
                  <span className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>Phone</span>
                </div>
                <a
                  href={`tel:${person.phone}`}
                  className="text-sm font-medium hover:text-[var(--covenant-accent)] transition-colors"
                  style={{ color: "var(--covenant-text)" }}
                >
                  {person.phone}
                </a>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4" style={{ color: "var(--covenant-accent)" }} />
                  <span className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>WhatsApp</span>
                </div>
                <a
                  href={`https://wa.me/${person.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-[var(--covenant-accent)] transition-colors flex items-center gap-1"
                  style={{ color: "var(--covenant-text)" }}
                >
                  {person.whatsapp}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Linked Companies */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--covenant-card)",
              border: "1px solid var(--covenant-border)",
            }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              Linked Companies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {person.linkedCompanies.map((company, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl flex items-center gap-4 transition-colors hover:bg-[var(--covenant-bg-secondary)]"
                  style={{
                    backgroundColor: "var(--covenant-bg-secondary)",
                    border: `1px solid ${company.color}30`,
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${company.color}20` }}
                  >
                    <Building2 className="h-5 w-5" style={{ color: company.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: "var(--covenant-text)" }}>
                      {company.name}
                    </p>
                    <p className="text-xs" style={{ color: company.color }}>
                      {company.role}
                    </p>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--covenant-text-muted)" }}>
                    Since {company.since}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--covenant-card)",
              border: "1px solid var(--covenant-border)",
            }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              Projects & Engagements
            </h2>
            <div className="space-y-2">
              {person.projects.map((project, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-[var(--covenant-bg-secondary)]"
                  style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--covenant-text)" }}>
                        {project.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
                        {project.company}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${project.color}20`,
                      color: project.color,
                    }}
                  >
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--covenant-card)",
              border: "1px solid var(--covenant-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "var(--covenant-text-muted)" }}
              >
                Notes
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                style={{ color: "var(--covenant-accent)" }}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--covenant-text)" }}>
              {person.notes}
            </p>
          </div>
        </div>

        {/* Right Column - Timeline & AI */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              backgroundColor: "var(--covenant-card)",
              border: "1px solid var(--covenant-gold)30",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, var(--covenant-gold), transparent)",
              }}
            />
            
            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--covenant-gold-glow)" }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "var(--covenant-gold)" }} />
              </div>
              <h2
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "var(--covenant-gold)" }}
              >
                AI Recommendations
              </h2>
            </div>
            
            <div className="space-y-3">
              {person.aiRecommendations.map((rec, i) => (
                <AIRecommendationCard key={i} {...rec} />
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--covenant-card)",
              border: "1px solid var(--covenant-border)",
            }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              Activity Timeline
            </h2>
            <div>
              {person.timeline.map((event, i) => (
                <TimelineEvent
                  key={i}
                  date={event.date}
                  event={event.event}
                  type={event.type}
                  isLast={i === person.timeline.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
