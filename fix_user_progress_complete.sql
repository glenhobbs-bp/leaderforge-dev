-- Complete fix for user_progress table structure
-- This script ensures the table is properly migrated and has all necessary constraints

BEGIN;

-- 1. First, check and fix table structure
DO $$
BEGIN
    -- Check if context_key column still exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'context_key'
    ) THEN
        ALTER TABLE core.user_progress DROP COLUMN context_key;
        RAISE NOTICE 'Dropped context_key column';
    END IF;

    -- Ensure tenant_key column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'tenant_key'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN tenant_key TEXT NOT NULL DEFAULT 'leaderforge';
        RAISE NOTICE 'Added tenant_key column';
    END IF;
END $$;

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add progress_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'progress_type'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN progress_type TEXT DEFAULT 'video';
        RAISE NOTICE 'Added progress_type column';
    END IF;

    -- Add completion_count if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'completion_count'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN completion_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added completion_count column';
    END IF;

    -- Add total_sessions if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'total_sessions'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN total_sessions INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_sessions column';
    END IF;

    -- Add started_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'started_at'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added started_at column';
    END IF;

    -- Add sync_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'sync_status'
    ) THEN
        -- First create the enum type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
            CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'conflict');
            RAISE NOTICE 'Created sync_status enum type';
        END IF;

        ALTER TABLE core.user_progress ADD COLUMN sync_status sync_status DEFAULT 'synced';
        RAISE NOTICE 'Added sync_status column';
    END IF;

    -- Add last_synced_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'last_synced_at'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN last_synced_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added last_synced_at column';
    END IF;

    -- Add notes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Ensure metadata column exists and is JSONB
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE core.user_progress ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column';
    END IF;
END $$;

-- 3. Add unique constraint for upserts
DO $$
BEGIN
    -- Drop existing unique constraint if it exists with wrong columns
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND constraint_name = 'user_progress_unique_content'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE core.user_progress DROP CONSTRAINT user_progress_unique_content;
        RAISE NOTICE 'Dropped old unique constraint';
    END IF;

    -- Add the correct unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND constraint_name = 'user_progress_unique_tenant'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE core.user_progress ADD CONSTRAINT user_progress_unique_tenant
        UNIQUE (user_id, content_id, tenant_key);
        RAISE NOTICE 'Added unique constraint on (user_id, content_id, tenant_key)';
    END IF;
END $$;

-- 4. Update RLS policies
DROP POLICY IF EXISTS "Users can read own progress" ON core.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON core.user_progress;
DROP POLICY IF EXISTS "Service role full access" ON core.user_progress;

-- Enable RLS
ALTER TABLE core.user_progress ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies with proper type handling
CREATE POLICY "Service role full access" ON core.user_progress
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can read own progress" ON core.user_progress
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own progress" ON core.user_progress
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- 5. Grant permissions
GRANT ALL ON core.user_progress TO service_role;
GRANT SELECT, INSERT, UPDATE ON core.user_progress TO authenticated;

-- 6. Verify the structure
SELECT
    'Table structure verification:' AS verification,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'core'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

COMMIT;

-- Final verification query
SELECT
    'Migration completed successfully' AS status,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'core'
AND table_name = 'user_progress';