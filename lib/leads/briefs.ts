import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  ORG_ID,
  createDealFromLead,
  createLead,
  findLeadByContact,
  getAdminClient,
  logActivity,
  type Lead,
} from "@/lib/leads/helpers";

export interface LeadBriefPayload {
  companyName: string;
  tagline?: string;
  cityCountry?: string;
  website?: string;
  socialMedia?: string;
  problemSolved?: string;
  differentiator?: string;
  whyChooseYou?: string;
  mainServices?: string;
  keyService?: string;
  idealClient?: string;
  notIdealClient?: string;
  yearsExperience?: string;
  clientsServed?: string;
  testimonials?: string;
  landingObjective?: string;
  trafficStrategy?: string[] | string;
  designStyle?: string;
  phone: string;
  email: string;
  address?: string;
  mainOffer?: string;
  generatedPrompt?: string;
  origen?: string;
  fecha?: string;
}

export interface StoredLeadBrief {
  id: string;
  lead_id: string;
  company_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
}

function getOptionalAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return createAdminClient(url, key);
}

function joinTraffic(value?: string[] | string) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || null;
}

async function updateLeadFromBrief(lead: Lead, payload: LeadBriefPayload) {
  const supabase = getAdminClient();

  const updates: Record<string, string | null> = {
    company_name: payload.companyName || lead.company_name || null,
    email: payload.email || lead.email || null,
    whatsapp: payload.phone || lead.whatsapp || null,
    city: payload.cityCountry || lead.city || null,
    website_url: payload.website || lead.website_url || null,
    social_links: payload.socialMedia || lead.social_links || null,
    project_description: payload.problemSolved || lead.project_description || null,
    main_goal: payload.landingObjective || lead.main_goal || null,
    main_service: payload.keyService || lead.main_service || null,
    ideal_client: payload.idealClient || lead.ideal_client || null,
    visual_style: payload.designStyle || lead.visual_style || null,
    budget_range: lead.budget_range || null,
    additional_notes: lead.additional_notes || null,
    status: "qualified",
  };

  const { error } = await supabase.from("leads").update(updates).eq("id", lead.id);
  if (error) {
    throw new Error(`Failed to update lead from brief: ${error.message}`);
  }
}

async function ensureLead(payload: LeadBriefPayload): Promise<Lead> {
  const existingLead = await findLeadByContact({
    brand: "ikingdom",
    email: payload.email,
    whatsapp: payload.phone,
  });

  if (existingLead) {
    await updateLeadFromBrief(existingLead, payload);
    return { ...existingLead, status: "qualified" };
  }

  const createdLead = await createLead({
    full_name: payload.companyName,
    company_name: payload.companyName,
    email: payload.email,
    whatsapp: payload.phone,
    city: payload.cityCountry,
    website_url: payload.website,
    social_links: payload.socialMedia,
    project_description: payload.problemSolved,
    main_goal: payload.landingObjective,
    main_service: payload.keyService,
    ideal_client: payload.idealClient,
    visual_style: payload.designStyle,
    additional_notes: payload.mainOffer || payload.generatedPrompt,
    source: "ikingdom-brief",
    brand: "ikingdom",
    origin_page: "/brief",
    form_type: "brief_general",
  });

  await updateLeadFromBrief(createdLead, payload);
  await createDealFromLead(createdLead);

  return { ...createdLead, status: "qualified" };
}

export async function storeLeadBrief(
  payload: LeadBriefPayload
): Promise<{ brief: StoredLeadBrief; lead: Lead }> {
  const client = getOptionalAdminClient();

  if (!client) {
    throw new Error("Server configuration error. Supabase admin credentials are missing.");
  }

  const lead = await ensureLead(payload);

  const submittedAt = payload.fecha ? new Date(payload.fecha).toISOString() : new Date().toISOString();

  const { data, error } = await client
    .from("lead_briefs")
    .insert({
      org_id: ORG_ID,
      lead_id: lead.id,
      brand: "ikingdom",
      source: "ikingdom-website",
      origin_page: "/brief",
      status: "received",
      company_name: payload.companyName,
      contact_email: payload.email || null,
      contact_phone: payload.phone || null,
      city_country: payload.cityCountry || null,
      website_url: payload.website || null,
      social_media: payload.socialMedia || null,
      problem_solved: payload.problemSolved || null,
      differentiator: payload.differentiator || null,
      why_choose_you: payload.whyChooseYou || null,
      main_services: payload.mainServices || null,
      key_service: payload.keyService || null,
      ideal_client: payload.idealClient || null,
      not_ideal_client: payload.notIdealClient || null,
      years_experience: payload.yearsExperience || null,
      clients_served: payload.clientsServed || null,
      testimonials: payload.testimonials || null,
      landing_objective: payload.landingObjective || null,
      traffic_strategy: joinTraffic(payload.trafficStrategy),
      design_style: payload.designStyle || null,
      address: payload.address || null,
      main_offer: payload.mainOffer || null,
      generated_prompt: payload.generatedPrompt || null,
      raw_payload: payload,
      submitted_at: submittedAt,
    })
    .select("id, lead_id, company_name, contact_email, contact_phone, status, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to store lead brief: ${error.message}`);
  }

  await logActivity("lead_brief_received", "lead_brief", data.id, {
    lead_id: lead.id,
    brand: "ikingdom",
    company_name: payload.companyName,
    email: payload.email,
    origin: payload.origen || "Brief General iKingdom",
  });

  return { brief: data as StoredLeadBrief, lead };
}
