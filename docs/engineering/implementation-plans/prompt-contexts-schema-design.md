# Prompt Contexts - Database Schema Design

**File:** docs/engineering/implementation-plans/prompt-contexts-schema-design.md
**Purpose:** Database schema implementation for Prompt Contexts PRD
**Owner:** Senior Engineer
**Tags:** implementation, database, prompt-contexts, schema

## Schema Design Overview

Based on the Prompt Contexts PRD and existing entitlement architecture, this document defines the database schema needed to implement the hierarchical context system.

## Core Tables

### 1. Prompt Contexts Table
```sql
CREATE TABLE core.prompt_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- The actual context content/instructions
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('personal', 'team', 'team_private', 'organization', 'external', 'system')),
    visibility_level VARCHAR(20) NOT NULL CHECK (visibility_level IN ('public', 'organization', 'team', 'team_private', 'personal', 'system')),

    -- Ownership and scope
    creator_id UUID REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),
    team_id UUID, -- Will need teams table
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    -- Hierarchy and inheritance
    parent_context_id UUID REFERENCES core.prompt_contexts(id),
    priority_weight INTEGER DEFAULT 0,
    merge_strategy VARCHAR(20) DEFAULT 'additive' CHECK (merge_strategy IN ('additive', 'override', 'replace')),

    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,

    -- Content structure
    template_variables JSONB DEFAULT '{}', -- Available variables for this context
    context_schema JSONB, -- Schema validation for content

    -- Usage and performance tracking
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),

    -- Constraints
    UNIQUE(name, tenant_key, organization_id, creator_id) -- Prevent duplicate names per scope
);

-- Indexes for performance
CREATE INDEX idx_prompt_contexts_type ON core.prompt_contexts(context_type);
CREATE INDEX idx_prompt_contexts_visibility ON core.prompt_contexts(visibility_level);
CREATE INDEX idx_prompt_contexts_tenant ON core.prompt_contexts(tenant_key);
CREATE INDEX idx_prompt_contexts_organization ON core.prompt_contexts(organization_id);
CREATE INDEX idx_prompt_contexts_creator ON core.prompt_contexts(creator_id);
CREATE INDEX idx_prompt_contexts_active ON core.prompt_contexts(is_active);
CREATE INDEX idx_prompt_contexts_priority ON core.prompt_contexts(priority_weight DESC);
CREATE INDEX idx_prompt_contexts_usage ON core.prompt_contexts(usage_count DESC);
```

### 2. Context Permissions Table
```sql
CREATE TABLE core.context_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID REFERENCES core.prompt_contexts(id) ON DELETE CASCADE,

    -- Grant target (one of these will be non-null)
    user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
    team_id UUID, -- References to teams table when created
    role_name VARCHAR(50), -- For role-based permissions

    -- Permission details
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin', 'inherit')),
    is_inherited BOOLEAN DEFAULT FALSE,

    -- Grant metadata
    granted_by UUID REFERENCES core.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Tenant isolation
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    -- Constraints
    CONSTRAINT context_permissions_target_check
        CHECK ((user_id IS NOT NULL)::integer + (team_id IS NOT NULL)::integer + (role_name IS NOT NULL)::integer = 1)
);

CREATE INDEX idx_context_permissions_context ON core.context_permissions(context_id);
CREATE INDEX idx_context_permissions_user ON core.context_permissions(user_id);
CREATE INDEX idx_context_permissions_tenant ON core.context_permissions(tenant_key);
CREATE INDEX idx_context_permissions_active ON core.context_permissions(is_active);
```

### 3. Context Usage Analytics Table
```sql
CREATE TABLE core.context_usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID REFERENCES core.prompt_contexts(id),
    user_id UUID REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    -- Usage details
    usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('ai_interaction', 'prompt_execution', 'preview', 'test')),
    session_id VARCHAR(255),
    interaction_id UUID,

    -- Context state at time of usage
    merged_context_hash VARCHAR(64), -- Hash of merged context for deduplication
    context_chain JSONB, -- Full inheritance chain used
    conflicts_detected INTEGER DEFAULT 0,
    resolution_time_ms INTEGER,

    -- Effectiveness metrics
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
    ai_response_quality_score DECIMAL(3,2),
    task_completion_success BOOLEAN,

    -- Performance metrics
    context_resolution_time_ms INTEGER,
    context_size_bytes INTEGER,
    cache_hit BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_context_usage_context ON core.context_usage_analytics(context_id);
CREATE INDEX idx_context_usage_user ON core.context_usage_analytics(user_id);
CREATE INDEX idx_context_usage_tenant ON core.context_usage_analytics(tenant_key);
CREATE INDEX idx_context_usage_created_at ON core.context_usage_analytics(created_at);
```

### 4. Context Versions Table
```sql
CREATE TABLE core.context_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID REFERENCES core.prompt_contexts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,

    -- Version content snapshot
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    template_variables JSONB,
    context_schema JSONB,

    -- Change tracking
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'merge', 'rollback')),
    change_summary TEXT,
    change_details JSONB, -- Detailed diff information

    -- Version metadata
    created_by UUID REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT FALSE,
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    UNIQUE(context_id, version_number)
);

CREATE INDEX idx_context_versions_context ON core.context_versions(context_id);
CREATE INDEX idx_context_versions_current ON core.context_versions(is_current);
CREATE INDEX idx_context_versions_created_at ON core.context_versions(created_at);
```

## Entitlement Integration

### Required Entitlements for Prompt Contexts
```sql
-- Add these entitlements to core.entitlements table
INSERT INTO core.entitlements (name, display_name, description, features, limits, tenant_key) VALUES
('prompt-contexts-basic', 'Prompt Contexts Basic', 'Basic prompt context management',
 '{"context_creation": true, "personal_contexts": true}',
 '{"max_personal_contexts": 5, "max_context_size_kb": 10}', 'leaderforge'),

('prompt-contexts-premium', 'Prompt Contexts Premium', 'Advanced context features with team collaboration',
 '{"context_creation": true, "personal_contexts": true, "team_contexts": true, "context_analytics": true, "version_control": true}',
 '{"max_personal_contexts": 25, "max_team_contexts": 10, "max_context_size_kb": 50}', 'leaderforge'),

('prompt-contexts-enterprise', 'Prompt Contexts Enterprise', 'Full context management with organizational features',
 '{"context_creation": true, "personal_contexts": true, "team_contexts": true, "org_contexts": true, "context_analytics": true, "version_control": true, "advanced_permissions": true}',
 '{"max_personal_contexts": 100, "max_team_contexts": 50, "max_org_contexts": 25, "max_context_size_kb": 100}', 'leaderforge');
```

### Permission Validation Functions
```sql
-- Function to check if user can create context
CREATE OR REPLACE FUNCTION check_context_creation_permission(
    p_user_id UUID,
    p_context_type VARCHAR(50),
    p_tenant_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_entitlements JSONB;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get user's entitlement features for this tenant
    SELECT COALESCE(jsonb_agg(e.features), '[]'::jsonb)
    INTO user_entitlements
    FROM core.user_entitlements ue
    JOIN core.entitlements e ON ue.entitlement_id = e.id
    WHERE ue.user_id = p_user_id
    AND ue.tenant_key = p_tenant_key
    AND ue.revoked_at IS NULL
    AND (ue.expires_at IS NULL OR ue.expires_at > NOW());

    -- Check if user has context creation permission
    IF NOT (user_entitlements ? 'context_creation') THEN
        RETURN FALSE;
    END IF;

    -- Check context type specific permissions
    CASE p_context_type
        WHEN 'personal' THEN
            IF NOT (user_entitlements ? 'personal_contexts') THEN
                RETURN FALSE;
            END IF;

            -- Check count limits
            SELECT COUNT(*) INTO current_count
            FROM core.prompt_contexts
            WHERE creator_id = p_user_id
            AND context_type = 'personal'
            AND tenant_key = p_tenant_key
            AND is_active = TRUE;

            -- Get max allowed from entitlements
            SELECT COALESCE(MAX((e.limits->>'max_personal_contexts')::INTEGER), 0)
            INTO max_allowed
            FROM core.user_entitlements ue
            JOIN core.entitlements e ON ue.entitlement_id = e.id
            WHERE ue.user_id = p_user_id
            AND ue.tenant_key = p_tenant_key
            AND ue.revoked_at IS NULL;

            RETURN current_count < max_allowed;

        WHEN 'team' THEN
            RETURN user_entitlements ? 'team_contexts';

        WHEN 'organization' THEN
            RETURN user_entitlements ? 'org_contexts';

        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Row Level Security (RLS) Policies
```sql
-- Enable RLS on all context tables
ALTER TABLE core.prompt_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.context_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.context_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.context_versions ENABLE ROW LEVEL SECURITY;

-- RLS policy for prompt_contexts
CREATE POLICY prompt_contexts_tenant_isolation ON core.prompt_contexts
    FOR ALL
    USING (tenant_key = current_setting('app.current_tenant_key', true));

-- RLS policy for visibility-based access
CREATE POLICY prompt_contexts_visibility_access ON core.prompt_contexts
    FOR SELECT
    USING (
        CASE visibility_level
            WHEN 'public' THEN TRUE
            WHEN 'personal' THEN creator_id = auth.uid()
            WHEN 'organization' THEN organization_id IN (
                SELECT uo.org_id FROM core.user_organizations uo
                WHERE uo.user_id = auth.uid()
            )
            -- Add team and other visibility checks when teams table exists
            ELSE FALSE
        END
    );
```