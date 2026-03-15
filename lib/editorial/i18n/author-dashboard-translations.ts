import type { PortalLocale } from "./portal-translations";

export const AUTHOR_DASHBOARD_TRANSLATIONS = {
  es: {
    // Navigation
    authorDashboard: "Panel del Autor",
    
    // Book Profile
    bookProfile: "Perfil de tu libro",
    primaryGenre: "Genero principal",
    estimatedAudience: "Audiencia estimada",
    readingLevel: "Nivel de lectura",
    estimatedReadingTime: "Tiempo estimado de lectura",
    hours: "horas",
    minutes: "minutos",
    
    // Clarity
    contentClarity: "Claridad del contenido",
    clarityDesc: "Evaluacion de que tan claro y accesible es tu mensaje para el lector.",
    excellent: "Excelente",
    veryGood: "Muy buena",
    good: "Buena",
    acceptable: "Aceptable",
    needsWork: "Necesita mejora",
    
    // Narrative Flow
    narrativeFlow: "Fluidez narrativa",
    flowDesc: "Evaluacion de como fluye el texto entre capitulos y secciones.",
    flowExcellent: "El contenido fluye de manera excepcional. Cada capitulo conecta naturalmente con el siguiente.",
    flowVeryGood: "El contenido fluye de manera natural entre capitulos.",
    flowGood: "El flujo general es bueno con algunas areas que podrian mejorar.",
    flowAcceptable: "El flujo es aceptable pero hay secciones que podrian conectarse mejor.",
    
    // Message Impact
    messageImpact: "Impacto del mensaje",
    impactDesc: "Evaluacion del potencial de impacto de tu libro en los lectores.",
    impactHigh: "El contenido presenta ideas claras y con alto potencial de impacto en el lector.",
    impactMedium: "El contenido tiene buen potencial de impacto con oportunidades de fortalecimiento.",
    impactModerate: "El mensaje tiene base solida con areas que podrian amplificarse.",
    
    // Structure
    bookStructure: "Estructura del libro",
    structureDesc: "Organizacion general del contenido de tu obra.",
    introduction: "Introduccion",
    chapters: "capitulos",
    conclusion: "Conclusion",
    appendix: "Apendice",
    structureProgressive: "La estructura del libro es progresiva y facil de seguir.",
    structureWellOrganized: "El contenido esta bien organizado en secciones claras.",
    
    // Audience
    estimatedAudienceTitle: "Audiencia estimada",
    audienceDesc: "Lectores que podrian estar interesados en tu libro.",
    
    // Strengths
    keyStrengths: "Fortalezas principales",
    strengthsDesc: "Aspectos destacados de tu manuscrito identificados por nuestro equipo editorial.",
    
    // Improvements
    improvementOpportunities: "Oportunidades de mejora",
    improvementsDesc: "Sugerencias constructivas para fortalecer tu obra.",
    
    // Influence Map
    influenceMap: "Mapa de influencia de tu libro",
    influenceDesc: "Como podria impactar tu libro en distintos tipos de lectores.",
    potentialReaders: "Posibles lectores de tu libro",
    reachPotential: "Potencial de alcance",
    high: "Alto",
    medium: "Medio",
    moderate: "Moderado",
    
    // Key Themes
    keyThemes: "Temas principales",
    themesDesc: "Temas centrales identificados en el contenido de tu obra.",
    
    // General
    basedOnEditorialReview: "Basado en la revision editorial de tu manuscrito",
    lastUpdated: "Ultima actualizacion",
    noDataYet: "Tu manuscrito esta siendo revisado por nuestro equipo editorial. Los resultados estaran disponibles pronto.",
    editorialAnalysis: "Analisis Editorial",
  },
  en: {
    // Navigation
    authorDashboard: "Author Dashboard",
    
    // Book Profile
    bookProfile: "Your book profile",
    primaryGenre: "Primary genre",
    estimatedAudience: "Estimated audience",
    readingLevel: "Reading level",
    estimatedReadingTime: "Estimated reading time",
    hours: "hours",
    minutes: "minutes",
    
    // Clarity
    contentClarity: "Content clarity",
    clarityDesc: "Assessment of how clear and accessible your message is for readers.",
    excellent: "Excellent",
    veryGood: "Very good",
    good: "Good",
    acceptable: "Acceptable",
    needsWork: "Needs improvement",
    
    // Narrative Flow
    narrativeFlow: "Narrative flow",
    flowDesc: "Assessment of how the text flows between chapters and sections.",
    flowExcellent: "The content flows exceptionally well. Each chapter connects naturally to the next.",
    flowVeryGood: "The content flows naturally between chapters.",
    flowGood: "Overall flow is good with some areas that could improve.",
    flowAcceptable: "Flow is acceptable but some sections could connect better.",
    
    // Message Impact
    messageImpact: "Message impact",
    impactDesc: "Assessment of your book's potential impact on readers.",
    impactHigh: "The content presents clear ideas with strong potential impact for readers.",
    impactMedium: "The content has good impact potential with strengthening opportunities.",
    impactModerate: "The message has a solid foundation with areas that could be amplified.",
    
    // Structure
    bookStructure: "Book structure",
    structureDesc: "Overall organization of your book's content.",
    introduction: "Introduction",
    chapters: "chapters",
    conclusion: "Conclusion",
    appendix: "Appendix",
    structureProgressive: "The structure of the book is progressive and easy to follow.",
    structureWellOrganized: "The content is well organized in clear sections.",
    
    // Audience
    estimatedAudienceTitle: "Estimated audience",
    audienceDesc: "Readers who may be interested in your book.",
    
    // Strengths
    keyStrengths: "Key strengths",
    strengthsDesc: "Highlights of your manuscript identified by our editorial team.",
    
    // Improvements
    improvementOpportunities: "Improvement opportunities",
    improvementsDesc: "Constructive suggestions to strengthen your work.",
    
    // Influence Map
    influenceMap: "Your book influence map",
    influenceDesc: "How your book could impact different types of readers.",
    potentialReaders: "Potential readers",
    reachPotential: "Reach potential",
    high: "High",
    medium: "Medium",
    moderate: "Moderate",
    
    // Key Themes
    keyThemes: "Key themes",
    themesDesc: "Central themes identified in your book's content.",
    
    // General
    basedOnEditorialReview: "Based on the editorial review of your manuscript",
    lastUpdated: "Last updated",
    noDataYet: "Your manuscript is being reviewed by our editorial team. Results will be available soon.",
    editorialAnalysis: "Editorial Analysis",
  },
} as const;

export type AuthorDashboardTranslations = typeof AUTHOR_DASHBOARD_TRANSLATIONS.es;

export function getAuthorDashboardTranslations(locale: PortalLocale): AuthorDashboardTranslations {
  return AUTHOR_DASHBOARD_TRANSLATIONS[locale] as unknown as AuthorDashboardTranslations;
}
