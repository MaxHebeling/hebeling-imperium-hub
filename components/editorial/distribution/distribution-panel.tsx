"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Globe,
  Plus,
  Loader2,
  ExternalLink,
  ShoppingCart,
  BookOpen,
  Store,
  Printer,
  Library,
  Send,
} from "lucide-react";
import type {
  DistributionChannel,
  ProjectDistribution,
  DistributionStatus,
} from "@/lib/editorial/distribution/types";
import {
  DISTRIBUTION_CHANNEL_LABELS,
  DISTRIBUTION_STATUS_LABELS,
} from "@/lib/editorial/distribution/types";

interface DistributionPanelProps {
  projectId: string;
  projectTitle: string;
  distributions: ProjectDistribution[];
}

const CHANNEL_ICONS: Record<DistributionChannel, React.ElementType> = {
  amazon_kdp: ShoppingCart,
  apple_books: BookOpen,
  google_play: Store,
  kobo: BookOpen,
  barnes_noble: Store,
  direct_sale: ShoppingCart,
  library: Library,
  print_on_demand: Printer,
  custom: Globe,
};

export function DistributionPanel({
  projectId,
  projectTitle,
  distributions,
}: DistributionPanelProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [channel, setChannel] = useState<DistributionChannel>("amazon_kdp");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleCreateDistribution = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(
        `/api/editorial/projects/${projectId}/distributions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            price: price ? parseFloat(price) : undefined,
            currency,
            regions: ["worldwide"],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create distribution");
      }

      toast.success(
        `Canal ${DISTRIBUTION_CHANNEL_LABELS[channel]} configurado`
      );
      setIsDialogOpen(false);
      setPrice("");
      router.refresh();
    } catch (error) {
      console.error("Error creating distribution:", error);
      toast.error("Error al configurar el canal");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: DistributionStatus) => {
    const variants: Record<DistributionStatus, string> = {
      draft: "outline",
      pending_approval: "secondary",
      approved: "secondary",
      submitted: "secondary",
      live: "default",
      rejected: "destructive",
      suspended: "destructive",
      archived: "outline",
    };

    const colors: Record<DistributionStatus, string> = {
      draft: "",
      pending_approval: "",
      approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      submitted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      live: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "",
      suspended: "",
      archived: "",
    };

    return (
      <Badge variant={variants[status] as "outline" | "secondary" | "destructive" | "default"} className={colors[status]}>
        {DISTRIBUTION_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (amount: number | null, curr: string) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Distribution Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Canales de Distribución
            </CardTitle>
            <CardDescription>
              Configura y gestiona la distribución de &quot;{projectTitle}&quot;
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Canal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Canal de Distribución</DialogTitle>
                <DialogDescription>
                  Selecciona un canal para distribuir tu libro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="channel">Canal</Label>
                  <Select
                    value={channel}
                    onValueChange={(v) => setChannel(v as DistributionChannel)}
                  >
                    <SelectTrigger id="channel">
                      <SelectValue placeholder="Selecciona un canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amazon_kdp">Amazon KDP</SelectItem>
                      <SelectItem value="apple_books">Apple Books</SelectItem>
                      <SelectItem value="google_play">Google Play Libros</SelectItem>
                      <SelectItem value="kobo">Kobo</SelectItem>
                      <SelectItem value="barnes_noble">Barnes & Noble</SelectItem>
                      <SelectItem value="direct_sale">Venta Directa</SelectItem>
                      <SelectItem value="print_on_demand">Impresión bajo demanda</SelectItem>
                      <SelectItem value="library">Bibliotecas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="9.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateDistribution} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {distributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Globe className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Sin canales configurados</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Agrega canales de distribución para publicar tu libro.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar primer canal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {distributions.map((dist) => {
                const Icon = CHANNEL_ICONS[dist.channel] ?? Globe;
                return (
                  <div
                    key={dist.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {DISTRIBUTION_CHANNEL_LABELS[dist.channel]}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatPrice(dist.price, dist.currency)}</span>
                          <span>·</span>
                          <span>{dist.regions.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(dist.status)}
                      {dist.status === "draft" && (
                        <Button size="sm" variant="outline">
                          <Send className="mr-2 h-4 w-4" />
                          Enviar
                        </Button>
                      )}
                      {dist.status === "live" && dist.external_url && (
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={dist.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution Stats */}
      {distributions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Canales Activos</CardDescription>
              <CardTitle className="text-2xl">
                {distributions.filter((d) => d.status === "live").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendientes</CardDescription>
              <CardTitle className="text-2xl">
                {
                  distributions.filter(
                    (d) =>
                      d.status === "draft" ||
                      d.status === "pending_approval" ||
                      d.status === "submitted"
                  ).length
                }
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Canales</CardDescription>
              <CardTitle className="text-2xl">{distributions.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
