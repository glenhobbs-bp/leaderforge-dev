-- Schema-Driven Forms Implementation - Phase 1 Database Migration
-- Purpose: Core infrastructure for form templates, file storage, and universal input extensions
-- Implementation Plan: Phase 1, Days 1-2 (Tasks 1.1, 1.2, 1.3)

-- =============================================================================
-- TASK 1.1: CREATE FORM TEMPLATES TABLE
-- =============================================================================

-- Form templates store JSON Schema definitions for dynamic form creation
CREATE TABLE IF NOT EXISTS core.form_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    description TEXT,

    -- Schema definitions
    json_schema JSONB NOT NULL, -- JSON Schema for validation
    ui_schema JSONB DEFAULT '{}', -- RJSF UI hints for rendering
    scoring_schema JSONB, -- Optional scoring configuration

    -- Agent integration
    created_by_agent_id UUID REFERENCES core.agents(id),
    processing_agent_id UUID REFERENCES core.agents(id), -- Agent to process submissions

    -- Multi-tenancy and versioning
    tenant_key TEXT, -- NULL for platform-wide templates
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    estimated_completion_minutes INTEGER DEFAULT 5,
    requires_file_upload BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'worksheet', -- 'worksheet', 'feedback', 'survey', 'assessment'

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT form_templates_category_check CHECK (category IN ('worksheet', 'feedback', 'survey', 'assessment', 'journal'))
);

-- Indexes for form templates
CREATE INDEX IF NOT EXISTS idx_form_templates_tenant ON core.form_templates(tenant_key, is_active);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON core.form_templates(category, is_active);
CREATE INDEX IF NOT EXISTS idx_form_templates_agent ON core.form_templates(created_by_agent_id);

-- =============================================================================
-- TASK 1.2: CREATE USER FILES TABLE
-- =============================================================================

-- User files table for secure file storage with processing pipeline
CREATE TABLE IF NOT EXISTS core.user_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

    -- File metadata
    original_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL, -- Pattern: "user/{user_id}/{file_id}"

    -- Processing pipeline
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    processing_metadata JSONB DEFAULT '{}', -- thumbnails, transcripts, virus scan results

    -- Access control (linked to universal_inputs for context)
    privacy_level TEXT DEFAULT 'user_private' CHECK (privacy_level IN ('user_private', 'hierarchy_accessible', 'admin_accessible')),
    tenant_key TEXT, -- Tenant context when uploaded

    -- File access
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Optional expiration for temporary files

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user files
CREATE INDEX IF NOT EXISTS idx_user_files_user ON core.user_files(user_id, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_user_files_status ON core.user_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_user_files_tenant ON core.user_files(tenant_key);
CREATE INDEX IF NOT EXISTS idx_user_files_type ON core.user_files(content_type);
CREATE INDEX IF NOT EXISTS idx_user_files_expires ON core.user_files(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================================================
-- TASK 1.3: EXTEND UNIVERSAL INPUTS TABLE
-- =============================================================================

-- Add attached_files column to link files to universal inputs
DO $$
BEGIN
    -- Check if attached_files column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'universal_inputs'
        AND column_name = 'attached_files'
    ) THEN
        ALTER TABLE core.universal_inputs
        ADD COLUMN attached_files TEXT[] DEFAULT '{}';

        RAISE NOTICE 'Added attached_files column to core.universal_inputs';
    ELSE
        RAISE NOTICE 'attached_files column already exists in core.universal_inputs';
    END IF;
END $$;

-- Add index for file attachment queries
CREATE INDEX IF NOT EXISTS idx_universal_inputs_files ON core.universal_inputs USING GIN(attached_files);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE core.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_files ENABLE ROW LEVEL SECURITY;

-- Form Templates RLS Policies
CREATE POLICY "Form templates readable by tenant users" ON core.form_templates
    FOR SELECT USING (
        is_active = true AND (
            tenant_key IS NULL OR -- Platform-wide templates
            tenant_key IN (
                SELECT u.current_module FROM core.users u WHERE u.id = auth.uid()
            )
        )
    );

CREATE POLICY "Form templates manageable by admins" ON core.form_templates
    FOR ALL TO service_role USING (true);

-- User Files RLS Policies
CREATE POLICY "Users can manage own files" ON core.user_files
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role full access to files" ON core.user_files
    FOR ALL TO service_role USING (true);

-- File access for hierarchy (team leaders can access team files with hierarchy_accessible privacy)
CREATE POLICY "Hierarchy access to team files" ON core.user_files
    FOR SELECT USING (
        privacy_level = 'hierarchy_accessible' AND
        EXISTS (
            SELECT 1 FROM core.user_organizations uo
            JOIN core.users u ON u.id = auth.uid()
            WHERE uo.user_id = core.user_files.user_id
            AND uo.role IN ('admin', 'team_leader')
            AND u.current_module = core.user_files.tenant_key
        )
    );

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON core.form_templates TO authenticated;
GRANT ALL ON core.user_files TO authenticated;

-- Grant permissions to service role
GRANT ALL ON core.form_templates TO service_role;
GRANT ALL ON core.user_files TO service_role;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON core.form_templates
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_user_files_updated_at BEFORE UPDATE ON core.user_files
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- =============================================================================
-- INITIAL SEED DATA - VIDEO REFLECTION WORKSHEET TEMPLATE
-- =============================================================================

-- Seed the video reflection worksheet template for immediate testing
INSERT INTO core.form_templates (
    template_name,
    display_name,
    description,
    json_schema,
    ui_schema,
    scoring_schema,
    category,
    requires_file_upload,
    estimated_completion_minutes
) VALUES (
    'video-reflection-worksheet',
    'Video Reflection Worksheet',
    'Capture key insights and action items from leadership video content',
    '{
        "type": "object",
        "required": ["insights", "big_idea", "bold_action"],
        "properties": {
            "video_context": {
                "type": "object",
                "properties": {
                    "video_id": {"type": "string"},
                    "video_title": {"type": "string"},
                    "video_duration": {"type": "string"}
                }
            },
            "insights": {
                "type": "array",
                "title": "Key Insights",
                "description": "What were the main insights from this video?",
                "items": {"type": "string"},
                "minItems": 1,
                "maxItems": 5
            },
            "big_idea": {
                "type": "string",
                "title": "Big Idea",
                "description": "What was the biggest insight or idea you gained?",
                "minLength": 10
            },
            "bold_action": {
                "type": "string",
                "title": "Bold Action",
                "description": "What bold action will you take based on this learning?",
                "minLength": 10
            },
            "future_ideas": {
                "type": "array",
                "title": "Future Ideas",
                "description": "Ideas you want to explore further",
                "items": {"type": "string"}
            },
            "time_spent_minutes": {
                "type": "integer",
                "title": "Time Spent (minutes)",
                "minimum": 1,
                "maximum": 60
            }
        }
    }',
    '{
        "insights": {
            "ui:widget": "array",
            "ui:options": {
                "addLabel": "Add Insight"
            },
            "items": {
                "ui:widget": "textarea",
                "ui:options": {
                    "rows": 2
                }
            }
        },
        "big_idea": {
            "ui:widget": "textarea",
            "ui:options": {
                "rows": 3
            }
        },
        "bold_action": {
            "ui:widget": "textarea",
            "ui:options": {
                "rows": 3
            }
        },
        "future_ideas": {
            "ui:widget": "array",
            "ui:options": {
                "addLabel": "Add Future Idea"
            },
            "items": {
                "ui:widget": "textarea",
                "ui:options": {
                    "rows": 2
                }
            }
        },
        "time_spent_minutes": {
            "ui:widget": "updown"
        }
    }',
    '{
        "completion_points": 50,
        "quality_multipliers": {
            "insights_per_item": 10,
            "big_idea_min_chars": 50,
            "bold_action_min_chars": 50
        },
        "time_bonus": {
            "under_5_minutes": 10,
            "under_10_minutes": 5
        }
    }',
    'worksheet',
    false,
    8
) ON CONFLICT (template_name) DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify tables were created successfully
DO $$
BEGIN
    RAISE NOTICE 'Schema-driven forms migration completed successfully!';
    RAISE NOTICE 'Created tables: core.form_templates, core.user_files';
    RAISE NOTICE 'Extended table: core.universal_inputs (added attached_files column)';
    RAISE NOTICE 'Seeded template: video-reflection-worksheet';
END $$;