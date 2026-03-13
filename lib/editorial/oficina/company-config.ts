/* ------------------------------------------------------------------ */
/*  Oficina de Reino Editorial — Company Configuration                */
/*  Update these values with your real business information.           */
/* ------------------------------------------------------------------ */

import type { CompanyInfo } from "./types";

export const COMPANY_INFO: CompanyInfo = {
  name: "REINO EDITORIAL",
  legalName: "Reino Editorial",
  address: "Blvd la Cuspide 1962 #28\nPrivada Monte Ararat\nLa Cuspide C.P 22517\nTijuana, BC - Mexico",
  taxId: "",
  phone: "",
  email: "editorial@reinoeditorial.com",
  website: "editorialreino.com",
  bankName: "",
  bankAccount: "",
  bankClabe: "",
};

/* ------------------------------------------------------------------ */
/*  Pre-built service catalog (ES / EN)                               */
/* ------------------------------------------------------------------ */

export const SERVICE_CATALOG = {
  es: [
    {
      key: "editorial_completo",
      name: "Paquete Editorial Completo",
      description:
        "Incluye revision estructural, correccion de estilo, correccion ortotipografica, diseno interior, portada y preparacion de archivos para publicacion.",
      defaultPrice: 0,
    },
    {
      key: "revision_edicion",
      name: "Revision y edicion de contenido",
      description:
        "Revision profunda del contenido, estructura narrativa y edicion general del manuscrito.",
      defaultPrice: 0,
    },
    {
      key: "correccion_ortotipografica",
      name: "Correccion ortotipografica",
      description:
        "Revision de ortografia, gramatica, puntuacion y normas tipograficas.",
      defaultPrice: 0,
    },
    {
      key: "correccion_estilo",
      name: "Correccion de estilo",
      description:
        "Revision del estilo narrativo, coherencia, claridad y fluidez del texto.",
      defaultPrice: 0,
    },
    {
      key: "isbn",
      name: "Gestion de Codigo ISBN (Amazon)",
      description: "Tramite y asignacion de ISBN para publicacion en Amazon y otras plataformas.",
      defaultPrice: 0,
    },
    {
      key: "diseno_portada",
      name: "Diseno de portada, contraportada e interior",
      description:
        "Diseno profesional de portada, lomo, contraportada y composicion del interior del libro.",
      defaultPrice: 0,
    },
    {
      key: "publicacion",
      name: "Subida de libro para venta online en formato version impresa",
      description:
        "Publicacion y configuracion del libro en plataformas de venta online para version impresa y digital.",
      defaultPrice: 0,
    },
    {
      key: "ebook",
      name: "Elaboracion de eBook",
      description:
        "Conversion del manuscrito a formato EPUB y MOBI optimizado para lectores digitales.",
      defaultPrice: 0,
    },
    {
      key: "copyright_usa",
      name: "Gestion de Registro de Copyright (USA)",
      description:
        "Tramite completo de registro de copyright ante la U.S. Copyright Office, incluyendo formulario, envio de manuscrito y seguimiento.",
      defaultPrice: 0,
    },
    {
      key: "copyright_mx",
      name: "Gestion de Registro de Copyright (Mexico - INDAUTOR)",
      description:
        "Tramite de registro de derechos de autor ante INDAUTOR, incluyendo preparacion de documentos y seguimiento.",
      defaultPrice: 0,
    },
    {
      key: "copyright_ar",
      name: "Gestion de Registro de Copyright (Argentina - DNDA)",
      description:
        "Tramite de registro de derechos de autor ante la Direccion Nacional del Derecho de Autor de Argentina.",
      defaultPrice: 0,
    },
    {
      key: "reedicion",
      name: "Re-edicion de manuscrito",
      description:
        "Revision y re-edicion completa de un manuscrito previamente publicado o editado.",
      defaultPrice: 0,
    },
    {
      key: "rediseno_portada",
      name: "Re-diseno de portada",
      description:
        "Nuevo diseno profesional de portada para un libro ya publicado o en proceso.",
      defaultPrice: 0,
    },
  ],
  en: [
    {
      key: "editorial_completo",
      name: "Complete Editorial Package",
      description:
        "Includes structural review, style editing, copyediting, interior design, cover design, and file preparation for publication.",
      defaultPrice: 0,
    },
    {
      key: "revision_edicion",
      name: "Content review and editing",
      description:
        "In-depth content review, narrative structure and general manuscript editing.",
      defaultPrice: 0,
    },
    {
      key: "correccion_ortotipografica",
      name: "Copyediting",
      description:
        "Review of spelling, grammar, punctuation, and typographic standards.",
      defaultPrice: 0,
    },
    {
      key: "correccion_estilo",
      name: "Style editing",
      description:
        "Review of narrative style, coherence, clarity, and text flow.",
      defaultPrice: 0,
    },
    {
      key: "isbn",
      name: "ISBN Code Management (Amazon)",
      description: "ISBN processing and assignment for publication on Amazon and other platforms.",
      defaultPrice: 0,
    },
    {
      key: "diseno_portada",
      name: "Cover, back cover and interior design",
      description:
        "Professional cover, spine, back cover and interior design of the book.",
      defaultPrice: 0,
    },
    {
      key: "publicacion",
      name: "Book upload for online sale in print format",
      description:
        "Publishing and configuration of the book on online sales platforms for print and digital versions.",
      defaultPrice: 0,
    },
    {
      key: "ebook",
      name: "eBook creation",
      description:
        "Manuscript conversion to EPUB and MOBI formats optimized for digital readers.",
      defaultPrice: 0,
    },
    {
      key: "copyright_usa",
      name: "Copyright Registration Management (USA)",
      description:
        "Complete copyright registration process with the U.S. Copyright Office, including form submission, manuscript upload, and follow-up.",
      defaultPrice: 0,
    },
    {
      key: "copyright_mx",
      name: "Copyright Registration Management (Mexico - INDAUTOR)",
      description:
        "Copyright registration process with INDAUTOR, including document preparation and follow-up.",
      defaultPrice: 0,
    },
    {
      key: "copyright_ar",
      name: "Copyright Registration Management (Argentina - DNDA)",
      description:
        "Copyright registration process with Argentina's National Directorate of Copyright.",
      defaultPrice: 0,
    },
    {
      key: "reedicion",
      name: "Manuscript re-editing",
      description:
        "Complete review and re-editing of a previously published or edited manuscript.",
      defaultPrice: 0,
    },
    {
      key: "rediseno_portada",
      name: "Cover redesign",
      description:
        "New professional cover design for an already published or in-progress book.",
      defaultPrice: 0,
    },
  ],
} as const;
