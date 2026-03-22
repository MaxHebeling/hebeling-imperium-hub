import type { Locale } from "@/lib/i18n/translations";

export const IDR_THEME = {
  bg: "#07101C",
  bgSecondary: "#0C1626",
  panel: "#101C2E",
  panelAlt: "#152338",
  border: "rgba(201, 166, 70, 0.16)",
  borderStrong: "rgba(201, 166, 70, 0.26)",
  gold: "#C9A646",
  goldSoft: "#E2C36B",
  ivory: "#F5F0E8",
  muted: "#9DA9BA",
  success: "#3FA46A",
  warning: "#D99A2B",
  danger: "#C75050",
  maroon: "#722F37",
  glow: "rgba(201, 166, 70, 0.18)",
} as const;

export function getIdrModuleContent(locale: Locale) {
  const isEs = locale === "es";

  return {
    hero: {
      eyebrow: isEs ? "Módulo Privado IDR" : "Private IDR Module",
      title: isEs
        ? "Centro privado para Staff e Inversionistas"
        : "Private command center for Staff and Investors",
      description: isEs
        ? "IDR se mantiene público en su propio repositorio y su propia web. Dentro de HEBELING OS, este módulo concentra la operación privada, la gobernanza interna, el contenido premium y la experiencia móvil para la comunidad."
        : "IDR stays public in its own repository and website. Inside HEBELING OS, this module centralizes private operations, internal governance, premium content, and the mobile experience for the community.",
      badges: [
        isEs ? "Gobernanza interna" : "Internal governance",
        isEs ? "Comunidad premium" : "Premium community",
        isEs ? "App instalable" : "Installable app",
      ],
    },
    overviewPillars: [
      {
        title: isEs ? "Carril Staff" : "Staff lane",
        description: isEs
          ? "Presidentes, secretarios y staff acceden a documentos, lineamientos, agendas internas y coordinación operativa."
          : "Presidents, secretaries, and staff access documents, internal guidelines, agendas, and operational coordination.",
        metric: isEs ? "Interno" : "Internal",
      },
      {
        title: isEs ? "Carril Inversionistas" : "Investor lane",
        description: isEs
          ? "Los inversionistas reciben avisos, notificaciones, videos, actualizaciones mensuales y recursos de valor en una experiencia controlada."
          : "Investors receive notices, notifications, videos, monthly updates, and high-value resources in a controlled experience.",
        metric: isEs ? "Comunidad" : "Community",
      },
      {
        title: isEs ? "Control central" : "Central control",
        description: isEs
          ? "HEBELING OS actúa como command center para permisos, publicación de contenido, trazabilidad y visión ejecutiva."
          : "HEBELING OS acts as the command center for permissions, content publishing, traceability, and executive visibility.",
        metric: "HEBELING OS",
      },
    ],
    staffRoles: [
      {
        title: isEs ? "Presidencia" : "Presidency",
        description: isEs
          ? "Visión estratégica, decisiones, documentación reservada y lineamientos de alto nivel."
          : "Strategic vision, decisions, confidential documentation, and high-level guidelines.",
      },
      {
        title: isEs ? "Secretaría" : "Secretary",
        description: isEs
          ? "Minutas, organización de reuniones, seguimiento interno, anuncios formales y control de agenda."
          : "Minutes, meeting organization, internal follow-up, formal announcements, and agenda control.",
      },
      {
        title: isEs ? "Staff operativo" : "Operations staff",
        description: isEs
          ? "Gestión de archivos, publicación de contenidos, soporte al inversionista y ejecución del calendario."
          : "File management, content publishing, investor support, and calendar execution.",
      },
    ],
    staffResources: [
      isEs ? "Biblioteca de documentos internos" : "Internal document library",
      isEs ? "Actas, lineamientos y memorandos" : "Minutes, guidelines, and memos",
      isEs ? "Agenda ejecutiva y hitos del ministerio" : "Executive agenda and ministry milestones",
      isEs ? "Centro de anuncios internos" : "Internal notices center",
      isEs ? "Panel para publicación a inversionistas" : "Publishing panel for investors",
    ],
    investorTracks: [
      {
        title: isEs ? "Avisos y notificaciones" : "Notices and notifications",
        description: isEs
          ? "Comunicaciones oficiales, recordatorios y mensajes clave del ministerio."
          : "Official communications, reminders, and key ministry messages.",
      },
      {
        title: isEs ? "Videos y sesiones" : "Videos and sessions",
        description: isEs
          ? "Contenido mensual, cápsulas ejecutivas y mensajes estratégicos en formato premium."
          : "Monthly content, executive capsules, and strategic messages in a premium format.",
      },
      {
        title: isEs ? "Recursos exclusivos" : "Exclusive resources",
        description: isEs
          ? "Materiales curados, documentos de valor y recursos privados para la comunidad."
          : "Curated materials, high-value documents, and private community resources.",
      },
    ],
    publishingTracks: [
      {
        title: isEs ? "Canal interno staff" : "Internal staff channel",
        audience: isEs ? "Reservado" : "Restricted",
      },
      {
        title: isEs ? "Canal comunidad IDR" : "IDR community channel",
        audience: isEs ? "Inversionistas" : "Investors",
      },
      {
        title: isEs ? "Lanzamientos mensuales" : "Monthly releases",
        audience: isEs ? "Premium" : "Premium",
      },
    ],
    monthlyCadence: [
      {
        label: isEs ? "Briefing mensual" : "Monthly briefing",
        value: isEs ? "Mensaje principal + video" : "Main message + video",
      },
      {
        label: isEs ? "Avisos urgentes" : "Urgent notices",
        value: isEs ? "Push + panel" : "Push + panel",
      },
      {
        label: isEs ? "Documentos premium" : "Premium documents",
        value: isEs ? "Descarga segura" : "Secure download",
      },
    ],
    portalHighlights: [
      isEs ? "Experiencia móvil primero" : "Mobile-first experience",
      isEs ? "PWA instalable en teléfono" : "Installable phone PWA",
      isEs ? "Panel personal con avisos y media" : "Personal dashboard with notices and media",
      isEs ? "Diseño premium consistente con IDR" : "Premium design consistent with IDR",
    ],
  };
}
