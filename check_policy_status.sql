-- CHECK POLICY STATUS AFTER CONTEXT->TENANT MIGRATION
-- This script only verifies the current state without making changes

-- 1. CHECK FOR ANY REMAINING CONTEXT_KEY REFERENCES IN POLICIES
SELECT
    'WARNING: Policy still references context_key' as alert_type,
    schemaname,
    tablename,
    policyname,
    qual as policy_condition
FROM pg_policies
WHERE
    (qual ILIKE '%context_key%' OR with_check ILIKE '%context_key%')
    AND schemaname = 'core'
ORDER BY tablename, policyname;

-- 2. VERIFY POLICIES ON MIGRATED TABLES USE TENANT_KEY
SELECT
    'INFO: Policies on migrated tables' as status,
    schemaname,
    tablename,
    policyname,
    CASE
        WHEN qual ILIKE '%tenant_key%' THEN 'Uses tenant_key ✅'
        WHEN qual ILIKE '%context_key%' THEN 'Still uses context_key ❌'
        ELSE 'No key reference'
    END as key_reference
FROM pg_policies
WHERE
    schemaname = 'core'
    AND tablename IN ('entitlements', 'tenants', 'tenant_access_policies', 'nav_options', 'conversation_events', 'conversations', 'user_progress')
ORDER BY tablename, policyname;

-- 3. CHECK IF OLD TABLE NAMES STILL HAVE POLICIES
SELECT
    'WARNING: Policies on old table names' as alert_type,
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE
    schemaname = 'core'
    AND tablename IN ('context_configs', 'context_access_policies')
ORDER BY tablename, policyname;

-- 4. SUMMARY: COUNT POLICIES BY TABLE
SELECT
    'SUMMARY: Policy count by table' as summary,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE
    schemaname = 'core'
    AND tablename IN ('entitlements', 'tenants', 'tenant_access_policies', 'nav_options', 'conversation_events', 'conversations', 'user_progress', 'context_configs', 'context_access_policies')
GROUP BY tablename
ORDER BY tablename;

-- 5. FINAL STATUS CHECK
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'core'
            AND (qual ILIKE '%context_key%' OR with_check ILIKE '%context_key%')
        ) THEN '❌ MIGRATION INCOMPLETE: Some policies still reference context_key'
        ELSE '✅ MIGRATION COMPLETE: All policies updated to use tenant_key'
    END as migration_status;