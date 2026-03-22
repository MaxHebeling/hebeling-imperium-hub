export type PortalLocale = "es" | "en";

export const PORTAL_TRANSLATIONS = {
  es: {
    // Nav
    myBooks: "Mis Libros",
    overview: "Resumen",
    signOut: "Salir",

    // Projects list
    myBooksTitle: "Mis Libros",
    myBooksSubtitle: "Proyectos editoriales asociados a tu cuenta",
    loading: "Cargando...",
    noProjectsYet: "Sin proyectos aún",
    noProjectsDesc: "Tu equipo editorial aún no ha vinculado ningún libro a tu cuenta.",
    cantSeeBook: "¿No ves tu libro?",
    contactUs: "Contáctanos",
    retry: "Reintentar",
    networkError: "Error de red. Verifica tu conexión e intenta de nuevo.",
    created: "Creado",
    inProgress: "En proceso",
    review: "En revisión",
    completed: "Completado",
    archived: "Archivado",

    // Project detail
    backToBooks: "Mis libros",
    by: "por",
    currentStage: "Etapa actual",
    progress: "Progreso",
    uploadNewVersion: "Subir nueva versión",
    uploadDesc: "Sube el manuscrito actualizado. La versión anterior se conservará.",
    selectFile: "Seleccionar archivo",
    uploading: "Subiendo...",
    uploadSuccess: "¡Archivo subido correctamente!",
    acceptedFormats: "Formatos: .doc, .docx, .pdf, .txt, .odt",
    pipelineStatus: "Estado del Proceso",
    pipelineDesc: "Cada etapa del proceso de producción de tu libro",
    myFiles: "Mis archivos",
    noFilesYet: "Aún no hay archivos compartidos contigo.",
    editorialNotes: "Notas del equipo editorial",
    downloads: "Descargas disponibles",
    ready: "Listo",
    estimatedDelivery: "Fecha estimada de entrega",
    stage: "Etapa",
    current: "Actual",

    // Stage statuses
    pending: "Pendiente",
    queued: "En cola",
    processing: "Procesando",
    reviewRequired: "Necesita revisión",
    approved: "Aprobada",
    failed: "Error",
    stageCompleted: "Completada",

    // Comments
    comments: "Comentarios",
    writeComment: "Escribe un comentario...",
    send: "Enviar",
    you: "Tú",
    editorialTeam: "Equipo Editorial",
    commentSent: "Comentario enviado",
    commentError: "Error al enviar comentario",

    // Notifications
    welcomeTitle: "¡Bienvenido a Reino Editorial!",
    welcomeMsg: "Tu libro está en las mejores manos. Aquí podrás seguir el progreso editorial en tiempo real.",
    notifications: "Notificaciones",
    noNotifications: "Sin notificaciones nuevas",
    markAllRead: "Marcar todo como leído",
    newComment: "Nuevo comentario",
    newSuggestion: "Nueva sugerencia",
    stageUpdate: "Actualización de etapa",
    projectUpdate: "Actualización del proyecto",
    fileShared: "Archivo compartido",
    justNow: "Justo ahora",
    minutesAgo: "hace {n} min",
    hoursAgo: "hace {n} h",
    daysAgo: "hace {n} d",

    // Language
    language: "Idioma",
    spanish: "Español",
    english: "English",

    // Registration
    fullName: "Nombre completo",
    emailAddress: "Correo electronico",
    phone: "Telefono",
    dateOfBirth: "Fecha de nacimiento",
    passwordLabel: "Contrasena",
    confirmPassword: "Confirmar contrasena",
    acceptTerms: "Acepto los terminos y condiciones de Reino Editorial",
    createAccount: "Crear mi cuenta",
    alreadyHaveAccount: "Ya tengo cuenta",
    dontHaveAccount: "No tengo cuenta",
    forgotPassword: "Olvide mi contrasena",
    resetPassword: "Restablecer contrasena",
    login: "Iniciar sesion",
    register: "Registrarse",
    enterYourEmail: "Ingresa tu correo",

    // Author Dashboard
    authorDashboard: "Panel del Autor",
    myBook: "Mi Libro",
    updates: "Actualizaciones",
    authorPanel: "Panel del Autor",

    // Birthday
    birthdayTitle: "Reino Editorial te desea un feliz cumpleanos",
    birthdayMsg: "Hoy es un dia especial para ti. Todo el equipo de Reino Editorial te desea lo mejor.",

    // Communication Preferences
    communicationPreferences: "Preferencias de comunicacion",
    birthdayEmailEnabled: "Felicitacion por correo electronico",
    birthdayPhoneEnabled: "Felicitacion por telefono/SMS",
    birthdayNotificationEnabled: "Felicitacion en el portal",
    savePreferences: "Guardar preferencias",
    preferencesSaved: "Preferencias guardadas correctamente",

    // App Download
    downloadApp: "Descarga la app de Reino Editorial",
    downloadAppDesc: "Lleva tu libro contigo y sigue el progreso desde tu telefono.",
    comingSoon: "Proximamente",
    notifyMe: "Avisame cuando este disponible",

    // Premium Portal
    welcomeBack: "Bienvenido de vuelta",
    welcomeBackName: "Bienvenido, {name}",
    portalSubtitle: "Aqui puedes seguir el progreso editorial de tu libro.",
    dayOf12: "Dia {n} de 12",
    nextStep: "Proximo paso",
    estimatedCompletion: "Finalizacion estimada",
    yourBookIs: "Tu libro esta actualmente en:",
    projectUpdates: "Actualizaciones de tu proyecto",
    noUpdatesYet: "Aun no hay actualizaciones para mostrar.",
    updatesDesc: "Recibe informacion sobre el avance de tu libro.",
    allFiles: "Todos los archivos",
    allFilesDesc: "Documentos y entregables de tu proyecto editorial.",
    noFilesAvailable: "Aun no hay archivos disponibles.",
    downloadFile: "Descargar",
    previewFile: "Ver",
    notificationsPage: "Centro de Notificaciones",
    notificationsDesc: "Todas tus notificaciones en un solo lugar.",
    viewAll: "Ver todo",
    recentUpdates: "Actualizaciones recientes",
    editorialProcess: "Proceso Editorial",
    editorialProcessDesc: "Tu libro avanza por un proceso editorial profesional de 12 dias.",
    stageDetail: "Detalle de etapa",

    // Stage descriptions for client (non-technical, editorial)
    stageDescriptions: {
      ingesta: "Estamos revisando y validando tu manuscrito original para iniciar el proceso editorial.",
      estructura: "Estamos analizando la organizacion de tu contenido para mejorar claridad y coherencia.",
      estilo: "Nuestro equipo trabaja en perfeccionar la redaccion, fluidez y consistencia del texto.",
      ortotipografia: "Revisamos la ortografia, gramatica y tipografia de tu manuscrito con atencion profesional.",
      maquetacion: "Estamos disenando el interior de tu libro con un formato elegante y profesional.",
      revision_final: "Tu libro esta en revision final exhaustiva antes de su entrega.",
      export: "Estamos preparando los archivos finales de tu libro para su publicacion.",
      distribution: "Tu libro esta siendo preparado para su distribucion y disponibilidad comercial.",
    },

    // Delays
    stageMessages: {
      ingesta: { active: "Tu manuscrito está siendo revisado por nuestro equipo editorial.", completed: "Revisión inicial completada." },
      estructura: { active: "Analizando la estructura narrativa de tu obra.", completed: "Análisis estructural completado." },
      estilo: { active: "Nuestro equipo trabaja en la corrección de estilo.", completed: "Corrección de estilo finalizada." },
      ortotipografia: { active: "Revisando ortografía y tipografía profesional.", completed: "Corrección ortotipográfica completada." },
      maquetacion: { active: "Diseñando el interior de tu libro con layout profesional.", completed: "Diseño interior completado." },
      revision_final: { active: "Tu libro está en revisión final exhaustiva.", completed: "Revisión final aprobada." },
      export: { active: "Preparando los archivos finales de tu libro.", completed: "Archivos finales listos." },
      distribution: { active: "Configurando la distribución de tu obra.", completed: "¡Tu libro está listo para publicar!" },
    },
    stageLabels: {
      ingesta: "Revisión Inicial",
      estructura: "Análisis Estructural",
      estilo: "Corrección de Estilo",
      ortotipografia: "Corrección Ortotipográfica",
      maquetacion: "Diseño Interior",
      revision_final: "Revisión Final",
      export: "Preparación de Archivos",
      distribution: "Listo para Publicar",
    },
  },
  en: {
    // Nav
    myBooks: "My Books",
    overview: "Overview",
    signOut: "Sign Out",

    // Projects list
    myBooksTitle: "My Books",
    myBooksSubtitle: "Editorial projects linked to your account",
    loading: "Loading...",
    noProjectsYet: "No projects yet",
    noProjectsDesc: "Your editorial team hasn't linked any books to your account yet.",
    cantSeeBook: "Can't see your book?",
    contactUs: "Contact us",
    retry: "Retry",
    networkError: "Network error. Check your connection and try again.",
    created: "Created",
    inProgress: "In Progress",
    review: "Under Review",
    completed: "Completed",
    archived: "Archived",

    // Project detail
    backToBooks: "My books",
    by: "by",
    currentStage: "Current stage",
    progress: "Progress",
    uploadNewVersion: "Upload new version",
    uploadDesc: "Upload the updated manuscript. The previous version will be preserved.",
    selectFile: "Select file",
    uploading: "Uploading...",
    uploadSuccess: "File uploaded successfully!",
    acceptedFormats: "Formats: .doc, .docx, .pdf, .txt, .odt",
    pipelineStatus: "Process Status",
    pipelineDesc: "Every stage of your book's production process",
    myFiles: "My files",
    noFilesYet: "No files shared with you yet.",
    editorialNotes: "Editorial team notes",
    downloads: "Available downloads",
    ready: "Ready",
    estimatedDelivery: "Estimated delivery date",
    stage: "Stage",
    current: "Current",

    // Stage statuses
    pending: "Pending",
    queued: "Queued",
    processing: "Processing",
    reviewRequired: "Review required",
    approved: "Approved",
    failed: "Error",
    stageCompleted: "Completed",

    // Comments
    comments: "Comments",
    writeComment: "Write a comment...",
    send: "Send",
    you: "You",
    editorialTeam: "Editorial Team",
    commentSent: "Comment sent",
    commentError: "Error sending comment",

    // Notifications
    welcomeTitle: "Welcome to Reino Editorial!",
    welcomeMsg: "Your book is in the best hands. Here you can follow the editorial progress in real time.",
    notifications: "Notifications",
    noNotifications: "No new notifications",
    markAllRead: "Mark all as read",
    newComment: "New comment",
    newSuggestion: "New suggestion",
    stageUpdate: "Stage update",
    projectUpdate: "Project update",
    fileShared: "File shared",
    justNow: "Just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",

    // Language
    language: "Language",
    spanish: "Español",
    english: "English",

    // Registration
    fullName: "Full name",
    emailAddress: "Email address",
    phone: "Phone number",
    dateOfBirth: "Date of birth",
    passwordLabel: "Password",
    confirmPassword: "Confirm password",
    acceptTerms: "I accept the terms and conditions of Reino Editorial",
    createAccount: "Create my account",
    alreadyHaveAccount: "Already have an account",
    dontHaveAccount: "Don't have an account",
    forgotPassword: "Forgot my password",
    resetPassword: "Reset password",
    login: "Sign in",
    register: "Sign up",
    enterYourEmail: "Enter your email",

    // Author Dashboard
    authorDashboard: "Author Dashboard",
    myBook: "My Book",
    updates: "Updates",
    authorPanel: "Author Dashboard",

    // Birthday
    birthdayTitle: "Reino Editorial wishes you a happy birthday",
    birthdayMsg: "Today is a special day for you. The entire Reino Editorial team wishes you the very best.",

    // Communication Preferences
    communicationPreferences: "Communication preferences",
    birthdayEmailEnabled: "Birthday email greeting",
    birthdayPhoneEnabled: "Birthday phone/SMS greeting",
    birthdayNotificationEnabled: "Birthday portal notification",
    savePreferences: "Save preferences",
    preferencesSaved: "Preferences saved successfully",

    // App Download
    downloadApp: "Download the Reino Editorial app",
    downloadAppDesc: "Take your book with you and follow the progress from your phone.",
    comingSoon: "Coming soon",
    notifyMe: "Notify me when available",

    // Premium Portal
    welcomeBack: "Welcome back",
    welcomeBackName: "Welcome, {name}",
    portalSubtitle: "Here you can follow the editorial progress of your book.",
    dayOf12: "Day {n} of 12",
    nextStep: "Next step",
    estimatedCompletion: "Estimated completion",
    yourBookIs: "Your book is currently in:",
    projectUpdates: "Project updates",
    noUpdatesYet: "No updates to show yet.",
    updatesDesc: "Receive information about the progress of your book.",
    allFiles: "All files",
    allFilesDesc: "Documents and deliverables from your editorial project.",
    noFilesAvailable: "No files available yet.",
    downloadFile: "Download",
    previewFile: "View",
    notificationsPage: "Notification Center",
    notificationsDesc: "All your notifications in one place.",
    viewAll: "View all",
    recentUpdates: "Recent updates",
    editorialProcess: "Editorial Process",
    editorialProcessDesc: "Your book goes through a professional 12-day editorial process.",
    stageDetail: "Stage detail",

    // Stage descriptions for client (non-technical, editorial)
    stageDescriptions: {
      ingesta: "We are reviewing and validating your original manuscript to begin the editorial process.",
      estructura: "We are analyzing the structure of your content to improve clarity and coherence.",
      estilo: "Our team is working on refining the writing, flow, and consistency of your text.",
      ortotipografia: "We are reviewing the spelling, grammar, and typography of your manuscript with professional attention.",
      maquetacion: "We are designing the interior of your book with an elegant and professional format.",
      revision_final: "Your book is undergoing a comprehensive final review before delivery.",
      export: "We are preparing the final files for your book for publication.",
      distribution: "Your book is being prepared for distribution and commercial availability.",
    },

    // Delays
    stageMessages: {
      ingesta: { active: "Your manuscript is being reviewed by our editorial team.", completed: "Initial review completed." },
      estructura: { active: "Analyzing the narrative structure of your work.", completed: "Structural analysis completed." },
      estilo: { active: "Our team is working on style editing.", completed: "Style editing finished." },
      ortotipografia: { active: "Reviewing professional spelling and typography.", completed: "Orthotypographic review completed." },
      maquetacion: { active: "Designing the interior layout of your book.", completed: "Interior design completed." },
      revision_final: { active: "Your book is in final comprehensive review.", completed: "Final review approved." },
      export: { active: "Preparing the final files for your book.", completed: "Final files ready." },
      distribution: { active: "Setting up distribution for your work.", completed: "Your book is ready to publish!" },
    },
    stageLabels: {
      ingesta: "Initial Review",
      estructura: "Structural Analysis",
      estilo: "Style Editing",
      ortotipografia: "Orthotypographic Review",
      maquetacion: "Interior Design",
      revision_final: "Final Review",
      export: "File Preparation",
      distribution: "Ready to Publish",
    },
  },
} as const;

export type PortalTranslations = typeof PORTAL_TRANSLATIONS.es;

export function getTranslations(locale: PortalLocale): PortalTranslations {
  // Both locales have the same shape; cast to satisfy strict literal types
  return PORTAL_TRANSLATIONS[locale] as unknown as PortalTranslations;
}
