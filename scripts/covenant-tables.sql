-- Covenant Core - Relationship Intelligence Tables
-- Run this script to create all necessary tables for the CRM

-- ============================================
-- CORE ENTITY TABLES
-- ============================================

-- People/Contacts table
CREATE TABLE IF NOT EXISTS covenant_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  
  -- Professional Info
  title TEXT,
  company TEXT,
  linkedin_url TEXT,
  website TEXT,
  
  -- Location
  city TEXT,
  country TEXT,
  timezone TEXT,
  
  -- Relationship Data
  relationship_tier TEXT DEFAULT 'standard' CHECK (relationship_tier IN ('vip', 'gold', 'standard', 'new')),
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_followup_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  source TEXT, -- how they were added (manual, import, referral, etc.)
  tags TEXT[], -- array of tags
  notes TEXT,
  
  -- Owner
  owner_id UUID REFERENCES auth.users(id)
);

-- Organizations table
CREATE TABLE IF NOT EXISTS covenant_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Info
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  
  -- Contact Info
  email TEXT,
  phone TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  country TEXT,
  
  -- Business Info
  employee_count TEXT, -- '1-10', '11-50', '51-200', '201-500', '500+'
  annual_revenue TEXT,
  organization_type TEXT DEFAULT 'company' CHECK (organization_type IN ('company', 'church', 'nonprofit', 'government', 'other')),
  
  -- Relationship
  relationship_status TEXT DEFAULT 'prospect' CHECK (relationship_status IN ('prospect', 'active', 'inactive', 'churned')),
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('enterprise', 'premium', 'standard', 'basic')),
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  -- Owner
  owner_id UUID REFERENCES auth.users(id)
);

-- Link people to organizations (many-to-many)
CREATE TABLE IF NOT EXISTS covenant_people_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES covenant_people(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES covenant_organizations(id) ON DELETE CASCADE,
  role TEXT, -- their role at this organization
  is_primary BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(person_id, organization_id)
);

-- ============================================
-- BUSINESS UNIT CONNECTIONS
-- ============================================

-- Link people/orgs to Hebeling business units
CREATE TABLE IF NOT EXISTS covenant_business_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Entity reference (either person or organization)
  person_id UUID REFERENCES covenant_people(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES covenant_organizations(id) ON DELETE CASCADE,
  
  -- Business unit
  business_unit TEXT NOT NULL CHECK (business_unit IN ('editorial', 'ikingdom', 'imperium', 'ministerio')),
  
  -- Connection type
  connection_type TEXT NOT NULL, -- 'author', 'investor', 'client', 'partner', 'speaker', 'member', etc.
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Financials (if applicable)
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  
  -- Ensure at least one entity is linked
  CONSTRAINT entity_required CHECK (person_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- ============================================
-- INTERACTIONS & ACTIVITIES
-- ============================================

-- Activity/Interaction log
CREATE TABLE IF NOT EXISTS covenant_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Entity reference
  person_id UUID REFERENCES covenant_people(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES covenant_organizations(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task', 'deal', 'event')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Timing
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  
  -- Status (for tasks)
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- User who created
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- OPPORTUNITIES/DEALS
-- ============================================

-- Opportunities/Deals pipeline
CREATE TABLE IF NOT EXISTS covenant_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Entity reference
  person_id UUID REFERENCES covenant_people(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES covenant_organizations(id) ON DELETE SET NULL,
  
  -- Pipeline
  business_unit TEXT NOT NULL CHECK (business_unit IN ('editorial', 'ikingdom', 'imperium', 'ministerio')),
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  
  -- Value
  value DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  
  -- Timing
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Owner
  owner_id UUID REFERENCES auth.users(id),
  
  -- Metadata
  tags TEXT[],
  notes TEXT
);

-- ============================================
-- EVENTS & COMMUNICATIONS
-- ============================================

-- Events
CREATE TABLE IF NOT EXISTS covenant_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'conference', 'webinar', 'workshop', 'other')),
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Location
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  
  -- Business unit
  business_unit TEXT CHECK (business_unit IN ('editorial', 'ikingdom', 'imperium', 'ministerio')),
  
  -- Owner
  owner_id UUID REFERENCES auth.users(id)
);

-- Event attendees
CREATE TABLE IF NOT EXISTS covenant_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES covenant_events(id) ON DELETE CASCADE,
  person_id UUID REFERENCES covenant_people(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'attended', 'no_show')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, person_id)
);

-- ============================================
-- AI INSIGHTS
-- ============================================

-- AI-generated insights
CREATE TABLE IF NOT EXISTS covenant_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Entity reference (optional)
  person_id UUID REFERENCES covenant_people(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES covenant_organizations(id) ON DELETE CASCADE,
  
  -- Insight details
  insight_type TEXT NOT NULL CHECK (insight_type IN ('opportunity', 'risk', 'recommendation', 'trend')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  
  -- Action
  suggested_action TEXT,
  action_taken BOOLEAN DEFAULT false,
  
  -- Visibility
  is_dismissed BOOLEAN DEFAULT false
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_covenant_people_email ON covenant_people(email);
CREATE INDEX IF NOT EXISTS idx_covenant_people_owner ON covenant_people(owner_id);
CREATE INDEX IF NOT EXISTS idx_covenant_people_tier ON covenant_people(relationship_tier);
CREATE INDEX IF NOT EXISTS idx_covenant_organizations_owner ON covenant_organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_covenant_activities_person ON covenant_activities(person_id);
CREATE INDEX IF NOT EXISTS idx_covenant_activities_org ON covenant_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_covenant_activities_date ON covenant_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_covenant_opportunities_stage ON covenant_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_covenant_opportunities_business_unit ON covenant_opportunities(business_unit);
CREATE INDEX IF NOT EXISTS idx_covenant_business_connections_person ON covenant_business_connections(person_id);
CREATE INDEX IF NOT EXISTS idx_covenant_business_connections_org ON covenant_business_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_covenant_business_connections_unit ON covenant_business_connections(business_unit);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE covenant_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_people_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_business_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE covenant_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access for now)
-- People
CREATE POLICY "Users can view all people" ON covenant_people FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert people" ON covenant_people FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update people" ON covenant_people FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete people" ON covenant_people FOR DELETE TO authenticated USING (true);

-- Organizations
CREATE POLICY "Users can view all organizations" ON covenant_organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert organizations" ON covenant_organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update organizations" ON covenant_organizations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete organizations" ON covenant_organizations FOR DELETE TO authenticated USING (true);

-- People-Organizations links
CREATE POLICY "Users can view all people_organizations" ON covenant_people_organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert people_organizations" ON covenant_people_organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update people_organizations" ON covenant_people_organizations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete people_organizations" ON covenant_people_organizations FOR DELETE TO authenticated USING (true);

-- Business connections
CREATE POLICY "Users can view all business_connections" ON covenant_business_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert business_connections" ON covenant_business_connections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update business_connections" ON covenant_business_connections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete business_connections" ON covenant_business_connections FOR DELETE TO authenticated USING (true);

-- Activities
CREATE POLICY "Users can view all activities" ON covenant_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert activities" ON covenant_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update activities" ON covenant_activities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete activities" ON covenant_activities FOR DELETE TO authenticated USING (true);

-- Opportunities
CREATE POLICY "Users can view all opportunities" ON covenant_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert opportunities" ON covenant_opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update opportunities" ON covenant_opportunities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete opportunities" ON covenant_opportunities FOR DELETE TO authenticated USING (true);

-- Events
CREATE POLICY "Users can view all events" ON covenant_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert events" ON covenant_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update events" ON covenant_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete events" ON covenant_events FOR DELETE TO authenticated USING (true);

-- Event attendees
CREATE POLICY "Users can view all event_attendees" ON covenant_event_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert event_attendees" ON covenant_event_attendees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update event_attendees" ON covenant_event_attendees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete event_attendees" ON covenant_event_attendees FOR DELETE TO authenticated USING (true);

-- Insights
CREATE POLICY "Users can view all insights" ON covenant_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert insights" ON covenant_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update insights" ON covenant_insights FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete insights" ON covenant_insights FOR DELETE TO authenticated USING (true);
