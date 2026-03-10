"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, FileDown, Settings, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { ProjectPublishingContext } from "@/types/editorial";
import { PublishingStatusCard } from "./publishing-status-card";
import { PublicationVersionCard } from "./publication-version-card";
import { ExportList } from "./export-list";
import { DistributionReadinessPanel } from "./distribution-readiness-panel";

interface PublishingDashboardProps {
  context: ProjectPublishingContext;
  projectId: string;
}

export function PublishingDashboard({ context, projectId }: PublishingDashboardProps) {
  const { project, publicationVersions, latestVersion, latestMetadata, recentExports, distributionPackages, readinessCheck } = context;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Publishing Engine</p>
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="capitalize">{project.current_stage}</Badge>
            <Badge variant="outline" className="capitalize">{project.status}</Badge>
            {project.author_name && (
              <span className="text-sm text-muted-foreground">por {project.author_name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/editorial/publishing/${projectId}/metadata`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Metadatos
            </Button>
          </Link>
          <Link href={`/app/editorial/publishing/${projectId}/exports`}>
            <Button variant="outline" size="sm" className="gap-2">
              <FileDown className="h-4 w-4" />
              Ver exportaciones
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Readiness banner */}
      <DistributionReadinessPanel readiness={readinessCheck} />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PublishingStatusCard
          label="Versiones"
          value={publicationVersions.length}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <PublishingStatusCard
          label="Listas para exportar"
          value={publicationVersions.filter((v) => v.status === "ready").length}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          highlight="success"
        />
        <PublishingStatusCard
          label="Exportaciones recientes"
          value={recentExports.length}
          icon={<FileDown className="h-4 w-4 text-muted-foreground" />}
        />
        <PublishingStatusCard
          label="Paquetes de distribución"
          value={distributionPackages.length}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Latest version */}
      {latestVersion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versión más reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <PublicationVersionCard
              version={latestVersion}
              metadata={latestMetadata}
              projectId={projectId}
              isLatest
            />
          </CardContent>
        </Card>
      )}

      {/* No versions yet */}
      {publicationVersions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">Sin versiones de publicación</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Crea la primera versión de publicación cuando el manuscrito esté listo para exportar.
            </p>
            <Button size="sm" asChild>
              <Link href={`/app/editorial/publishing/${projectId}/exports`}>
                Crear versión
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent exports */}
      {recentExports.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Exportaciones recientes</CardTitle>
            <Link href={`/app/editorial/publishing/${projectId}/exports`}>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ExportList exports={recentExports.slice(0, 5)} compact />
          </CardContent>
        </Card>
      )}

      {/* All publication versions */}
      {publicationVersions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de versiones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {publicationVersions.slice(1).map((version) => (
              <PublicationVersionCard
                key={version.id}
                version={version}
                metadata={null}
                projectId={projectId}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
