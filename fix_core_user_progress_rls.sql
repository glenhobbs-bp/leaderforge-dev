-- Fix RLS policies on core.user_progress table
-- This script ensures the table exists and has proper RLS configuration

-- First ensure the table exists (based on the structure you showed earlier)
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS core.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id TEXT NOT NULL,
    context_key TEXT NOT NULL,
    progress_type TEXT NOT NULL DEFAULT 'video',
    progress_percentage INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    sync_status TEXT DEFAULT 'synced',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_content_context UNIQUE (user_id, content_id, context_key),
    CONSTRAINT valid_progress_percentage CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    CONSTRAINT valid_sync_status CHECK (sync_status IN ('synced', 'pending', 'conflict'))
);

-- Enable RLS on the table
ALTER TABLE core.user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own progress" ON core.user_progress;
DROP POLICY IF EXISTS "Service role full access" ON core.user_progress;

-- Create RLS policies that allow users to manage their own progress
CREATE POLICY "Users can manage own progress" ON core.user_progress
FOR ALL
USING (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role full access" ON core.user_progress
FOR ALL
TO service_role
USING (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_progress TO authenticated;
GRANT USAGE ON SCHEMA core TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON core.user_progress TO service_role;
GRANT ALL ON SCHEMA core TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_context ON core.user_progress(user_id, context_key);
CREATE INDEX IF NOT EXISTS idx_user_progress_content ON core.user_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON core.user_progress(completed_at) WHERE completed_at IS NOT NULL;

-- Verify the setup
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    tableowner
FROM pg_tables
WHERE schemaname = 'core' AND tablename = 'user_progress';

-- Check policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'core' AND tablename = 'user_progress';