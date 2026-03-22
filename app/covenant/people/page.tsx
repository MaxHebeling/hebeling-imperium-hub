"use client";

import { useState, useEffect, useCallback } from "react";
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
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RelationshipTier = "vip" | "gold" | "standard" | "new";
import { Textarea } from "@/components/ui/textarea";
import type { CovenantPerson } from "@/lib/covenant/types";

/* ═══════════════════════════════════════════════════════════════
   COVENANT CORE — People Directory
   Premium luxury CRM contact registry with Supabase integration
   ═══════════════════════════════════════════════════════════════ */

// Contact Card Component
function PersonCard({ person, onRefresh }: { person: CovenantPerson; onRefresh: () => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399" };
    if (score >= 60) return { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24" };
    return { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af" };
  };

  const scoreStyle = getScoreColor(person.opportunity_score);
  const fullName = `${person.first_name} ${person.last_name}`;
  const initials = `${person.first_name?.[0] || ""}${person.last_name?.[0] || ""}`.toUpperCase();
  const location = [person.city, person.country].filter(Boolean).join(", ") || "No location";

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "vip": return "#f59e0b";
      case "gold": return "#eab308";
      case "standard": return "#3b82f6";
      default: return "#22c55e";
    }
  };

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
              {initials}
            </div>
            <div>
              <h3
                className="font-semibold group-hover:text-[var(--covenant-accent)] transition-colors"
                style={{ color: "var(--covenant-text)" }}
              >
                {fullName}
              </h3>
              <p className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
                {person.title || person.company || "No title"}
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
              {person.opportunity_score}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="h-3 w-3" style={{ color: "var(--covenant-text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--covenant-text-muted)" }}>
            {location}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
            style={{
              backgroundColor: `${getTierColor(person.relationship_tier)}20`,
              color: getTierColor(person.relationship_tier),
              border: `1px solid ${getTierColor(person.relationship_tier)}30`,
            }}
          >
            {person.relationship_tier}
          </span>
          {person.tags?.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                color: "#8b5cf6",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Company */}
        {person.company && (
          <div
            className="pt-3 border-t"
            style={{ borderColor: "var(--covenant-border)" }}
          >
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" style={{ color: "var(--covenant-text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--covenant-text-silver)" }}>
                {person.company}
              </span>
            </div>
          </div>
        )}

        {/* Quick Contact */}
        <div
          className="flex items-center gap-3 mt-4 pt-3 border-t"
          style={{ borderColor: "var(--covenant-border)" }}
        >
          {person.email && (
            <a
              href={`mailto:${person.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--covenant-accent)]"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              <Mail className="h-3 w-3" />
              Email
            </a>
          )}
          {person.phone && (
            <a
              href={`tel:${person.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--covenant-accent)]"
              style={{ color: "var(--covenant-text-muted)" }}
            >
              <Phone className="h-3 w-3" />
              Call
            </a>
          )}
          <span
            className="text-[10px] ml-auto"
            style={{ color: "var(--covenant-text-muted)" }}
          >
            {new Date(person.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Person Row Component for List View
function PersonRow({ person }: { person: CovenantPerson }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "rgba(52, 211, 153, 0.15)", text: "#34d399" };
    if (score >= 60) return { bg: "rgba(251, 191, 36, 0.15)", text: "#fbbf24" };
    return { bg: "rgba(156, 163, 175, 0.15)", text: "#9ca3af" };
  };

  const scoreStyle = getScoreColor(person.opportunity_score);
  const fullName = `${person.first_name} ${person.last_name}`;
  const initials = `${person.first_name?.[0] || ""}${person.last_name?.[0] || ""}`.toUpperCase();
  const location = [person.city, person.country].filter(Boolean).join(", ") || "—";

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
          {initials}
        </div>

        {/* Name & Profession */}
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-sm group-hover:text-[var(--covenant-accent)] transition-colors truncate"
            style={{ color: "var(--covenant-text)" }}
          >
            {fullName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--covenant-text-muted)" }}>
            {person.title || person.company || "No title"}
          </p>
        </div>

        {/* Location */}
        <div className="hidden md:flex items-center gap-1.5 w-32">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--covenant-text-muted)" }} />
          <span className="text-xs truncate" style={{ color: "var(--covenant-text-muted)" }}>
            {location}
          </span>
        </div>

        {/* Company */}
        <div className="hidden lg:block w-32">
          <span className="text-xs truncate" style={{ color: "var(--covenant-text-silver)" }}>
            {person.company || "—"}
          </span>
        </div>

        {/* Score */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full w-14 justify-center"
          style={{ backgroundColor: scoreStyle.bg }}
        >
          <Star className="h-3 w-3" style={{ color: scoreStyle.text }} />
          <span className="text-xs font-semibold" style={{ color: scoreStyle.text }}>
            {person.opportunity_score}
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

// Add Person Modal
function AddPersonModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    title: "",
    company: "",
    city: "",
    country: "",
    relationship_tier: "new" as RelationshipTier,
    opportunity_score: 50,
    tags: [] as string[],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/covenant/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create person");
      }

      onSuccess();
      onClose();
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        title: "",
        company: "",
        city: "",
        country: "",
        relationship_tier: "new",
        opportunity_score: 50,
        tags: [],
        notes: "",
      });
    } catch (error) {
      console.error("Error creating person:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--covenant-card)",
          borderColor: "var(--covenant-border)",
          color: "var(--covenant-text)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--covenant-text)" }}>
            Add New Person
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>First Name *</Label>
              <Input
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Last Name *</Label>
              <Input
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
          </div>

          {/* Professional Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Title/Position</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., CEO, Author"
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
          </div>

          {/* Location Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                style={{
                  backgroundColor: "var(--covenant-bg-secondary)",
                  borderColor: "var(--covenant-border)",
                  color: "var(--covenant-text)",
                }}
              />
            </div>
          </div>

          {/* Tier & Score Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>Relationship Tier</Label>
              <Select
                value={formData.relationship_tier}
                onValueChange={(value: "vip" | "gold" | "standard" | "new") =>
                  setFormData({ ...formData, relationship_tier: value })
                }
              >
                <SelectTrigger
                  style={{
                    backgroundColor: "var(--covenant-bg-secondary)",
                    borderColor: "var(--covenant-border)",
                    color: "var(--covenant-text)",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: "var(--covenant-card)",
                    borderColor: "var(--covenant-border)",
                  }}
                >
                  <SelectItem value="new" style={{ color: "var(--covenant-text)" }}>New</SelectItem>
                  <SelectItem value="standard" style={{ color: "var(--covenant-text)" }}>Standard</SelectItem>
                  <SelectItem value="gold" style={{ color: "var(--covenant-text)" }}>Gold</SelectItem>
                  <SelectItem value="vip" style={{ color: "var(--covenant-text)" }}>VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--covenant-text-silver)" }}>
                Opportunity Score: {formData.opportunity_score}
              </Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={formData.opportunity_score}
                onChange={(e) =>
                  setFormData({ ...formData, opportunity_score: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label style={{ color: "var(--covenant-text-silver)" }}>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{
                backgroundColor: "var(--covenant-bg-secondary)",
                borderColor: "var(--covenant-border)",
                color: "var(--covenant-text)",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              style={{
                borderColor: "var(--covenant-border)",
                color: "var(--covenant-text)",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--covenant-accent)",
                color: "var(--covenant-bg)",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Person"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PeoplePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<CovenantPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterTier, setFilterTier] = useState<string>("");

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterTier) params.set("tier", filterTier);

      const response = await fetch(`/api/covenant/people?${params}`);
      const { data } = await response.json();
      setPeople(data || []);
    } catch (error) {
      console.error("Error fetching people:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterTier]);

  useEffect(() => {
    const debounce = setTimeout(fetchPeople, 300);
    return () => clearTimeout(debounce);
  }, [fetchPeople]);

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
          onClick={() => setIsAddModalOpen(true)}
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
            placeholder="Search by name, email, or company..."
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
                {filterTier ? filterTier.charAt(0).toUpperCase() + filterTier.slice(1) : "Tier"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                backgroundColor: "var(--covenant-card)",
                borderColor: "var(--covenant-border)",
              }}
            >
              <DropdownMenuItem
                onClick={() => setFilterTier("")}
                style={{ color: "var(--covenant-text)" }}
              >
                All Tiers
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterTier("vip")}
                style={{ color: "var(--covenant-text)" }}
              >
                VIP
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterTier("gold")}
                style={{ color: "var(--covenant-text)" }}
              >
                Gold
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterTier("standard")}
                style={{ color: "var(--covenant-text)" }}
              >
                Standard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFilterTier("new")}
                style={{ color: "var(--covenant-text)" }}
              >
                New
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div
            className="flex rounded-lg p-1"
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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--covenant-accent)" }}
          />
        </div>
      ) : people.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{
            backgroundColor: "var(--covenant-card)",
            border: "1px solid var(--covenant-border)",
          }}
        >
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--covenant-bg-secondary)" }}
          >
            <UserPlus className="h-8 w-8" style={{ color: "var(--covenant-text-muted)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--covenant-text)" }}>
            No people yet
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--covenant-text-muted)" }}>
            Start building your relationship network
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: "var(--covenant-accent)",
              color: "var(--covenant-bg)",
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add First Person
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} onRefresh={fetchPeople} />
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
          {/* Header */}
          <div
            className="flex items-center gap-4 px-4 py-3 border-b text-xs font-medium uppercase tracking-wider"
            style={{
              borderColor: "var(--covenant-border)",
              color: "var(--covenant-text-muted)",
            }}
          >
            <div className="w-10" />
            <div className="flex-1">Name</div>
            <div className="hidden md:block w-32">Location</div>
            <div className="hidden lg:block w-32">Company</div>
            <div className="w-14 text-center">Score</div>
            <div className="w-8" />
          </div>
          {/* Rows */}
          <div className="divide-y" style={{ borderColor: "var(--covenant-border)" }}>
            {people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPeople}
      />
    </div>
  );
}
