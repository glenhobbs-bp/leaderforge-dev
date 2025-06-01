# Database Setup Addendum
*Addendum to LeaderForge Master Technical Specification v2.0*
*Created: January 2025*

## 📋 Purpose

This addendum provides complete database schema creation scripts, initial data seeding, and development fixtures for the LeaderForge platform. Since this is a **net new platform** with no migration from existing systems, all scripts focus on fresh database creation.

**Reference**: LeaderForge Master Technical Specification v2.0 - Database Architecture

---

## 🗄️ Complete Database Schema Creation

### 1. Core Schema Setup

```sql
-- schema-setup.sql
-- Initialize database with extensions and schemas

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS modules;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default permissions
GRANT USAGE ON SCHEMA core TO authenticated;
GRANT USAGE ON SCHEMA modules TO authenticated;
GRANT USAGE ON SCHEMA analytics TO authenticated;

-- Create enum types
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict', 'failed');
```

### 2. Core Tables Creation

```sql
-- core-tables.sql
-- Core user and organization tables

-- Users table with multi-context support
CREATE TABLE core.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Module access
  enabled_modules TEXT[] DEFAULT ARRAY['brilliant-movement'],
  current_module TEXT DEFAULT 'brilliant-movement',

  -- Preferences and settings
  preferences JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',

  -- Status and metadata
  status user_status DEFAULT 'active',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_current_module CHECK (
    current_module = ANY(enabled_modules)
  ),
  CONSTRAINT valid_email CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Indexes for users
CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_status ON core.users(status) WHERE status = 'active';
CREATE INDEX idx_users_modules ON core.users USING GIN(enabled_modules);
CREATE INDEX idx_users_updated ON core.users(updated_at);

-- Organizations with flexible hierarchy
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  org_type TEXT NOT NULL, -- 'company', 'team', 'church', 'small_group', etc.

  -- Hierarchy
  parent_org_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  path TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of org IDs from root

  -- Module context
  module_id TEXT NOT NULL,

  -- Settings and configuration
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',

  -- Contact info
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id)
);

-- Indexes for organizations
CREATE INDEX idx_org_parent ON core.organizations(parent_org_id);
CREATE INDEX idx_org_path ON core.organizations USING GIN(path);
CREATE INDEX idx_org_module ON core.organizations(module_id);
CREATE INDEX idx_org_status ON core.organizations(status) WHERE status = 'active';
CREATE INDEX idx_org_type ON core.organizations(org_type, module_id);

-- User organization membership
CREATE TABLE core.user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Role and permissions
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{}',

  -- Status and invitation flow
  status invitation_status DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES core.users(id),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT unique_user_org UNIQUE (user_id, org_id),
  CONSTRAINT valid_join_date CHECK (
    joined_at IS NULL OR joined_at >= invited_at
  )
);

-- Indexes for user organizations
CREATE INDEX idx_user_org_user ON core.user_organizations(user_id);
CREATE INDEX idx_user_org_org ON core.user_organizations(org_id);
CREATE INDEX idx_user_org_status ON core.user_organizations(status);
CREATE INDEX idx_user_org_role ON core.user_organizations(role);
```

### 3. Entitlements System

```
-- NOTE: PostgreSQL does not support partial unique constraints in CREATE TABLE. Use a unique index with WHERE after table creation.

-- Entitlement definitions
CREATE TABLE core.entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  context_key TEXT NOT NULL,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  access_rules JSONB DEFAULT '{}',
  price_monthly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entitlements_context ON core.entitlements(context_key);
CREATE INDEX idx_entitlements_active ON core.entitlements(active) WHERE active = true;

-- Organization entitlements (purchased/allocated)
CREATE TABLE core.org_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES core.entitlements(id),
  quantity INTEGER DEFAULT 1,
  allocated INTEGER DEFAULT 0,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES core.users(id),
  purchase_order TEXT,
  billing_reference TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')),
  CONSTRAINT check_allocation CHECK (allocated <= quantity),
  CONSTRAINT check_positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_org_entitlements_org ON core.org_entitlements(org_id);
CREATE INDEX idx_org_entitlements_entitlement ON core.org_entitlements(entitlement_id);
CREATE INDEX idx_org_entitlements_status ON core.org_entitlements(status);
CREATE INDEX idx_org_entitlements_expires ON core.org_entitlements(expires_at) WHERE expires_at IS NOT NULL;

-- User entitlements (individual licenses)
DROP TABLE IF EXISTS core.user_entitlements CASCADE;
CREATE TABLE core.user_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES core.entitlements(id),
  org_entitlement_id UUID REFERENCES core.org_entitlements(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  granted_by UUID REFERENCES core.users(id),
  grant_reason TEXT,
  revoke_reason TEXT,
  first_used_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Add partial unique index for active entitlements
CREATE UNIQUE INDEX unique_active_entitlement
  ON core.user_entitlements (user_id, entitlement_id)
  WHERE revoked_at IS NULL;

-- Index for non-revoked entitlements (time-based filtering should be done in queries, not in the index)
CREATE INDEX idx_user_entitlements_active
  ON core.user_entitlements(user_id, entitlement_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_user_entitlements_user ON core.user_entitlements(user_id);
CREATE INDEX idx_user_entitlements_entitlement ON core.user_entitlements(entitlement_id);
CREATE INDEX idx_user_entitlements_org ON core.user_entitlements(org_entitlement_id);

-- Email validation for secure provisioning
CREATE TABLE core.email_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Purpose and type
  validation_type TEXT NOT NULL CHECK (validation_type IN (
    'user_invite',
    'org_invite',
    'email_change',
    'magic_link',
    'password_reset'
  )),

  -- Related entities
  user_id UUID REFERENCES core.users(id),
  org_id UUID REFERENCES core.organizations(id),
  metadata JSONB DEFAULT '{}',

  -- Status and timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  validated_at TIMESTAMPTZ,

  -- Security tracking
  attempts INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,

  CONSTRAINT max_attempts CHECK (attempts <= 5)
);

-- Indexes for email validations
CREATE INDEX idx_email_validation_token ON core.email_validations(token);
CREATE INDEX idx_email_validation_email ON core.email_validations(email);
CREATE INDEX idx_email_validation_expires ON core.email_validations(expires_at) WHERE validated_at IS NULL;
```

### 4. Content and Progress Tables

-- NOTE: The schema for the media/content library remains 'modules' (e.g., modules.content, modules.user_progress) as this refers to code/data modules, not business 'contexts'. All business logic columns use 'context'/'contexts'.

-- Content library
CREATE TABLE IF NOT EXISTS modules.content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'audio', 'document', 'course', 'live_session')),
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  transcript_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  available_contexts TEXT[] NOT NULL,
  categories JSONB DEFAULT '{}',
  tags TEXT[],
  instructor_name TEXT,
  instructor_id UUID,
  source_platform TEXT,
  external_id TEXT,
  search_vector tsvector,
  embedding vector(1536),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES core.users(id),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'context', 'organization', 'private')),
  parent_content_id UUID REFERENCES modules.content(id),
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_contexts ON modules.content USING GIN(available_contexts);
CREATE INDEX IF NOT EXISTS idx_content_search ON modules.content USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_content_embedding ON modules.content USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_content_published ON modules.content(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_type ON modules.content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_instructor ON modules.content(instructor_name);
CREATE INDEX IF NOT EXISTS idx_content_parent ON modules.content(parent_content_id);

-- User progress tracking
CREATE TABLE IF NOT EXISTS modules.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES modules.content(id) ON DELETE CASCADE,
  context_key TEXT NOT NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  watch_time_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  current_session_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  bookmarks JSONB DEFAULT '[]',
  sync_status sync_status DEFAULT 'synced',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_content_context UNIQUE (user_id, content_id, context_key),
  CONSTRAINT valid_position CHECK (last_position_seconds >= 0),
  CONSTRAINT valid_watch_time CHECK (watch_time_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON modules.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content ON modules.user_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_context ON modules.user_progress(context_key);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON modules.user_progress(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_progress_sync ON modules.user_progress(sync_status) WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_user_progress_active ON modules.user_progress(user_id, last_viewed_at) WHERE completed_at IS NULL;

### 5. Conversation and Analytics Tables

```sql
-- conversations-analytics.sql
-- Event-sourced conversations and analytics

-- Conversation events (append-only for agent interactions)
CREATE TABLE IF NOT EXISTS core.conversation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES core.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'conversation_started', 'message_sent', 'message_received',
    'agent_switched', 'context_changed', 'action_performed',
    'error_occurred', 'conversation_ended'
  )),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  context_key TEXT NOT NULL,
  session_id UUID,
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sequence_number BIGSERIAL,
  CONSTRAINT unique_sequence UNIQUE (conversation_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_conversation_events_conv ON core.conversation_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_events_user ON core.conversation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_events_created ON core.conversation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_events_type ON core.conversation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversation_events_context ON core.conversation_events(context_key);

-- Conversation metadata (mutable summary)
CREATE TABLE IF NOT EXISTS core.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  context_key TEXT NOT NULL,
  active_agent_id TEXT,
  title TEXT,
  summary TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON core.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON core.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON core.conversations(context_key);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON core.conversations(updated_at);

-- Learning analytics events
CREATE TABLE IF NOT EXISTS analytics.learning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  context_key TEXT NOT NULL,
  content_id UUID,
  duration_seconds INTEGER,
  score DECIMAL(5,2),
  session_id UUID,
  device_type TEXT,
  browser TEXT,
  ip_address INET,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_events_user ON analytics.learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON analytics.learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_learning_events_context ON analytics.learning_events(context_key);
CREATE INDEX IF NOT EXISTS idx_learning_events_created ON analytics.learning_events(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_events_content ON analytics.learning_events(content_id);
```

---

## 🌱 Initial Data Seeding

-- NOTE: In all initial data seeding, 'context'/'contexts' is used for business logic columns, keys, and comments. 'module' is retained only for code/data module schemas or where required by external systems (e.g., video library). 'trainingModules' is correct and unchanged.

### 1. Core Entitlements Seeding

```sql
-- seed-entitlements.sql
-- Initial entitlements for all modules

INSERT INTO core.entitlements (name, display_name, description, context_key, features, price_monthly, price_annual) VALUES
-- Brilliant Movement entitlements
('movement-member', 'Movement Member', 'Full access to Brilliant Movement platform', 'brilliant-movement',
 '{"brilliantPlus": true, "gatherings": true, "smallGroups": true, "events": true}', 47.00, 397.00),
('movement-ambassador', 'Movement Ambassador', 'Ambassador access with commission tracking', 'brilliant-movement',
 '{"canPromote": true, "referralTracking": true, "commissionAccess": true}', null, 10.00),

-- LeaderForge entitlements
('leaderforge-basic', 'LeaderForge Basic', 'Basic business leadership training', 'leaderforge-business',
 '{"trainingModules": true, "basicDashboard": true}', 99.00, 999.00),
('leaderforge-premium', 'LeaderForge Premium', 'Advanced leadership training with team features', 'leaderforge-business',
 '{"trainingModules": true, "teamDashboard": true, "boldActions": true, "analytics": true}', 199.00, 1999.00),
('ceo-inner-circle', 'CEO Inner Circle', 'Executive leadership circle with personal coaching', 'leaderforge-business',
 '{"allFeatures": true, "personalCoaching": true, "executiveSessions": true}', 1500.00, 15000.00),

-- Wealth with God entitlements
('wealth-basic', 'Wealth Basic', 'Biblical financial stewardship basics', 'wealth-with-god',
 '{"basicContent": true, "budgetTools": true}', 29.00, 297.00),
('wealth-premium', 'Wealth Premium', 'Advanced wealth building with personal guidance', 'wealth-with-god',
 '{"allContent": true, "personalGuidance": true, "advancedTools": true}', 97.00, 997.00),
('wealth-partner', 'Wealth Partner', 'Partner access for financial advisors', 'wealth-with-god',
 '{"clientManagement": true, "advisorTools": true, "whiteLabel": true}', 197.00, 1997.00),

-- Brilliant School entitlements
('bsol-student', 'BSOL Student', 'Brilliant School of Leadership student access', 'brilliant-school',
 '{"curriculum": true, "assignments": true, "cohortAccess": true}', 999.00, 6997.00),
('bsol-graduate', 'BSOL Graduate', 'Graduate access to resources and community', 'brilliant-school',
 '{"graduateResources": true, "mentorNetwork": true, "continuingEducation": true}', null, null),

-- Small Group entitlements
('smallgroup-member', 'Small Group Member', 'Small group participation access', 'small-group-hub',
 '{"groupAccess": true, "studies": true, "events": true}', 19.00, 197.00),
('smallgroup-leader', 'Small Group Leader', 'Small group leadership tools and training', 'small-group-hub',
 '{"leaderTools": true, "facilitationGuides": true, "groupManagement": true}', 47.00, 397.00);
```

### 2. Module Access Policies

```sql
-- seed-module-policies.sql
-- Define which entitlements grant access to which modules

INSERT INTO core.module_access_policies (module_id, required_entitlements, access_mode) VALUES
('brilliant-movement', ARRAY['movement-member', 'movement-ambassador'], 'any'),
('leaderforge-business', ARRAY['leaderforge-basic', 'leaderforge-premium', 'ceo-inner-circle'], 'any'),
('wealth-with-god', ARRAY['wealth-basic', 'wealth-premium', 'wealth-partner'], 'any'),
('brilliant-school', ARRAY['bsol-student', 'bsol-graduate'], 'any'),
('small-group-hub', ARRAY['smallgroup-member', 'smallgroup-leader'], 'any');
```

### 3A. Context Access Policies (Replaces Module Access Policies for Business Logic)

-- NOTE: This section introduces context-based access policies for business logic, replacing previous module-based access policies.

-- Context access policies
CREATE TABLE core.context_access_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_key TEXT NOT NULL,
  required_entitlements TEXT[] NOT NULL,
  access_mode TEXT CHECK (access_mode IN ('any', 'all')) DEFAULT 'any',
  additional_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_context_policy UNIQUE (context_key)
);

-- Seeding context access policies
INSERT INTO core.context_access_policies (context_key, required_entitlements, access_mode) VALUES
('brilliant-movement', ARRAY['movement-member', 'movement-ambassador'], 'any'),
('leaderforge-business', ARRAY['leaderforge-basic', 'leaderforge-premium', 'ceo-inner-circle'], 'any'),
('wealth-with-god', ARRAY['wealth-basic', 'wealth-premium', 'wealth-partner'], 'any'),
('brilliant-school', ARRAY['bsol-student', 'bsol-graduate'], 'any'),
('small-group-hub', ARRAY['smallgroup-member', 'smallgroup-leader'], 'any');

-- Function to check context access
CREATE OR REPLACE FUNCTION core.user_can_access_context(
  p_user_id UUID,
  p_context_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_required_entitlements TEXT[];
  v_access_mode TEXT;
  v_has_access BOOLEAN := FALSE;
BEGIN
  -- Get context requirements
  SELECT required_entitlements, access_mode
  INTO v_required_entitlements, v_access_mode
  FROM core.context_access_policies
  WHERE context_key = p_context_key;

  -- No policy means open access
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Check entitlements based on mode
  IF v_access_mode = 'any' THEN
    SELECT EXISTS (
      SELECT 1
      FROM unnest(v_required_entitlements) AS required
      WHERE core.user_has_entitlement(p_user_id, required)
    ) INTO v_has_access;
  ELSE
    SELECT NOT EXISTS (
      SELECT 1
      FROM unnest(v_required_entitlements) AS required
      WHERE NOT core.user_has_entitlement(p_user_id, required)
    ) INTO v_has_access;
  END IF;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- (Optional) You may now deprecate or drop the old module_access_policies and user_can_access_module if not needed for code modules.

### 3. Sample Content

```sql
-- seed-content.sql
-- Sample content for development and testing

INSERT INTO modules.content (title, description, content_type, available_contexts, categories, instructor_name, duration_seconds, published_at) VALUES
-- Brilliant Movement content
('Welcome to Your New Nature', 'Introduction to New Creation theology and your identity in Christ', 'video',
 ARRAY['brilliant-movement'], '{"movement": ["identity", "foundation"]}', 'Graham Cooke', 1200, NOW()),
('Kingdom Routines: Reset to Rest', 'Learn how to reset to rest when anxiety and stress arise', 'video',
 ARRAY['brilliant-movement'], '{"movement": ["routines", "rest"]}', 'Graham Cooke', 900, NOW()),
('The Exchange Store', 'Understanding God''s divine exchanges for every negative situation', 'video',
 ARRAY['brilliant-movement'], '{"movement": ["routines", "exchange"]}', 'Graham Cooke', 1500, NOW()),

-- LeaderForge content
('Module 1: A Team of Leaders', 'Introduction to creating teams where everyone leads', 'video',
 ARRAY['leaderforge-business'], '{"leaderforge": ["leadership", "teams"]}', 'Dionne van Zyl', 2400, NOW()),
('Clarity and Simplicity Drive Speed', 'How clarity accelerates organizational effectiveness', 'video',
 ARRAY['leaderforge-business'], '{"leaderforge": ["clarity", "speed"]}', 'Dionne van Zyl', 2100, NOW()),
('Building High Performance Trust Culture', 'The neuroscience of trust in team environments', 'video',
 ARRAY['leaderforge-business'], '{"leaderforge": ["culture", "trust"]}', 'Jenny Taylor', 1800, NOW()),

-- Wealth with God content
('Biblical Principles of Stewardship', 'Understanding your role as a steward of God''s resources', 'video',
 ARRAY['wealth-with-god'], '{"wealth": ["stewardship", "foundation"]}', 'Financial Expert', 1800, NOW()),
('Kingdom Investment Strategies', 'How to invest with Kingdom principles in mind', 'video',
 ARRAY['wealth-with-god'], '{"wealth": ["investing", "kingdom"]}', 'Financial Expert', 2100, NOW()),

-- Brilliant School content
('New Creation Theology Foundations', 'Deep dive into the theological foundations of new creation reality', 'video',
 ARRAY['brilliant-school'], '{"school": ["theology", "foundation"]}', 'Graham Cooke', 3600, NOW()),
('Leadership Development in the Kingdom', 'Developing Kingdom leadership characteristics', 'video',
 ARRAY['brilliant-school'], '{"school": ["leadership", "development"]}', 'Dionne van Zyl', 3000, NOW()),

-- Small Group content
('Facilitating Kingdom Conversations', 'How to guide meaningful spiritual discussions', 'video',
 ARRAY['small-group-hub'], '{"smallgroup": ["facilitation", "conversation"]}', 'Bridget van Zyl', 1500, NOW()),
('Building Community in Small Groups', 'Creating deep connections and authentic relationships', 'video',
 ARRAY['small-group-hub'], '{"smallgroup": ["community", "relationships"]}', 'Bridget van Zyl', 1200, NOW());
```

---

## 🧪 Development Fixtures

### 1. Test Users and Organizations

```sql
-- dev-fixtures.sql
-- Development data for testing (DO NOT run in production)

-- Create test users
INSERT INTO core.users (id, email, full_name, enabled_modules, current_module, preferences) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'glen@brilliant.com', 'Glen Hobbs',
 ARRAY['brilliant-movement', 'leaderforge-business'], 'leaderforge-business',
 '{"role": "admin", "theme": "dark"}'),
('123e4567-e89b-12d3-a456-426614174001', 'dionne@brilliant.com', 'Dionne van Zyl',
 ARRAY['brilliant-movement', 'leaderforge-business'], 'brilliant-movement',
 '{"role": "ceo", "theme": "light"}'),
('123e4567-e89b-12d3-a456-426614174002', 'testuser@example.com', 'Test User',
 ARRAY['brilliant-movement'], 'brilliant-movement',
 '{"role": "member", "theme": "auto"}');

-- Create test organizations
INSERT INTO core.organizations (id, name, display_name, org_type, module_id, created_by) VALUES
('223e4567-e89b-12d3-a456-426614174000', 'brilliant-perspectives', 'Brilliant Perspectives', 'company', 'leaderforge-business',
 '123e4567-e89b-12d3-a456-426614174000'),
('223e4567-e89b-12d3-a456-426614174001', 'engineering-team', 'Engineering Team', 'team', 'leaderforge-business',
 '123e4567-e89b-12d3-a456-426614174000');

-- Add test organization memberships
INSERT INTO core.user_organizations (user_id, org_id, role, status, joined_at) VALUES
('123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000', 'owner', 'accepted', NOW()),
('123e4567-e89b-12d3-a456-426614174001', '223e4567-e89b-12d3-a456-426614174000', 'admin', 'accepted', NOW()),
('123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001', 'admin', 'accepted', NOW());

-- Grant test entitlements
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_by) VALUES
('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM core.entitlements WHERE name = 'movement-member'), '123e4567-e89b-12d3-a456-426614174000'),
('123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM core.entitlements WHERE name = 'leaderforge-premium'), '123e4567-e89b-12d3-a456-426614174000'),
('123e4567-e89b-12d3-a456-426614174001', (SELECT id FROM core.entitlements WHERE name = 'movement-member'), '123e4567-e89b-12d3-a456-426614174000'),
('123e4567-e89b-12d3-a456-426614174001', (SELECT id FROM core.entitlements WHERE name = 'ceo-inner-circle'), '123e4567-e89b-12d3-a456-426614174000'),
('123e4567-e89b-12d3-a456-426614174002', (SELECT id FROM core.entitlements WHERE name = 'movement-member'), '123e4567-e89b-12d3-a456-426614174000');
```

---

## 🔧 Database Functions and Triggers

### 1. Essential Database Functions

```sql
-- database-functions.sql
-- Core database functions for business logic

-- Function to check user entitlements
CREATE OR REPLACE FUNCTION core.user_has_entitlement(
  p_user_id UUID,
  p_entitlement_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_entitlement BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM core.user_entitlements ue
    JOIN core.entitlements e ON e.id = ue.entitlement_id
    WHERE ue.user_id = p_user_id
      AND e.name = p_entitlement_name
      AND ue.revoked_at IS NULL
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
  ) INTO v_has_entitlement;

  RETURN v_has_entitlement;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check context access (see above for definition)
-- CREATE OR REPLACE FUNCTION core.user_can_access_context ...

-- Function to update search vectors for content (search indexing)
CREATE OR REPLACE FUNCTION modules.update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.instructor_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update organization path
CREATE OR REPLACE FUNCTION core.update_organization_path()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_path TEXT[];
BEGIN
  IF NEW.parent_org_id IS NULL THEN
    NEW.path := ARRAY[]::TEXT[];
    NEW.level := 0;
  ELSE
    SELECT path, level INTO v_parent_path, NEW.level
    FROM core.organizations
    WHERE id = NEW.parent_org_id;

    NEW.path := v_parent_path || NEW.parent_org_id::TEXT;
    NEW.level := NEW.level + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Automated Triggers

-- NOTE: The following triggers and functions are for data consistency and maintenance on content/media and core tables. They are not related to context or entitlement access logic.

-- Update search vector on content changes (see above for function definition)
CREATE TRIGGER trigger_update_content_search_vector
  BEFORE INSERT OR UPDATE ON modules.content
  FOR EACH ROW EXECUTE FUNCTION modules.update_content_search_vector();

-- Update organization hierarchy on changes
-- Keeps the organization path and level fields in sync when parent_org_id changes
CREATE TRIGGER trigger_update_organization_path
  BEFORE INSERT OR UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION core.update_organization_path();

-- Update timestamps on record changes
-- Ensures the updated_at column is set to NOW() on any update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at columns
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_entitlements_updated_at
  BEFORE UPDATE ON core.entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_content_updated_at
  BEFORE UPDATE ON modules.content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON core.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🚀 Implementation Scripts

### 1. Complete Setup Script

```bash
#!/bin/bash
# setup-database.sh
# Complete database setup for LeaderForge

set -e

echo "🗄️  Setting up LeaderForge database..."

# Load environment variables
source .env.local

# Run schema creation scripts in order
echo "📋 Creating schemas and extensions..."
psql $DATABASE_URL -f scripts/sql/schema-setup.sql

echo "👥 Creating core tables..."
psql $DATABASE_URL -f scripts/sql/core-tables.sql

echo "🔐 Creating entitlements system..."
psql $DATABASE_URL -f scripts/sql/entitlements.sql

echo "📚 Creating content and progress tables..."
psql $DATABASE_URL -f scripts/sql/content-tables.sql

echo "💬 Creating conversation and analytics tables..."
psql $DATABASE_URL -f scripts/sql/conversations-analytics.sql

echo "⚙️  Creating database functions..."
psql $DATABASE_URL -f scripts/sql/database-functions.sql

echo "🔄 Creating triggers..."
psql $DATABASE_URL -f scripts/sql/triggers.sql

echo "🌱 Seeding initial data..."
psql $DATABASE_URL -f scripts/sql/seed-entitlements.sql
psql $DATABASE_URL -f scripts/sql/seed-module-policies.sql
psql $DATABASE_URL -f scripts/sql/seed-content.sql

# Only run dev fixtures in development
if [ "$NODE_ENV" = "development" ]; then
  echo "🧪 Loading development fixtures..."
  psql $DATABASE_URL -f scripts/sql/dev-fixtures.sql
fi

echo "✅ Database setup complete!"
```

### 2. Validation Script

```bash
#!/bin/bash
# validate-database.sh
# Validate database setup

echo "🔍 Validating database setup..."

# Check if all tables exist
TABLES=(
  "core.users"
  "core.organizations"
  "core.user_organizations"
  "core.entitlements"
  "core.org_entitlements"
  "core.user_entitlements"
  "core.email_validations"
  "modules.content"
  "modules.user_progress"
  "core.conversation_events"
  "core.conversations"
  "analytics.learning_events"
)

for table in "${TABLES[@]}"; do
  if psql $DATABASE_URL -c "\d $table" > /dev/null 2>&1; then
    echo "✅ Table $table exists"
  else
    echo "❌ Table $table missing"
    exit 1
  fi
done

# Check if functions exist
FUNCTIONS=(
  "core.user_has_entitlement"
  "core.user_can_access_context"
)

for func in "${FUNCTIONS[@]}"; do
  if psql $DATABASE_URL -c "\df $func" | grep -q "$func"; then
    echo "✅ Function $func exists"
  else
    echo "❌ Function $func missing"
    exit 1
  fi
done

# Check if initial data exists
ENTITLEMENT_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM core.entitlements;")
if [ "$ENTITLEMENT_COUNT" -gt 0 ]; then
  echo "✅ Initial entitlements seeded ($ENTITLEMENT_COUNT records)"
else
  echo "❌ No entitlements found"
  exit 1
fi

echo "✅ Database validation complete!"
```

---

## 📁 File Organization

```
packages/database/
├── scripts/
│   ├── setup-database.sh
│   ├── validate-database.sh
│   └── sql/
│       ├── schema-setup.sql
│       ├── core-tables.sql
│       ├── entitlements.sql
│       ├── content-tables.sql
│       ├── conversations-analytics.sql
│       ├── database-functions.sql
│       ├── triggers.sql
│       ├── seed-entitlements.sql
│       ├── seed-module-policies.sql
│       ├── seed-content.sql
│       └── dev-fixtures.sql
├── types/
│   └── supabase.ts (auto-generated)
└── migrations/
    └── (future migrations as needed)
```

---

## ✅ Implementation Checklist

### Database Setup
- [ ] Run schema setup script
- [ ] Execute all table creation scripts
- [ ] Apply database functions and triggers
- [ ] Seed initial entitlements and policies
- [ ] Load sample content
- [ ] Run validation script
- [ ] Generate TypeScript types

### Development Environment
- [ ] Configure Supabase locally
- [ ] Set up environment variables
- [ ] Test database connections
- [ ] Verify RLS policies work
- [ ] Test core functions
- [ ] Load development fixtures

### Production Readiness
- [ ] Remove development fixtures
- [ ] Configure production backups
- [ ] Set up monitoring
- [ ] Implement security policies
- [ ] Test disaster recovery
- [ ] Document maintenance procedures

---

**This addendum provides complete, production-ready database schemas and setup scripts for the LeaderForge platform. All scripts are designed for a net new installation with no migration concerns.**
---

## 🗃️ Database Setup Enhancements

### 🧪 Local Dev with Seeded Fixtures
Support local development environments with:
- Dockerized Postgres or equivalent
- Seed scripts (`scripts/seed.ts`) that load test data
- Optional reset script (`scripts/reset-db.ts`)

### 🧩 Modular Experience Schema
Support logical separation of experience data:
- Use tenant or experience ID in table schemas or queries
- Consider schema-based multitenancy (`schema_per_experience`) if needed

### 🧠 Observability Integration
Ensure queries log trace IDs or experience IDs for observability. Use a tool like OpenTelemetry to track query timing and associate with user flows.

### 🔄 Migration Strategy
Adopt a migration tool such as:
- Prisma Migrate (if using Prisma)
- [Drizzle](https://orm.drizzle.team/)
- [Flyway](https://flywaydb.org/)

Document rollback process and link DB migrations to GitHub PRs.

### Database Validation SQL

-- Use these SQL queries in the Supabase SQL editor to validate your database setup.

-- 1. List all tables in each schema
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('core', 'modules', 'analytics')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- 2. List all functions in the 'core' and 'modules' schemas
SELECT routine_schema, routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema IN ('core', 'modules')
ORDER BY routine_schema, routine_name;

-- 3. Check for key functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'core'
  AND routine_name IN ('user_has_entitlement', 'user_can_access_context');

-- 4. Count initial entitlements
SELECT COUNT(*) AS entitlement_count FROM core.entitlements;

-- 5. Count seeded users and organizations
SELECT COUNT(*) AS user_count FROM core.users;
SELECT COUNT(*) AS org_count FROM core.organizations;

-- 6. Show a sample of seeded content
SELECT id, title, available_contexts, published_at
FROM modules.content
ORDER BY published_at DESC
LIMIT 5;

-- 7. Show context access policies
SELECT * FROM core.context_access_policies;

