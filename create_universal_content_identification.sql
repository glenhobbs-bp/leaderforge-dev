-- Universal Content Identification Migration
-- Implements ADR-0010: Universal Content Identification - UUIDs with Human-Readable Keys
--
-- This migration adds:
-- 1. content_uuid (Primary ID) - Universal unique identifier for all content operations
-- 2. content_key (Human-Readable Key) - Stable, readable identifier for routing/config
-- 3. Updates user_progress to use content_uuid instead of mixed identifiers
-- 4. Updates universal_inputs to use content_uuid for worksheet correlation

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Add Universal Content Identification to existing content tables
-- Note: In a real CMS, this would be a dedicated content table
-- For now, we'll simulate with a content registry table

CREATE TABLE IF NOT EXISTS core.content_registry (
    content_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_key TEXT UNIQUE NOT NULL, -- Human-readable stable identifier
    title TEXT NOT NULL, -- Display name for UI
    content_type TEXT NOT NULL, -- 'video', 'article', 'assessment', etc.
    tenant_key TEXT NOT NULL,

    -- Content metadata
    description TEXT,
    duration_minutes INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT,

    -- External references (for migration compatibility)
    legacy_video_id TEXT, -- Maps to old video IDs like 'leadership-fundamentals-01'
    legacy_title_id TEXT, -- Maps to old content titles like '5.1 Deep Work Part 1'

    -- Platform-specific data (can be JSON for flexibility)
    platform_data JSONB DEFAULT '{}',

    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Tenant isolation
    CONSTRAINT fk_content_tenant FOREIGN KEY (tenant_key) REFERENCES core.tenants(tenant_key) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_registry_tenant ON core.content_registry(tenant_key);
CREATE INDEX IF NOT EXISTS idx_content_registry_type ON core.content_registry(content_type);
CREATE INDEX IF NOT EXISTS idx_content_registry_key ON core.content_registry(content_key);
CREATE INDEX IF NOT EXISTS idx_content_registry_legacy_video ON core.content_registry(legacy_video_id) WHERE legacy_video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_registry_legacy_title ON core.content_registry(legacy_title_id) WHERE legacy_title_id IS NOT NULL;

-- Step 2: Migrate existing LeaderForge content to Universal Content ID system
-- This creates content records for all the Leadership Library videos we see in logs

INSERT INTO core.content_registry (content_key, title, content_type, tenant_key, legacy_title_id, legacy_video_id, description, category, platform_data) VALUES
    -- Leadership Library Content (based on terminal logs)
    ('deep-work-part-1', '5.1 Deep Work Part 1', 'video', 'leaderforge', '5.1 Deep Work Part 1', 'leadership-fundamentals-01', 'Learn the fundamentals of deep work and focused productivity', 'productivity', '{"section": "5", "order": 1}'),
    ('power-start-projects', '4.3 How to Power START Projects', 'video', 'leaderforge', '4.3 How to Power START Projects', '2258888', 'Master the art of project initiation and momentum building', 'project-management', '{"section": "4", "order": 3}'),
    ('power-of-buckets', '4.2 The Power of Buckets', 'video', 'leaderforge', '4.2 The Power of Buckets', NULL, 'Organize your work with the bucket methodology', 'organization', '{"section": "4", "order": 2}'),
    ('cue-management', '4.1 CUE Management - A Powerful Self Management Tool', 'video', 'leaderforge', '4.1 CUE Management - A Powerful Self Management Tool', NULL, 'Self-management through the CUE framework', 'self-management', '{"section": "4", "order": 1}'),
    ('change-agent', '3.4 How To Be A Change Agent', 'video', 'leaderforge', '3.4 How To Be A Change Agent', NULL, 'Leading organizational change effectively', 'change-management', '{"section": "3", "order": 4}'),
    ('deciding-done', '3.3 Deciding What Done Means', 'video', 'leaderforge', '3.3 Deciding What Done Means', NULL, 'Define completion criteria for better outcomes', 'clarity', '{"section": "3", "order": 3}'),
    ('five-second-rule', '3.2 The 5-Second Rule', 'video', 'leaderforge', '3.2 The 5-Second Rule', NULL, 'Overcome hesitation with the 5-second technique', 'productivity', '{"section": "3", "order": 2}'),
    ('culture-of-trust', '3.1 Creating a Culture of Trust', 'video', 'leaderforge', '3.1 Creating a Culture of Trust', NULL, 'Build trust within your team and organization', 'culture', '{"section": "3", "order": 1}'),
    ('two-hats-relational', '2.4 Two Hats to Create Relational Space', 'video', 'leaderforge', '2.4 Two Hats to Create Relational Space', NULL, 'Balance task and relationship leadership', 'relationships', '{"section": "2", "order": 4}'),
    ('triple-bottom-line', '2.3 The Triple Bottom Line', 'video', 'leaderforge', '2.3 The Triple Bottom Line', NULL, 'Sustainable business through people, planet, profit', 'sustainability', '{"section": "2", "order": 3}'),
    ('one-line-job-descriptions', '2.2 One-Line Job Descriptions', 'video', 'leaderforge', '2.2 One-Line Job Descriptions', NULL, 'Clarify roles with concise job definitions', 'clarity', '{"section": "2", "order": 2}'),
    ('what-are-we-doing', '2.1 What On Earth Are We Doing?', 'video', 'leaderforge', '2.1 What On Earth Are We Doing?', NULL, 'Find purpose and direction in your work', 'purpose', '{"section": "2", "order": 1}'),
    ('courageous-leadership', '1.4 Courageous Leadership', 'video', 'leaderforge', '1.4 Courageous Leadership', NULL, 'Lead with courage in challenging situations', 'courage', '{"section": "1", "order": 4}'),
    ('leading-three-types', '1.3 Leading 3 Types of People', 'video', 'leaderforge', '1.3 Leading 3 Types of People', NULL, 'Adapt your leadership style to different personalities', 'leadership-styles', '{"section": "1", "order": 3}'),
    ('power-of-reframing', '1.2 The Power of Reframing', 'video', 'leaderforge', '1.2 The Power of Reframing', NULL, 'Change perspective to unlock new solutions', 'mindset', '{"section": "1", "order": 2}'),
    ('success-to-prime', '1.1 Moving From Success to Prime', 'video', 'leaderforge', '1.1 Moving From Success to Prime', NULL, 'Transition from individual success to leadership excellence', 'leadership-fundamentals', '{"section": "1", "order": 1}'),
    ('delight-at-work', '4.4 Finding Delight at Work: Joy Table', 'video', 'leaderforge', '4.4 Finding Delight at Work: Joy Table', NULL, 'Discover joy and fulfillment in your work', 'fulfillment', '{"section": "4", "order": 4}'),
    ('deep-work-part-2', '5.2 Deep Work Part 2', 'video', 'leaderforge', '5.2 Deep Work Part 2', NULL, 'Advanced deep work techniques and habits', 'productivity', '{"section": "5", "order": 2}'),
    ('art-of-showing-up', '5.3 Perfecting the Art of Showing Up', 'video', 'leaderforge', '5.3 Perfecting the Art of Showing Up', NULL, 'Consistent presence and engagement strategies', 'presence', '{"section": "5", "order": 3}'),
    ('brilliant-project-manager', '5.4 How to Be a Brilliant Project Manager', 'video', 'leaderforge', '5.4 How to Be a Brilliant Project Manager', NULL, 'Excel in project management and delivery', 'project-management', '{"section": "5", "order": 4}')
ON CONFLICT (content_key) DO NOTHING;

-- Step 3: Update user_progress table to use content_uuid
-- Add new column for content_uuid
ALTER TABLE core.user_progress
ADD COLUMN IF NOT EXISTS content_uuid UUID;

-- Create foreign key relationship
ALTER TABLE core.user_progress
ADD CONSTRAINT IF NOT EXISTS fk_user_progress_content
FOREIGN KEY (content_uuid) REFERENCES core.content_registry(content_uuid) ON DELETE CASCADE;

-- Migrate existing progress records to use content_uuid
-- Map content_id (titles) to content_uuid from registry
UPDATE core.user_progress
SET content_uuid = cr.content_uuid
FROM core.content_registry cr
WHERE core.user_progress.content_id = cr.legacy_title_id
AND core.user_progress.content_uuid IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_content_uuid ON core.user_progress(content_uuid);

-- Step 4: Update universal_inputs to use content_uuid for worksheet correlation
-- Add content_uuid column
ALTER TABLE core.universal_inputs
ADD COLUMN IF NOT EXISTS content_uuid UUID;

-- Create foreign key relationship
ALTER TABLE core.universal_inputs
ADD CONSTRAINT IF NOT EXISTS fk_universal_inputs_content
FOREIGN KEY (content_uuid) REFERENCES core.content_registry(content_uuid) ON DELETE SET NULL;

-- Migrate existing worksheet submissions to use content_uuid
-- Extract video IDs from source_context and map to content_uuid
WITH worksheet_extracts AS (
    SELECT
        id,
        CASE
            WHEN source_context ~ '^worksheet:video-reflection:([^:]+)' THEN
                substring(source_context from '^worksheet:video-reflection:([^:]+)')
            ELSE NULL
        END as extracted_video_id
    FROM core.universal_inputs
    WHERE input_type = 'form'
    AND source_context LIKE 'worksheet:video-reflection:%'
    AND content_uuid IS NULL
)
UPDATE core.universal_inputs ui
SET content_uuid = cr.content_uuid
FROM worksheet_extracts we, core.content_registry cr
WHERE ui.id = we.id
AND (cr.legacy_video_id = we.extracted_video_id OR cr.legacy_title_id = we.extracted_video_id OR cr.content_key = we.extracted_video_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_universal_inputs_content_uuid ON core.universal_inputs(content_uuid);

-- Step 5: Create view for easy content lookup
CREATE OR REPLACE VIEW core.content_lookup AS
SELECT
    content_uuid,
    content_key,
    title,
    content_type,
    tenant_key,
    category,
    description,
    legacy_video_id,
    legacy_title_id,
    platform_data
FROM core.content_registry;

-- Step 6: Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION core.update_content_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_registry_updated_at ON core.content_registry;
CREATE TRIGGER trigger_content_registry_updated_at
    BEFORE UPDATE ON core.content_registry
    FOR EACH ROW
    EXECUTE FUNCTION core.update_content_registry_updated_at();

-- Step 7: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON core.content_registry TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.content_registry TO service_role;
GRANT SELECT ON core.content_lookup TO authenticated;
GRANT SELECT ON core.content_lookup TO service_role;

-- Step 8: Create RLS policies
ALTER TABLE core.content_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content from their tenant" ON core.content_registry
    FOR SELECT USING (
        tenant_key = (
            SELECT up.tenant_key
            FROM core.user_profiles up
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to content registry" ON core.content_registry
    FOR ALL USING (auth.role() = 'service_role');

-- Verification queries (comment out in production)
/*
-- Verify content registry population
SELECT content_key, title, legacy_title_id, legacy_video_id FROM core.content_registry ORDER BY content_key;

-- Verify progress migration
SELECT COUNT(*) as migrated_progress FROM core.user_progress WHERE content_uuid IS NOT NULL;

-- Verify worksheet migration
SELECT COUNT(*) as migrated_worksheets FROM core.universal_inputs WHERE content_uuid IS NOT NULL AND input_type = 'form';

-- Show worksheet correlation
SELECT
    ui.source_context,
    cr.content_key,
    cr.title
FROM core.universal_inputs ui
JOIN core.content_registry cr ON ui.content_uuid = cr.content_uuid
WHERE ui.input_type = 'form' AND ui.source_context LIKE 'worksheet:%'
LIMIT 10;
*/

-- Phase 1: Add content_id column to universal_inputs table
-- This implements the immediate fix from ADR-0011

ALTER TABLE universal_inputs
ADD COLUMN content_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_universal_inputs_content_id
ON universal_inputs(content_id);

-- Add index for combined lookups
CREATE INDEX IF NOT EXISTS idx_universal_inputs_user_content
ON universal_inputs(user_id, content_id);

-- Backfill existing records where possible
-- This maps video_id from input_data to content_id
UPDATE universal_inputs
SET content_id = input_data->>'video_id'
WHERE input_data->>'video_id' IS NOT NULL
AND content_id IS NULL;

-- Add comment to document the hybrid approach
COMMENT ON COLUMN universal_inputs.content_id IS 'Universal content identifier - Phase 1: content titles, Phase 2: UUIDs with CMS';