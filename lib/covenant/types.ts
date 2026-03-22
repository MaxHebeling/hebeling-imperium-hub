// Covenant Core - Type Definitions

export type CovenantBusinessUnit =
  | "editorial"
  | "ikingdom"
  | "imperium"
  | "ministerio"
  | "lead_hunter";

export interface CovenantPerson {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  relationship_tier: 'vip' | 'gold' | 'standard' | 'new';
  opportunity_score: number;
  last_contact_date: string | null;
  next_followup_date: string | null;
  source: string | null;
  tags: string[] | null;
  notes: string | null;
  owner_id: string | null;
}

export interface CovenantOrganization {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  employee_count: string | null;
  annual_revenue: string | null;
  organization_type: 'company' | 'church' | 'nonprofit' | 'government' | 'other';
  relationship_status: 'prospect' | 'active' | 'inactive' | 'churned';
  tier: 'enterprise' | 'premium' | 'standard' | 'basic';
  tags: string[] | null;
  notes: string | null;
  owner_id: string | null;
}

export interface CovenantBusinessConnection {
  id: string;
  created_at: string;
  person_id: string | null;
  organization_id: string | null;
  business_unit: CovenantBusinessUnit;
  connection_type: string;
  status: 'active' | 'inactive' | 'pending';
  lifetime_value: number;
  notes: string | null;
}

export interface CovenantActivity {
  id: string;
  created_at: string;
  person_id: string | null;
  organization_id: string | null;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal' | 'event';
  title: string;
  description: string | null;
  activity_date: string;
  duration_minutes: number | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string | null;
}

export interface CovenantOpportunity {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  person_id: string | null;
  organization_id: string | null;
  business_unit: CovenantBusinessUnit;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number | null;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  owner_id: string | null;
  tags: string[] | null;
  notes: string | null;
}

export interface CovenantEvent {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  event_type: 'meeting' | 'conference' | 'webinar' | 'workshop' | 'other';
  start_date: string;
  end_date: string | null;
  timezone: string;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  business_unit: CovenantBusinessUnit | null;
  owner_id: string | null;
}

export interface CovenantInsight {
  id: string;
  created_at: string;
  person_id: string | null;
  organization_id: string | null;
  insight_type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  suggested_action: string | null;
  action_taken: boolean;
  is_dismissed: boolean;
}

// Form types for creating/updating
export type CreatePersonInput = Omit<CovenantPerson, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePersonInput = Partial<CreatePersonInput>;

export type CreateOrganizationInput = Omit<CovenantOrganization, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export type CreateOpportunityInput = Omit<CovenantOpportunity, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOpportunityInput = Partial<CreateOpportunityInput>;

// Extended types with relations
export interface PersonWithConnections extends CovenantPerson {
  business_connections?: CovenantBusinessConnection[];
  activities?: CovenantActivity[];
  opportunities?: CovenantOpportunity[];
}

export interface OrganizationWithConnections extends CovenantOrganization {
  business_connections?: CovenantBusinessConnection[];
  people?: CovenantPerson[];
}
