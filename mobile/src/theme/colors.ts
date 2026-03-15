/**
 * Reino Editorial — Paleta de colores premium
 * Coherente con el portal web del cliente.
 */
export const Colors = {
  // Primarios — Azul editorial
  primary: "#1a3a6b",
  primaryLight: "#2a5a9b",
  primaryDark: "#0f2548",
  primaryFaded: "rgba(26, 58, 107, 0.08)",
  primaryBorder: "rgba(26, 58, 107, 0.12)",

  // Fondos
  background: "#f8f9fb",
  surface: "#ffffff",
  surfaceHover: "#f5f6f8",
  surfaceElevated: "#ffffff",

  // Texto
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  textMuted: "#d1d5db",
  textOnPrimary: "#ffffff",

  // Estado
  success: "#059669",
  successLight: "#ecfdf5",
  successBorder: "#a7f3d0",
  warning: "#d97706",
  warningLight: "#fffbeb",
  warningBorder: "#fde68a",
  error: "#dc2626",
  errorLight: "#fef2f2",
  errorBorder: "#fecaca",
  info: "#2563eb",
  infoLight: "#eff6ff",

  // Bordes
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  borderFocus: "rgba(26, 58, 107, 0.4)",

  // Sombras
  shadowLight: "rgba(0, 0, 0, 0.04)",
  shadowMedium: "rgba(0, 0, 0, 0.08)",

  // Gradiente progress
  progressStart: "#1a3a6b",
  progressEnd: "#2a5a9b",

  // Etapas del timeline
  stageCompleted: "#059669",
  stageActive: "#1a3a6b",
  stagePending: "#d1d5db",

  // Acento dorado editorial
  gold: "#b8860b",
  goldLight: "#fef9ef",
} as const;
