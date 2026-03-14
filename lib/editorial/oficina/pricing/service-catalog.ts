/* ------------------------------------------------------------------ */
/*  Pricing Engine — Service Catalog with Base Prices                  */
/*  All prices in USD base (before country/complexity multipliers)      */
/* ------------------------------------------------------------------ */

import type { ServiceKey, ServicePrice } from "./types";

export const SERVICE_PRICES: Record<ServiceKey, ServicePrice> = {
  correccion_ortotipografica: {
    key: "correccion_ortotipografica",
    basePrice: 150,
    name: {
      es: "Corrección ortotipográfica",
      en: "Orthographic correction",
    },
    description: {
      es: "Revisión de ortografía, gramática, puntuación y normas tipográficas.",
      en: "Review of spelling, grammar, punctuation, and typographic standards.",
    },
    category: "correction",
  },
  correccion_gramatical: {
    key: "correccion_gramatical",
    basePrice: 200,
    name: {
      es: "Corrección gramatical",
      en: "Grammar correction",
    },
    description: {
      es: "Revisión completa de gramática, sintaxis y estructura de oraciones.",
      en: "Complete grammar, syntax, and sentence structure review.",
    },
    category: "correction",
  },
  correccion_estilo: {
    key: "correccion_estilo",
    basePrice: 300,
    name: {
      es: "Edición de estilo",
      en: "Style editing",
    },
    description: {
      es: "Revisión del estilo narrativo, coherencia, claridad y fluidez del texto.",
      en: "Review of narrative style, coherence, clarity, and text flow.",
    },
    category: "correction",
  },
  revision_edicion: {
    key: "revision_edicion",
    basePrice: 350,
    name: {
      es: "Revisión y edición de contenido",
      en: "Content review and editing",
    },
    description: {
      es: "Revisión profunda del contenido, estructura narrativa y edición general.",
      en: "In-depth content review, narrative structure, and general editing.",
    },
    category: "correction",
  },
  diseno_interior: {
    key: "diseno_interior",
    basePrice: 400,
    name: {
      es: "Diseño interior / Maquetación",
      en: "Interior layout design",
    },
    description: {
      es: "Composición profesional del interior del libro con tipografía y diseño editorial.",
      en: "Professional book interior composition with typography and editorial design.",
    },
    category: "design",
  },
  diseno_portada: {
    key: "diseno_portada",
    basePrice: 350,
    name: {
      es: "Diseño de portada, contraportada y lomo",
      en: "Cover, back cover, and spine design",
    },
    description: {
      es: "Diseño profesional de portada, lomo y contraportada.",
      en: "Professional cover, spine, and back cover design.",
    },
    category: "design",
  },
  ebook_conversion: {
    key: "ebook_conversion",
    basePrice: 200,
    name: {
      es: "Conversión a eBook",
      en: "eBook conversion",
    },
    description: {
      es: "Conversión del manuscrito a formato EPUB/MOBI optimizado para lectores digitales.",
      en: "Manuscript conversion to EPUB/MOBI format optimized for digital readers.",
    },
    category: "publishing",
  },
  publicacion_amazon: {
    key: "publicacion_amazon",
    basePrice: 150,
    name: {
      es: "Publicación en Amazon KDP",
      en: "Amazon KDP publishing",
    },
    description: {
      es: "Subida, configuración y publicación del libro en Amazon KDP.",
      en: "Upload, setup, and publishing of the book on Amazon KDP.",
    },
    category: "publishing",
  },
  distribucion: {
    key: "distribucion",
    basePrice: 200,
    name: {
      es: "Configuración de distribución",
      en: "Distribution setup",
    },
    description: {
      es: "Configuración de canales de distribución digital y físico.",
      en: "Setup of digital and physical distribution channels.",
    },
    category: "publishing",
  },
  isbn: {
    key: "isbn",
    basePrice: 125,
    name: {
      es: "Gestión de código ISBN",
      en: "ISBN code management",
    },
    description: {
      es: "Trámite y asignación de ISBN para publicación.",
      en: "ISBN processing and assignment for publication.",
    },
    category: "legal",
  },
  copyright_usa: {
    key: "copyright_usa",
    basePrice: 250,
    name: {
      es: "Registro de Copyright (USA)",
      en: "Copyright registration (USA)",
    },
    description: {
      es: "Trámite completo de registro ante la U.S. Copyright Office.",
      en: "Complete registration with the U.S. Copyright Office.",
    },
    category: "legal",
  },
  copyright_mx: {
    key: "copyright_mx",
    basePrice: 200,
    name: {
      es: "Registro de Copyright (México - INDAUTOR)",
      en: "Copyright registration (Mexico - INDAUTOR)",
    },
    description: {
      es: "Trámite de registro de derechos de autor ante INDAUTOR.",
      en: "Copyright registration with INDAUTOR.",
    },
    category: "legal",
  },
  copyright_ar: {
    key: "copyright_ar",
    basePrice: 180,
    name: {
      es: "Registro de Copyright (Argentina - DNDA)",
      en: "Copyright registration (Argentina - DNDA)",
    },
    description: {
      es: "Trámite de registro ante la Dirección Nacional del Derecho de Autor.",
      en: "Copyright registration with Argentina's DNDA.",
    },
    category: "legal",
  },
  editorial_completo: {
    key: "editorial_completo",
    basePrice: 1500,
    name: {
      es: "Paquete Editorial Completo",
      en: "Complete Editorial Package",
    },
    description: {
      es: "Incluye corrección, edición, diseño interior, portada y preparación para publicación.",
      en: "Includes editing, correction, interior design, cover, and publication preparation.",
    },
    category: "package",
  },
  reedicion: {
    key: "reedicion",
    basePrice: 400,
    name: {
      es: "Re-edición de manuscrito",
      en: "Manuscript re-editing",
    },
    description: {
      es: "Revisión y re-edición completa de un manuscrito previamente publicado.",
      en: "Complete review and re-editing of a previously published manuscript.",
    },
    category: "correction",
  },
  rediseno_portada: {
    key: "rediseno_portada",
    basePrice: 250,
    name: {
      es: "Re-diseño de portada",
      en: "Cover redesign",
    },
    description: {
      es: "Nuevo diseño profesional de portada para un libro ya publicado.",
      en: "New professional cover design for an already published book.",
    },
    category: "design",
  },
};

/** Get all services grouped by category */
export function getServicesByCategory(locale: "es" | "en") {
  const categories = {
    correction: { label: locale === "es" ? "Corrección y Edición" : "Correction & Editing", services: [] as ServicePrice[] },
    design: { label: locale === "es" ? "Diseño" : "Design", services: [] as ServicePrice[] },
    publishing: { label: locale === "es" ? "Publicación" : "Publishing", services: [] as ServicePrice[] },
    legal: { label: locale === "es" ? "Legal y Registros" : "Legal & Registration", services: [] as ServicePrice[] },
    package: { label: locale === "es" ? "Paquetes" : "Packages", services: [] as ServicePrice[] },
  };

  for (const service of Object.values(SERVICE_PRICES)) {
    categories[service.category].services.push(service);
  }

  return categories;
}

/** Get a single service by key */
export function getService(key: ServiceKey): ServicePrice | undefined {
  return SERVICE_PRICES[key];
}
