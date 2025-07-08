# Prompt Library - Database Schema Design

**File:** docs/engineering/implementation-plans/prompt-library-schema-design.md
**Purpose:** Database schema implementation for Prompt Library PRD
**Owner:** Senior Engineer
**Tags:** implementation, database, prompt-library, schema

## Schema Design Overview

Based on the Prompt Library PRD and existing entitlement architecture, this document defines the database schema needed to implement the searchable prompt repository.

## Core Tables

### 1. Prompts Table
```sql
CREATE TABLE core.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- The actual prompt content
    instructions TEXT, -- Usage instructions
    category_id UUID REFERENCES core.categories(id),

    -- Ownership and scope
    creator_id UUID REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),
    team_id UUID, -- Will need teams table
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    -- Visibility and access
    visibility_level VARCHAR(20) NOT NULL CHECK (visibility_level IN ('public', 'community', 'team', 'organization', 'premium', 'private')),
    is_premium BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    parent_prompt_id UUID REFERENCES core.prompts(id),

    -- Status and moderation
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),

    -- Template and variables
    template_variables JSONB DEFAULT '{}',
    expected_output_format TEXT,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

    -- Usage analytics
    usage_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),

    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'C')
    ) STORED
);

-- Indexes for performance
CREATE INDEX idx_prompts_visibility ON core.prompts(visibility_level);
CREATE INDEX idx_prompts_category ON core.prompts(category_id);
CREATE INDEX idx_prompts_tenant ON core.prompts(tenant_key);
CREATE INDEX idx_prompts_creator ON core.prompts(creator_id);
CREATE INDEX idx_prompts_organization ON core.prompts(organization_id);
CREATE INDEX idx_prompts_status ON core.prompts(status);
CREATE INDEX idx_prompts_moderation ON core.prompts(moderation_status);
CREATE INDEX idx_prompts_usage_count ON core.prompts(usage_count DESC);
CREATE INDEX idx_prompts_rating ON core.prompts(rating_average DESC);
CREATE INDEX idx_prompts_search ON core.prompts USING GIN(search_vector);
CREATE INDEX idx_prompts_created_at ON core.prompts(created_at DESC);
```

### 2. Categories Table (Hierarchical Organization Structure)
```sql
-- Categories provide hierarchical folder-like organization (e.g., "Marketing > Email Templates > Follow-ups")
-- This is different from tags which are flat labels for cross-cutting classification
-- Categories answer "Where does this belong?" while tags answer "What is this about?"
CREATE TABLE core.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES core.categories(id), -- Enables folder-like hierarchy
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),
    organization_id UUID REFERENCES core.organizations(id),

    -- Category metadata
    is_system_category BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50), -- Icon name for UI
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(name, tenant_key, organization_id, parent_id)
);

CREATE INDEX idx_categories_parent ON core.categories(parent_id);
CREATE INDEX idx_categories_tenant ON core.categories(tenant_key);
CREATE INDEX idx_categories_organization ON core.categories(organization_id);
CREATE INDEX idx_categories_active ON core.categories(is_active);
```

### 3. Tags Table (Flat Cross-Cutting Labels)
```sql
-- Tags are flat labels for cross-cutting classification (e.g., "sales", "technical", "urgent")
-- Unlike categories which provide hierarchical structure, tags enable multiple classifications
-- Example: A prompt might be in "Marketing > Email" category but tagged "sales", "follow-up", "template"
CREATE TABLE core.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),
    organization_id UUID REFERENCES core.organizations(id),

    -- Tag metadata
    usage_count INTEGER DEFAULT 0,
    is_system_tag BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),

    UNIQUE(name, tenant_key, organization_id)
);

CREATE INDEX idx_tags_name ON core.tags(name);
CREATE INDEX idx_tags_tenant ON core.tags(tenant_key);
CREATE INDEX idx_tags_organization ON core.tags(organization_id);
CREATE INDEX idx_tags_usage ON core.tags(usage_count DESC);
```

### 4. Prompt Tags Junction Table
```sql
CREATE TABLE core.prompt_tags (
    prompt_id UUID REFERENCES core.prompts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES core.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id),

    PRIMARY KEY (prompt_id, tag_id)
);

CREATE INDEX idx_prompt_tags_prompt ON core.prompt_tags(prompt_id);
CREATE INDEX idx_prompt_tags_tag ON core.prompt_tags(tag_id);
```

### 5. Prompt Permissions Table (Controls Private/Shared Access)
```sql
-- This table controls who can see and use prompts, enabling private prompts
-- Private prompts: Only creator has access (no entries = private to creator)
-- Shared prompts: Explicit permissions granted to users/teams/roles
-- Public prompts: Handled via visibility_level in core.prompts table
CREATE TABLE core.prompt_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES core.prompts(id) ON DELETE CASCADE,

    -- Grant target (one of these will be non-null)
    user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
    team_id UUID, -- References to teams table when created
    role_name VARCHAR(50), -- For role-based permissions

    -- Permission details
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES core.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Tenant isolation
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    -- Constraints
    CONSTRAINT prompt_permissions_target_check
        CHECK ((user_id IS NOT NULL)::integer + (team_id IS NOT NULL)::integer + (role_name IS NOT NULL)::integer = 1)
);

CREATE INDEX idx_prompt_permissions_prompt ON core.prompt_permissions(prompt_id);
CREATE INDEX idx_prompt_permissions_user ON core.prompt_permissions(user_id);
CREATE INDEX idx_prompt_permissions_tenant ON core.prompt_permissions(tenant_key);
CREATE INDEX idx_prompt_permissions_active ON core.prompt_permissions(is_active);
```

### 6. Prompt Usage Analytics Table
```sql
CREATE TABLE core.prompt_usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES core.prompts(id),
    user_id UUID REFERENCES core.users(id),
    organization_id UUID REFERENCES core.organizations(id),
    tenant_key TEXT NOT NULL REFERENCES core.tenants(tenant_key),

    -- Execution context
    execution_context JSONB, -- CopilotKit context data
    template_variables JSONB, -- Variables used in this execution

    -- Usage details
    session_id VARCHAR(255),
    interaction_id UUID,
    execution_time_ms INTEGER,

    -- User feedback
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    task_completed BOOLEAN,

    -- Analytics
    source VARCHAR(50), -- 'search', 'featured', 'category', 'recommendation'
    search_query TEXT, -- If found via search

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prompt_usage_prompt ON core.prompt_usage_analytics(prompt_id);
CREATE INDEX idx_prompt_usage_user ON core.prompt_usage_analytics(user_id);
CREATE INDEX idx_prompt_usage_tenant ON core.prompt_usage_analytics(tenant_key);
CREATE INDEX idx_prompt_usage_created_at ON core.prompt_usage_analytics(created_at);
```

## AI Dashboard Analytics - Fully Supported ✅

The schema design fully supports all AI Dashboard requirements:

### 📊 **Usage Statistics & Leaderboards**
```sql
-- Most used prompts
SELECT p.title, p.usage_count, p.rating_average
FROM core.prompts p
ORDER BY p.usage_count DESC;

-- User leaderboard (who uses prompts most)
SELECT u.name, COUNT(*) as usage_count
FROM core.prompt_usage_analytics pua
JOIN core.users u ON pua.user_id = u.id
WHERE pua.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY usage_count DESC;
```

### ⭐ **Amazon-Style User Ratings**
```sql
-- Individual ratings and feedback
SELECT pua.success_rating, pua.user_feedback, pua.task_completed
FROM core.prompt_usage_analytics pua
WHERE pua.prompt_id = 'some-prompt-id';

-- Average ratings (automatically maintained in core.prompts)
SELECT p.rating_average, p.rating_count
FROM core.prompts p;
```

### 📈 **Analytics Dashboard Data**
- **Usage trends**: `core.prompt_usage_analytics.created_at`
- **Execution performance**: `core.prompt_usage_analytics.execution_time_ms`
- **Success rates**: `core.prompt_usage_analytics.task_completed`
- **User satisfaction**: `core.prompt_usage_analytics.success_rating`
- **Search analytics**: `core.prompt_usage_analytics.search_query`

## Entitlement Integration

### Required Entitlements for Prompt Library
```sql
-- Add these entitlements to core.entitlements table
INSERT INTO core.entitlements (name, display_name, description, features, limits, tenant_key) VALUES
('prompt-library-basic', 'Prompt Library Basic', 'Basic prompt library access',
 '{"library_access": true, "prompt_usage": true, "basic_search": true}',
 '{"max_personal_prompts": 10, "daily_usage_limit": 50}', 'leaderforge'),

('prompt-library-premium', 'Prompt Library Premium', 'Premium prompt library with creation and analytics',
 '{"library_access": true, "prompt_usage": true, "prompt_creation": true, "advanced_search": true, "usage_analytics": true, "premium_content": true}',
 '{"max_personal_prompts": 50, "max_team_prompts": 25, "daily_usage_limit": 200}', 'leaderforge'),

('prompt-library-enterprise', 'Prompt Library Enterprise', 'Full prompt library with organization features',
 '{"library_access": true, "prompt_usage": true, "prompt_creation": true, "advanced_search": true, "usage_analytics": true, "premium_content": true, "org_library": true, "content_moderation": true}',
 '{"max_personal_prompts": 200, "max_team_prompts": 100, "max_org_prompts": 50, "unlimited_usage": true}', 'leaderforge');
```

### Permission Validation Functions
```sql
-- Function to check if user can access prompt
CREATE OR REPLACE FUNCTION check_prompt_access_permission(
    p_user_id UUID,
    p_prompt_id UUID,
    p_tenant_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    prompt_record RECORD;
    user_entitlements JSONB;
BEGIN
    -- Get prompt details
    SELECT visibility_level, is_premium, creator_id, organization_id, team_id
    INTO prompt_record
    FROM core.prompts
    WHERE id = p_prompt_id AND tenant_key = p_tenant_key;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get user's entitlement features for this tenant
    SELECT COALESCE(jsonb_agg(e.features), '[]'::jsonb)
    INTO user_entitlements
    FROM core.user_entitlements ue
    JOIN core.entitlements e ON ue.entitlement_id = e.id
    WHERE ue.user_id = p_user_id
    AND ue.tenant_key = p_tenant_key
    AND ue.revoked_at IS NULL
    AND (ue.expires_at IS NULL OR ue.expires_at > NOW());

    -- Check basic library access
    IF NOT (user_entitlements ? 'library_access') THEN
        RETURN FALSE;
    END IF;

    -- Check premium content access
    IF prompt_record.is_premium AND NOT (user_entitlements ? 'premium_content') THEN
        RETURN FALSE;
    END IF;

    -- Check visibility level permissions
    CASE prompt_record.visibility_level
        WHEN 'public' THEN
            RETURN TRUE;
        WHEN 'private' THEN
            RETURN prompt_record.creator_id = p_user_id;
        WHEN 'organization' THEN
            RETURN prompt_record.organization_id IN (
                SELECT uo.org_id FROM core.user_organizations uo
                WHERE uo.user_id = p_user_id
            );
        WHEN 'premium' THEN
            RETURN user_entitlements ? 'premium_content';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create prompt
CREATE OR REPLACE FUNCTION check_prompt_creation_permission(
    p_user_id UUID,
    p_visibility_level VARCHAR(20),
    p_tenant_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_entitlements JSONB;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get user's entitlement features
    SELECT COALESCE(jsonb_agg(e.features), '[]'::jsonb)
    INTO user_entitlements
    FROM core.user_entitlements ue
    JOIN core.entitlements e ON ue.entitlement_id = e.id
    WHERE ue.user_id = p_user_id
    AND ue.tenant_key = p_tenant_key
    AND ue.revoked_at IS NULL;

    -- Check if user has prompt creation permission
    IF NOT (user_entitlements ? 'prompt_creation') THEN
        RETURN FALSE;
    END IF;

    -- Check limits based on visibility level
    CASE p_visibility_level
        WHEN 'private' THEN
            SELECT COUNT(*) INTO current_count
            FROM core.prompts
            WHERE creator_id = p_user_id
            AND visibility_level = 'private'
            AND tenant_key = p_tenant_key
            AND status = 'active';

            SELECT COALESCE(MAX((e.limits->>'max_personal_prompts')::INTEGER), 0)
            INTO max_allowed
            FROM core.user_entitlements ue
            JOIN core.entitlements e ON ue.entitlement_id = e.id
            WHERE ue.user_id = p_user_id
            AND ue.tenant_key = p_tenant_key
            AND ue.revoked_at IS NULL;

            RETURN current_count < max_allowed;

        WHEN 'team' THEN
            RETURN user_entitlements ? 'team_prompts';

        WHEN 'organization' THEN
            RETURN user_entitlements ? 'org_library';

        ELSE
            RETURN TRUE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Row Level Security (RLS) Policies
```sql
-- Enable RLS on all prompt library tables
ALTER TABLE core.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.prompt_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.prompt_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.prompt_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policy for tenant isolation
CREATE POLICY prompts_tenant_isolation ON core.prompts
    FOR ALL
    USING (tenant_key = current_setting('app.current_tenant_key', true));

-- RLS policy for prompt visibility
CREATE POLICY prompts_visibility_access ON core.prompts
    FOR SELECT
    USING (
        check_prompt_access_permission(auth.uid(), id, tenant_key)
    );

-- RLS policies for other tables
CREATE POLICY categories_tenant_isolation ON core.categories
    FOR ALL
    USING (tenant_key = current_setting('app.current_tenant_key', true));

CREATE POLICY tags_tenant_isolation ON core.tags
    FOR ALL
    USING (tenant_key = current_setting('app.current_tenant_key', true));
```