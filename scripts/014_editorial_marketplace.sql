-- =============================================================================
-- Phase 8 — Editorial Platform / Marketplace
-- Reino Editorial AI Engine · Hebeling OS
-- =============================================================================
-- Turns the editorial system into a marketplace where:
--   Authors   → purchase editorial services
--   Professionals → offer and fulfill services
--   Orders    → link directly to editorial_projects in the pipeline
--
-- 8 new tables:
--   1. editorial_professionals          — professional profiles
--   2. editorial_service_listings       — services offered by professionals
--   3. editorial_marketplace_orders     — service purchases (author → professional)
--   4. editorial_order_messages         — in-order messaging thread
--   5. editorial_order_deliverables     — files delivered by the professional
--   6. editorial_reviews                — author ratings of professionals
--   7. editorial_payments               — escrow-ready payment tracking
--   8. editorial_ai_matches             — AI recommendations of professionals
--
-- Depends on:
--   009_editorial_phase4a.sql   (editorial_projects, editorial_files)
--   001_schema.sql              (auth.users via Supabase Auth)
--
-- Does NOT modify any existing table.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS).
-- All user references go to auth.users, not profiles, so the marketplace
-- remains accessible to both staff and non-staff authors.
-- =============================================================================


-- ============================================================
-- 1. EDITORIAL PROFESSIONALS
-- ============================================================
-- One row per editorial professional (editor, proofreader, designer, etc.)
-- who offers services on the marketplace.
-- A professional can be any auth.users user — not limited to staff roles.
-- ============================================================

create table if not exists editorial_professionals (
  id                uuid        primary key default gen_random_uuid(),

  -- The Supabase Auth user behind this professional profile.
  user_id           uuid        not null references auth.users(id) on delete cascade,

  display_name      text        not null,
  bio               text,

  -- ISO-3166-1 alpha-2 country code (e.g. 'MX', 'ES', 'US')
  country           text,

  -- BCP-47 language tags (e.g. '{"es","en","fr"}')
  languages         text[],

  -- Service specialties (e.g. '{"corrección","maquetación","estilo"}')
  specialties       text[],

  portfolio_url     text,

  -- Verified by platform admins
  verified          boolean     not null default false,

  -- Aggregate rating computed from editorial_reviews; updated via trigger or service
  rating            numeric(3,2) not null default 0
                      check (rating >= 0 and rating <= 5),

  total_projects    integer     not null default 0
                      check (total_projects >= 0),

  created_at        timestamptz not null default now()
);

comment on table editorial_professionals is
  'Editorial professionals who offer services on the marketplace (editors, proofreaders, designers, etc.).';
comment on column editorial_professionals.user_id is
  'References auth.users. A professional can be any authenticated user.';
comment on column editorial_professionals.languages is
  'Array of BCP-47 language tags this professional works in.';
comment on column editorial_professionals.specialties is
  'Array of editorial specialties, e.g. corrección, estilo, maquetación, índice.';
comment on column editorial_professionals.rating is
  'Aggregate rating in [0, 5]; updated by the application after each review.';

create unique index if not exists idx_professionals_user_id
  on editorial_professionals(user_id);

create index if not exists idx_professionals_country
  on editorial_professionals(country);

create index if not exists idx_professionals_verified
  on editorial_professionals(verified)
  where verified = true;


-- ============================================================
-- 2. EDITORIAL SERVICE LISTINGS
-- ============================================================
-- A service offered by a professional — think of it as a "gig".
-- One professional can have many service listings across categories.
-- ============================================================

create table if not exists editorial_service_listings (
  id                uuid        primary key default gen_random_uuid(),

  professional_id   uuid        not null
                      references editorial_professionals(id) on delete cascade,

  title             text        not null,
  description       text,

  -- Service category (e.g. 'correction', 'style', 'layout', 'indexing')
  category          text        not null,

  -- Base price for the standard delivery tier
  price             numeric(12,2)
                      check (price is null or price >= 0),

  -- ISO-4217 currency code (e.g. 'USD', 'EUR', 'MXN')
  currency          text        not null default 'USD',

  -- Standard delivery commitment in calendar days
  delivery_days     integer
                      check (delivery_days is null or delivery_days > 0),

  -- False = hidden from the marketplace (draft or deactivated)
  active            boolean     not null default true,

  -- Aggregate rating from order reviews; updated by the application
  rating            numeric(3,2) not null default 0
                      check (rating >= 0 and rating <= 5),

  orders_count      integer     not null default 0
                      check (orders_count >= 0),

  created_at        timestamptz not null default now()
);

comment on table editorial_service_listings is
  'Services (gigs) offered by editorial professionals on the marketplace.';
comment on column editorial_service_listings.category is
  'Service category, e.g. correction, style_editing, proofreading, layout, indexing, translation.';
comment on column editorial_service_listings.active is
  'When false the listing is hidden from buyers but not deleted.';
comment on column editorial_service_listings.rating is
  'Aggregate rating in [0, 5]; updated by the application after each order review.';

create index if not exists idx_service_listings_professional
  on editorial_service_listings(professional_id);

create index if not exists idx_service_listings_category
  on editorial_service_listings(category);

create index if not exists idx_service_listings_active
  on editorial_service_listings(active)
  where active = true;

create index if not exists idx_service_listings_category_active
  on editorial_service_listings(category, active)
  where active = true;


-- ============================================================
-- 3. EDITORIAL MARKETPLACE ORDERS
-- ============================================================
-- The central transaction entity. One row per service purchase.
-- Directly linked to an editorial_project so the order becomes
-- part of the editorial pipeline.
-- ============================================================

create table if not exists editorial_marketplace_orders (
  id                uuid        primary key default gen_random_uuid(),

  -- Project this order serves (mandatory — marketplace is pipeline-integrated)
  project_id        uuid        not null
                      references editorial_projects(id) on delete restrict,

  -- The service being purchased
  service_id        uuid        not null
                      references editorial_service_listings(id) on delete restrict,

  -- The author/client who placed the order
  buyer_id          uuid        not null
                      references auth.users(id) on delete restrict,

  -- The professional fulfilling the order
  provider_id       uuid        not null
                      references auth.users(id) on delete restrict,

  -- Order lifecycle state machine
  status            text        not null default 'pending'
                      check (status in (
                        'pending',
                        'accepted',
                        'in_progress',
                        'delivered',
                        'revision_requested',
                        'completed',
                        'cancelled'
                      )),

  -- Price locked at order time (may differ from listing price if negotiated)
  price             numeric(12,2)
                      check (price is null or price >= 0),

  currency          text        not null default 'USD',

  -- Agreed delivery deadline
  delivery_date     timestamptz,

  created_at        timestamptz not null default now()
);

comment on table editorial_marketplace_orders is
  'Marketplace orders linking authors (buyers), professionals (providers), services, and editorial projects.';
comment on column editorial_marketplace_orders.project_id is
  'Every order is tied to an editorial_project, keeping it inside the editorial pipeline.';
comment on column editorial_marketplace_orders.status is
  'Lifecycle: pending → accepted → in_progress → delivered → (revision_requested →)* completed | cancelled.';
comment on column editorial_marketplace_orders.price is
  'Price locked at order creation. May differ from the listing price if agreed otherwise.';

create index if not exists idx_orders_project
  on editorial_marketplace_orders(project_id);

create index if not exists idx_orders_buyer
  on editorial_marketplace_orders(buyer_id);

create index if not exists idx_orders_provider
  on editorial_marketplace_orders(provider_id);

create index if not exists idx_orders_status
  on editorial_marketplace_orders(status);

create index if not exists idx_orders_buyer_status
  on editorial_marketplace_orders(buyer_id, status);

create index if not exists idx_orders_provider_status
  on editorial_marketplace_orders(provider_id, status);


-- ============================================================
-- 4. EDITORIAL ORDER MESSAGES
-- ============================================================
-- Threaded messaging between author and professional within an order.
-- Supports attachments (e.g. file references or external URLs stored as JSONB).
-- ============================================================

create table if not exists editorial_order_messages (
  id                uuid        primary key default gen_random_uuid(),

  order_id          uuid        not null
                      references editorial_marketplace_orders(id) on delete cascade,

  sender_id         uuid        not null
                      references auth.users(id) on delete restrict,

  message           text,

  -- JSONB array of attachment objects: [{name, url, type, size_bytes}]
  attachments       jsonb       not null default '[]',

  created_at        timestamptz not null default now(),

  -- At least one of message or attachments must be provided
  constraint chk_message_or_attachment
    check (
      (message is not null and trim(message) <> '')
      or jsonb_array_length(attachments) > 0
    )
);

comment on table editorial_order_messages is
  'Messaging thread between author and professional for an order.';
comment on column editorial_order_messages.attachments is
  'JSON array of {name, url, type, size_bytes} attachment descriptors.';

create index if not exists idx_order_messages_order
  on editorial_order_messages(order_id);

create index if not exists idx_order_messages_order_created
  on editorial_order_messages(order_id, created_at asc);


-- ============================================================
-- 5. EDITORIAL ORDER DELIVERABLES
-- ============================================================
-- Files delivered by the professional against an order.
-- Each delivery can be a new version (revision workflow).
-- Reuses editorial_files from Phase 4A for traceability.
-- ============================================================

create table if not exists editorial_order_deliverables (
  id                uuid        primary key default gen_random_uuid(),

  order_id          uuid        not null
                      references editorial_marketplace_orders(id) on delete cascade,

  -- Reference to the physical file already uploaded to the system (Phase 4A)
  file_id           uuid
                      references editorial_files(id) on delete set null,

  -- Monotonically increasing version counter per order (1 = initial delivery)
  version           integer     not null default 1
                      check (version >= 1),

  -- Optional delivery notes from the professional
  notes             text,

  created_at        timestamptz not null default now()
);

comment on table editorial_order_deliverables is
  'Files delivered by the professional. Each row represents one delivery iteration (version).';
comment on column editorial_order_deliverables.file_id is
  'References editorial_files; the file must already be uploaded before creating the deliverable.';
comment on column editorial_order_deliverables.version is
  'Delivery version number starting at 1. Incremented with each revision round.';

create index if not exists idx_order_deliverables_order
  on editorial_order_deliverables(order_id);

create index if not exists idx_order_deliverables_order_version
  on editorial_order_deliverables(order_id, version desc);


-- ============================================================
-- 6. EDITORIAL REVIEWS
-- ============================================================
-- Star ratings and comments left by authors (buyers) after
-- an order is completed. One review per completed order.
-- ============================================================

create table if not exists editorial_reviews (
  id                uuid        primary key default gen_random_uuid(),

  -- Only one review per order (enforced by unique constraint)
  order_id          uuid        not null unique
                      references editorial_marketplace_orders(id) on delete cascade,

  -- The author who placed the order and is leaving the review
  reviewer_id       uuid        not null
                      references auth.users(id) on delete restrict,

  -- The professional being reviewed
  provider_id       uuid        not null
                      references auth.users(id) on delete restrict,

  -- Integer 1–5 star rating
  rating            integer     not null
                      check (rating between 1 and 5),

  comment           text,

  created_at        timestamptz not null default now()
);

comment on table editorial_reviews is
  'Author reviews of professionals after an order is completed. One review per order.';
comment on column editorial_reviews.rating is
  'Integer star rating from 1 (worst) to 5 (best).';

create index if not exists idx_reviews_provider
  on editorial_reviews(provider_id);

create index if not exists idx_reviews_order
  on editorial_reviews(order_id);

create index if not exists idx_reviews_reviewer
  on editorial_reviews(reviewer_id);


-- ============================================================
-- 7. EDITORIAL PAYMENTS
-- ============================================================
-- Payment tracking with escrow support.
-- One payment row per order (1-to-1); complex split scenarios
-- can be modeled with additional rows if needed.
-- Actual payment processing is external — this table tracks state only.
-- ============================================================

create table if not exists editorial_payments (
  id                uuid        primary key default gen_random_uuid(),

  order_id          uuid        not null
                      references editorial_marketplace_orders(id) on delete restrict,

  amount            numeric(12,2)
                      check (amount is null or amount >= 0),

  currency          text        not null default 'USD',

  -- External payment provider name (e.g. 'stripe', 'paypal', 'manual')
  payment_provider  text,

  -- Provider-side transaction or payment-intent ID for reconciliation
  transaction_id    text,

  -- Payment lifecycle
  status            text        not null default 'pending'
                      check (status in (
                        'pending',
                        'escrow',
                        'released',
                        'refunded'
                      )),

  -- Timestamp when escrow funds were released to the professional
  released_at       timestamptz,

  created_at        timestamptz not null default now()
);

comment on table editorial_payments is
  'Payment tracking for marketplace orders. Supports escrow lifecycle: pending → escrow → released | refunded.';
comment on column editorial_payments.status is
  'Lifecycle: pending (intent created) → escrow (funds held) → released (paid out) | refunded.';
comment on column editorial_payments.transaction_id is
  'Provider-side ID (e.g. Stripe PaymentIntent ID) used for reconciliation.';
comment on column editorial_payments.released_at is
  'Set when funds leave escrow and are paid out to the professional.';

create index if not exists idx_payments_order
  on editorial_payments(order_id);

create index if not exists idx_payments_status
  on editorial_payments(status);

create index if not exists idx_payments_transaction
  on editorial_payments(transaction_id)
  where transaction_id is not null;


-- ============================================================
-- 8. EDITORIAL AI MATCHES
-- ============================================================
-- AI-generated recommendations that suggest professionals
-- for a given editorial project based on match_score.
-- Each row represents one professional recommendation for one project.
-- ============================================================

create table if not exists editorial_ai_matches (
  id                uuid        primary key default gen_random_uuid(),

  project_id        uuid        not null
                      references editorial_projects(id) on delete cascade,

  professional_id   uuid        not null
                      references editorial_professionals(id) on delete cascade,

  -- Normalised match score in [0, 1]; higher is better
  match_score       numeric(5,4) not null default 0
                      check (match_score >= 0 and match_score <= 1),

  -- Human-readable explanation of why this professional was matched
  reason            text,

  created_at        timestamptz not null default now(),

  -- Prevent duplicate recommendations for the same (project, professional) pair
  unique (project_id, professional_id)
);

comment on table editorial_ai_matches is
  'AI-generated professional recommendations for editorial projects. One row per (project, professional) pair.';
comment on column editorial_ai_matches.match_score is
  'Normalised score in [0, 1]. Higher values indicate a stronger match.';
comment on column editorial_ai_matches.reason is
  'Human-readable explanation produced by the AI recommender.';

create index if not exists idx_ai_matches_project
  on editorial_ai_matches(project_id);

create index if not exists idx_ai_matches_professional
  on editorial_ai_matches(professional_id);

create index if not exists idx_ai_matches_project_score
  on editorial_ai_matches(project_id, match_score desc);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- All marketplace tables use auth.uid() directly because professionals and
-- authors may not be staff (no profiles.role check needed here).
-- Staff roles can still access these via the service-role key.
-- =============================================================================

alter table editorial_professionals         enable row level security;
alter table editorial_service_listings      enable row level security;
alter table editorial_marketplace_orders    enable row level security;
alter table editorial_order_messages        enable row level security;
alter table editorial_order_deliverables    enable row level security;
alter table editorial_reviews               enable row level security;
alter table editorial_payments              enable row level security;
alter table editorial_ai_matches            enable row level security;


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: editorial_professionals
-- ────────────────────────────────────────────────────────────────────────────

-- Any authenticated user can view professional profiles (marketplace browse)
drop policy if exists "anyone can view professionals"    on editorial_professionals;
create policy "anyone can view professionals"
  on editorial_professionals
  for select
  using (auth.uid() is not null);

-- Professionals manage only their own profile
drop policy if exists "professionals manage own profile"  on editorial_professionals;
create policy "professionals manage own profile"
  on editorial_professionals
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Platform staff can manage any profile (uses service role; no user-facing policy needed)


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: editorial_service_listings
-- ────────────────────────────────────────────────────────────────────────────

-- Any authenticated user can view active listings
drop policy if exists "anyone can view active listings"   on editorial_service_listings;
create policy "anyone can view active listings"
  on editorial_service_listings
  for select
  using (
    auth.uid() is not null
    and active = true
  );

-- Professionals can view all their own listings (including inactive)
drop policy if exists "professionals view own listings"   on editorial_service_listings;
create policy "professionals view own listings"
  on editorial_service_listings
  for select
  using (
    exists (
      select 1 from editorial_professionals p
      where p.id = editorial_service_listings.professional_id
        and p.user_id = auth.uid()
    )
  );

-- Professionals can insert/update/delete only their own listings
drop policy if exists "professionals manage own listings" on editorial_service_listings;
create policy "professionals manage own listings"
  on editorial_service_listings
  for all
  using (
    exists (
      select 1 from editorial_professionals p
      where p.id = editorial_service_listings.professional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from editorial_professionals p
      where p.id = editorial_service_listings.professional_id
        and p.user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 3: editorial_marketplace_orders
-- ────────────────────────────────────────────────────────────────────────────

-- Buyers can view their own orders
drop policy if exists "buyers view own orders"    on editorial_marketplace_orders;
create policy "buyers view own orders"
  on editorial_marketplace_orders
  for select
  using (buyer_id = auth.uid());

-- Providers can view orders assigned to them
drop policy if exists "providers view own orders" on editorial_marketplace_orders;
create policy "providers view own orders"
  on editorial_marketplace_orders
  for select
  using (provider_id = auth.uid());

-- Buyers can create orders (placing a purchase)
drop policy if exists "buyers create orders"      on editorial_marketplace_orders;
create policy "buyers create orders"
  on editorial_marketplace_orders
  for insert
  with check (buyer_id = auth.uid());

-- Providers can update order status (accept, mark in_progress, deliver)
drop policy if exists "providers update order status" on editorial_marketplace_orders;
create policy "providers update order status"
  on editorial_marketplace_orders
  for update
  using (provider_id = auth.uid());

-- Buyers can update order status (request revision, mark completed, cancel)
drop policy if exists "buyers update order status"    on editorial_marketplace_orders;
create policy "buyers update order status"
  on editorial_marketplace_orders
  for update
  using (buyer_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 4: editorial_order_messages
-- ────────────────────────────────────────────────────────────────────────────

-- Order participants (buyer or provider) can read messages
drop policy if exists "order participants read messages"   on editorial_order_messages;
create policy "order participants read messages"
  on editorial_order_messages
  for select
  using (
    exists (
      select 1 from editorial_marketplace_orders o
      where o.id = editorial_order_messages.order_id
        and (o.buyer_id = auth.uid() or o.provider_id = auth.uid())
    )
  );

-- Order participants can send messages (sender must be themselves)
drop policy if exists "order participants send messages"   on editorial_order_messages;
create policy "order participants send messages"
  on editorial_order_messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from editorial_marketplace_orders o
      where o.id = editorial_order_messages.order_id
        and (o.buyer_id = auth.uid() or o.provider_id = auth.uid())
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 5: editorial_order_deliverables
-- ────────────────────────────────────────────────────────────────────────────

-- Order participants can view deliverables
drop policy if exists "order participants view deliverables"   on editorial_order_deliverables;
create policy "order participants view deliverables"
  on editorial_order_deliverables
  for select
  using (
    exists (
      select 1 from editorial_marketplace_orders o
      where o.id = editorial_order_deliverables.order_id
        and (o.buyer_id = auth.uid() or o.provider_id = auth.uid())
    )
  );

-- Only the provider can submit deliverables
drop policy if exists "providers submit deliverables"          on editorial_order_deliverables;
create policy "providers submit deliverables"
  on editorial_order_deliverables
  for insert
  with check (
    exists (
      select 1 from editorial_marketplace_orders o
      where o.id = editorial_order_deliverables.order_id
        and o.provider_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 6: editorial_reviews
-- ────────────────────────────────────────────────────────────────────────────

-- Anyone authenticated can read reviews (public reputation data)
drop policy if exists "anyone reads reviews"    on editorial_reviews;
create policy "anyone reads reviews"
  on editorial_reviews
  for select
  using (auth.uid() is not null);

-- Only the buyer of the completed order can create the review
drop policy if exists "buyers create reviews"   on editorial_reviews;
create policy "buyers create reviews"
  on editorial_reviews
  for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from editorial_marketplace_orders o
      where o.id = editorial_reviews.order_id
        and o.buyer_id = auth.uid()
        and o.status = 'completed'
    )
  );

-- Reviewers can update (edit) their own review
drop policy if exists "reviewers update own review" on editorial_reviews;
create policy "reviewers update own review"
  on editorial_reviews
  for update
  using (reviewer_id = auth.uid());


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 7: editorial_payments
-- ────────────────────────────────────────────────────────────────────────────

-- Order participants can view payment info for their orders
drop policy if exists "order participants view payments"  on editorial_payments;
create policy "order participants view payments"
  on editorial_payments
  for select
  using (
    exists (
      select 1 from editorial_marketplace_orders o
      where o.id = editorial_payments.order_id
        and (o.buyer_id = auth.uid() or o.provider_id = auth.uid())
    )
  );

-- Payment writes are handled exclusively via service role (webhook, backend).
-- No user-facing insert/update policy — intentional for security.


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 8: editorial_ai_matches
-- ────────────────────────────────────────────────────────────────────────────

-- Only the project's buyer can view AI match recommendations for their project.
-- Staff can also view matches via service role.
drop policy if exists "buyers view own project matches"    on editorial_ai_matches;
create policy "buyers view own project matches"
  on editorial_ai_matches
  for select
  using (
    exists (
      select 1 from editorial_marketplace_orders o
      where o.project_id = editorial_ai_matches.project_id
        and o.buyer_id = auth.uid()
    )
    -- Also allow viewing if the user owns the project directly
    -- (before any order exists, e.g. during initial recommendation)
    or exists (
      select 1 from editorial_projects ep
      where ep.id = editorial_ai_matches.project_id
        and ep.created_by = auth.uid()
    )
  );

-- AI match writes are handled exclusively via service role.


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
