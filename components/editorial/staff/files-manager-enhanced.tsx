"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  FolderOpen,
  Download,
  Eye,
  Trash2,
  Upload,
  File,
  FileImage,
  Grid3X3,
  List,
  Filter,
} from "lucide-react";

interface FileEntry {
  id: string;
  name: string;
  type: string;
  size: number;
  stage: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

interface FilesManagerEnhancedProps {
  files: FileEntry[];
  projectId: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  "application/pdf": FileText,
  "image/png": FileImage,
  "image/jpeg": FileImage,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesManagerEnhanced({ files, projectId }: FilesManagerEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const stages = Array.from(new Set(files.map((f) => f.stage)));

  const filtered = files.filter((f) => {
    if (stageFilter !== "all" && f.stage !== stageFilter) return false;
    if (searchQuery) return f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Gestor de Archivos
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" className="gap-1 ml-2">
                <Upload className="h-3.5 w-3.5" />
                Subir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button
                variant={stageFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => setStageFilter("all")}
              >
                Todos
              </Button>
              {stages.map((stage) => (
                <Button
                  key={stage}
                  variant={stageFilter === stage ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => setStageFilter(stage)}
                >
                  {stage}
                </Button>
              ))}
            </div>
          </div>

          {/* Files */}
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <File className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No se encontraron archivos.</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-1">
              {filtered.map((file) => {
                const IconComp = FILE_ICONS[file.type] ?? File;
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <IconComp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{formatSize(file.size)}</span>
                          <span>-</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString("es-ES")}</span>
                          <span>-</span>
                          <span>{file.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Badge variant="secondary" className="text-[10px]">{file.stage}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((file) => {
                const IconComp = FILE_ICONS[file.type] ?? File;
                return (
                  <div
                    key={file.id}
                    className="rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors cursor-pointer text-center"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <IconComp className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                    <Badge variant="secondary" className="text-[8px] mt-1">{file.stage}</Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span>{filtered.length} de {files.length} archivos</span>
            <span>{formatSize(filtered.reduce((sum, f) => sum + f.size, 0))} total</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
