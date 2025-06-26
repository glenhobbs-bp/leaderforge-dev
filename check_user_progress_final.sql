-- Final verification of user_progress table structure and policies

-- 1. Check table structure
SELECT 'TABLE STRUCTURE:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'core'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT 'RLS STATUS:' as info;
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'core'
AND tablename = 'user_progress';

-- 3. Check current policies
SELECT 'CURRENT POLICIES:' as info;
SELECT
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'core'
AND tablename = 'user_progress';

-- 4. Check permissions
SELECT 'TABLE PERMISSIONS:' as info;
SELECT
    privilege_type,
    grantee
FROM information_schema.table_privileges
WHERE table_schema = 'core'
AND table_name = 'user_progress'
AND grantee IN ('service_role', 'authenticated');

-- 5. Check constraints
SELECT 'UNIQUE CONSTRAINTS:' as info;
SELECT
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'core'
AND tc.table_name = 'user_progress'
AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name;