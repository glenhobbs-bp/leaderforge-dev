-- Asset Composition Schema for LeaderForge
-- Purpose: Support hierarchical context-aware compositions and agent discovery
-- Phase 3.2: Database Schema for Compositions (Hours 73-76)

-- Assets table - Widget metadata for agent discovery
CREATE TABLE IF NOT EXISTS core.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'widget', 'tool', 'composition'
    type VARCHAR(50) NOT NULL, -- specific type like 'Card', 'Grid', etc
    version VARCHAR(20) DEFAULT '1.0.0',
    schema_definition JSONB NOT NULL, -- widget schema with props/data/config
    capabilities JSONB DEFAULT '[]'::jsonb, -- array of capability objects
    dependencies JSONB DEFAULT '[]'::jsonb, -- array of dependency strings
    tags JSONB DEFAULT '[]'::jsonb, -- array of tag strings
    examples JSONB DEFAULT '[]'::jsonb, -- array of example schemas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT assets_category_check CHECK (category IN ('widget', 'tool', 'composition')),
    CONSTRAINT assets_name_unique UNIQUE (name, version)
);

-- Compositions table - Hierarchical context-aware layouts
CREATE TABLE IF NOT EXISTS core.compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    context_level VARCHAR(20) NOT NULL, -- 'leaderforge', 'tenant', 'team', 'individual'
    context_id UUID, -- tenant_id, team_id, user_id depending on level
    composition_type VARCHAR(50) DEFAULT 'layout', -- 'layout', 'workflow', 'template'
    schema_definition JSONB NOT NULL, -- composition layout schema
    activation_rules JSONB DEFAULT '{}'::jsonb, -- when this composition activates
    inheritance_parent UUID REFERENCES core.compositions(id), -- template inheritance
    is_template BOOLEAN DEFAULT false,
    sharing_scope VARCHAR(20) DEFAULT 'private', -- 'private', 'team', 'tenant', 'public'
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT compositions_context_level_check CHECK (context_level IN ('leaderforge', 'tenant', 'team', 'individual')),
    CONSTRAINT compositions_sharing_scope_check CHECK (sharing_scope IN ('private', 'team', 'tenant', 'public')),
    CONSTRAINT compositions_type_check CHECK (composition_type IN ('layout', 'workflow', 'template'))
);

-- User Compositions table - Individual customizations and usage
CREATE TABLE IF NOT EXISTS core.user_compositions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    composition_id UUID NOT NULL REFERENCES core.compositions(id),
    customizations JSONB DEFAULT '{}'::jsonb, -- user-specific overrides
    usage_metrics JSONB DEFAULT '{}'::jsonb, -- frequency, effectiveness, etc
    context_preferences JSONB DEFAULT '{}'::jsonb, -- when user prefers this
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, composition_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_category ON core.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_type ON core.assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON core.assets USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_compositions_context_level ON core.compositions(context_level);
CREATE INDEX IF NOT EXISTS idx_compositions_context_id ON core.compositions(context_id);
CREATE INDEX IF NOT EXISTS idx_compositions_is_template ON core.compositions(is_template);
CREATE INDEX IF NOT EXISTS idx_compositions_sharing_scope ON core.compositions(sharing_scope);

CREATE INDEX IF NOT EXISTS idx_user_compositions_user_id ON core.user_compositions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_compositions_active ON core.user_compositions(user_id, is_active);

-- RLS Policies for secure access
ALTER TABLE core.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_compositions ENABLE ROW LEVEL SECURITY;

-- Assets policies - readable by authenticated users
CREATE POLICY "Assets readable by authenticated users" ON core.assets
    FOR SELECT USING (auth.role() = 'authenticated');

-- Compositions policies - hierarchical access based on context
CREATE POLICY "Compositions readable by context" ON core.compositions
    FOR SELECT USING (
        sharing_scope = 'public' OR
        (context_level = 'leaderforge') OR
        (context_level = 'tenant' AND EXISTS (
            SELECT 1 FROM core.users u WHERE u.id = auth.uid() AND u.tenant_key = context_id::text
        )) OR
        (context_level = 'individual' AND context_id = auth.uid())
    );

-- User compositions policies - user owns their customizations
CREATE POLICY "User compositions owned by user" ON core.user_compositions
    FOR ALL USING (user_id = auth.uid());

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON core.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compositions_updated_at BEFORE UPDATE ON core.compositions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_compositions_updated_at BEFORE UPDATE ON core.user_compositions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();