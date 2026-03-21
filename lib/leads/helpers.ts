import { createClient as createAdminClient } from "@supabase/supabase-js";

// Hardcoded org_id for Hebeling Imperium Group
export const ORG_ID = "4059832a-ff39-43e6-984f-d9e866dfb8a4";

// Create admin client that bypasses RLS
export function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generate unique lead code in format: IK-YYYYMMDD-XXXX
 * Uses timestamp + random number to guarantee uniqueness
 */
export async function generateLeadCode(): Promise<string> {
  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Generate a unique code using timestamp milliseconds + random number
  const timestamp = Date.now() % 10000; // Get last 4 digits of timestamp
  const random = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
  const uniqueSuffix = ((timestamp + random) % 10000).toString().padStart(4, '0');
  
  return `IK-${dateKey}-${uniqueSuffix}`;
}

export interface LeadPayload {
  // Required
  full_name: string;
  
  // Basic info
  company_name?: string;
  email?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  
  // Project details
  project_description?: string;
  organization_type?: string;
  website_url?: string;
  social_links?: string;
  main_goal?: string;
  expected_result?: string;
  main_service?: string;
  ideal_client?: string;
  
  // Branding
  has_logo?: boolean;
  has_brand_colors?: boolean;
  visual_style?: string;
  available_content?: string;
  reference_websites?: string;
  has_current_landing?: boolean;
  
  // Project scope
  project_type?: string;
  budget_range?: string;
  timeline?: string;
  preferred_contact_method?: string;
  additional_notes?: string;
  
  // Tracking
  source?: string;
  brand?: string;
  origin_page?: string;
  form_type?: string;
}

export interface Lead {
  id: string;
  lead_code: string;
  org_id: string;
  full_name: string;
  company_name?: string;
  email?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  project_description?: string;
  organization_type?: string;
  website_url?: string;
  social_links?: string;
  main_goal?: string;
  expected_result?: string;
  main_service?: string;
  ideal_client?: string;
  has_logo?: boolean;
  has_brand_colors?: boolean;
  visual_style?: string;
  available_content?: string;
  reference_websites?: string;
  has_current_landing?: boolean;
  project_type?: string;
  budget_range?: string;
  timeline?: string;
  preferred_contact_method?: string;
  additional_notes?: string;
  source?: string;
  brand?: string;
  origin_page?: string;
  form_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FindLeadByContactInput {
  brand?: string;
  email?: string;
  whatsapp?: string;
}

/**
 * Find an existing lead by contact details to avoid duplicate records.
 */
export async function findLeadByContact({
  brand,
  email,
  whatsapp,
}: FindLeadByContactInput): Promise<Lead | null> {
  const supabase = getAdminClient();
  const filters: string[] = [];

  if (email?.trim()) {
    filters.push(`email.eq.${email.trim()}`);
  }

  if (whatsapp?.trim()) {
    filters.push(`whatsapp.eq.${whatsapp.trim()}`);
  }

  if (filters.length === 0) {
    return null;
  }

  let query = supabase.from("leads").select("*").or(filters.join(",")).limit(1);

  if (brand?.trim()) {
    query = query.eq("brand", brand.trim());
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Lead lookup error:", error);
    throw new Error(`Failed to find lead by contact: ${error.message}`);
  }

  return data ?? null;
}

/**
 * Create a new lead in the database
 */
export async function createLead(payload: LeadPayload): Promise<Lead> {
  const supabase = getAdminClient();
  
  // Generate unique lead code
  const leadCode = await generateLeadCode();
  
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      org_id: ORG_ID,
      lead_code: leadCode,
      full_name: payload.full_name,
      company_name: payload.company_name || null,
      email: payload.email || null,
      whatsapp: payload.whatsapp || null,
      country: payload.country || null,
      city: payload.city || null,
      project_description: payload.project_description || null,
      organization_type: payload.organization_type || null,
      website_url: payload.website_url || null,
      social_links: payload.social_links || null,
      main_goal: payload.main_goal || null,
      expected_result: payload.expected_result || null,
      main_service: payload.main_service || null,
      ideal_client: payload.ideal_client || null,
      has_logo: payload.has_logo ?? null,
      has_brand_colors: payload.has_brand_colors ?? null,
      visual_style: payload.visual_style || null,
      available_content: payload.available_content || null,
      reference_websites: payload.reference_websites || null,
      has_current_landing: payload.has_current_landing ?? null,
      project_type: payload.project_type || null,
      budget_range: payload.budget_range || null,
      timeline: payload.timeline || null,
      preferred_contact_method: payload.preferred_contact_method || null,
      additional_notes: payload.additional_notes || null,
      source: payload.source || "website",
      brand: payload.brand || null,
      origin_page: payload.origin_page || null,
      form_type: payload.form_type || null,
      status: "new_lead",
    })
    .select()
    .single();

  if (error) {
    console.error("Lead creation error:", error);
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return lead;
}

export interface DealFromLead {
  id: string;
  lead_id: string;
  lead_code: string;
  title: string;
  pipeline: string;
  stage_id: string | null;
  status: string;
  owner: string;
}

/**
 * Create a deal linked to a lead
 */
export async function createDealFromLead(lead: Lead): Promise<DealFromLead | null> {
  const supabase = getAdminClient();
  
  // Get the "New" or "Lead" stage from the default pipeline
  const { data: stages } = await supabase
    .from("stages")
    .select("id")
    .or("name.eq.New,name.eq.Lead")
    .limit(1);

  const stageId = stages?.[0]?.id || null;
  
  // Generate deal name
  const dealName = lead.company_name 
    ? `Landing Page - ${lead.company_name}` 
    : `Landing Page - ${lead.full_name}`;
  
  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      org_id: ORG_ID,
      lead_id: lead.id,
      lead_code: lead.lead_code,
      title: dealName,
      pipeline: "ikingdom",
      stage_id: stageId,
      status: "open",
      owner: "max",
      value: 0,
      currency: "USD",
      source: lead.source || "website",
    })
    .select()
    .single();

  if (error) {
    console.error("Deal creation error:", error);
    return null;
  }

  return deal;
}

/**
 * Log activity for audit trail
 */
export async function logActivity(
  action: string, 
  entity: string, 
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = getAdminClient();
  
  await supabase.from("activity_logs").insert({
    org_id: ORG_ID,
    action,
    entity,
    entity_id: entityId,
    metadata: metadata || null,
  });
}

/**
 * Map budget range to readable text
 */
export function formatBudgetRange(budget: string | undefined): string {
  const budgetMap: Record<string, string> = {
    "menos_500": "Menos de $500 USD",
    "500_1000": "$500 - $1,000 USD",
    "1000_2500": "$1,000 - $2,500 USD",
    "2500_5000": "$2,500 - $5,000 USD",
    "5000_10000": "$5,000 - $10,000 USD",
    "mas_10000": "Mas de $10,000 USD",
    "por_definir": "Por definir",
  };
  return budget ? budgetMap[budget] || budget : "No especificado";
}

/**
 * Map timeline to readable text
 */
export function formatTimeline(timeline: string | undefined): string {
  const timelineMap: Record<string, string> = {
    "urgente": "Urgente (1-2 semanas)",
    "pronto": "Pronto (2-4 semanas)",
    "normal": "Normal (1-2 meses)",
    "flexible": "Flexible (sin prisa)",
  };
  return timeline ? timelineMap[timeline] || timeline : "No especificado";
}

/**
 * Map main service to readable text
 */
export function formatMainService(service: string | undefined): string {
  const serviceMap: Record<string, string> = {
    "landing_page": "Landing Page",
    "sitio_web": "Sitio Web Completo",
    "ecommerce": "E-commerce / Tienda Online",
    "funnel": "Funnel de Ventas",
    "branding": "Branding / Identidad",
    "sistema_web": "Sistema Web / App",
    "consultoria": "Consultoria Digital",
  };
  return service ? serviceMap[service] || service : "No especificado";
}

/**
 * Map main goal to readable text
 */
export function formatMainGoal(goal: string | undefined): string {
  const goalMap: Record<string, string> = {
    "generar_leads": "Generar leads / prospectos",
    "vender_productos": "Vender productos online",
    "captar_clientes": "Captar nuevos clientes",
    "construir_marca": "Construir presencia de marca",
    "lanzar_producto": "Lanzar nuevo producto/servicio",
    "escalar_negocio": "Escalar mi negocio",
  };
  return goal ? goalMap[goal] || goal : "No especificado";
}

/**
 * Map contact method to readable text
 */
export function formatContactMethod(method: string | undefined): string {
  const methodMap: Record<string, string> = {
    "whatsapp": "WhatsApp",
    "email": "Email",
    "llamada": "Llamada telefonica",
    "videollamada": "Videollamada",
  };
  return method ? methodMap[method] || method : "No especificado";
}
