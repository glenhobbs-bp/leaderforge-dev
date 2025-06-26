-- FIX USER_PROGRESS RLS POLICIES
-- This should resolve the 406 error from Supabase

BEGIN;

-- 1. Enable RLS on user_progress table
ALTER TABLE core.user_progress ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies that might be outdated
DROP POLICY IF EXISTS "Users can access own progress" ON core.user_progress;
DROP POLICY IF EXISTS "Service role can access all progress" ON core.user_progress;
DROP POLICY IF EXISTS "Allow authenticated read" ON core.user_progress;
DROP POLICY IF EXISTS "Allow authenticated write" ON core.user_progress;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON core.user_progress;
DROP POLICY IF EXISTS "Enable write access for users based on user_id" ON core.user_progress;

-- 3. Create comprehensive RLS policies for user_progress

-- Allow service_role to do everything (for backend operations)
CREATE POLICY "service_role_all_access" ON core.user_progress
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read their own progress
CREATE POLICY "users_read_own_progress" ON core.user_progress
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);

-- Allow authenticated users to insert their own progress
CREATE POLICY "users_insert_own_progress" ON core.user_progress
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid()::text);

-- Allow authenticated users to update their own progress
CREATE POLICY "users_update_own_progress" ON core.user_progress
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

-- Allow authenticated users to delete their own progress
CREATE POLICY "users_delete_own_progress" ON core.user_progress
    FOR DELETE TO authenticated
    USING (user_id = auth.uid()::text);

-- 4. Grant necessary permissions
GRANT ALL ON core.user_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_progress TO authenticated;

-- 5. Verify policies were created
DO $$
BEGIN
    RAISE NOTICE 'RLS policies created for core.user_progress table';
    RAISE NOTICE 'Service role has full access, authenticated users can manage their own progress';
END $$;

COMMIT;

-- VERIFICATION QUERIES (run after applying)
-- SELECT policyname, roles, cmd FROM pg_policies WHERE schemaname = 'core' AND tablename = 'user_progress';
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'core' AND table_name = 'user_progress';