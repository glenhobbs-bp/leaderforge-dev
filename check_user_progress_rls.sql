-- Check RLS policies on core.user_progress table
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
WHERE schemaname = 'core' AND tablename = 'user_progress'
ORDER BY policyname;

-- Check if RLS is enabled on the table
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'core' AND tablename = 'user_progress';

-- Check table ownership
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'core' AND tablename = 'user_progress';

-- Check grants on the table
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'core' AND table_name = 'user_progress';

-- Check current database user and roles
SELECT current_user as current_db_user, session_user as session_user;

-- Check what roles the current user has
SELECT r.rolname
FROM pg_roles r
JOIN pg_auth_members m ON r.oid = m.roleid
JOIN pg_roles u ON u.oid = m.member
WHERE u.rolname = current_user;

-- Check if the table actually exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'core' AND table_name = 'user_progress'
ORDER BY ordinal_position;