export const IKINGDOM_BRIEF_URL = "https://www.ikingdom.org/brief";

export const ikingdomKpis = [
  {
    label: "Leads activos",
    value: "12",
    note: "4 con brief pendiente y 3 listos para propuesta",
  },
  {
    label: "Briefs recibidos",
    value: "8",
    note: "Base estratégica disponible para diagnóstico y cotización",
  },
  {
    label: "Propuestas abiertas",
    value: "5",
    note: "2 en seguimiento directo esta semana",
  },
  {
    label: "Proyectos activos",
    value: "2",
    note: "1 en fase de arquitectura y 1 en desarrollo",
  },
];

export const ikingdomLeadStages = [
  { label: "Nuevo lead", count: 3, description: "Entradas recientes desde formularios, WhatsApp y referencia directa." },
  { label: "Contacto iniciado", count: 2, description: "Conversación abierta; falta calificación y siguiente acción." },
  { label: "Brief enviado", count: 4, description: "Ya se compartió el enlace del brief general y se espera respuesta." },
  { label: "Brief recibido", count: 3, description: "Información lista para análisis, diagnóstico y propuesta." },
  { label: "Propuesta enviada", count: 3, description: "Cotización entregada; requiere seguimiento estratégico." },
  { label: "Cierre ganado", count: 1, description: "Cliente aprobado y en transición a onboarding." },
];

export const ikingdomLeadRecords = [
  {
    company: "Domínguez & Toranzos",
    contact: "Dirección general",
    origin: "Referencia",
    status: "Brief recibido",
    nextAction: "Preparar diagnóstico arquitectónico",
    value: "$3.5K",
  },
  {
    company: "Redes de Reino",
    contact: "Sergio Ariel Gómez",
    origin: "Formulario",
    status: "Propuesta enviada",
    nextAction: "Dar seguimiento en 48 horas",
    value: "$2.4K",
  },
  {
    company: "Constructora privada",
    contact: "Socio fundador",
    origin: "WhatsApp",
    status: "Brief enviado",
    nextAction: "Confirmar envío de assets visuales",
    value: "$4.8K",
  },
];

export const ikingdomBriefLibrary = [
  {
    title: "Brief General de Presencia Digital",
    status: "Activo",
    purpose: "Calificar leads y levantar información base para cotización y estudio arquitectónico.",
    output: "Resumen comercial + prompt de diseño + insumo para diagnóstico.",
  },
  {
    title: "Diagnóstico Arquitectónico Digital",
    status: "Siguiente fase",
    purpose: "Traducir el brief a hallazgos estratégicos, estructura y recomendación.",
    output: "Oportunidades, riesgos, enfoque de conversión y ticket sugerido.",
  },
  {
    title: "Ficha Estratégica del Cliente",
    status: "Plantilla",
    purpose: "Concentrar posicionamiento, objeciones, promesa, estilo y diferenciadores.",
    output: "Documento interno para ventas, copy y dirección visual.",
  },
];

export const ikingdomProposalTemplates = [
  {
    name: "Propuesta Express",
    useCase: "Prospectos que necesitan velocidad de decisión y una oferta clara.",
    includes: "Alcance, tiempos, inversión, entregables y CTA de cierre.",
  },
  {
    name: "Propuesta Premium",
    useCase: "Marcas que requieren narrativa, arquitectura y ejecución con mayor detalle.",
    includes: "Diagnóstico, enfoque visual, experiencia, desarrollo y optimización.",
  },
  {
    name: "Propuesta por fases",
    useCase: "Clientes que necesitan avanzar por etapas o con presupuesto escalonado.",
    includes: "Fase estratégica, fase visual, fase técnica y add-ons.",
  },
];

export const ikingdomProjectStages = [
  "Onboarding",
  "Recepción de assets",
  "Arquitectura y copy",
  "Diseño visual",
  "Desarrollo",
  "Revisión cliente",
  "Ajustes finales",
  "Publicación",
];

export const ikingdomProjectBoard = [
  {
    name: "Landing premium de firma legal",
    phase: "Arquitectura y copy",
    owner: "Dirección estratégica",
    blocker: "Esperando mensajes clave del cliente",
  },
  {
    name: "Landing de servicios high-ticket",
    phase: "Desarrollo",
    owner: "Producción web",
    blocker: "Pendiente validación final del formulario",
  },
];
