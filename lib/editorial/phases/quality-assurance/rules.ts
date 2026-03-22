import { createFoundationId } from "@/lib/editorial/foundation";
import type { EditorialLayoutPackage } from "../layout-engine/types";
import type { EditorialValidatedManuscript } from "../semantic-validation/types";
import type {
  EditorialQaCheck,
  EditorialQaIssue,
  EditorialQaSeverity,
} from "./types";

function createCheck(input: Omit<EditorialQaCheck, "id">): EditorialQaCheck {
  return {
    id: createFoundationId(),
    ...input,
  };
}

function createIssue(input: Omit<EditorialQaIssue, "id">): EditorialQaIssue {
  return {
    id: createFoundationId(),
    ...input,
  };
}

function hasPdfSignature(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("utf8") === "%PDF-";
}

function hasEpubMarkers(buffer: Buffer): boolean {
  if (buffer.subarray(0, 4).toString("binary") !== "PK\u0003\u0004") {
    return false;
  }

  return buffer.includes(Buffer.from("application/epub+zip", "utf8"));
}

function summarizeIssues(
  criticalIssueCount: number,
  warningIssueCount: number
): string {
  if (criticalIssueCount === 0 && warningIssueCount === 0) {
    return "QA completado sin errores críticos ni advertencias relevantes.";
  }

  if (criticalIssueCount === 0) {
    return `QA completado con ${warningIssueCount} advertencia(s) y sin errores críticos.`;
  }

  return `QA detectó ${criticalIssueCount} error(es) crítico(s) y ${warningIssueCount} advertencia(s).`;
}

function severitySortValue(severity: EditorialQaSeverity): number {
  switch (severity) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
  }
}

export function runLayoutQualityChecks(input: {
  layoutPackage: EditorialLayoutPackage;
  pdfBuffer: Buffer;
  epubBuffer: Buffer;
  hasCoverAsset: boolean;
}): {
  checks: EditorialQaCheck[];
  issues: EditorialQaIssue[];
  approved: boolean;
  criticalIssueCount: number;
  warningIssueCount: number;
  summary: string;
} {
  const checks: EditorialQaCheck[] = [];
  const issues: EditorialQaIssue[] = [];
  const pdfArtifact = input.layoutPackage.exports.find((item) => item.format === "pdf");
  const epubArtifact = input.layoutPackage.exports.find((item) => item.format === "epub");

  const addIssue = (issue: Omit<EditorialQaIssue, "id">) => {
    issues.push(createIssue(issue));
  };

  checks.push(
    createCheck({
      label: "PDF export presente",
      category: "file",
      status: pdfArtifact ? "passed" : "failed",
      file_format: "pdf",
      details: pdfArtifact
        ? `PDF localizado en ${pdfArtifact.storage_path}.`
        : "No se encontró el PDF final en el paquete de layout.",
    })
  );

  if (!pdfArtifact) {
    addIssue({
      severity: "critical",
      category: "file",
      title: "Falta el PDF final",
      message: "El paquete de layout no incluye el archivo PDF requerido para impresión.",
      file_format: "pdf",
      auto_fixable: false,
    });
  }

  checks.push(
    createCheck({
      label: "EPUB export presente",
      category: "file",
      status: epubArtifact ? "passed" : "failed",
      file_format: "epub",
      details: epubArtifact
        ? `EPUB localizado en ${epubArtifact.storage_path}.`
        : "No se encontró el EPUB final en el paquete de layout.",
    })
  );

  if (!epubArtifact) {
    addIssue({
      severity: "critical",
      category: "file",
      title: "Falta el EPUB final",
      message: "El paquete de layout no incluye el archivo EPUB requerido para distribución digital.",
      file_format: "epub",
      auto_fixable: false,
    });
  }

  const pdfSignatureValid = hasPdfSignature(input.pdfBuffer);
  checks.push(
    createCheck({
      label: "Firma PDF válida",
      category: "format",
      status: pdfSignatureValid ? "passed" : "failed",
      file_format: "pdf",
      details: pdfSignatureValid
        ? "El archivo PDF contiene una firma binaria válida."
        : "El archivo PDF no tiene la firma esperada %PDF-.",
    })
  );

  if (!pdfSignatureValid) {
    addIssue({
      severity: "critical",
      category: "format",
      title: "PDF inválido",
      message: "El archivo exportado como PDF no tiene una firma PDF válida.",
      file_format: "pdf",
      auto_fixable: false,
    });
  }

  const epubSignatureValid = hasEpubMarkers(input.epubBuffer);
  checks.push(
    createCheck({
      label: "Firma EPUB válida",
      category: "format",
      status: epubSignatureValid ? "passed" : "failed",
      file_format: "epub",
      details: epubSignatureValid
        ? "El EPUB contiene la estructura zip y el mimetype esperado."
        : "El archivo EPUB no presenta la estructura mínima esperada.",
    })
  );

  if (!epubSignatureValid) {
    addIssue({
      severity: "critical",
      category: "format",
      title: "EPUB inválido",
      message: "El archivo exportado como EPUB no contiene un mimetype EPUB válido.",
      file_format: "epub",
      auto_fixable: false,
    });
  }

  const hasChapters = input.layoutPackage.chapters.length > 0;
  checks.push(
    createCheck({
      label: "Capítulos presentes",
      category: "missing_elements",
      status: hasChapters ? "passed" : "failed",
      file_format: "package",
      details: hasChapters
        ? `${input.layoutPackage.chapters.length} capítulo(s) incluidos en el paquete.`
        : "No hay capítulos en el paquete de layout.",
    })
  );

  if (!hasChapters) {
    addIssue({
      severity: "critical",
      category: "missing_elements",
      title: "No hay capítulos maquetados",
      message: "El paquete de layout no contiene capítulos renderizados.",
      file_format: "package",
      auto_fixable: false,
    });
  }

  const hasMetadata = Boolean(input.layoutPackage.metadata_asset_id);
  checks.push(
    createCheck({
      label: "Metadata editorial enlazada",
      category: "missing_elements",
      status: hasMetadata ? "passed" : "failed",
      file_format: "package",
      details: hasMetadata
        ? `Metadata asset ${input.layoutPackage.metadata_asset_id} enlazado correctamente.`
        : "El paquete de layout no está vinculado a metadata comercial.",
    })
  );

  if (!hasMetadata) {
    addIssue({
      severity: "critical",
      category: "missing_elements",
      title: "Falta metadata comercial",
      message: "El paquete de layout no tiene referencia a metadata editorial.",
      file_format: "package",
      auto_fixable: false,
    });
  }

  const hasCover = input.hasCoverAsset && Boolean(input.layoutPackage.cover_asset_id);
  checks.push(
    createCheck({
      label: "Portada enlazada",
      category: "missing_elements",
      status: hasCover ? "passed" : "warning",
      file_format: "package",
      details: hasCover
        ? `Portada ${input.layoutPackage.cover_asset_id} enlazada en el layout package.`
        : "No se detectó una portada enlazada al layout final.",
    })
  );

  if (!hasCover) {
    addIssue({
      severity: "warning",
      category: "missing_elements",
      title: "Portada no enlazada",
      message: "El paquete de layout no incluye referencia directa a una portada final.",
      file_format: "package",
      auto_fixable: false,
    });
  }

  const chapterCountConsistent =
    (pdfArtifact?.chapter_count ?? input.layoutPackage.chapters.length) ===
      input.layoutPackage.chapters.length &&
    (epubArtifact?.chapter_count ?? input.layoutPackage.chapters.length) ===
      input.layoutPackage.chapters.length;

  checks.push(
    createCheck({
      label: "Conteo de capítulos consistente",
      category: "format",
      status: chapterCountConsistent ? "passed" : "warning",
      file_format: "general",
      details: chapterCountConsistent
        ? "El conteo de capítulos coincide entre el paquete y los exports."
        : "El conteo de capítulos difiere entre el paquete y al menos un export.",
    })
  );

  if (!chapterCountConsistent) {
    addIssue({
      severity: "warning",
      category: "format",
      title: "Conteo de capítulos inconsistente",
      message: "Los exports no reportan el mismo número de capítulos que el layout package.",
      file_format: "general",
      auto_fixable: false,
    });
  }

  const criticalIssueCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const warningIssueCount = issues.filter(
    (issue) => issue.severity === "warning"
  ).length;

  issues.sort(
    (left, right) => severitySortValue(left.severity) - severitySortValue(right.severity)
  );

  return {
    checks,
    issues,
    approved: criticalIssueCount === 0,
    criticalIssueCount,
    warningIssueCount,
    summary: summarizeIssues(criticalIssueCount, warningIssueCount),
  };
}

export function runProfessionalEditorialChecks(input: {
  validatedManuscript: EditorialValidatedManuscript;
}): {
  checks: EditorialQaCheck[];
  issues: EditorialQaIssue[];
  approved: boolean;
  criticalIssueCount: number;
  warningIssueCount: number;
  summary: string;
} {
  const { validatedManuscript } = input;
  const checks: EditorialQaCheck[] = [];
  const issues: EditorialQaIssue[] = [];

  const addIssue = (issue: Omit<EditorialQaIssue, "id">) => {
    issues.push(createIssue(issue));
  };

  const hasValidatedChapters = validatedManuscript.chapter_revisions.length > 0;
  checks.push(
    createCheck({
      label: "Capítulos validados presentes",
      category: "missing_elements",
      status: hasValidatedChapters ? "passed" : "failed",
      file_format: "package",
      details: hasValidatedChapters
        ? `${validatedManuscript.chapter_revisions.length} capítulo(s) listos para QA editorial.`
        : "No hay capítulos validados disponibles para la revisión editorial.",
    })
  );

  if (!hasValidatedChapters) {
    addIssue({
      severity: "critical",
      category: "missing_elements",
      title: "Faltan capítulos validados",
      message: "El manuscrito validado no contiene capítulos para revisar en QA.",
      file_format: "package",
      auto_fixable: false,
    });
  }

  const hasGlobalSummary = validatedManuscript.global_summary.trim().length > 0;
  checks.push(
    createCheck({
      label: "Resumen global disponible",
      category: "format",
      status: hasGlobalSummary ? "passed" : "warning",
      file_format: "general",
      details: hasGlobalSummary
        ? "El manuscrito validado incluye un resumen editorial global."
        : "No se detectó resumen global en el manuscrito validado.",
    })
  );

  if (!hasGlobalSummary) {
    addIssue({
      severity: "warning",
      category: "format",
      title: "Falta resumen global",
      message: "El manuscrito validado no incluye un resumen editorial global.",
      file_format: "general",
      auto_fixable: false,
    });
  }

  const unresolvedIssues = validatedManuscript.issues.length;
  checks.push(
    createCheck({
      label: "Issues semánticos abiertos",
      category: "format",
      status: unresolvedIssues === 0 ? "passed" : "warning",
      file_format: "general",
      details:
        unresolvedIssues === 0
          ? "No hay issues semánticos pendientes en el manuscrito validado."
          : `${unresolvedIssues} issue(s) semántico(s) permanecen abiertos tras la validación.`,
    })
  );

  for (const semanticIssue of validatedManuscript.issues.slice(0, 5)) {
    addIssue({
      severity: semanticIssue.severity === "high" ? "warning" : "info",
      category: "format",
      title: `Issue semántico: ${semanticIssue.title}`,
      message: semanticIssue.explanation,
      file_format: "general",
      auto_fixable: semanticIssue.auto_fixable,
    });
  }

  const averageChangeRatio = validatedManuscript.validation_totals.average_change_ratio;
  const changeRatioHealthy = averageChangeRatio <= 0.35;
  checks.push(
    createCheck({
      label: "Variación editorial controlada",
      category: "format",
      status: changeRatioHealthy ? "passed" : "warning",
      file_format: "general",
      details: changeRatioHealthy
        ? `Cambio promedio controlado (${averageChangeRatio.toFixed(3)}).`
        : `Cambio promedio elevado (${averageChangeRatio.toFixed(3)}); revisar consistencia editorial.`,
    })
  );

  if (!changeRatioHealthy) {
    addIssue({
      severity: "warning",
      category: "format",
      title: "Cambio editorial elevado",
      message:
        "La validación produjo una variación promedio alta; conviene revisar consistencia y tono antes de aprobar.",
      file_format: "general",
      auto_fixable: false,
    });
  }

  const criticalIssueCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const warningIssueCount = issues.filter(
    (issue) => issue.severity === "warning"
  ).length;

  issues.sort(
    (left, right) => severitySortValue(left.severity) - severitySortValue(right.severity)
  );

  return {
    checks,
    issues,
    approved: criticalIssueCount === 0,
    criticalIssueCount,
    warningIssueCount,
    summary: summarizeIssues(criticalIssueCount, warningIssueCount),
  };
}
