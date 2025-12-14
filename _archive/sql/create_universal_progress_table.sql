-- Create Universal Progress Table in Core Schema
-- Based on excellent existing modules.user_progress structure with universal enhancements

-- First, check if sync_status enum exists in core schema, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
        CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');
    END IF;
END $$;

-- Create the enhanced universal progress table
CREATE TABLE core.user_progress (
    -- Core identifiers (keep existing structure)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL, -- Changed from UUID to TEXT for flexibility
    context_key TEXT NOT NULL,

    -- NEW: Universal content type differentiation
    progress_type TEXT NOT NULL DEFAULT 'video'
        CHECK (progress_type IN ('video', 'quiz', 'reading', 'worksheet', 'course', 'custom')),

    -- Universal progress tracking (keep existing)
    progress_percentage INTEGER DEFAULT 0
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completion_count INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,

    -- Universal timestamps (keep existing)
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Universal user features (keep existing)
    notes TEXT,

    -- NEW: Universal metadata for type-specific data
    metadata JSONB DEFAULT '{}',
    -- Examples:
    -- video: {"watchTimeSeconds": 120, "lastPositionSeconds": 45, "bookmarks": [{"time": 30, "note": "key point"}]}
    -- quiz: {"score": 85, "answers": {...}, "attempts": 2}
    -- reading: {"scrollPosition": 0.75, "highlights": [...]}

    -- Universal sync capabilities (keep existing)
    sync_status sync_status DEFAULT 'synced',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Maintain unique constraint
    CONSTRAINT unique_user_content_context UNIQUE (user_id, content_id, context_key)
);

-- Recreate all excellent existing indexes
CREATE INDEX idx_user_progress_user ON core.user_progress USING btree (user_id);
CREATE INDEX idx_user_progress_content ON core.user_progress USING btree (content_id);
CREATE INDEX idx_user_progress_context ON core.user_progress USING btree (context_key);

-- NEW: Index for progress type queries
CREATE INDEX idx_user_progress_type ON core.user_progress USING btree (progress_type);

-- Recreate smart partial indexes
CREATE INDEX idx_user_progress_completed ON core.user_progress USING btree (completed_at)
    WHERE (completed_at IS NOT NULL);

CREATE INDEX idx_user_progress_sync ON core.user_progress USING btree (sync_status)
    WHERE (sync_status <> 'synced'::sync_status);

CREATE INDEX idx_user_progress_active ON core.user_progress USING btree (user_id, last_viewed_at)
    WHERE (completed_at IS NULL);

-- NEW: Index for metadata queries (GIN for JSONB)
CREATE INDEX idx_user_progress_metadata ON core.user_progress USING gin (metadata);

-- NEW: Composite index for agent queries (user + context + type)
CREATE INDEX idx_user_progress_agent_lookup ON core.user_progress USING btree (user_id, context_key, progress_type);

-- Enable Row Level Security (following LeaderForge patterns)
ALTER TABLE core.user_progress ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy - users can only see their own progress
CREATE POLICY "Users can manage own progress" ON core.user_progress
    FOR ALL USING (user_id = auth.uid());

-- Service role policy for agent access
CREATE POLICY "Service role full access" ON core.user_progress
    FOR ALL TO service_role USING (true);

-- Add helpful comments
COMMENT ON TABLE core.user_progress IS 'Universal user progress tracking for all content types across contexts';
COMMENT ON COLUMN core.user_progress.progress_type IS 'Type of content: video, quiz, reading, worksheet, course, custom';
COMMENT ON COLUMN core.user_progress.metadata IS 'Type-specific data: video timing, quiz scores, reading position, etc.';
COMMENT ON COLUMN core.user_progress.content_id IS 'Flexible identifier - can be UUID, slug, or external ID';
COMMENT ON COLUMN core.user_progress.context_key IS 'Module/context identifier for multi-tenant progress tracking';

-- Create function to update last_viewed_at automatically
CREATE OR REPLACE FUNCTION core.update_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_viewed_at = NOW();
    NEW.last_synced_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_progress_timestamp_trigger
    BEFORE UPDATE ON core.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION core.update_progress_timestamp();