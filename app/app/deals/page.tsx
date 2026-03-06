"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign, Building2, GripVertical } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  position: number;
  pipeline_id: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_id: string;
  tenant_id: string | null;
  brand_id: string | null;
  org_id: string;
  created_at: string;
  tenant?: { name: string } | null;
  brand?: { name: string } | null;
}

interface Tenant {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Profile {
  org_id: string;
}

const STAGE_COLORS: Record<string, string> = {
  Lead: "bg-slate-100 border-slate-300",
  Discovery: "bg-blue-50 border-blue-300",
  Proposal: "bg-amber-50 border-amber-300",
  Negotiation: "bg-purple-50 border-purple-300",
  Won: "bg-emerald-50 border-emerald-300",
  Lost: "bg-red-50 border-red-300",
};

const STAGE_HEADER_COLORS: Record<string, string> = {
  Lead: "bg-slate-200 text-slate-800",
  Discovery: "bg-blue-200 text-blue-800",
  Proposal: "bg-amber-200 text-amber-800",
  Negotiation: "bg-purple-200 text-purple-800",
  Won: "bg-emerald-200 text-emerald-800",
  Lost: "bg-red-200 text-red-800",
};

export default function DealsPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // New deal form state
  const [newDeal, setNewDeal] = useState({
    title: "",
    value: "",
    currency: "USD",
    tenant_id: "",
    brand_id: "",
    stage_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    const { data: pipelinesData } = await supabase
      .from("pipelines")
      .select("id")
      .limit(1)
      .single();

    if (pipelinesData) {
      const { data: stagesData } = await supabase
        .from("stages")
        .select("*")
        .eq("pipeline_id", pipelinesData.id)
        .order("position", { ascending: true });

      if (stagesData) {
        setStages(stagesData);
        if (stagesData.length > 0 && !newDeal.stage_id) {
          setNewDeal((prev) => ({ ...prev, stage_id: stagesData[0].id }));
        }
      }
    }

    const { data: dealsData } = await supabase
      .from("deals")
      .select(`*, tenant:tenants(name), brand:brands(name)`)
      .order("created_at", { ascending: false });

    if (dealsData) {
      setDeals(dealsData);
    }

    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("id, name")
      .order("name");

    if (tenantsData) {
      setTenants(tenantsData);
    }

    const { data: brandsData } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");

    if (brandsData) {
      setBrands(brandsData);
    }

    setLoading(false);
  }

  async function handleAddDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("deals").insert({
      title: newDeal.title,
      value: parseFloat(newDeal.value) || 0,
      currency: newDeal.currency,
      tenant_id: newDeal.tenant_id || null,
      brand_id: newDeal.brand_id || null,
      stage_id: newDeal.stage_id,
      org_id: profile.org_id,
    });

    if (!error) {
      setNewDeal({
        title: "",
        value: "",
        currency: "USD",
        tenant_id: "",
        brand_id: "",
        stage_id: stages[0]?.id || "",
      });
      setIsAddOpen(false);
      loadData();
    }

    setIsSubmitting(false);
  }

  function handleDragStart(deal: Deal) {
    setDraggedDeal(deal);
  }

  function handleDragEnd() {
    setDraggedDeal(null);
    setDragOverStage(null);
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOverStage(stageId);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function handleDrop(stageId: string) {
    if (!draggedDeal || draggedDeal.stage_id === stageId) {
      setDraggedDeal(null);
      setDragOverStage(null);
      return;
    }

    setDeals((prev) =>
      prev.map((d) => (d.id === draggedDeal.id ? { ...d, stage_id: stageId } : d))
    );

    const { error } = await supabase
      .from("deals")
      .update({ stage_id: stageId })
      .eq("id", draggedDeal.id);

    if (error) {
      loadData();
    }

    setDraggedDeal(null);
    setDragOverStage(null);
  }

  function formatCurrency(value: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getDealsForStage(stageId: string) {
    return deals.filter((d) => d.stage_id === stageId);
  }

  function getStageTotalValue(stageId: string) {
    return getDealsForStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals Pipeline</h1>
          <p className="text-muted-foreground">
            Drag and drop deals between stages to update their status
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
              <DialogDescription>
                Create a new deal in your sales pipeline.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDeal}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Deal Title *</Label>
                  <Input
                    id="title"
                    value={newDeal.title}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, title: e.target.value })
                    }
                    placeholder="Website Redesign Project"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      value={newDeal.value}
                      onChange={(e) =>
                        setNewDeal({ ...newDeal, value: e.target.value })
                      }
                      placeholder="10000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newDeal.currency}
                      onValueChange={(v) =>
                        setNewDeal({ ...newDeal, currency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={newDeal.stage_id}
                    onValueChange={(v) =>
                      setNewDeal({ ...newDeal, stage_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenant">Client</Label>
                  <Select
                    value={newDeal.tenant_id}
                    onValueChange={(v) =>
                      setNewDeal({ ...newDeal, tenant_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Select
                    value={newDeal.brand_id}
                    onValueChange={(v) =>
                      setNewDeal({ ...newDeal, brand_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Deal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                deals
                  .filter((d) => {
                    const stage = stages.find((s) => s.id === d.stage_id);
                    return stage && stage.name !== "Won" && stage.name !== "Lost";
                  })
                  .reduce((sum, d) => sum + (d.value || 0), 0),
                "USD"
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Won Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(
                deals
                  .filter((d) => {
                    const stage = stages.find((s) => s.id === d.stage_id);
                    return stage && stage.name === "Won";
                  })
                  .reduce((sum, d) => sum + (d.value || 0), 0),
                "USD"
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lost Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                deals
                  .filter((d) => {
                    const stage = stages.find((s) => s.id === d.stage_id);
                    return stage && stage.name === "Lost";
                  })
                  .reduce((sum, d) => sum + (d.value || 0), 0),
                "USD"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`flex-shrink-0 w-72 rounded-lg border-2 ${
              dragOverStage === stage.id
                ? "border-primary border-dashed"
                : STAGE_COLORS[stage.name] || "bg-gray-50 border-gray-300"
            }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(stage.id)}
          >
            <div
              className={`px-3 py-2 rounded-t-md ${
                STAGE_HEADER_COLORS[stage.name] || "bg-gray-200 text-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{stage.name}</span>
                <Badge variant="secondary" className="bg-white/50">
                  {getDealsForStage(stage.id).length}
                </Badge>
              </div>
              <div className="text-xs mt-1 opacity-80">
                {formatCurrency(getStageTotalValue(stage.id), "USD")}
              </div>
            </div>

            <div className="p-2 space-y-2 min-h-[200px]">
              {getDealsForStage(stage.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No deals
                </div>
              ) : (
                getDealsForStage(stage.id).map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-md border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                      draggedDeal?.id === deal.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {deal.title}
                        </h4>
                        {deal.tenant && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{deal.tenant.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 mt-2">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(deal.value || 0, deal.currency)}
                        </div>
                        {deal.brand && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {deal.brand.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {stages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pipeline Configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Contact your administrator to set up the sales pipeline.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
