-- =============================================================================
-- LEADERFORGE CORE SCHEMA - CURRENT STATE
-- Generated from live Supabase database: 2025-01-27
-- =============================================================================
-- This file documents the ACTUAL current state of the core schema
-- DO NOT rely on legacy .sql files in the root directory
-- =============================================================================

-- =============================================================================
-- TENANTS & ACCESS CONTROL
-- =============================================================================

-- Core tenant configuration (migrated from context_configs)
CREATE TABLE core.tenants (
    tenant_key text PRIMARY KEY,
    name text NOT NULL,
    display_name text NOT NULL,
    subtitle text,
    description text,
    theme jsonb NOT NULL,
    i18n jsonb,
    logo_url text,
    nav_options jsonb,
    settings jsonb,
    config jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tenant access policies
CREATE TABLE core.tenant_access_policies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_key text NOT NULL,
    required_entitlements text[] NOT NULL,
    access_mode text DEFAULT 'any',
    additional_rules jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_tenant_policy UNIQUE (tenant_key)
);

-- =============================================================================
-- AGENTS & NAVIGATION
-- =============================================================================

-- Agent definitions (supports type="mockup" for our system!)
CREATE TABLE core.agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_name text,
    type text NOT NULL, -- "langgraph", "claude", "mockup", etc.
    prompt text,
    tools jsonb,
    model text,
    parameters jsonb,
    config jsonb,
    enabled boolean DEFAULT true,
    description text,
    version integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Navigation options (connects to agents via agent_id)
CREATE TABLE core.nav_options (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    label text NOT NULL,
    icon text,
    description text,
    "order" integer,
    nav_key text,
    agent_prompt text,
    schema_hint jsonb,
    agent_id uuid REFERENCES core.agents(id),
    required_entitlements text[] DEFAULT ARRAY[]::text[],
    section text,
    section_order integer DEFAULT 0,
    tenant_key text NOT NULL REFERENCES core.tenants(tenant_key),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- ENTITLEMENTS & ACCESS CONTROL (Perfect for Mockup Access!)
-- =============================================================================

-- Entitlement definitions
CREATE TABLE core.entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE, -- e.g., "mockup-access"
    display_name text NOT NULL,
    description text,
    features jsonb DEFAULT '{}', -- e.g., {"mockup": true}
    limits jsonb DEFAULT '{}',
    access_rules jsonb DEFAULT '{}',
    price_monthly numeric(10,2),
    price_annual numeric(10,2),
    currency text DEFAULT 'USD',
    active boolean DEFAULT true,
    tenant_key text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User entitlements (controls who can access mockups)
CREATE TABLE core.user_entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.users(id),
    entitlement_id uuid NOT NULL REFERENCES core.entitlements(id),
    org_entitlement_id uuid REFERENCES core.org_entitlements(id),
    granted_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    revoked_at timestamptz,
    granted_by uuid REFERENCES core.users(id),
    grant_reason text,
    revoke_reason text,
    first_used_at timestamptz,
    last_used_at timestamptz,
    usage_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    CONSTRAINT unique_active_entitlement UNIQUE (user_id, entitlement_id) WHERE (revoked_at IS NULL)
);

-- Organization entitlements
CREATE TABLE core.org_entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES core.organizations(id),
    entitlement_id uuid NOT NULL REFERENCES core.entitlements(id),
    quantity integer DEFAULT 1,
    allocated integer DEFAULT 0,
    granted_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    auto_renew boolean DEFAULT false,
    granted_by uuid REFERENCES core.users(id),
    purchase_order text,
    billing_reference text,
    status text DEFAULT 'active'
);

-- =============================================================================
-- USERS & ORGANIZATIONS
-- =============================================================================

-- Users (extends Supabase auth.users)
CREATE TABLE core.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL UNIQUE,
    full_name text,
    first_name text,
    last_name text,
    avatar_url text,
    enabled_modules text[] DEFAULT ARRAY['brilliant-movement'],
    current_module text DEFAULT 'brilliant-movement',
    preferences jsonb DEFAULT '{}',
    timezone text DEFAULT 'UTC',
    language text DEFAULT 'en',
    status user_status DEFAULT 'active',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_login_at timestamptz,
    deleted_at timestamptz,
    -- Additional Supabase auth fields exist but not relevant for app logic
    phone text,
    instance_id uuid,
    aud character varying(255),
    role character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamptz,
    invited_at timestamptz,
    confirmation_token character varying(255),
    confirmation_sent_at timestamptz,
    recovery_token character varying(255),
    recovery_sent_at timestamptz,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    phone_confirmed_at timestamptz,
    phone_change text,
    phone_change_token character varying(255),
    phone_change_sent_at timestamptz,
    confirmed_at timestamptz,
    email_change_token_current character varying(255),
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamptz,
    reauthentication_token character varying(255),
    reauthentication_sent_at timestamptz,
    is_sso_user boolean DEFAULT false,
    is_anonymous boolean DEFAULT false
);

-- Organizations (hierarchical structure)
CREATE TABLE core.organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    display_name text NOT NULL,
    org_type text NOT NULL,
    parent_org_id uuid REFERENCES core.organizations(id),
    level integer DEFAULT 0,
    path text[] DEFAULT ARRAY[]::text[],
    module_id text NOT NULL,
    settings jsonb DEFAULT '{}',
    features jsonb DEFAULT '{}',
    branding jsonb DEFAULT '{}',
    contact_email text,
    contact_phone text,
    address jsonb,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES core.users(id)
);

-- User-Organization relationships
CREATE TABLE core.user_organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.users(id),
    org_id uuid NOT NULL REFERENCES core.organizations(id),
    role text NOT NULL,
    permissions jsonb DEFAULT '{}',
    status invitation_status DEFAULT 'pending',
    invited_at timestamptz DEFAULT now(),
    invited_by uuid REFERENCES core.users(id),
    joined_at timestamptz,
    left_at timestamptz,
    metadata jsonb DEFAULT '{}',
    CONSTRAINT unique_user_org UNIQUE (user_id, org_id)
);

-- =============================================================================
-- USER PROGRESS & CONTENT
-- =============================================================================

-- User progress tracking (migrated to use tenant_key)
CREATE TABLE core.user_progress (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.users(id),
    content_id text NOT NULL,
    tenant_key text NOT NULL, -- Migrated from context_key
    progress_type text NOT NULL DEFAULT 'video',
    progress_percentage integer DEFAULT 0,
    completion_count integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    started_at timestamptz DEFAULT now(),
    last_viewed_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    notes text,
    metadata jsonb DEFAULT '{}',
    sync_status sync_status DEFAULT 'synced',
    last_synced_at timestamptz DEFAULT now(),
    CONSTRAINT user_progress_user_content_tenant_unique UNIQUE (user_id, content_id, tenant_key)
);

-- Content access policies
CREATE TABLE core.content_access_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id text NOT NULL,
    context_key text NOT NULL, -- Note: still uses context_key for content
    required_entitlements text[] DEFAULT '{}',
    prerequisite_content_ids text[] DEFAULT '{}',
    ab_test_group text,
    access_mode text DEFAULT 'any',
    additional_rules jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- CONVERSATIONS & COPILOT
-- =============================================================================

-- Conversations
CREATE TABLE core.conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.users(id),
    tenant_key text NOT NULL,
    status text DEFAULT 'active',
    last_message_at timestamptz,
    message_count integer DEFAULT 0,
    active_agent_id text,
    title text,
    summary text,
    tags text[],
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Conversation events
CREATE TABLE core.conversation_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid NOT NULL REFERENCES core.conversations(id),
    user_id uuid NOT NULL REFERENCES core.users(id),
    tenant_key text NOT NULL,
    event_type text NOT NULL,
    actor_type text NOT NULL,
    actor_id text NOT NULL,
    payload jsonb NOT NULL,
    sequence_number bigint NOT NULL DEFAULT nextval('core.conversation_events_sequence_number_seq'),
    session_id uuid,
    device_info jsonb,
    ip_address inet,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_sequence UNIQUE (conversation_id, sequence_number)
);

-- =============================================================================
-- SUPPORTING TABLES
-- =============================================================================

-- Component layouts (for dynamic UI)
CREATE TABLE core.component_layout (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES core.users(id),
    context_key text NOT NULL, -- Still uses context_key
    nav_option_id uuid,
    layout jsonb NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- UI layouts
CREATE TABLE core.ui_layouts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_key text,
    nav_option_id uuid REFERENCES core.nav_options(id),
    schema jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- A/B testing
CREATE TABLE core.ab_test_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES core.users(id),
    experiment_key text NOT NULL,
    group_name text NOT NULL,
    assigned_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'
);

-- Email validations
CREATE TABLE core.email_validations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    validation_type text NOT NULL,
    user_id uuid REFERENCES core.users(id),
    org_id uuid REFERENCES core.organizations(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '24 hours'),
    validated_at timestamptz,
    attempts integer DEFAULT 0,
    ip_address inet,
    user_agent text
);

-- Entitlement audit log
CREATE TABLE core.entitlement_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES core.users(id),
    org_id uuid REFERENCES core.organizations(id),
    entitlement_id uuid REFERENCES core.entitlements(id),
    action text NOT NULL,
    performed_by uuid REFERENCES core.users(id),
    reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- MOCKUP SYSTEM IMPLEMENTATION SUMMARY
-- =============================================================================
--
-- ✅ PERFECT ARCHITECTURE FOR AGENT-NATIVE MOCKUPS:
--
-- 1. AGENT SYSTEM READY:
--    - core.agents table has 'type' field → can use type="mockup"
--    - core.nav_options.agent_id → nav links to agents
--    - Existing flow: nav_option → agent_id → agent dispatcher
--
-- 2. ENTITLEMENT ACCESS CONTROL READY:
--    - core.entitlements.features → {"mockup": true}
--    - core.user_entitlements → admin-controllable access
--    - No hardcoded user arrays needed!
--
-- 3. TENANT MIGRATION COMPLETE:
--    - core.tenants (was context_configs) ✅
--    - core.user_progress.tenant_key ✅
--    - core.nav_options.tenant_key ✅
--    - Legacy context references only in: content_access_policies, component_layout
--
-- 4. IMPLEMENTATION PLAN:
--    a) Create mockup entitlement:
--       INSERT INTO core.entitlements (name, features) VALUES ('mockup-access', '{"mockup": true}')
--    b) Grant entitlement to users via core.user_entitlements
--    c) Create mockup agent:
--       INSERT INTO core.agents (type, name) VALUES ('mockup', 'Marcus Dashboard Mockup')
--    d) Create nav option linking to mockup agent
--    e) Add agent dispatcher case for type="mockup" → render JSX component
--
-- This leverages the existing agent-native architecture perfectly!
-- =============================================================================