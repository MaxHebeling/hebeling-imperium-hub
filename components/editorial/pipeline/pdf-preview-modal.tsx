"use client";

import { useState } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PdfPreviewModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
  onApprove?: () => void;
  metadata?: Record<string, string>;
}

export function PdfPreviewModal({
  url,
  fileName,
  onClose,
  onApprove,
  metadata,
}: PdfPreviewModalProps) {
  const [zoom, setZoom] = useState(100);

  function handleDownload() {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{fileName}</h3>
              {metadata && Object.keys(metadata).length > 0 && (
                <div className="flex gap-2 mt-1 flex-wrap">
                  {Object.entries(metadata).map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="text-[10px] font-normal text-muted-foreground"
                    >
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 px-2 py-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                className="p-0.5 hover:bg-muted/60 rounded transition-colors"
                title="Reducir zoom"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-medium tabular-nums w-8 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                className="p-0.5 hover:bg-muted/60 rounded transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="gap-1.5 text-xs"
              title="Descargar"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </Button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {onApprove && (
              <Button
                size="sm"
                onClick={onApprove}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprobar
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PDF iframe viewer */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          <div
            className="mx-auto transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full border-0 rounded-lg shadow-lg bg-white"
              style={{ height: "80vh", minWidth: "700px" }}
              title={fileName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
