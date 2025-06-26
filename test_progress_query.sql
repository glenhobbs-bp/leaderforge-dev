-- Test script to diagnose the 406 error from UserProgressTool
-- This simulates the exact query that's failing

-- 1. Check if user_progress table exists and structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- 2. Check RLS policies on user_progress table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'core'
  AND tablename = 'user_progress';

-- 3. Check table permissions for service_role
SELECT grantee, privilege_type, is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'core'
  AND table_name = 'user_progress'
  AND grantee = 'service_role';

-- 4. Test the exact query that's failing with service_role context
-- This should simulate: .eq('user_id', userId).eq('content_id', contentId).eq('tenant_key', contextKey)

SELECT COUNT(*) as total_records FROM core.user_progress;
SELECT COUNT(*) as tenant_key_records FROM core.user_progress WHERE tenant_key = 'leaderforge';

-- 5. Check if the specific user exists and has progress
SELECT
    user_id,
    content_id,
    tenant_key,
    progress_percentage,
    created_at
FROM core.user_progress
WHERE user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c'
LIMIT 5;

-- 6. Test exact failing query pattern
SELECT *
FROM core.user_progress
WHERE user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c'
  AND content_id = '3.1 Creating a Culture of Trust'
  AND tenant_key = 'leaderforge';

-- 7. Check auth configuration
SELECT current_setting('role') as current_role;
SELECT auth.uid() as current_user_id;

-- 8. Check RLS status
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'user_progress'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core');