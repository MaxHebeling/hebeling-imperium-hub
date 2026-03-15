/**
 * Utilidades de formato — Español
 */

export function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatBytes(b: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Justo ahora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ayer";
  return `hace ${diffD} días`;
}

export function fileTypeLabel(fileType: string): string {
  const labels: Record<string, string> = {
    manuscript: "Manuscrito",
    manuscript_original: "Manuscrito Original",
    manuscript_edited: "Manuscrito Editado",
    manuscript_final: "Manuscrito Final",
    cover: "Portada",
    cover_draft: "Borrador de Portada",
    cover_final: "Portada Final",
    interior: "Interior",
    interior_layout: "Maquetación Interior",
    pdf_review: "PDF de Revisión",
    pdf_final: "PDF Final",
    epub: "ePub",
    mobi: "Mobi",
    proof: "Prueba de Impresión",
  };
  return labels[fileType] ?? fileType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
