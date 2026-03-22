import type { Locale } from "@/lib/i18n/translations";

type LocalizedText = {
  es: string;
  en: string;
};

type StaffOfficeSeatSeed = {
  title: LocalizedText;
  person: LocalizedText;
  scope: LocalizedText;
  accessLevel: LocalizedText;
  credentialStatus: LocalizedText;
};

type StaffOfficeContentBlockSeed = {
  title: LocalizedText;
  description: LocalizedText;
  releasePhase: LocalizedText;
};

type StaffOfficeSeed = {
  slug: string;
  order: number;
  title: LocalizedText;
  shortTitle: LocalizedText;
  subtitle: LocalizedText;
  summary: LocalizedText;
  audience: LocalizedText;
  access: LocalizedText;
  launchGoal: LocalizedText;
  officeFunctions: LocalizedText[];
  responsibilities: LocalizedText[];
  modules: LocalizedText[];
  contentBlocks: StaffOfficeContentBlockSeed[];
  seats: StaffOfficeSeatSeed[];
};

type CommunityWorkspaceSeed = {
  title: LocalizedText;
  subtitle: LocalizedText;
  summary: LocalizedText;
  audience: LocalizedText;
  access: LocalizedText;
  launchGoal: LocalizedText;
  modules: LocalizedText[];
  experiences: LocalizedText[];
};

export type IdrStaffOffice = {
  slug: string;
  order: number;
  code: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  summary: string;
  audience: string;
  access: string;
  launchGoal: string;
  officeFunctions: string[];
  responsibilities: string[];
  modules: string[];
  contentBlocks: {
    title: string;
    description: string;
    releasePhase: string;
  }[];
  seats: {
    title: string;
    person: string;
    scope: string;
    accessLevel: string;
    credentialStatus: string;
  }[];
  href: string;
};

export type IdrCommunityWorkspace = {
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  audience: string;
  access: string;
  launchGoal: string;
  modules: string[];
  experiences: string[];
  href: string;
};

const STAFF_OFFICE_SEEDS: StaffOfficeSeed[] = [
  {
    slug: "ceo",
    order: 1,
    title: {
      es: "CEO",
      en: "CEO",
    },
    shortTitle: {
      es: "CEO",
      en: "CEO",
    },
    subtitle: {
      es: "Visión general, autoridad ejecutiva y decisiones finales",
      en: "Overall vision, executive authority, and final decisions",
    },
    summary: {
      es: "Oficina principal para la dirección ejecutiva de Inversionistas del Reino, resguardo de visión, decisiones críticas y alineación total del proyecto.",
      en: "Primary office for the executive leadership of Kingdom Investors, safeguarding vision, critical decisions, and overall project alignment.",
    },
    audience: {
      es: "CEO y apoyo ejecutivo autorizado",
      en: "CEO and authorized executive support",
    },
    access: {
      es: "Acceso reservado por credenciales nominadas y control directo",
      en: "Reserved access via named credentials and direct control",
    },
    launchGoal: {
      es: "Concentrar la conducción ejecutiva del ministerio en una sola oficina premium.",
      en: "Concentrate the ministry’s executive leadership into a single premium office.",
    },
    officeFunctions: [
      {
        es: "Definir la visión general, prioridades y metas del ministerio.",
        en: "Define the ministry’s overall vision, priorities, and goals.",
      },
      {
        es: "Autorizar decisiones de alto impacto y cierres estratégicos.",
        en: "Authorize high-impact decisions and strategic closures.",
      },
      {
        es: "Supervisar el rumbo integral de las demás oficinas del staff.",
        en: "Oversee the overall direction of the remaining staff offices.",
      },
    ],
    responsibilities: [
      {
        es: "Visión estratégica y decisiones finales",
        en: "Strategic vision and final decisions",
      },
      {
        es: "Lineamientos ejecutivos reservados",
        en: "Reserved executive directives",
      },
      {
        es: "Coordinación transversal de oficinas",
        en: "Cross-office coordination",
      },
    ],
    modules: [
      {
        es: "Visión y acuerdos ejecutivos",
        en: "Vision and executive agreements",
      },
      {
        es: "Repositorio confidencial de dirección",
        en: "Confidential leadership repository",
      },
      {
        es: "Agenda estratégica del CEO",
        en: "CEO strategic agenda",
      },
    ],
    contentBlocks: [
      {
        title: {
          es: "Acuerdos ejecutivos reservados",
          en: "Reserved executive agreements",
        },
        description: {
          es: "Decisiones finales, lineamientos del proyecto y documentos de conducción general.",
          en: "Final decisions, project directives, and overall leadership documents.",
        },
        releasePhase: {
          es: "Release inicial",
          en: "Initial release",
        },
      },
      {
        title: {
          es: "Agenda estratégica de dirección",
          en: "Strategic leadership agenda",
        },
        description: {
          es: "Calendario de prioridades, sesiones clave y seguimiento del rumbo general.",
          en: "Priority calendar, key sessions, and overall direction follow-up.",
        },
        releasePhase: {
          es: "Fase operativa",
          en: "Operational phase",
        },
      },
      {
        title: {
          es: "Repositorio confidencial CEO",
          en: "Confidential CEO repository",
        },
        description: {
          es: "Material crítico y documentación premium solo para conducción ejecutiva.",
          en: "Critical material and premium documentation for executive leadership only.",
        },
        releasePhase: {
          es: "Fase segura",
          en: "Secure phase",
        },
      },
    ],
    seats: [
      {
        title: { es: "CEO", en: "CEO" },
        person: { es: "Ap. Jorge Pompa", en: "Ap. Jorge Pompa" },
        scope: { es: "Dirección ejecutiva y aprobación final", en: "Executive leadership and final approval" },
        accessLevel: { es: "Acceso total de oficina", en: "Full office access" },
        credentialStatus: { es: "Pendiente de credencial nominada", en: "Pending named credentials" },
      },
    ],
  },
  {
    slug: "presidente",
    order: 2,
    title: {
      es: "Presidente",
      en: "President",
    },
    shortTitle: {
      es: "Presidencia",
      en: "Presidency",
    },
    subtitle: {
      es: "Gobierno ministerial, conducción institucional y representación",
      en: "Ministry governance, institutional leadership, and representation",
    },
    summary: {
      es: "Oficina de presidencia para conducir la operación ministerial, afirmar dirección institucional y respaldar el cumplimiento de los acuerdos mayores.",
      en: "Presidential office to lead ministry operations, reinforce institutional direction, and support the execution of major agreements.",
    },
    audience: {
      es: "Presidencia y enlaces autorizados",
      en: "Presidency and authorized liaisons",
    },
    access: {
      es: "Acceso restringido al núcleo presidencial",
      en: "Restricted access for the presidential core",
    },
    launchGoal: {
      es: "Establecer una oficina de presidencia clara, reservada y trazable.",
      en: "Establish a clear, private, and traceable presidential office.",
    },
    officeFunctions: [
      {
        es: "Conducir la operación presidencial y el tono institucional del ministerio.",
        en: "Lead presidential operations and the institutional tone of the ministry.",
      },
      {
        es: "Acompañar la toma de decisiones estratégicas con liderazgo cercano.",
        en: "Support strategic decision-making through close leadership.",
      },
      {
        es: "Representar la presidencia en su relación con las demás oficinas.",
        en: "Represent the presidency in its relationship with the other offices.",
      },
    ],
    responsibilities: [
      {
        es: "Conducción institucional",
        en: "Institutional leadership",
      },
      {
        es: "Representación de presidencia",
        en: "Presidential representation",
      },
      {
        es: "Seguimiento de acuerdos superiores",
        en: "Follow-up on high-level agreements",
      },
    ],
    modules: [
      {
        es: "Sala de decisiones presidenciales",
        en: "Presidential decisions room",
      },
      {
        es: "Panel de acuerdos prioritarios",
        en: "Priority agreements panel",
      },
      {
        es: "Ruta institucional de seguimiento",
        en: "Institutional follow-up route",
      },
    ],
    contentBlocks: [
      {
        title: {
          es: "Directrices presidenciales",
          en: "Presidential directives",
        },
        description: {
          es: "Mensajes, orientaciones y resoluciones de presidencia para el ministerio.",
          en: "Messages, guidance, and presidential resolutions for the ministry.",
        },
        releasePhase: {
          es: "Release inicial",
          en: "Initial release",
        },
      },
      {
        title: {
          es: "Seguimiento institucional",
          en: "Institutional follow-up",
        },
        description: {
          es: "Bitácora de acuerdos superiores y continuidad de la operación presidencial.",
          en: "Log of major agreements and continuity of presidential operations.",
        },
        releasePhase: {
          es: "Fase operativa",
          en: "Operational phase",
        },
      },
      {
        title: {
          es: "Carpeta reservada de representación",
          en: "Reserved representation folder",
        },
        description: {
          es: "Documentos sensibles vinculados a representación y gobierno institucional.",
          en: "Sensitive documents tied to representation and institutional governance.",
        },
        releasePhase: {
          es: "Fase segura",
          en: "Secure phase",
        },
      },
    ],
    seats: [
      {
        title: { es: "Presidente", en: "President" },
        person: { es: "Ps. Heriberto Saucedo", en: "Ps. Heriberto Saucedo" },
        scope: { es: "Gobierno institucional y conducción ministerial", en: "Institutional governance and ministry leadership" },
        accessLevel: { es: "Acceso total de oficina", en: "Full office access" },
        credentialStatus: { es: "Pendiente de credencial nominada", en: "Pending named credentials" },
      },
    ],
  },
  {
    slug: "vice-presidente",
    order: 3,
    title: {
      es: "Vice-Presidente",
      en: "Vice President",
    },
    shortTitle: {
      es: "Vicepresidencia",
      en: "Vice Presidency",
    },
    subtitle: {
      es: "Apoyo estratégico, coordinación interna y continuidad ejecutiva",
      en: "Strategic support, internal coordination, and executive continuity",
    },
    summary: {
      es: "Oficina encargada de sostener la continuidad del liderazgo, acompañar a presidencia y asegurar que las decisiones ejecutivas se traduzcan en operación concreta.",
      en: "Office in charge of sustaining leadership continuity, supporting the presidency, and ensuring executive decisions translate into concrete operations.",
    },
    audience: {
      es: "Vicepresidencia y coordinación estratégica autorizada",
      en: "Vice presidency and authorized strategic coordination",
    },
    access: {
      es: "Acceso reservado para apoyo ejecutivo de alto nivel",
      en: "Reserved access for high-level executive support",
    },
    launchGoal: {
      es: "Dar estabilidad y seguimiento a la conducción ejecutiva del staff.",
      en: "Provide stability and follow-up for the staff’s executive leadership.",
    },
    officeFunctions: [
      {
        es: "Respaldar a presidencia y CEO en seguimiento estratégico.",
        en: "Support the president and CEO in strategic follow-up.",
      },
      {
        es: "Coordinar continuidad cuando las decisiones requieren despliegue entre oficinas.",
        en: "Coordinate continuity when decisions require deployment across offices.",
      },
      {
        es: "Fortalecer la comunicación ejecutiva entre liderazgo y operación.",
        en: "Strengthen executive communication between leadership and operations.",
      },
    ],
    responsibilities: [
      {
        es: "Seguimiento estratégico de liderazgo",
        en: "Strategic leadership follow-up",
      },
      {
        es: "Coordinación de continuidad ejecutiva",
        en: "Executive continuity coordination",
      },
      {
        es: "Puente entre decisiones y operación",
        en: "Bridge between decisions and operations",
      },
    ],
    modules: [
      {
        es: "Bitácora de seguimiento ejecutivo",
        en: "Executive follow-up log",
      },
      {
        es: "Panel de coordinación interoficinas",
        en: "Inter-office coordination panel",
      },
      {
        es: "Ruta de continuidad presidencial",
        en: "Presidential continuity route",
      },
    ],
    contentBlocks: [
      {
        title: {
          es: "Seguimiento de liderazgo",
          en: "Leadership follow-up",
        },
        description: {
          es: "Monitoreo de decisiones ejecutivas y continuidad entre CEO y presidencia.",
          en: "Monitoring of executive decisions and continuity between CEO and presidency.",
        },
        releasePhase: {
          es: "Release inicial",
          en: "Initial release",
        },
      },
      {
        title: {
          es: "Coordinación interoficinas",
          en: "Inter-office coordination",
        },
        description: {
          es: "Puente operativo entre oficinas para que las decisiones se ejecuten sin fricción.",
          en: "Operational bridge between offices so decisions are executed without friction.",
        },
        releasePhase: {
          es: "Fase operativa",
          en: "Operational phase",
        },
      },
      {
        title: {
          es: "Panel de continuidad ejecutiva",
          en: "Executive continuity panel",
        },
        description: {
          es: "Vista reservada de pendientes estratégicos, delegaciones y cierres.",
          en: "Reserved view of strategic pending items, delegations, and closures.",
        },
        releasePhase: {
          es: "Fase segura",
          en: "Secure phase",
        },
      },
    ],
    seats: [
      {
        title: { es: "Vice-Presidente", en: "Vice President" },
        person: { es: "Ps. Ivonne Pompa", en: "Ps. Ivonne Pompa" },
        scope: { es: "Coordinación ejecutiva y continuidad de liderazgo", en: "Executive coordination and leadership continuity" },
        accessLevel: { es: "Acceso ejecutivo de coordinación", en: "Executive coordination access" },
        credentialStatus: { es: "Pendiente de usuario y contraseña", en: "Pending username and password" },
      },
    ],
  },
  {
    slug: "finanzas",
    order: 4,
    title: {
      es: "Finanzas",
      en: "Finance",
    },
    shortTitle: {
      es: "Finanzas",
      en: "Finance",
    },
    subtitle: {
      es: "Planeación financiera, control, seguimiento y soporte administrativo",
      en: "Financial planning, control, follow-up, and administrative support",
    },
    summary: {
      es: "Oficina para la gestión financiera del ministerio, control interno, seguimiento de compromisos y soporte administrativo ligado a recursos y flujos económicos.",
      en: "Office for the ministry’s financial management, internal control, commitment tracking, and administrative support tied to resources and economic flows.",
    },
    audience: {
      es: "Equipo financiero y apoyo administrativo autorizado",
      en: "Financial team and authorized administrative support",
    },
    access: {
      es: "Acceso reservado para control financiero y revisión administrativa",
      en: "Reserved access for financial control and administrative review",
    },
    launchGoal: {
      es: "Crear una oficina financiera ordenada, confiable y trazable desde el primer release.",
      en: "Create an orderly, reliable, and traceable finance office from the first release.",
    },
    officeFunctions: [
      {
        es: "Administrar la operación financiera y la organización de recursos.",
        en: "Manage financial operations and resource organization.",
      },
      {
        es: "Dar seguimiento a controles, pagos, reportes y documentación de soporte.",
        en: "Track controls, payments, reports, and supporting documentation.",
      },
      {
        es: "Sostener el orden administrativo vinculado a finanzas.",
        en: "Sustain the administrative order tied to finance.",
      },
    ],
    responsibilities: [
      {
        es: "Control financiero y reportes",
        en: "Financial control and reporting",
      },
      {
        es: "Seguimiento administrativo",
        en: "Administrative follow-up",
      },
      {
        es: "Organización de compromisos y recursos",
        en: "Commitment and resource organization",
      },
    ],
    modules: [
      {
        es: "Panel financiero interno",
        en: "Internal finance panel",
      },
      {
        es: "Repositorio de soportes y reportes",
        en: "Supporting documents and reports repository",
      },
      {
        es: "Seguimiento administrativo de recursos",
        en: "Administrative resource tracking",
      },
    ],
    contentBlocks: [
      {
        title: {
          es: "Reportes y control financiero",
          en: "Financial reports and control",
        },
        description: {
          es: "Cortes, reportes, controles y estado general de la operación financiera.",
          en: "Closings, reports, controls, and general state of financial operations.",
        },
        releasePhase: {
          es: "Release inicial",
          en: "Initial release",
        },
      },
      {
        title: {
          es: "Soportes y documentación administrativa",
          en: "Supporting and administrative documentation",
        },
        description: {
          es: "Archivos de respaldo, comprobación y orden documental del área.",
          en: "Support files, validation records, and document order for the area.",
        },
        releasePhase: {
          es: "Fase operativa",
          en: "Operational phase",
        },
      },
      {
        title: {
          es: "Planeación de recursos",
          en: "Resource planning",
        },
        description: {
          es: "Seguimiento de compromisos, necesidades y movimientos internos de recursos.",
          en: "Tracking of commitments, needs, and internal resource movements.",
        },
        releasePhase: {
          es: "Fase segura",
          en: "Secure phase",
        },
      },
    ],
    seats: [
      {
        title: { es: "Director de Finanzas", en: "Finance Director" },
        person: { es: "Ps. Miguel Urbano", en: "Ps. Miguel Urbano" },
        scope: { es: "Dirección y supervisión financiera", en: "Financial direction and oversight" },
        accessLevel: { es: "Acceso total de oficina", en: "Full office access" },
        credentialStatus: { es: "Pendiente de credencial nominada", en: "Pending named credentials" },
      },
      {
        title: { es: "Coordinadora de Finanzas", en: "Finance Coordinator" },
        person: { es: "Ps. Mayra López", en: "Ps. Mayra López" },
        scope: { es: "Seguimiento, control y coordinación administrativa", en: "Follow-up, control, and administrative coordination" },
        accessLevel: { es: "Acceso operativo extendido", en: "Extended operational access" },
        credentialStatus: { es: "Pendiente de usuario y contraseña", en: "Pending username and password" },
      },
      {
        title: { es: "Apoyo Administrativo Financiero", en: "Financial Administrative Support" },
        person: { es: "Paola Pompa", en: "Paola Pompa" },
        scope: { es: "Operación de soporte y orden documental", en: "Support operations and document order" },
        accessLevel: { es: "Acceso operativo controlado", en: "Controlled operational access" },
        credentialStatus: { es: "Pendiente de activación interna", en: "Pending internal activation" },
      },
    ],
  },
  {
    slug: "protocolo-y-avanzada",
    order: 5,
    title: {
      es: "Protocolo y Avanzada",
      en: "Protocol and Advance",
    },
    shortTitle: {
      es: "Protocolo",
      en: "Protocol",
    },
    subtitle: {
      es: "Preparación logística, orden institucional y coordinación previa",
      en: "Logistics preparation, institutional order, and advance coordination",
    },
    summary: {
      es: "Oficina responsable de protocolo, preparación anticipada, coordinación previa de actividades y resguardo de la forma institucional en eventos y encuentros.",
      en: "Office responsible for protocol, advance preparation, pre-event coordination, and protecting the institutional form during events and gatherings.",
    },
    audience: {
      es: "Equipo de protocolo y avanzada autorizado",
      en: "Authorized protocol and advance team",
    },
    access: {
      es: "Acceso restringido a operadores de logística y protocolo",
      en: "Restricted access for logistics and protocol operators",
    },
    launchGoal: {
      es: "Asegurar coordinación previa y orden institucional en la ejecución del staff.",
      en: "Ensure advance coordination and institutional order in staff execution.",
    },
    officeFunctions: [
      {
        es: "Preparar la avanzada de reuniones, eventos y acciones sensibles.",
        en: "Prepare the advance work for meetings, events, and sensitive actions.",
      },
      {
        es: "Sostener el protocolo institucional en actividades del ministerio.",
        en: "Maintain institutional protocol in ministry activities.",
      },
      {
        es: "Coordinar los detalles previos que respaldan la operación del liderazgo.",
        en: "Coordinate the advance details that support leadership operations.",
      },
    ],
    responsibilities: [
      {
        es: "Logística previa y avanzada",
        en: "Advance logistics",
      },
      {
        es: "Protocolo institucional",
        en: "Institutional protocol",
      },
      {
        es: "Coordinación operativa previa",
        en: "Advance operational coordination",
      },
    ],
    modules: [
      {
        es: "Agenda de avanzada",
        en: "Advance agenda",
      },
      {
        es: "Panel de protocolo institucional",
        en: "Institutional protocol panel",
      },
      {
        es: "Checklist de coordinación previa",
        en: "Advance coordination checklist",
      },
    ],
    contentBlocks: [
      {
        title: {
          es: "Agenda de protocolo",
          en: "Protocol agenda",
        },
        description: {
          es: "Planeación formal de encuentros, orden institucional y secuencia de actividades.",
          en: "Formal planning of meetings, institutional order, and activity sequencing.",
        },
        releasePhase: {
          es: "Release inicial",
          en: "Initial release",
        },
      },
      {
        title: {
          es: "Checklist de avanzada",
          en: "Advance checklist",
        },
        description: {
          es: "Tareas previas, logística y coordinación necesaria antes de cada actividad.",
          en: "Advance tasks, logistics, and coordination needed before each activity.",
        },
        releasePhase: {
          es: "Fase operativa",
          en: "Operational phase",
        },
      },
      {
        title: {
          es: "Bitácora de ejecución",
          en: "Execution log",
        },
        description: {
          es: "Registro reservado de detalles críticos, ajustes y cierre protocolario.",
          en: "Reserved log of critical details, adjustments, and protocol closing.",
        },
        releasePhase: {
          es: "Fase segura",
          en: "Secure phase",
        },
      },
    ],
    seats: [
      {
        title: { es: "Responsable de Protocolo", en: "Protocol Lead" },
        person: { es: "Ps. Karla Caballero", en: "Ps. Karla Caballero" },
        scope: { es: "Orden protocolario e institucional", en: "Protocol and institutional order" },
        accessLevel: { es: "Acceso operativo extendido", en: "Extended operational access" },
        credentialStatus: { es: "Pendiente de usuario y contraseña", en: "Pending username and password" },
      },
      {
        title: { es: "Responsable de Avanzada", en: "Advance Lead" },
        person: { es: "Ps. Néstor Aguilar", en: "Ps. Néstor Aguilar" },
        scope: { es: "Preparación previa y despliegue operativo", en: "Advance preparation and operational deployment" },
        accessLevel: { es: "Acceso operativo controlado", en: "Controlled operational access" },
        credentialStatus: { es: "Pendiente de activación interna", en: "Pending internal activation" },
      },
    ],
  },
  {
    slug: "publicidad-y-diseno",
    order: 6,
    title: {
      es: "Publicidad y Diseño",
      en: "Advertising and Design",
    },
    shortTitle: {
      es: "Publicidad",
      en: "Advertising",
    },
    subtitle: {
      es: "Comunicación visual, creatividad y presentación pública premium",
      en: "Visual communication, creativity, and premium public presentation",
    },
    summary: {
      es: "Oficina enfocada en publicidad, diseño, identidad visual y desarrollo de piezas que comuniquen la propuesta de Inversionistas del Reino con estándar premium.",
      en: "Office focused on advertising, design, visual identity, and asset development that communicates the Kingdom Investors proposal with a premium standard.",
    },
    audience: {
      es: "Equipo creativo y responsables de comunicación visual",
      en: "Creative team and visual communication operators",
    },
    access: {
      es: "Acceso restringido a producción visual y publicidad autorizada",
      en: "Restricted access for authorized visual production and advertising",
    },
    launchGoal: {
      es: "Consolidar una oficina creativa que sostenga la imagen premium de IDR.",
      en: "Consolidate a creative office that sustains IDR’s premium image.",
    },
    officeFunctions: [
      {
        es: "Desarrollar la comunicación visual y la línea gráfica de IDR.",
        en: "Develop IDR’s visual communication and graphic line.",
      },
      {
        es: "Crear piezas publicitarias, campañas y materiales institucionales.",
        en: "Create advertising assets, campaigns, and institutional materials.",
      },
      {
        es: "Mantener consistencia premium en diseño, marca y presentación.",
        en: "Maintain premium consistency across design, brand, and presentation.",
      },
    ],
    responsibilities: [
      {
        es: "Identidad visual y piezas creativas",
        en: "Visual identity and creative assets",
      },
      {
        es: "Campañas y publicidad institucional",
        en: "Campaigns and institutional advertising",
      },
      {
        es: "Dirección estética premium",
        en: "Premium aesthetic direction",
      },
    ],
    modules: [
      {
        es: "Biblioteca de marca y diseño",
        en: "Brand and design library",
      },
      {
        es: "Panel de campañas y piezas",
        en: "Campaign and asset panel",
      },
      {
        es: "Repositorio creativo premium",
        en: "Premium creative repository",
      },
    ],
    contentBlocks: [
      {
        title: {
          es: "Biblioteca de marca",
          en: "Brand library",
        },
        description: {
          es: "Logos, lineamientos, recursos visuales y piezas maestras de identidad IDR.",
          en: "Logos, guidelines, visual resources, and master identity assets for IDR.",
        },
        releasePhase: {
          es: "Release inicial",
          en: "Initial release",
        },
      },
      {
        title: {
          es: "Campañas y publicidad",
          en: "Campaigns and advertising",
        },
        description: {
          es: "Conceptos, piezas aprobadas, ejecuciones creativas y planes de difusión.",
          en: "Concepts, approved assets, creative executions, and dissemination plans.",
        },
        releasePhase: {
          es: "Fase operativa",
          en: "Operational phase",
        },
      },
      {
        title: {
          es: "Repositorio creativo premium",
          en: "Premium creative repository",
        },
        description: {
          es: "Material visual reservado, dirección estética y entregables listos para uso.",
          en: "Reserved visual material, aesthetic direction, and deliverables ready for use.",
        },
        releasePhase: {
          es: "Fase segura",
          en: "Secure phase",
        },
      },
    ],
    seats: [
      {
        title: { es: "Director de Publicidad", en: "Advertising Director" },
        person: { es: "Ps. Ángel Rosas", en: "Ps. Ángel Rosas" },
        scope: { es: "Dirección de campañas, mensaje y publicidad", en: "Campaign, message, and advertising direction" },
        accessLevel: { es: "Acceso creativo estratégico", en: "Strategic creative access" },
        credentialStatus: { es: "Pendiente de usuario y contraseña", en: "Pending username and password" },
      },
      {
        title: { es: "Dirección Creativa y Diseño", en: "Creative Direction and Design" },
        person: { es: "Ap. Max Hebeling", en: "Ap. Max Hebeling" },
        scope: { es: "Diseño premium, identidad visual y dirección estética", en: "Premium design, visual identity, and aesthetic direction" },
        accessLevel: { es: "Acceso total creativo", en: "Full creative access" },
        credentialStatus: { es: "Pendiente de credencial nominada", en: "Pending named credentials" },
      },
    ],
  },
];

const COMMUNITY_WORKSPACE_SEED: CommunityWorkspaceSeed = {
  title: {
    es: "Comunidad General de Inversionistas",
    en: "General Investor Community",
  },
  subtitle: {
    es: "Séptimo acceso para todos los inversionistas del proyecto",
    en: "Seventh access point for all project investors",
  },
  summary: {
    es: "Este es el séptimo lugar del módulo IDR: el portal donde entra la comunidad general para recibir avisos, videos, notificaciones y recursos premium.",
    en: "This is the seventh place inside the IDR module: the portal where the general community enters to receive notices, videos, notifications, and premium resources.",
  },
  audience: {
    es: "Todos los inversionistas autorizados",
    en: "All authorized investors",
  },
  access: {
    es: "Acceso por usuario y contraseña individuales",
    en: "Access through individual usernames and passwords",
  },
  launchGoal: {
    es: "Entregar una experiencia clara, privada y móvil para la comunidad general.",
    en: "Deliver a clear, private, mobile experience for the general community.",
  },
  modules: [
    {
      es: "Avisos oficiales",
      en: "Official notices",
    },
    {
      es: "Videos mensuales y sesiones",
      en: "Monthly videos and sessions",
    },
    {
      es: "Recursos seleccionados",
      en: "Selected resources",
    },
  ],
  experiences: [
    {
      es: "Portal premium instalable en el teléfono",
      en: "Premium portal installable on the phone",
    },
    {
      es: "Notificaciones y comunicaciones ordenadas",
      en: "Structured notifications and communications",
    },
    {
      es: "Biblioteca de valor para la comunidad",
      en: "High-value community library",
    },
  ],
};

function t(locale: Locale, text: LocalizedText) {
  return locale === "es" ? text.es : text.en;
}

export function getIdrStaffOffices(locale: Locale): IdrStaffOffice[] {
  return STAFF_OFFICE_SEEDS.map((office) => ({
    slug: office.slug,
    order: office.order,
    code: locale === "es" ? `Oficina ${String(office.order).padStart(2, "0")}` : `Office ${String(office.order).padStart(2, "0")}`,
    title: t(locale, office.title),
    shortTitle: t(locale, office.shortTitle),
    subtitle: t(locale, office.subtitle),
    summary: t(locale, office.summary),
    audience: t(locale, office.audience),
    access: t(locale, office.access),
    launchGoal: t(locale, office.launchGoal),
    officeFunctions: office.officeFunctions.map((item) => t(locale, item)),
    responsibilities: office.responsibilities.map((item) => t(locale, item)),
    modules: office.modules.map((item) => t(locale, item)),
    contentBlocks: office.contentBlocks.map((item) => ({
      title: t(locale, item.title),
      description: t(locale, item.description),
      releasePhase: t(locale, item.releasePhase),
    })),
    seats: office.seats.map((seat) => ({
      title: t(locale, seat.title),
      person: t(locale, seat.person),
      scope: t(locale, seat.scope),
      accessLevel: t(locale, seat.accessLevel),
      credentialStatus: t(locale, seat.credentialStatus),
    })),
    href: `/app/companies/idr/oficinas/${office.slug}`,
  }));
}

export function getIdrStaffOfficeBySlug(slug: string, locale: Locale) {
  return getIdrStaffOffices(locale).find((office) => office.slug === slug);
}

export function isIdrStaffOfficeSlug(slug: string) {
  return STAFF_OFFICE_SEEDS.some((office) => office.slug === slug);
}

export function getIdrCommunityWorkspace(locale: Locale): IdrCommunityWorkspace {
  return {
    code: locale === "es" ? "Acceso 07" : "Access 07",
    title: t(locale, COMMUNITY_WORKSPACE_SEED.title),
    subtitle: t(locale, COMMUNITY_WORKSPACE_SEED.subtitle),
    summary: t(locale, COMMUNITY_WORKSPACE_SEED.summary),
    audience: t(locale, COMMUNITY_WORKSPACE_SEED.audience),
    access: t(locale, COMMUNITY_WORKSPACE_SEED.access),
    launchGoal: t(locale, COMMUNITY_WORKSPACE_SEED.launchGoal),
    modules: COMMUNITY_WORKSPACE_SEED.modules.map((item) => t(locale, item)),
    experiences: COMMUNITY_WORKSPACE_SEED.experiences.map((item) => t(locale, item)),
    href: "/idr/overview",
  };
}
