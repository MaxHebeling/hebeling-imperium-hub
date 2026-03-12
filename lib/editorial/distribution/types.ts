export type DistributionChannel =
  | "amazon_kdp"
  | "apple_books"
  | "google_play"
  | "kobo"
  | "barnes_noble"
  | "direct_sale"
  | "library"
  | "print_on_demand"
  | "custom";

export type DistributionStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "submitted"
  | "live"
  | "rejected"
  | "suspended"
  | "archived";

export type DistributionRegion =
  | "worldwide"
  | "north_america"
  | "europe"
  | "latin_america"
  | "asia_pacific"
  | "custom";

export interface DistributionChannelConfig {
  id: string;
  org_id: string;
  channel: DistributionChannel;
  name: string;
  description: string | null;
  api_endpoint: string | null;
  credentials_ref: string | null;
  is_enabled: boolean;
  supported_formats: string[];
  regions: DistributionRegion[];
  commission_percent: number | null;
  min_price: number | null;
  max_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectDistribution {
  id: string;
  project_id: string;
  channel: DistributionChannel;
  status: DistributionStatus;
  export_id: string | null;
  external_id: string | null;
  external_url: string | null;
  price: number | null;
  currency: string;
  regions: DistributionRegion[];
  metadata: ProjectDistributionMetadata;
  submitted_at: string | null;
  published_at: string | null;
  last_synced_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectDistributionMetadata {
  isbn?: string;
  asin?: string;
  categories?: string[];
  keywords?: string[];
  description?: string;
  author_bio?: string;
  publisher_name?: string;
  publication_date?: string;
  language?: string;
  page_count?: number;
  drm_enabled?: boolean;
}

export const DISTRIBUTION_CHANNEL_LABELS: Record<DistributionChannel, string> = {
  amazon_kdp: "Amazon KDP",
  apple_books: "Apple Books",
  google_play: "Google Play Libros",
  kobo: "Kobo",
  barnes_noble: "Barnes & Noble",
  direct_sale: "Venta Directa",
  library: "Bibliotecas",
  print_on_demand: "Impresión bajo demanda",
  custom: "Canal personalizado",
};

export const DISTRIBUTION_STATUS_LABELS: Record<DistributionStatus, string> = {
  draft: "Borrador",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  submitted: "Enviado",
  live: "Publicado",
  rejected: "Rechazado",
  suspended: "Suspendido",
  archived: "Archivado",
};

export const DISTRIBUTION_REGION_LABELS: Record<DistributionRegion, string> = {
  worldwide: "Mundial",
  north_america: "Norteamérica",
  europe: "Europa",
  latin_america: "Latinoamérica",
  asia_pacific: "Asia-Pacífico",
  custom: "Personalizado",
};

export const DEFAULT_CHANNEL_CONFIGS: Partial<Record<DistributionChannel, { 
  supportedFormats: string[]; 
  defaultRegions: DistributionRegion[];
  commissionPercent: number;
}>> = {
  amazon_kdp: {
    supportedFormats: ["epub", "mobi", "pdf"],
    defaultRegions: ["worldwide"],
    commissionPercent: 30,
  },
  apple_books: {
    supportedFormats: ["epub"],
    defaultRegions: ["worldwide"],
    commissionPercent: 30,
  },
  google_play: {
    supportedFormats: ["epub", "pdf"],
    defaultRegions: ["worldwide"],
    commissionPercent: 30,
  },
  kobo: {
    supportedFormats: ["epub"],
    defaultRegions: ["worldwide"],
    commissionPercent: 30,
  },
  barnes_noble: {
    supportedFormats: ["epub"],
    defaultRegions: ["north_america"],
    commissionPercent: 35,
  },
  direct_sale: {
    supportedFormats: ["pdf", "epub"],
    defaultRegions: ["worldwide"],
    commissionPercent: 0,
  },
  print_on_demand: {
    supportedFormats: ["pdf"],
    defaultRegions: ["worldwide"],
    commissionPercent: 40,
  },
};
