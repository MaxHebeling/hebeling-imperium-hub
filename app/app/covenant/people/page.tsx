"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  UserPlus,
  MapPin,
  Mail,
  Phone,
  Building2,
  Star,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/* ═══════════════════════════════════════════════════════════════
   COVENANT CORE — People Directory
   Premium luxury CRM contact registry
   ═══════════════════════════════════════════════════════════════ */

interface Person {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  profession: string;
  email: string;
  phone: string;
  tags: { label: string; color: string }[];
  linkedCompanies: { name: string; role: string; color: string }[];
  opportunityScore: number;
  lastActivity: string;
}

// Contact Card Component
function PersonCard({ person }: { person: Person }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399" };
    if (score >= 60) return { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24" };
    return { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af" };
  };

  const scoreStyle = getScoreColor(person.opportunityScore);

  return (
    <Link href={`/app/covenant/people/${person.id}`}>
      <div
        className="rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px] group cursor-pointer relative overflow-hidden"
        style={{
          backgroundColor: "var(--covenant-card)",
          border: "1px solid var(--covenant-border)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 0%, var(--covenant-accent-glow) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between relative mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--covenant-accent), var(--covenant-gold))",
                color: "var(--covenant-bg)",
              }}
            >
              {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h3
                className="font-semibold group-hover:text-[var(--covenant-accent)] transition-colors"
                style={{ color: "var(--covenant-text)" }}
              >
                {person.name}
              </h3>
              <p className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
                {person.profession}
              </p>
            </div>
          </div>
          
          {/* Opportunity Score */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ backgroundColor: scoreStyle.bg }}
          >
            <Star className="h-3 w-3" style={{ color: scoreStyle.text }} />
            <span className="text-xs font-semibold" style={{ color: scoreStyle.text }}>
              {person.opportunityScore}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="h-3 w-3" style={{ color: "var(--covenant-text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
            {person.location}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {person.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
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

        {/* Linked Companies */}
        <div
          className="pt-3 border-t"
          style={{ borderColor: "var(--covenant-border)" }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "var(--covenant-text-muted)" }}
          >
            Linked Companies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {person.linkedCompanies.map((company, i) => (
              <span
                key={i}
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${company.color}15`,
                  color: company.color,
                }}
              >
                {company.name}: {company.role}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Contact */}
        <div
          className="flex items-center gap-3 mt-4 pt-3 border-t"
          style={{ borderColor: "var(--covenant-border)" }}
        >
          <a
            href={`mailto:${person.email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--covenant-accent)]"
            style={{ color: "var(--covenant-text-muted)" }}
          >
            <Mail className="h-3 w-3" />
            Email
          </a>
          <a
            href={`tel:${person.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--covenant-accent)]"
            style={{ color: "var(--covenant-text-muted)" }}
          >
            <Phone className="h-3 w-3" />
            Call
          </a>
          <span
            className="text-[10px] ml-auto"
            style={{ color: "var(--covenant-text-muted)" }}
          >
            {person.lastActivity}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Person Row Component for List View
function PersonRow({ person }: { person: Person }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399" };
    if (score >= 60) return { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24" };
    return { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af" };
  };

  const scoreStyle = getScoreColor(person.opportunityScore);

  return (
    <Link href={`/app/covenant/people/${person.id}`}>
      <div
        className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-[var(--covenant-bg-secondary)] cursor-pointer group"
      >
        {/* Avatar */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--covenant-accent), var(--covenant-gold))",
            color: "var(--covenant-bg)",
          }}
        >
          {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>

        {/* Name & Profession */}
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-sm group-hover:text-[var(--covenant-accent)] transition-colors truncate"
            style={{ color: "var(--covenant-text)" }}
          >
            {person.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--covenant-text-muted)" }}>
            {person.profession}
          </p>
        </div>

        {/* Location */}
        <div className="hidden md:flex items-center gap-1.5 w-32">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--covenant-text-muted)" }} />
          <span className="text-xs truncate" style={{ color: "var(--covenant-text-muted)" }}>
            {person.location}
          </span>
        </div>

        {/* Tags */}
        <div className="hidden lg:flex items-center gap-1 w-48">
          {person.tags.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.label}
            </span>
          ))}
          {person.tags.length > 2 && (
            <span className="text-[10px]" style={{ color: "var(--covenant-text-muted)" }}>
              +{person.tags.length - 2}
            </span>
          )}
        </div>

        {/* Companies */}
        <div className="hidden xl:flex items-center gap-1 w-40">
          {person.linkedCompanies.slice(0, 2).map((company, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${company.color}15`,
                color: company.color,
              }}
            >
              {company.name}
            </span>
          ))}
        </div>

        {/* Score */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full w-14 justify-center"
          style={{ backgroundColor: scoreStyle.bg }}
        >
          <Star className="h-3 w-3" style={{ color: scoreStyle.text }} />
          <span className="text-xs font-semibold" style={{ color: scoreStyle.text }}>
            {person.opportunityScore}
          </span>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--covenant-text-muted)" }}
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
              <Mail className="h-4 w-4 mr-2" /> Send Email
            </DropdownMenuItem>
            <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>
              <Phone className="h-4 w-4 mr-2" /> Call
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: "var(--covenant-border)" }} />
            <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>
              <Building2 className="h-4 w-4 mr-2" /> View Companies
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}

export default function PeoplePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data
  const people: Person[] = [
    {
      id: "1",
      name: "Juan Pérez",
      location: "Madrid, Spain",
      profession: "Business Executive",
      email: "juan.perez@email.com",
      phone: "+34 612 345 678",
      tags: [
        { label: "Author", color: "#3b82f6" },
        { label: "Client", color: "#8b5cf6" },
        { label: "Gold Investor", color: "#f59e0b" },
        { label: "Leader", color: "#ec4899" },
      ],
      linkedCompanies: [
        { name: "Editorial", role: "Author", color: "#3b82f6" },
        { name: "iKingdom", role: "Client", color: "#8b5cf6" },
        { name: "Imperium", role: "Gold Investor", color: "#f59e0b" },
        { name: "Ministerio", role: "Leader", color: "#ec4899" },
      ],
      opportunityScore: 95,
      lastActivity: "2 hours ago",
    },
    {
      id: "2",
      name: "María González",
      location: "Barcelona, Spain",
      profession: "Author & Speaker",
      email: "maria.gonzalez@email.com",
      phone: "+34 623 456 789",
      tags: [
        { label: "Author", color: "#3b82f6" },
        { label: "Speaker", color: "#ec4899" },
      ],
      linkedCompanies: [
        { name: "Editorial", role: "Bestselling Author", color: "#3b82f6" },
        { name: "Ministerio", role: "Speaker", color: "#ec4899" },
      ],
      opportunityScore: 82,
      lastActivity: "1 day ago",
    },
    {
      id: "3",
      name: "Carlos Rodríguez",
      location: "Mexico City, Mexico",
      profession: "Investor & Entrepreneur",
      email: "carlos.rodriguez@email.com",
      phone: "+52 55 1234 5678",
      tags: [
        { label: "Platinum Investor", color: "#f59e0b" },
        { label: "Strategic Partner", color: "#8b5cf6" },
      ],
      linkedCompanies: [
        { name: "Imperium", role: "Platinum Investor", color: "#f59e0b" },
        { name: "iKingdom", role: "Strategic Partner", color: "#8b5cf6" },
      ],
      opportunityScore: 88,
      lastActivity: "3 hours ago",
    },
    {
      id: "4",
      name: "Ana Martínez",
      location: "Buenos Aires, Argentina",
      profession: "Digital Marketing Expert",
      email: "ana.martinez@email.com",
      phone: "+54 11 2345 6789",
      tags: [
        { label: "Client", color: "#8b5cf6" },
        { label: "Prospect", color: "#22c55e" },
      ],
      linkedCompanies: [
        { name: "iKingdom", role: "Enterprise Client", color: "#8b5cf6" },
      ],
      opportunityScore: 75,
      lastActivity: "5 days ago",
    },
    {
      id: "5",
      name: "Roberto Silva",
      location: "São Paulo, Brazil",
      profession: "Ministry Director",
      email: "roberto.silva@email.com",
      phone: "+55 11 98765 4321",
      tags: [
        { label: "Gold Investor", color: "#f59e0b" },
        { label: "Ministry Leader", color: "#ec4899" },
      ],
      linkedCompanies: [
        { name: "Imperium", role: "Gold Investor", color: "#f59e0b" },
        { name: "Ministerio", role: "Regional Director", color: "#ec4899" },
      ],
      opportunityScore: 91,
      lastActivity: "1 hour ago",
    },
    {
      id: "6",
      name: "Elena Torres",
      location: "Lima, Peru",
      profession: "Publisher & Editor",
      email: "elena.torres@email.com",
      phone: "+51 1 234 5678",
      tags: [
        { label: "Author", color: "#3b82f6" },
        { label: "Editor", color: "#6366f1" },
      ],
      linkedCompanies: [
        { name: "Editorial", role: "Senior Editor", color: "#3b82f6" },
      ],
      opportunityScore: 68,
      lastActivity: "2 days ago",
    },
  ];

  const filteredPeople = people.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen p-6 md:p-8 space-y-6"
      style={{ backgroundColor: "var(--covenant-bg)" }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-1"
            style={{ color: "var(--covenant-accent)" }}
          >
            People Directory
          </p>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--covenant-text)" }}
          >
            Ecosystem Contacts
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--covenant-text-muted)" }}>
            {people.length} people across all business units
          </p>
        </div>
        <Button
          className="gap-2"
          style={{
            backgroundColor: "var(--covenant-accent)",
            color: "var(--covenant-bg)",
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* Filters & Search */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl"
        style={{
          backgroundColor: "var(--covenant-card)",
          border: "1px solid var(--covenant-border)",
        }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--covenant-text-muted)" }}
          />
          <Input
            placeholder="Search by name, profession, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-0"
            style={{
              backgroundColor: "var(--covenant-bg-secondary)",
              color: "var(--covenant-text)",
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                style={{
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                  backgroundColor: "transparent",
                }}
              >
                <Filter className="h-4 w-4" />
                Company
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                backgroundColor: "var(--covenant-card)",
                borderColor: "var(--covenant-border)",
              }}
            >
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>All Companies</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Editorial</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>iKingdom</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Imperium</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Ministerio</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                style={{
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                  backgroundColor: "transparent",
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                backgroundColor: "var(--covenant-card)",
                borderColor: "var(--covenant-border)",
              }}
            >
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Name A-Z</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Score (High to Low)</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Recent Activity</DropdownMenuItem>
              <DropdownMenuItem style={{ color: "var(--covenant-text)" }}>Date Added</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div
            className="flex items-center rounded-lg p-1"
            style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              style={{
                backgroundColor: viewMode === "grid" ? "var(--covenant-card)" : "transparent",
                color: viewMode === "grid" ? "var(--covenant-accent)" : "var(--covenant-text-muted)",
              }}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
              style={{
                backgroundColor: viewMode === "list" ? "var(--covenant-card)" : "transparent",
                color: viewMode === "list" ? "var(--covenant-accent)" : "var(--covenant-text-muted)",
              }}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* People Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--covenant-card)",
            border: "1px solid var(--covenant-border)",
          }}
        >
          {/* List Header */}
          <div
            className="flex items-center gap-4 px-4 py-3 text-xs font-medium uppercase tracking-wider border-b"
            style={{
              backgroundColor: "var(--covenant-bg-secondary)",
              borderColor: "var(--covenant-border)",
              color: "var(--covenant-text-muted)",
            }}
          >
            <div className="w-10" />
            <div className="flex-1">Name</div>
            <div className="hidden md:block w-32">Location</div>
            <div className="hidden lg:block w-48">Tags</div>
            <div className="hidden xl:block w-40">Companies</div>
            <div className="w-14 text-center">Score</div>
            <div className="w-8" />
          </div>
          
          {/* List Body */}
          <div className="divide-y" style={{ borderColor: "var(--covenant-border)" }}>
            {filteredPeople.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPeople.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{
            backgroundColor: "var(--covenant-card)",
            border: "1px solid var(--covenant-border)",
          }}
        >
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
          >
            <Search className="h-8 w-8" style={{ color: "var(--covenant-text-muted)" }} />
          </div>
          <p className="text-lg font-medium" style={{ color: "var(--covenant-text)" }}>
            No people found
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--covenant-text-muted)" }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
