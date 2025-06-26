-- Add constraints and RLS policies for user_progress table
-- Assumes table structure has already been migrated

BEGIN;

-- 1. Add unique constraint for upserts
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
        AND constraint_name = 'user_progress_user_content_tenant_unique'
        AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE core.user_progress ADD CONSTRAINT user_progress_user_content_tenant_unique
        UNIQUE (user_id, content_id, tenant_key);
        RAISE NOTICE 'Added unique constraint on (user_id, content_id, tenant_key)';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in constraint creation: %', SQLERRM;
        ROLLBACK;
        RETURN;
END $$;

-- 2. Enable RLS and create policies
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE core.user_progress ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on core.user_progress';

    -- Drop existing policies to start fresh
    DROP POLICY IF EXISTS "service_role_all_access" ON core.user_progress;
    DROP POLICY IF EXISTS "users_own_data_select" ON core.user_progress;
    DROP POLICY IF EXISTS "users_own_data_insert" ON core.user_progress;
    DROP POLICY IF EXISTS "users_own_data_update" ON core.user_progress;
    DROP POLICY IF EXISTS "users_own_data_delete" ON core.user_progress;
    RAISE NOTICE 'Dropped existing RLS policies';

    -- Service role gets full access (for agent tools)
    CREATE POLICY "service_role_all_access" ON core.user_progress
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
    RAISE NOTICE 'Created service_role_all_access policy';

    -- Authenticated users can only access their own data
    -- Cast user_id (text) to UUID for comparison with auth.uid()
    CREATE POLICY "users_own_data_select" ON core.user_progress
    FOR SELECT
    TO authenticated
    USING (user_id::uuid = auth.uid());
    RAISE NOTICE 'Created users_own_data_select policy';

    CREATE POLICY "users_own_data_insert" ON core.user_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id::uuid = auth.uid());
    RAISE NOTICE 'Created users_own_data_insert policy';

    CREATE POLICY "users_own_data_update" ON core.user_progress
    FOR UPDATE
    TO authenticated
    USING (user_id::uuid = auth.uid())
    WITH CHECK (user_id::uuid = auth.uid());
    RAISE NOTICE 'Created users_own_data_update policy';

    CREATE POLICY "users_own_data_delete" ON core.user_progress
    FOR DELETE
    TO authenticated
    USING (user_id::uuid = auth.uid());
    RAISE NOTICE 'Created users_own_data_delete policy';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in RLS policy creation: %', SQLERRM;
        ROLLBACK;
        RETURN;
END $$;

-- 3. Grant necessary permissions
DO $$
BEGIN
    -- Grant permissions to service role
    GRANT ALL ON TABLE core.user_progress TO service_role;
    RAISE NOTICE 'Granted ALL privileges to service_role';

    -- Grant permissions to authenticated users
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.user_progress TO authenticated;
    RAISE NOTICE 'Granted SELECT, INSERT, UPDATE, DELETE privileges to authenticated';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in permission grants: %', SQLERRM;
        ROLLBACK;
        RETURN;
END $$;

-- 4. Verification
SELECT
    'Migration completed successfully' AS status,
    COUNT(*) as total_constraints
FROM information_schema.table_constraints
WHERE table_schema = 'core'
AND table_name = 'user_progress'
AND constraint_type = 'UNIQUE';

COMMIT;