import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type {
  PermitHunterCommand,
  PermitHunterCommandCenterSnapshot,
  PermitHunterCommandType,
  PermitHunterCrmBoardData,
  PermitHunterCrmPriority,
  PermitHunterCrmRecord,
  PermitHunterCrmStage,
  PermitHunterCrmTask,
  PermitHunterDashboardData,
  PermitHunterLead,
  PermitHunterLeadDetail,
  PermitHunterNote,
  PermitHunterOutreachRecord,
  PermitHunterRun,
} from "@/lib/lead-hunter/permit-hunter-types";

interface PermitHunterBridgeStore {
  leads: PermitHunterLead[];
  runs: PermitHunterRun[];
  commands: PermitHunterCommand[];
  crmRecords: PermitHunterCrmRecord[];
  tasks: PermitHunterCrmTask[];
  notes: PermitHunterNote[];
  outreachStatuses: PermitHunterOutreachRecord[];
}

const runtimeDataRoot =
  process.env.VERCEL || process.env.AWS_REGION
    ? path.join(process.env.TMPDIR ?? "/tmp", "hebeling-os")
    : process.cwd();
const dataDir = path.join(runtimeDataRoot, ".data");
const dataPath = path.join(dataDir, "lead-hunter-permit-bridge.json");

const SEED_LEADS: PermitHunterLead[] = [
  {
    permitNumber: "PRJ-2026-001245",
    address: "4127 Arista St",
    city: "San Diego",
    state: "CA",
    postalCode: "92103",
    apn: null,
    rawStatus: "Permit Issued",
    normalizedStage: "issuance",
    scopeOfWork: "New detached ADU with site utility work",
    rawDescription: "New detached ADU with site utility work",
    normalizedProjectType: "adu",
    valuation: 385000,
    submittedAt: "2026-03-16T17:15:00.000Z",
    updatedAt: "2026-03-17T12:10:00.000Z",
    sourceUrl: null,
    ownerName: "Daniel Price",
    ownerPhone: "(619) 555-0148",
    ownerEmail: "daniel@example.com",
    mailingAddress: "4127 Arista St, San Diego, CA 92103",
    licensedProfessionalName: "Nova Construction Company, Inc.",
    licensedProfessionalBusiness: "Nova Construction Company, Inc.",
    licensedProfessionalLicenseType: "General Building Contractor",
    enrichedAt: "2026-03-17T12:30:00.000Z",
    score: 165,
    recommendedAction: "call_first",
    isHotLead: true,
  },
  {
    permitNumber: "PRJ-2026-001251",
    address: "8822 Glenhaven St",
    city: "San Diego",
    state: "CA",
    postalCode: "92123",
    apn: null,
    rawStatus: "Plan Review",
    normalizedStage: "plan_check",
    scopeOfWork: "Single family complete remodel and room addition",
    rawDescription: "Single family complete remodel and room addition",
    normalizedProjectType: "addition",
    valuation: 295000,
    submittedAt: "2026-03-16T20:05:00.000Z",
    updatedAt: "2026-03-17T11:40:00.000Z",
    sourceUrl: null,
    ownerName: "Alyssa Moreno",
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: "PO Box 22114, San Diego, CA 92192",
    licensedProfessionalName: "YD Design",
    licensedProfessionalBusiness: "YD Design",
    licensedProfessionalLicenseType: "Designer",
    enrichedAt: null,
    score: 125,
    recommendedAction: "research_next",
    isHotLead: true,
  },
  {
    permitNumber: "PRJ-2026-001259",
    address: "2256 Soto St",
    city: "San Diego",
    state: "CA",
    postalCode: "92107",
    apn: null,
    rawStatus: "Ready to Issue",
    normalizedStage: "issuance",
    scopeOfWork: "Garage conversion to JADU",
    rawDescription: "Garage conversion to JADU",
    normalizedProjectType: "jadu",
    valuation: 165000,
    submittedAt: "2026-03-16T23:10:00.000Z",
    updatedAt: "2026-03-17T10:25:00.000Z",
    sourceUrl: null,
    ownerName: null,
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: null,
    licensedProfessionalName: null,
    licensedProfessionalBusiness: null,
    licensedProfessionalLicenseType: null,
    enrichedAt: null,
    score: 160,
    recommendedAction: "enrich_immediately",
    isHotLead: true,
  },
  {
    permitNumber: "PRJ-2026-001270",
    address: "9172 Flanders Dr",
    city: "San Diego",
    state: "CA",
    postalCode: "92126",
    apn: null,
    rawStatus: "Pending Corrections",
    normalizedStage: "plan_check",
    scopeOfWork: "Whole house remodel with structural changes",
    rawDescription: "Whole house remodel with structural changes",
    normalizedProjectType: "remodel",
    valuation: 540000,
    submittedAt: "2026-03-16T18:10:00.000Z",
    updatedAt: "2026-03-17T08:45:00.000Z",
    sourceUrl: null,
    ownerName: "Andrea Nguyen",
    ownerPhone: "(858) 555-0121",
    ownerEmail: "andrea@example.com",
    mailingAddress: "9172 Flanders Dr, San Diego, CA 92126",
    licensedProfessionalName: "Harbor Studio",
    licensedProfessionalBusiness: "Harbor Studio",
    licensedProfessionalLicenseType: "Architect",
    enrichedAt: "2026-03-17T09:05:00.000Z",
    score: 150,
    recommendedAction: "research_next",
    isHotLead: true,
  },
  {
    permitNumber: "PRJ-2026-001281",
    address: "5618 Lauretta St",
    city: "San Diego",
    state: "CA",
    postalCode: "92110",
    apn: null,
    rawStatus: "Approved Upon Final Payment",
    normalizedStage: "issuance",
    scopeOfWork: "Detached structure and kitchen expansion",
    rawDescription: "Detached structure and kitchen expansion",
    normalizedProjectType: "detached_structure",
    valuation: 215000,
    submittedAt: "2026-03-15T22:41:00.000Z",
    updatedAt: "2026-03-17T07:12:00.000Z",
    sourceUrl: null,
    ownerName: "Marco Ruiz",
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: "5618 Lauretta St, San Diego, CA 92110",
    licensedProfessionalName: "West Harbor Build",
    licensedProfessionalBusiness: "West Harbor Build",
    licensedProfessionalLicenseType: "General Building Contractor",
    enrichedAt: null,
    score: 138,
    recommendedAction: "research_next",
    isHotLead: false,
  },
  {
    permitNumber: "PRJ-2026-001288",
    address: "7481 Margerum Ave",
    city: "San Diego",
    state: "CA",
    postalCode: "92120",
    apn: null,
    rawStatus: "Plan Review",
    normalizedStage: "plan_check",
    scopeOfWork: "Addition above garage with interior remodel",
    rawDescription: "Addition above garage with interior remodel",
    normalizedProjectType: "addition",
    valuation: 330000,
    submittedAt: "2026-03-15T20:08:00.000Z",
    updatedAt: "2026-03-17T06:38:00.000Z",
    sourceUrl: null,
    ownerName: null,
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: null,
    licensedProfessionalName: "MTR Drafting",
    licensedProfessionalBusiness: "MTR Drafting",
    licensedProfessionalLicenseType: "Designer",
    enrichedAt: null,
    score: 132,
    recommendedAction: "enrich_immediately",
    isHotLead: false,
  },
];

const SEED_RUNS: PermitHunterRun[] = [
  {
    id: "run_20260318_060000",
    startedAt: "2026-03-18T13:00:00.000Z",
    completedAt: "2026-03-18T13:03:54.000Z",
    status: "success",
    permitsFound: 24,
    permitsInserted: 8,
    permitsUpdated: 3,
    errorMessage: null,
  },
  {
    id: "run_20260317_060000",
    startedAt: "2026-03-17T13:00:00.000Z",
    completedAt: "2026-03-17T13:03:32.000Z",
    status: "success",
    permitsFound: 18,
    permitsInserted: 6,
    permitsUpdated: 2,
    errorMessage: null,
  },
];

const SEED_OUTREACH: PermitHunterOutreachRecord[] = [
  {
    permitNumber: "PRJ-2026-001245",
    status: "contacted",
    channel: "call",
    ownerResponse: "Pidió visita al sitio para revisar alcance del ADU.",
    lastContactedAt: "2026-03-18T18:20:00.000Z",
    nextFollowUpAt: "2026-03-22T18:30:00.000Z",
    updatedAt: "2026-03-18T18:20:00.000Z",
  },
  {
    permitNumber: "PRJ-2026-001270",
    status: "attempted",
    channel: "email",
    ownerResponse: "Respondió el despacho; están revisando tiempos.",
    lastContactedAt: "2026-03-18T16:00:00.000Z",
    nextFollowUpAt: "2026-03-22T16:00:00.000Z",
    updatedAt: "2026-03-18T16:00:00.000Z",
  },
];

const SEED_CRM_RECORDS: PermitHunterCrmRecord[] = [
  {
    id: "crm_PRJ-2026-001245",
    permitNumber: "PRJ-2026-001245",
    stage: "contacted",
    priority: "urgent",
    assignedTo: "Daniela",
    estimatedValue: 385000,
    nextAction: "Confirmar visita técnica y validar presupuesto preliminar",
    nextActionDueAt: "2026-03-22T18:30:00.000Z",
    lastActivityAt: "2026-03-18T18:20:00.000Z",
    workflowSummary: "Lead caliente con contacto directo. Debe avanzar a visita y propuesta.",
    createdAt: "2026-03-17T12:40:00.000Z",
    updatedAt: "2026-03-18T18:20:00.000Z",
  },
  {
    id: "crm_PRJ-2026-001270",
    permitNumber: "PRJ-2026-001270",
    stage: "appointment_set",
    priority: "high",
    assignedTo: "María",
    estimatedValue: 540000,
    nextAction: "Preparar brief para reunión con propietario y arquitecto",
    nextActionDueAt: "2026-03-22T16:00:00.000Z",
    lastActivityAt: "2026-03-18T16:00:00.000Z",
    workflowSummary: "Remodel grande en etapa temprana. Ya existe interés y se agenda presentación.",
    createdAt: "2026-03-17T09:05:00.000Z",
    updatedAt: "2026-03-18T16:00:00.000Z",
  },
  {
    id: "crm_PRJ-2026-001281",
    permitNumber: "PRJ-2026-001281",
    stage: "ready_to_contact",
    priority: "high",
    assignedTo: "José",
    estimatedValue: 215000,
    nextAction: "Llamar al owner y validar timing del detached structure",
    nextActionDueAt: "2026-03-21T17:00:00.000Z",
    lastActivityAt: "2026-03-18T14:00:00.000Z",
    workflowSummary: "Owner identificado pero sin contacto directo. Falta completar teléfono o email.",
    createdAt: "2026-03-17T08:00:00.000Z",
    updatedAt: "2026-03-18T14:00:00.000Z",
  },
];

const SEED_TASKS: PermitHunterCrmTask[] = [
  {
    id: "task_PRJ-2026-001245_call",
    permitNumber: "PRJ-2026-001245",
    title: "Confirmar visita técnica",
    description: "Alinear ventana de visita y confirmar quién estará en sitio.",
    type: "follow_up",
    status: "open",
    dueAt: "2026-03-22T18:30:00.000Z",
    assignedTo: "Daniela",
    completedAt: null,
    createdAt: "2026-03-18T18:22:00.000Z",
    updatedAt: "2026-03-18T18:22:00.000Z",
  },
  {
    id: "task_PRJ-2026-001270_brief",
    permitNumber: "PRJ-2026-001270",
    title: "Preparar brief de reunión",
    description: "Revisar alcance, valuation y posibles objeciones para la reunión.",
    type: "estimate",
    status: "in_progress",
    dueAt: "2026-03-22T16:00:00.000Z",
    assignedTo: "María",
    completedAt: null,
    createdAt: "2026-03-18T16:04:00.000Z",
    updatedAt: "2026-03-18T16:04:00.000Z",
  },
  {
    id: "task_PRJ-2026-001251_research",
    permitNumber: "PRJ-2026-001251",
    title: "Validar decisión del owner en plan check",
    description: "Investigar si el owner ya tiene contratista o está abierto a propuestas.",
    type: "research",
    status: "open",
    dueAt: "2026-03-22T15:00:00.000Z",
    assignedTo: "José",
    completedAt: null,
    createdAt: "2026-03-18T15:10:00.000Z",
    updatedAt: "2026-03-18T15:10:00.000Z",
  },
];

const SEED_NOTES: PermitHunterNote[] = [
  {
    id: "note_PRJ-2026-001245_1",
    permitNumber: "PRJ-2026-001245",
    note: "Owner respondió por teléfono. Quiere comparar dos opciones de construcción para el ADU.",
    createdBy: "Daniela",
    createdAt: "2026-03-18T18:25:00.000Z",
  },
  {
    id: "note_PRJ-2026-001270_1",
    permitNumber: "PRJ-2026-001270",
    note: "Arquitecto abierto a revisar una propuesta cuando cierren correcciones.",
    createdBy: "María",
    createdAt: "2026-03-18T16:07:00.000Z",
  },
];

const CONTACT_ENRICHMENTS: Record<
  string,
  { ownerName: string; ownerPhone: string; ownerEmail: string; mailingAddress: string }
> = {
  "PRJ-2026-001251": {
    ownerName: "Alyssa Moreno",
    ownerPhone: "(858) 555-0179",
    ownerEmail: "alyssa.moreno@example.com",
    mailingAddress: "PO Box 22114, San Diego, CA 92192",
  },
  "PRJ-2026-001259": {
    ownerName: "Javier Solis",
    ownerPhone: "(619) 555-0186",
    ownerEmail: "javier.solis@example.com",
    mailingAddress: "2256 Soto St, San Diego, CA 92107",
  },
  "PRJ-2026-001281": {
    ownerName: "Marco Ruiz",
    ownerPhone: "(619) 555-0131",
    ownerEmail: "marco.ruiz@example.com",
    mailingAddress: "5618 Lauretta St, San Diego, CA 92110",
  },
  "PRJ-2026-001288": {
    ownerName: "Clara Velez",
    ownerPhone: "(619) 555-0192",
    ownerEmail: "clara.velez@example.com",
    mailingAddress: "7481 Margerum Ave, San Diego, CA 92120",
  },
};

type PermitHunterLeadTemplate = Omit<
  PermitHunterLead,
  "permitNumber" | "updatedAt" | "submittedAt"
> & {
  updatedOffsetHours: number;
  submittedOffsetHours: number;
};

const DAILY_SCAN_TEMPLATES: PermitHunterLeadTemplate[] = [
  {
    address: "6634 Estrella Ave",
    city: "San Diego",
    state: "CA",
    postalCode: "92120",
    apn: null,
    rawStatus: "Permit Issued",
    normalizedStage: "issuance",
    scopeOfWork: "Detached ADU with exterior hardscape and utility tie-ins",
    rawDescription: "Detached ADU with exterior hardscape and utility tie-ins",
    normalizedProjectType: "adu",
    valuation: 410000,
    sourceUrl: null,
    ownerName: "Patricia Vega",
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: "6634 Estrella Ave, San Diego, CA 92120",
    licensedProfessionalName: "Harborline Builders",
    licensedProfessionalBusiness: "Harborline Builders",
    licensedProfessionalLicenseType: "General Building Contractor",
    enrichedAt: null,
    score: 172,
    recommendedAction: "call_first",
    isHotLead: true,
    updatedOffsetHours: 1,
    submittedOffsetHours: 10,
  },
  {
    address: "1842 Bancroft St",
    city: "San Diego",
    state: "CA",
    postalCode: "92102",
    apn: null,
    rawStatus: "Plan Review",
    normalizedStage: "plan_check",
    scopeOfWork: "Whole-home remodel with second-story addition",
    rawDescription: "Whole-home remodel with second-story addition",
    normalizedProjectType: "addition",
    valuation: 620000,
    sourceUrl: null,
    ownerName: null,
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: null,
    licensedProfessionalName: "Studio Oeste",
    licensedProfessionalBusiness: "Studio Oeste",
    licensedProfessionalLicenseType: "Architect",
    enrichedAt: null,
    score: 148,
    recommendedAction: "research_next",
    isHotLead: true,
    updatedOffsetHours: 2,
    submittedOffsetHours: 14,
  },
];

const BACKFILL_TEMPLATES: PermitHunterLeadTemplate[] = [
  {
    address: "3278 Hawk St",
    city: "San Diego",
    state: "CA",
    postalCode: "92103",
    apn: null,
    rawStatus: "Permit Issued",
    normalizedStage: "issuance",
    scopeOfWork: "Garage conversion to JADU with new patio cover",
    rawDescription: "Garage conversion to JADU with new patio cover",
    normalizedProjectType: "garage_conversion",
    valuation: 188000,
    sourceUrl: null,
    ownerName: "Rafael Molina",
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: "3278 Hawk St, San Diego, CA 92103",
    licensedProfessionalName: "Oakline Design Build",
    licensedProfessionalBusiness: "Oakline Design Build",
    licensedProfessionalLicenseType: "General Building Contractor",
    enrichedAt: null,
    score: 134,
    recommendedAction: "research_next",
    isHotLead: false,
    updatedOffsetHours: 360,
    submittedOffsetHours: 420,
  },
  {
    address: "4511 Lotus Dr",
    city: "San Diego",
    state: "CA",
    postalCode: "92115",
    apn: null,
    rawStatus: "Ready to Issue",
    normalizedStage: "issuance",
    scopeOfWork: "Interior remodel with detached studio conversion",
    rawDescription: "Interior remodel with detached studio conversion",
    normalizedProjectType: "remodel",
    valuation: 240000,
    sourceUrl: null,
    ownerName: null,
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: null,
    licensedProfessionalName: "Mesa Planning",
    licensedProfessionalBusiness: "Mesa Planning",
    licensedProfessionalLicenseType: "Designer",
    enrichedAt: null,
    score: 122,
    recommendedAction: "enrich_immediately",
    isHotLead: false,
    updatedOffsetHours: 420,
    submittedOffsetHours: 480,
  },
  {
    address: "7825 Via Mallorca",
    city: "San Diego",
    state: "CA",
    postalCode: "92037",
    apn: null,
    rawStatus: "Plan Review",
    normalizedStage: "plan_check",
    scopeOfWork: "High-end kitchen remodel and structural wall removal",
    rawDescription: "High-end kitchen remodel and structural wall removal",
    normalizedProjectType: "remodel",
    valuation: 310000,
    sourceUrl: null,
    ownerName: "Lauren Bishop",
    ownerPhone: "(858) 555-0198",
    ownerEmail: "lauren.bishop@example.com",
    mailingAddress: "7825 Via Mallorca, San Diego, CA 92037",
    licensedProfessionalName: "Pacific Atelier",
    licensedProfessionalBusiness: "Pacific Atelier",
    licensedProfessionalLicenseType: "Architect",
    enrichedAt: "2026-03-02T17:00:00.000Z",
    score: 118,
    recommendedAction: "monitor_only",
    isHotLead: false,
    updatedOffsetHours: 500,
    submittedOffsetHours: 620,
  },
  {
    address: "9975 Del Rio Rd",
    city: "San Diego",
    state: "CA",
    postalCode: "92129",
    apn: null,
    rawStatus: "Pending Corrections",
    normalizedStage: "plan_check",
    scopeOfWork: "Detached structure and pool-side bath addition",
    rawDescription: "Detached structure and pool-side bath addition",
    normalizedProjectType: "detached_structure",
    valuation: 205000,
    sourceUrl: null,
    ownerName: null,
    ownerPhone: null,
    ownerEmail: null,
    mailingAddress: null,
    licensedProfessionalName: "North County Drafting",
    licensedProfessionalBusiness: "North County Drafting",
    licensedProfessionalLicenseType: "Designer",
    enrichedAt: null,
    score: 111,
    recommendedAction: "monitor_only",
    isHotLead: false,
    updatedOffsetHours: 540,
    submittedOffsetHours: 700,
  },
];

const CRM_STAGE_LABELS: Record<PermitHunterCrmStage, string> = {
  new_lead: "Nuevo lead",
  needs_enrichment: "Enriquecimiento",
  ready_to_contact: "Listo para contacto",
  contacted: "Contactado",
  appointment_set: "Cita agendada",
  proposal_sent: "Propuesta enviada",
  won: "Ganado",
  lost: "Perdido",
};

const CRM_STAGE_ORDER: PermitHunterCrmStage[] = [
  "new_lead",
  "needs_enrichment",
  "ready_to_contact",
  "contacted",
  "appointment_set",
  "proposal_sent",
  "won",
  "lost",
];

function cloneObjects<T extends object>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

function mergeByKey<T>(
  seed: T[],
  overrides: T[] | undefined,
  getKey: (value: T) => string
): T[] {
  const merged = new Map<string, T>();

  for (const item of seed) {
    merged.set(getKey(item), item);
  }

  for (const item of overrides ?? []) {
    merged.set(getKey(item), item);
  }

  return [...merged.values()];
}

function createSeedStore(): PermitHunterBridgeStore {
  return {
    leads: cloneObjects(SEED_LEADS),
    runs: cloneObjects(SEED_RUNS),
    commands: [],
    crmRecords: cloneObjects(SEED_CRM_RECORDS),
    tasks: cloneObjects(SEED_TASKS),
    notes: cloneObjects(SEED_NOTES),
    outreachStatuses: cloneObjects(SEED_OUTREACH),
  };
}

function normalizeStore(parsed: Partial<PermitHunterBridgeStore>): PermitHunterBridgeStore {
  return {
    leads: mergeByKey(SEED_LEADS, parsed.leads, (lead) => lead.permitNumber),
    runs: mergeByKey(SEED_RUNS, parsed.runs, (run) => run.id),
    commands: parsed.commands ?? [],
    crmRecords: mergeByKey(SEED_CRM_RECORDS, parsed.crmRecords, (record) => record.permitNumber),
    tasks: mergeByKey(SEED_TASKS, parsed.tasks, (task) => task.id),
    notes: mergeByKey(SEED_NOTES, parsed.notes, (note) => note.id),
    outreachStatuses: mergeByKey(
      SEED_OUTREACH,
      parsed.outreachStatuses,
      (outreach) => outreach.permitNumber
    ),
  };
}

async function readBridgeStore(): Promise<PermitHunterBridgeStore> {
  await mkdir(dataDir, { recursive: true });

  try {
    const file = await readFile(dataPath, "utf8");
    const parsed = JSON.parse(file) as Partial<PermitHunterBridgeStore>;
    return normalizeStore(parsed);
  } catch {
    const seed = createSeedStore();
    await writeBridgeStore(seed);
    return seed;
  }
}

async function writeBridgeStore(store: PermitHunterBridgeStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataPath, JSON.stringify(store, null, 2), "utf8");
}

function isFreshTargetLead(lead: PermitHunterLead) {
  return Date.now() - Date.parse(lead.updatedAt) <= 14 * 24 * 60 * 60 * 1000;
}

function isFreshIssuanceLead(lead: PermitHunterLead) {
  return isFreshTargetLead(lead) && lead.normalizedStage === "issuance";
}

function isFreshPlanCheckLead(lead: PermitHunterLead) {
  return isFreshTargetLead(lead) && lead.normalizedStage === "plan_check";
}

function sortLeadsByScore(leads: PermitHunterLead[]) {
  return [...leads].sort(
    (a, b) => b.score - a.score || Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );
}

function sortRuns(runs: PermitHunterRun[]) {
  return [...runs].sort(
    (a, b) =>
      Date.parse(b.completedAt ?? b.startedAt) - Date.parse(a.completedAt ?? a.startedAt)
  );
}

function sortCommands(commands: PermitHunterCommand[]) {
  return [...commands].sort(
    (a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt)
  );
}

function sortNotes(notes: PermitHunterNote[]) {
  return [...notes].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function sortTasks(tasks: PermitHunterCrmTask[]) {
  return [...tasks].sort((a, b) => {
    const left = Date.parse(a.dueAt ?? a.createdAt);
    const right = Date.parse(b.dueAt ?? b.createdAt);
    return left - right;
  });
}

function countFullContact(leads: PermitHunterLead[]) {
  return leads.filter((lead) => lead.ownerPhone || lead.ownerEmail).length;
}

function countOwnerOnly(leads: PermitHunterLead[]) {
  return leads.filter(
    (lead) => !lead.ownerPhone && !lead.ownerEmail && (lead.ownerName || lead.mailingAddress)
  ).length;
}

function countManualResearch(leads: PermitHunterLead[]) {
  return leads.filter(
    (lead) => !lead.ownerPhone && !lead.ownerEmail && !lead.ownerName && !lead.mailingAddress
  ).length;
}

function deriveCrmStage(
  lead: PermitHunterLead,
  outreach: PermitHunterOutreachRecord | null
): PermitHunterCrmStage {
  if (outreach?.status === "won") return "won";
  if (outreach?.status === "lost") return "lost";
  if (lead.normalizedStage === "issuance" && !lead.ownerName) return "needs_enrichment";
  if (outreach?.status === "contacted") return "contacted";
  if (outreach?.status === "attempted") return "ready_to_contact";
  if (lead.normalizedStage === "issuance") return "ready_to_contact";
  return "new_lead";
}

function deriveCrmPriority(lead: PermitHunterLead): PermitHunterCrmPriority {
  if (lead.normalizedStage === "issuance" && lead.score >= 140) return "urgent";
  if (lead.score >= 120) return "high";
  if (lead.score >= 85) return "normal";
  return "low";
}

function deriveNextAction(lead: PermitHunterLead, stage: PermitHunterCrmStage) {
  if (stage === "needs_enrichment") return "Comprar contacto y verificar owner";
  if (stage === "ready_to_contact") return "Llamar al homeowner y presentar servicios";
  if (stage === "contacted") return "Mover a visita técnica o calificación de alcance";
  if (stage === "proposal_sent") return "Dar seguimiento a propuesta";
  if (lead.normalizedStage === "plan_check") {
    return "Investigar alcance del plan check y primer outreach";
  }

  return "Revisar lead y asignar owner interno";
}

function deriveNextActionDueAt(lead: PermitHunterLead, stage: PermitHunterCrmStage) {
  const base = Date.parse(lead.updatedAt);
  const hours = stage === "needs_enrichment" || stage === "ready_to_contact" ? 12 : 24;
  return new Date(base + hours * 60 * 60 * 1000).toISOString();
}

function buildWorkflowSummary(lead: PermitHunterLead, stage: PermitHunterCrmStage) {
  if (stage === "needs_enrichment") {
    return "El owner no tiene contacto completo. Hay que enriquecer antes de outreach.";
  }

  if (stage === "ready_to_contact") {
    return "Permiso listo para atacar. Debe llamarse primero y dejar siguiente acción inmediata.";
  }

  if (stage === "contacted") {
    return "Lead ya tocado. El objetivo es moverlo a visita, estimado y propuesta.";
  }

  if (lead.normalizedStage === "plan_check") {
    return "Oportunidad temprana. Conviene investigar el alcance y entrar antes de la emisión.";
  }

  return "Revisar el lead, asignar responsable y moverlo a una etapa accionable.";
}

export function buildDefaultPermitHunterCrmRecord(
  lead: PermitHunterLead,
  outreach: PermitHunterOutreachRecord | null
): PermitHunterCrmRecord {
  const stage = deriveCrmStage(lead, outreach);
  const now = new Date().toISOString();

  return {
    id: `derived-${lead.permitNumber}`,
    permitNumber: lead.permitNumber,
    stage,
    priority: deriveCrmPriority(lead),
    assignedTo: null,
    estimatedValue: lead.valuation ?? null,
    nextAction: deriveNextAction(lead, stage),
    nextActionDueAt: deriveNextActionDueAt(lead, stage),
    lastActivityAt: outreach?.lastContactedAt ?? lead.updatedAt,
    workflowSummary: buildWorkflowSummary(lead, stage),
    createdAt: now,
    updatedAt: now,
  };
}

function buildDefaultCrmTask(
  lead: PermitHunterLead,
  crm: PermitHunterCrmRecord
):
  | Omit<
      PermitHunterCrmTask,
      "id" | "permitNumber" | "createdAt" | "updatedAt" | "completedAt"
    >
  | null {
  if (crm.stage === "won" || crm.stage === "lost") {
    return null;
  }

  const taskByStage: Record<
    PermitHunterCrmStage,
    { title: string; description: string; type: PermitHunterCrmTask["type"] } | null
  > = {
    new_lead: {
      title: "Revisar permiso e investigar alcance",
      description: "Confirmar tamaño del proyecto y si vale ataque inmediato.",
      type: "research",
    },
    needs_enrichment: {
      title: "Enriquecer información del owner",
      description: "Comprar contacto y verificar owner antes de outreach.",
      type: "research",
    },
    ready_to_contact: {
      title: "Llamar al homeowner y presentar servicios",
      description: "Hacer primer contacto y dejar outcome claro en CRM.",
      type: "call",
    },
    contacted: {
      title: "Dar seguimiento al lead",
      description: "Mover la conversación hacia cita o visita técnica.",
      type: "follow_up",
    },
    appointment_set: {
      title: "Preparar reunión de calificación",
      description: "Entrar con valuation, alcance y siguiente paso definido.",
      type: "site_visit",
    },
    proposal_sent: {
      title: "Seguimiento de propuesta enviada",
      description: "Cerrar feedback, objeciones y decisión final.",
      type: "follow_up",
    },
    won: null,
    lost: null,
  };

  const template = taskByStage[crm.stage];

  if (!template) {
    return null;
  }

  return {
    title: template.title,
    description: template.description,
    type: template.type,
    status: "open",
    dueAt: crm.nextActionDueAt,
    assignedTo: crm.assignedTo,
  };
}

function upsertStoreCrmRecord(
  store: PermitHunterBridgeStore,
  record: PermitHunterCrmRecord
) {
  const existingIndex = store.crmRecords.findIndex(
    (item) => item.permitNumber === record.permitNumber
  );

  if (existingIndex >= 0) {
    store.crmRecords[existingIndex] = record;
  } else {
    store.crmRecords.push(record);
  }
}

function setLeadUpdatedAt(store: PermitHunterBridgeStore, permitNumber: string, updatedAt: string) {
  const lead = store.leads.find((item) => item.permitNumber === permitNumber);

  if (lead) {
    lead.updatedAt = updatedAt;
  }
}

function getHighestPermitSequence(store: PermitHunterBridgeStore) {
  return store.leads.reduce((highest, lead) => {
    const match = lead.permitNumber.match(/(\d+)$/);
    const value = match ? Number(match[1]) : 0;
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
}

function buildPermitNumberFromSequence(sequence: number) {
  return `PRJ-2026-${String(sequence).padStart(6, "0")}`;
}

function createLeadFromTemplate(
  template: PermitHunterLeadTemplate,
  permitNumber: string,
  requestedAt: string
): PermitHunterLead {
  const base = Date.parse(requestedAt);
  const { updatedOffsetHours, submittedOffsetHours, ...lead } = template;

  return {
    ...lead,
    permitNumber,
    submittedAt: new Date(base - submittedOffsetHours * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(base - updatedOffsetHours * 60 * 60 * 1000).toISOString(),
  };
}

function createRunRecord(
  requestedAt: string,
  counts: { found: number; inserted: number; updated: number },
  type: PermitHunterCommandType
): PermitHunterRun {
  const date = new Date(requestedAt);
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}_${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}${String(date.getUTCSeconds()).padStart(2, "0")}`;

  return {
    id: `${type}_${stamp}`,
    startedAt: requestedAt,
    completedAt: new Date(date.getTime() + 75 * 1000).toISOString(),
    status: "success",
    permitsFound: counts.found,
    permitsInserted: counts.inserted,
    permitsUpdated: counts.updated,
    errorMessage: null,
  };
}

function insertRun(store: PermitHunterBridgeStore, run: PermitHunterRun) {
  store.runs = sortRuns([run, ...store.runs]).slice(0, 24);
}

function resolveContactEnrichment(lead: PermitHunterLead) {
  return (
    CONTACT_ENRICHMENTS[lead.permitNumber] ?? {
      ownerName: lead.ownerName ?? "Owner Record",
      ownerPhone: "(619) 555-0100",
      ownerEmail: "owner@example.com",
      mailingAddress:
        lead.mailingAddress ??
        `${lead.address}, ${lead.city}, ${lead.state} ${lead.postalCode ?? ""}`.trim(),
    }
  );
}

function ensureLeadOperationalStateInStore(
  store: PermitHunterBridgeStore,
  lead: PermitHunterLead
) {
  let changed = false;
  const outreach =
    store.outreachStatuses.find((item) => item.permitNumber === lead.permitNumber) ?? null;
  let crm =
    store.crmRecords.find((item) => item.permitNumber === lead.permitNumber) ?? null;

  if (!crm) {
    crm = buildDefaultPermitHunterCrmRecord(lead, outreach);
    store.crmRecords.push(crm);
    changed = true;
  }

  const leadTasks = store.tasks.filter((item) => item.permitNumber === lead.permitNumber);

  if (leadTasks.length === 0) {
    const defaultTask = buildDefaultCrmTask(lead, crm);

    if (defaultTask) {
      const now = new Date().toISOString();
      store.tasks.push({
        id: randomUUID(),
        permitNumber: lead.permitNumber,
        title: defaultTask.title,
        description: defaultTask.description,
        type: defaultTask.type,
        status: defaultTask.status,
        dueAt: defaultTask.dueAt,
        assignedTo: defaultTask.assignedTo,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      changed = true;
    }
  }

  return changed;
}

function materializeStoreState(store: PermitHunterBridgeStore) {
  let changed = false;

  for (const lead of store.leads) {
    changed = ensureLeadOperationalStateInStore(store, lead) || changed;
  }

  return changed;
}

function addSweepTask(
  store: PermitHunterBridgeStore,
  permitNumber: string,
  assignedTo: string | null,
  requestedAt: string
) {
  const hasOpenCallTask = store.tasks.some(
    (task) =>
      task.permitNumber === permitNumber &&
      task.status !== "done" &&
      (task.type === "call" || task.title.includes("owner"))
  );

  if (hasOpenCallTask) {
    return;
  }

  store.tasks.push({
    id: randomUUID(),
    permitNumber,
    title: "Llamar al owner enriquecido",
    description: "Ejecutar primer outreach con el contacto recién enriquecido.",
    type: "call",
    status: "open",
    dueAt: new Date(Date.parse(requestedAt) + 24 * 60 * 60 * 1000).toISOString(),
    assignedTo,
    completedAt: null,
    createdAt: requestedAt,
    updatedAt: requestedAt,
  });
}

function executeDailyScan(store: PermitHunterBridgeStore, requestedAt: string) {
  let nextSequence = getHighestPermitSequence(store);
  let inserted = 0;

  for (const template of DAILY_SCAN_TEMPLATES) {
    nextSequence += 1;
    store.leads.push(
      createLeadFromTemplate(template, buildPermitNumberFromSequence(nextSequence), requestedAt)
    );
    inserted += 1;
  }

  const target = store.leads.find((lead) => lead.permitNumber === "PRJ-2026-001251");
  let updated = 0;

  if (target) {
    target.rawStatus = "Plan Review Resubmittal";
    target.updatedAt = requestedAt;
    target.score += 6;
    updated = 1;
  }

  insertRun(
    store,
    createRunRecord(requestedAt, { found: inserted + updated, inserted, updated }, "daily_scan")
  );

  return `${inserted} leads nuevos y ${updated} actualización de inventario.`;
}

function executeBackfill(store: PermitHunterBridgeStore, requestedAt: string) {
  let nextSequence = getHighestPermitSequence(store);
  let inserted = 0;

  for (const template of BACKFILL_TEMPLATES) {
    nextSequence += 1;
    store.leads.push(
      createLeadFromTemplate(template, buildPermitNumberFromSequence(nextSequence), requestedAt)
    );
    inserted += 1;
  }

  insertRun(
    store,
    createRunRecord(requestedAt, { found: 18, inserted, updated: 0 }, "backfill_30")
  );

  return `${inserted} permisos históricos agregados al inventario local.`;
}

function executeContactSweep(store: PermitHunterBridgeStore, requestedAt: string) {
  const targets = sortLeadsByScore(
    store.leads.filter((lead) => !lead.ownerPhone && !lead.ownerEmail)
  ).slice(0, 3);

  for (const lead of targets) {
    const enrichment = resolveContactEnrichment(lead);
    lead.ownerName = enrichment.ownerName;
    lead.ownerPhone = enrichment.ownerPhone;
    lead.ownerEmail = enrichment.ownerEmail;
    lead.mailingAddress = enrichment.mailingAddress;
    lead.enrichedAt = requestedAt;
    lead.updatedAt = requestedAt;

    const outreach: PermitHunterOutreachRecord = {
      permitNumber: lead.permitNumber,
      status: "attempted",
      channel: "call",
      ownerResponse: "Contacto enriquecido y listo para primer outreach.",
      lastContactedAt: requestedAt,
      nextFollowUpAt: new Date(Date.parse(requestedAt) + 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: requestedAt,
    };
    const outreachIndex = store.outreachStatuses.findIndex(
      (item) => item.permitNumber === lead.permitNumber
    );

    if (outreachIndex >= 0) {
      store.outreachStatuses[outreachIndex] = outreach;
    } else {
      store.outreachStatuses.push(outreach);
    }

    const currentCrm =
      store.crmRecords.find((item) => item.permitNumber === lead.permitNumber) ??
      buildDefaultPermitHunterCrmRecord(lead, outreach);
    const nextCrm: PermitHunterCrmRecord = {
      ...currentCrm,
      stage: "ready_to_contact",
      assignedTo: currentCrm.assignedTo ?? "Lead Ops",
      nextAction: "Llamar al owner y registrar disposition",
      nextActionDueAt: new Date(
        Date.parse(requestedAt) + 24 * 60 * 60 * 1000
      ).toISOString(),
      lastActivityAt: requestedAt,
      workflowSummary:
        "Contacto enriquecido localmente. El siguiente paso es primer outreach y calificación.",
      updatedAt: requestedAt,
    };
    upsertStoreCrmRecord(store, nextCrm);
    addSweepTask(store, lead.permitNumber, nextCrm.assignedTo, requestedAt);
    store.notes.push({
      id: randomUUID(),
      permitNumber: lead.permitNumber,
      note: "Contact sweep local ejecutado. Lead enriquecido y listo para llamada.",
      createdBy: "HEBELING OS",
      createdAt: requestedAt,
    });
  }

  return `${targets.length} leads enriquecidos y movidos a ready-to-contact.`;
}

async function materializeStore(): Promise<PermitHunterBridgeStore> {
  const store = await readBridgeStore();
  const changed = materializeStoreState(store);

  if (changed) {
    await writeBridgeStore(store);
  }

  return store;
}

function buildDashboardData(store: PermitHunterBridgeStore): PermitHunterDashboardData {
  const leads = sortLeadsByScore(store.leads);
  const runs = sortRuns(store.runs);
  const latestRun = runs[0];
  const lastSuccessfulRun = runs.find((run) => run.status === "success") ?? null;
  const freshLeads = leads.filter((lead) => isFreshTargetLead(lead));
  const inventoryByCity = [
    ...leads.reduce((map, lead) => {
      const city = lead.city.trim();
      map.set(city, (map.get(city) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries(),
  ]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  const inventoryByProjectType = [
    ...leads.reduce((map, lead) => {
      map.set(lead.normalizedProjectType, (map.get(lead.normalizedProjectType) ?? 0) + 1);
      return map;
    }, new Map<string, number>()).entries(),
  ]
    .map(([projectType, count]) => ({ projectType, count }))
    .sort((a, b) => b.count - a.count || a.projectType.localeCompare(b.projectType));
  const sortedByUpdatedAt = [...leads].sort(
    (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
  );
  const fullContact = leads.filter((lead) => Boolean(lead.ownerPhone || lead.ownerEmail));
  const ownerOnly = leads.filter(
    (lead) =>
      !lead.ownerPhone &&
      !lead.ownerEmail &&
      Boolean(lead.ownerName || lead.mailingAddress)
  );
  const manualResearch = leads.filter(
    (lead) =>
      !lead.ownerPhone &&
      !lead.ownerEmail &&
      !lead.ownerName &&
      !lead.mailingAddress
  );

  return {
    metrics: {
      qualifiedLeadInventory: leads.length,
      sourceCoverage: inventoryByCity.length,
      secondaryCandidates: leads.filter((lead) => lead.recommendedAction === "monitor_only")
        .length,
      hotLeads: freshLeads.filter((lead) => lead.isHotLead).length,
      freshIssuanceLeads: freshLeads.filter((lead) => isFreshIssuanceLead(lead)).length,
      freshPlanCheckLeads: freshLeads.filter((lead) => isFreshPlanCheckLead(lead)).length,
      enrichmentPending: freshLeads.filter((lead) => !lead.ownerPhone && !lead.ownerEmail)
        .length,
      lastRunStatus: latestRun?.status ?? "not_run",
    },
    reporting: {
      oldestLeadUpdatedAt: sortedByUpdatedAt[0]?.updatedAt ?? null,
      latestLeadUpdatedAt: sortedByUpdatedAt[sortedByUpdatedAt.length - 1]?.updatedAt ?? null,
      lastSuccessfulRun,
      recentRuns: runs.slice(0, 4),
      inventoryByCity,
      inventoryByProjectType,
    },
    filters: {
      byContactStatus: [
        { key: "full_contact", label: "Contacto completo", count: fullContact.length },
        { key: "owner_only", label: "Solo owner", count: ownerOnly.length },
        { key: "manual_research", label: "Investigación manual", count: manualResearch.length },
      ],
      byProjectType: inventoryByProjectType.map((item) => ({
        key: item.projectType,
        label: item.projectType.replaceAll("_", " "),
        count: item.count,
      })),
      byStage: [
        {
          key: "issuance",
          label: "Emisión",
          count: leads.filter((lead) => lead.normalizedStage === "issuance").length,
        },
        {
          key: "plan_check",
          label: "Plan check",
          count: leads.filter((lead) => lead.normalizedStage === "plan_check").length,
        },
      ],
    },
    priorities: {
      call_first: freshLeads.filter((lead) => lead.recommendedAction === "call_first"),
      enrich_immediately: freshLeads.filter(
        (lead) => lead.recommendedAction === "enrich_immediately"
      ),
      research_next: freshLeads.filter((lead) => lead.recommendedAction === "research_next"),
      monitor_only: freshLeads.filter((lead) => lead.recommendedAction === "monitor_only"),
    },
    sections: {
      qualifiedPipeline: sortLeadsByScore(leads).slice(0, 18),
      fullIssuanceInventory: leads
        .filter((lead) => lead.normalizedStage === "issuance")
        .sort(
          (a, b) => b.score - a.score || Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
        ),
      secondaryCandidates: leads
        .filter((lead) => lead.recommendedAction === "monitor_only")
        .sort((a, b) => b.score - a.score)
        .slice(0, 18),
      hotLeads: freshLeads.filter((lead) => lead.isHotLead).sort((a, b) => b.score - a.score),
      freshIssuance: freshLeads
        .filter((lead) => isFreshIssuanceLead(lead))
        .sort((a, b) => b.score - a.score),
      freshPlanCheck: freshLeads
        .filter((lead) => isFreshPlanCheckLead(lead))
        .sort((a, b) => b.score - a.score),
      recentUpdates: [...leads]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, 12),
    },
  };
}

function buildCrmBoardData(store: PermitHunterBridgeStore): PermitHunterCrmBoardData {
  const boardItems = sortLeadsByScore(store.leads).map((lead) => {
    const crm =
      store.crmRecords.find((item) => item.permitNumber === lead.permitNumber) ??
      buildDefaultPermitHunterCrmRecord(
        lead,
        store.outreachStatuses.find((item) => item.permitNumber === lead.permitNumber) ?? null
      );
    const tasks = store.tasks.filter((item) => item.permitNumber === lead.permitNumber);

    return { lead, crm, tasks };
  });

  const lanes = CRM_STAGE_ORDER.map((stage) => ({
    stage,
    label: CRM_STAGE_LABELS[stage],
    leads: boardItems
      .filter((item) => item.crm.stage === stage)
      .sort((a, b) => b.lead.score - a.lead.score)
      .slice(0, 8)
      .map((item) => ({
        lead: item.lead,
        crm: item.crm,
        taskCount: item.tasks.filter((task) => task.status !== "done").length,
      })),
  }));

  const dueTasks = boardItems
    .flatMap((item) => item.tasks.map((task) => ({ lead: item.lead, crm: item.crm, task })))
    .filter((item) => item.task.status !== "done")
    .sort(
      (a, b) =>
        Date.parse(a.task.dueAt ?? a.task.createdAt) -
        Date.parse(b.task.dueAt ?? b.task.createdAt)
    )
    .slice(0, 10);

  const stageCounts = CRM_STAGE_ORDER.map((stage) => ({
    stage,
    label: CRM_STAGE_LABELS[stage],
    count: boardItems.filter((item) => item.crm.stage === stage).length,
  }));

  const assigneeMap = new Map<string, { leadCount: number; taskCount: number }>();
  for (const item of boardItems) {
    const assignee = item.crm.assignedTo?.trim() || "Sin asignar";
    const existing = assigneeMap.get(assignee) ?? { leadCount: 0, taskCount: 0 };
    existing.leadCount += 1;
    existing.taskCount += item.tasks.filter((task) => task.status !== "done").length;
    assigneeMap.set(assignee, existing);
  }

  const assignees = [...assigneeMap.entries()]
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.leadCount - a.leadCount || b.taskCount - a.taskCount)
    .slice(0, 6);

  const openTasks = boardItems.reduce(
    (count, item) => count + item.tasks.filter((task) => task.status !== "done").length,
    0
  );
  const overdueTasks = boardItems.reduce(
    (count, item) =>
      count +
      item.tasks.filter(
        (task) =>
          task.status !== "done" && Boolean(task.dueAt) && Date.parse(task.dueAt!) < Date.now()
      ).length,
    0
  );
  const unassignedLeads = boardItems.filter((item) => !item.crm.assignedTo?.trim()).length;

  return {
    lanes,
    stageCounts,
    assignees,
    metrics: {
      openTasks,
      overdueTasks,
      unassignedLeads,
    },
    dueTasks,
  };
}

function buildSnapshot(store: PermitHunterBridgeStore): PermitHunterCommandCenterSnapshot {
  const leads = sortLeadsByScore(store.leads);
  const runs = sortRuns(store.runs);
  const commands = sortCommands(store.commands);
  const dashboard = buildDashboardData(store);
  const board = buildCrmBoardData(store);
  const lastRunAt = runs[0]?.completedAt ?? runs[0]?.startedAt ?? null;
  const timestamps = [
    lastRunAt,
    ...leads.map((lead) => lead.updatedAt),
    ...commands.map((command) => command.requestedAt),
    ...store.crmRecords.map((record) => record.updatedAt),
    ...store.tasks.map((task) => task.updatedAt),
    ...store.notes.map((note) => note.createdAt),
    ...store.outreachStatuses.map((outreach) => outreach.updatedAt),
  ].filter(Boolean) as string[];
  const lastUpdatedAt = timestamps.sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  return {
    mode: "bridge_local",
    workspaceLabel: "Permit-Hunter workspace bridge",
    storageLabel: "Hebeling OS local lead operating store",
    integrationStatus: "supabase_pending",
    reporting: {
      lastUpdatedAt,
      lastRunAt,
    },
    metrics: {
      trackedLeads: leads.length,
      hotLeads: leads.filter((lead) => lead.isHotLead).length,
      issuance: leads.filter((lead) => lead.normalizedStage === "issuance").length,
      planCheck: leads.filter((lead) => lead.normalizedStage === "plan_check").length,
      fullContact: countFullContact(leads),
      ownerOnly: countOwnerOnly(leads),
      manualResearch: countManualResearch(leads),
      pendingCommands: commands.filter((command) => command.status === "pending_supabase")
        .length,
    },
    priorityLeads: leads.slice(0, 4),
    runs,
    commands: commands.slice(0, 10),
    dashboard,
    board,
  };
}

export async function getPermitHunterCommandCenterSnapshot(): Promise<PermitHunterCommandCenterSnapshot> {
  const store = await materializeStore();
  return buildSnapshot(store);
}

export async function queuePermitHunterCommand(type: PermitHunterCommandType) {
  const store = await materializeStore();
  const requestedAt = new Date().toISOString();
  let note = "Operación local registrada dentro de HEBELING OS.";

  if (type === "daily_scan") {
    note = executeDailyScan(store, requestedAt);
  } else if (type === "backfill_30") {
    note = executeBackfill(store, requestedAt);
  } else if (type === "contact_sweep") {
    note = executeContactSweep(store, requestedAt);
  }

  materializeStoreState(store);

  const command: PermitHunterCommand = {
    id: randomUUID(),
    type,
    status: "completed",
    requestedAt,
    requestedBy: "HEBELING OS",
    note: `${note} Ejecutado localmente hasta el handoff a Supabase.`,
  };

  store.commands.unshift(command);
  store.commands = store.commands.slice(0, 24);
  await writeBridgeStore(store);

  return {
    command,
    snapshot: buildSnapshot(store),
  };
}

export async function getPermitHunterLeadDetail(
  permitNumber: string
): Promise<PermitHunterLeadDetail> {
  const store = await materializeStore();
  const lead = store.leads.find((item) => item.permitNumber === permitNumber) ?? null;

  if (!lead) {
    return { lead: null, notes: [], outreach: null, crm: null, tasks: [] };
  }

  return {
    lead,
    notes: sortNotes(store.notes.filter((item) => item.permitNumber === permitNumber)),
    outreach:
      store.outreachStatuses.find((item) => item.permitNumber === permitNumber) ?? null,
    crm: store.crmRecords.find((item) => item.permitNumber === permitNumber) ?? null,
    tasks: sortTasks(store.tasks.filter((item) => item.permitNumber === permitNumber)),
  };
}

export async function savePermitHunterCrmRecord(
  permitNumber: string,
  updates: Partial<
    Pick<
      PermitHunterCrmRecord,
      | "stage"
      | "priority"
      | "assignedTo"
      | "estimatedValue"
      | "nextAction"
      | "nextActionDueAt"
      | "lastActivityAt"
      | "workflowSummary"
    >
  >
) {
  const store = await materializeStore();
  const lead = store.leads.find((item) => item.permitNumber === permitNumber);

  if (!lead) {
    return null;
  }

  const outreach =
    store.outreachStatuses.find((item) => item.permitNumber === permitNumber) ?? null;
  const current =
    store.crmRecords.find((item) => item.permitNumber === permitNumber) ??
    buildDefaultPermitHunterCrmRecord(lead, outreach);
  const now = new Date().toISOString();
  const nextRecord: PermitHunterCrmRecord = {
    ...current,
    stage: updates.stage ?? current.stage,
    priority: updates.priority ?? current.priority,
    assignedTo: updates.assignedTo ?? current.assignedTo,
    estimatedValue: updates.estimatedValue ?? current.estimatedValue,
    nextAction: updates.nextAction ?? current.nextAction,
    nextActionDueAt: updates.nextActionDueAt ?? current.nextActionDueAt,
    lastActivityAt: updates.lastActivityAt ?? current.lastActivityAt,
    workflowSummary: updates.workflowSummary ?? current.workflowSummary,
    updatedAt: now,
  };

  upsertStoreCrmRecord(store, nextRecord);
  setLeadUpdatedAt(store, permitNumber, now);
  await writeBridgeStore(store);

  return nextRecord;
}

export async function addPermitHunterTask(
  permitNumber: string,
  payload: Pick<
    PermitHunterCrmTask,
    "title" | "description" | "type" | "status" | "dueAt" | "assignedTo"
  >
) {
  const store = await materializeStore();
  const lead = store.leads.find((item) => item.permitNumber === permitNumber);

  if (!lead) {
    return null;
  }

  const now = new Date().toISOString();
  const task: PermitHunterCrmTask = {
    id: randomUUID(),
    permitNumber,
    title: payload.title.trim(),
    description: payload.description ?? null,
    type: payload.type,
    status: payload.status,
    dueAt: payload.dueAt ?? null,
    assignedTo: payload.assignedTo ?? null,
    completedAt: payload.status === "done" ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  store.tasks.push(task);
  setLeadUpdatedAt(store, permitNumber, now);
  await writeBridgeStore(store);

  return task;
}

export async function updatePermitHunterTask(
  taskId: string,
  updates: Partial<
    Pick<
      PermitHunterCrmTask,
      "title" | "description" | "status" | "dueAt" | "assignedTo"
    >
  >
) {
  const store = await materializeStore();
  const task = store.tasks.find((item) => item.id === taskId);

  if (!task) {
    return null;
  }

  const now = new Date().toISOString();
  task.title = updates.title?.trim() || task.title;
  task.description = updates.description ?? task.description;
  task.status = updates.status ?? task.status;
  task.dueAt = updates.dueAt ?? task.dueAt;
  task.assignedTo = updates.assignedTo ?? task.assignedTo;
  task.completedAt = task.status === "done" ? task.completedAt ?? now : null;
  task.updatedAt = now;

  setLeadUpdatedAt(store, task.permitNumber, now);
  await writeBridgeStore(store);

  return task;
}

export async function addPermitHunterNote(
  permitNumber: string,
  note: string,
  createdBy: string
) {
  const store = await materializeStore();
  const lead = store.leads.find((item) => item.permitNumber === permitNumber);

  if (!lead) {
    return null;
  }

  const now = new Date().toISOString();
  const record: PermitHunterNote = {
    id: randomUUID(),
    permitNumber,
    note: note.trim(),
    createdBy: createdBy.trim() || "operator",
    createdAt: now,
  };

  store.notes.push(record);
  setLeadUpdatedAt(store, permitNumber, now);
  await writeBridgeStore(store);

  return record;
}

export async function savePermitHunterOutreach(
  permitNumber: string,
  payload: Pick<
    PermitHunterOutreachRecord,
    "status" | "channel" | "ownerResponse" | "lastContactedAt" | "nextFollowUpAt"
  >
) {
  const store = await materializeStore();
  const lead = store.leads.find((item) => item.permitNumber === permitNumber);

  if (!lead) {
    return null;
  }

  const now = new Date().toISOString();
  const record: PermitHunterOutreachRecord = {
    permitNumber,
    status: payload.status,
    channel: payload.channel,
    ownerResponse: payload.ownerResponse ?? null,
    lastContactedAt: payload.lastContactedAt ?? null,
    nextFollowUpAt: payload.nextFollowUpAt ?? null,
    updatedAt: now,
  };
  const existingIndex = store.outreachStatuses.findIndex(
    (item) => item.permitNumber === permitNumber
  );

  if (existingIndex >= 0) {
    store.outreachStatuses[existingIndex] = record;
  } else {
    store.outreachStatuses.push(record);
  }

  const crm =
    store.crmRecords.find((item) => item.permitNumber === permitNumber) ??
    buildDefaultPermitHunterCrmRecord(lead, record);
  const nextStage = deriveCrmStage(lead, record);
  upsertStoreCrmRecord(store, {
    ...crm,
    stage: nextStage,
    lastActivityAt: record.lastContactedAt ?? crm.lastActivityAt,
    nextActionDueAt: record.nextFollowUpAt ?? crm.nextActionDueAt,
    updatedAt: now,
  });

  setLeadUpdatedAt(store, permitNumber, now);
  await writeBridgeStore(store);

  return record;
}

export async function buyPermitHunterContact(permitNumber: string) {
  const store = await materializeStore();
  const lead = store.leads.find((item) => item.permitNumber === permitNumber);

  if (!lead) {
    return null;
  }

  const enrichment =
    CONTACT_ENRICHMENTS[permitNumber] ??
    ({
      ownerName: lead.ownerName ?? "Owner Record",
      ownerPhone: "(619) 555-0100",
      ownerEmail: "owner@example.com",
      mailingAddress:
        lead.mailingAddress ??
        `${lead.address}, ${lead.city}, ${lead.state} ${lead.postalCode ?? ""}`.trim(),
    } as const);
  const now = new Date().toISOString();

  lead.ownerName = enrichment.ownerName;
  lead.ownerPhone = enrichment.ownerPhone;
  lead.ownerEmail = enrichment.ownerEmail;
  lead.mailingAddress = enrichment.mailingAddress;
  lead.enrichedAt = now;
  lead.updatedAt = now;

  const outreach =
    store.outreachStatuses.find((item) => item.permitNumber === permitNumber) ?? null;
  const crm =
    store.crmRecords.find((item) => item.permitNumber === permitNumber) ??
    buildDefaultPermitHunterCrmRecord(lead, outreach);
  const nextStage =
    crm.stage === "needs_enrichment" ? "ready_to_contact" : crm.stage;

  upsertStoreCrmRecord(store, {
    ...crm,
    stage: nextStage,
    nextAction:
      nextStage === "ready_to_contact"
        ? "Llamar al owner enriquecido y mover a calificación"
        : crm.nextAction,
    updatedAt: now,
  });

  await writeBridgeStore(store);

  return {
    lead,
    enrichment,
  };
}
