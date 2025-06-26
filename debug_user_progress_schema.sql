-- DIAGNOSTIC SCRIPT FOR USER_PROGRESS TABLE ISSUES
-- Run this to diagnose the 406 error from Supabase

-- 1. Check user_progress table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'core'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- 2. Check if user_progress table exists and is accessible
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'core'
AND tablename = 'user_progress';

-- 3. Check RLS policies on user_progress table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'core'
AND tablename = 'user_progress';

-- 4. Check constraints on user_progress table
SELECT
    constraint_name,
    constraint_type,
    table_schema,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'core'
AND table_name = 'user_progress';

-- 5. Check indexes on user_progress table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'core'
AND tablename = 'user_progress';

-- 6. Test a simple select to see what error we get
-- Uncomment to test:
-- SELECT COUNT(*) FROM core.user_progress LIMIT 1;

-- 7. Check if we can insert test data
-- Uncomment to test:
-- INSERT INTO core.user_progress (user_id, content_id, tenant_key, progress_percentage, is_completed, metadata)
-- VALUES ('test-user', 'test-content', 'leaderforge', 0, false, '{}')
-- ON CONFLICT (user_id, content_id, tenant_key) DO NOTHING;