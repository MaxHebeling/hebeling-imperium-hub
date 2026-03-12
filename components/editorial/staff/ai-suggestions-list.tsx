"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AiSuggestion {
  id: string;
  kind: string;
  severity: string;
  confidence: number;
  original_text: string;
  suggested_text: string;
  justification: string;
}

interface AiSuggestionsListProps {
  projectId: string;
  fileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiSuggestionsList({
  projectId,
  fileId,
  open,
  onOpenChange,
}: AiSuggestionsListProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/suggestions?fileId=${encodeURIComponent(fileId)}&status=pending`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudieron cargar las sugerencias de IA.");
        setSuggestions([]);
        return;
      }
      setSuggestions(data.suggestions ?? []);
      setSelectedIds(new Set());
    } catch {
      setError("Error de red al cargar sugerencias de IA.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelection(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleApply() {
    if (selectedIds.size === 0) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/staff/projects/${encodeURIComponent(projectId)}/ai/revisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceFileId: fileId,
            sourceFileVersion: 1,
            suggestionIds: Array.from(selectedIds),
            resultFileType: "manuscript_edited",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "No se pudieron aplicar las sugerencias.");
        return;
      }
      onOpenChange(false);
    } catch {
      setError("Error de red al aplicar sugerencias.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sugerencias de IA</DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-xs text-destructive mb-2">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">
            No hay sugerencias pendientes de aplicar para este manuscrito.
          </p>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex gap-3 rounded-md border border-border/60 bg-muted/20 p-3"
              >
                <div className="pt-1">
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleSelection(s.id)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{s.kind}</Badge>
                    <Badge
                      variant={
                        s.severity === "alta"
                          ? "destructive"
                          : s.severity === "media"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {s.severity}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Confianza: {(s.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground mb-0.5">Original</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {s.original_text}
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground mb-0.5">Sugerencia</p>
                    <p className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">
                      {s.suggested_text}
                    </p>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.justification}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applying}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={applying || selectedIds.size === 0}
          >
            {applying && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Aplicar sugerencias seleccionadas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

