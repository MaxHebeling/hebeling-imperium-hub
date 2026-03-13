import type { WebStageKey } from "../types/web-project";

export const WEB_STAGE_KEYS: WebStageKey[] = [
  "briefing",
  "diseno",
  "desarrollo",
  "contenido",
  "revision",
  "testing",
  "lanzamiento",
  "soporte",
];

export const WEB_STAGE_LABELS: Record<WebStageKey, string> = {
  briefing: "Briefing",
  diseno: "Dise\u00f1o",
  desarrollo: "Desarrollo",
  contenido: "Contenido",
  revision: "Revisi\u00f3n",
  testing: "Testing & QA",
  lanzamiento: "Lanzamiento",
  soporte: "Soporte",
};

export const WEB_STAGE_DESCRIPTIONS: Record<WebStageKey, string> = {
  briefing: "Recopilaci\u00f3n de requerimientos, objetivos y alcance del proyecto",
  diseno: "Wireframes, mockups y dise\u00f1o visual de la interfaz",
  desarrollo: "Programaci\u00f3n frontend y backend del sitio web",
  contenido: "Redacci\u00f3n, im\u00e1genes, SEO y contenido multimedia",
  revision: "Revisi\u00f3n del cliente y ajustes finales",
  testing: "Pruebas de funcionalidad, responsividad y rendimiento",
  lanzamiento: "Deploy a producci\u00f3n y configuraci\u00f3n de dominio",
  soporte: "Mantenimiento post-lanzamiento y soporte t\u00e9cnico",
};

export const WEB_STAGE_PROGRESS: Record<WebStageKey, number> = {
  briefing: 10,
  diseno: 25,
  desarrollo: 50,
  contenido: 65,
  revision: 75,
  testing: 85,
  lanzamiento: 95,
  soporte: 100,
};

export const WEB_SERVICE_TYPE_LABELS: Record<string, string> = {
  landing_page: "Landing Page",
  sitio_corporativo: "Sitio Corporativo",
  ecommerce: "E-Commerce",
  blog: "Blog",
  webapp: "Web App",
  rediseno: "Redise\u00f1o",
  mantenimiento: "Mantenimiento",
};

export const WEB_STAGE_STATUSES = [
  "pending",
  "queued",
  "processing",
  "review_required",
  "approved",
  "failed",
  "completed",
] as const;
