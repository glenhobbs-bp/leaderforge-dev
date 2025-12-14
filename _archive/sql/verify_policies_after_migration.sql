-- VERIFY AND FIX RLS POLICIES AFTER CONTEXT->TENANT MIGRATION
-- Run this to check if any policies still reference old context_key columns

-- 1. CHECK ALL POLICIES FOR CONTEXT_KEY REFERENCES
SELECT
    schemaname,
    tablename,
    policyname,
    qual as policy_condition,
    with_check as check_condition
FROM pg_policies
WHERE
    qual ILIKE '%context_key%'
    OR with_check ILIKE '%context_key%'
ORDER BY schemaname, tablename, policyname;

-- 2. CHECK POLICIES FOR TABLE NAMES THAT SHOULD BE UPDATED
SELECT
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE
    tablename IN ('context_configs', 'context_access_policies')
ORDER BY schemaname, tablename, policyname;

-- 3. FIX ANY REMAINING CONTEXT_KEY REFERENCES IN POLICIES
-- Update entitlements policies if they still reference context_key
DROP POLICY IF EXISTS "user_can_select_context_entitlements" ON core.entitlements;
CREATE POLICY "user_can_select_tenant_entitlements"
  ON core.entitlements
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- Update content access policies if they still reference context_key
DROP POLICY IF EXISTS "user_can_select_context_content_access_policies" ON core.tenant_access_policies;
CREATE POLICY "user_can_select_tenant_content_access_policies"
  ON core.tenant_access_policies
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- 4. UPDATE ANY POLICIES ON OLD TABLE NAMES
-- For context_configs -> tenants table
DROP POLICY IF EXISTS "Allow authenticated read" ON core.context_configs;
CREATE POLICY "Allow authenticated read" ON core.tenants
  FOR SELECT
  TO authenticated
  USING (true);

-- For context_access_policies -> tenant_access_policies table
DROP POLICY IF EXISTS "Allow authenticated read" ON core.context_access_policies;
CREATE POLICY "Allow authenticated read" ON core.tenant_access_policies
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. VERIFICATION QUERY - Should return no rows if migration is complete
SELECT
    'ALERT: Policy still references context_key' as warning,
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE
    qual ILIKE '%context_key%'
    OR with_check ILIKE '%context_key%';

-- 6. FINAL CHECK - List all policies on migrated tables
SELECT
    'FINAL STATUS:' as status,
    schemaname,
    tablename,
    policyname,
    roles
FROM pg_policies
WHERE
    tablename IN ('entitlements', 'tenants', 'tenant_access_policies', 'nav_options', 'conversation_events', 'conversations', 'user_progress')
    AND schemaname = 'core'
ORDER BY tablename, policyname;

-- Verify policies and permissions after migration
-- This script checks the current state of user_progress table

\echo '=== TABLE STRUCTURE ==='
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'core'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

\echo '=== RLS STATUS ==='
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'core'
AND tablename = 'user_progress';

\echo '=== CURRENT POLICIES ==='
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

\echo '=== TABLE PERMISSIONS ==='
SELECT
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges
WHERE table_schema = 'core'
AND table_name = 'user_progress'
AND grantee IN ('service_role', 'authenticated', 'anon');

\echo '=== UNIQUE CONSTRAINTS ==='
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'core'
AND tc.table_name = 'user_progress'
AND tc.constraint_type = 'UNIQUE';

\echo '=== TEST QUERY AS SERVICE_ROLE ==='
SET ROLE service_role;
SELECT COUNT(*) as total_records FROM core.user_progress;
RESET ROLE;

\echo '=== SAMPLE DATA ==='
SELECT
    id,
    user_id,
    content_id,
    tenant_key,
    progress_type
FROM core.user_progress
LIMIT 3;