-- FIX REMAINING CONTEXT_KEY REFERENCES IN POLICIES
-- This script will identify and update the specific policies that still reference context_key

-- 1. FIRST, IDENTIFY EXACTLY WHICH POLICIES STILL HAVE CONTEXT_KEY
SELECT
    'FOUND: Policy with context_key reference' as alert,
    schemaname,
    tablename,
    policyname,
    qual as policy_condition
FROM pg_policies
WHERE
    (qual ILIKE '%context_key%' OR with_check ILIKE '%context_key%')
    AND schemaname = 'core';

-- 2. FIX ENTITLEMENTS POLICIES
-- Drop old context-based policy and create tenant-based one
DROP POLICY IF EXISTS "user_can_select_context_entitlements" ON core.entitlements;
DROP POLICY IF EXISTS "user_can_select_tenant_entitlements" ON core.entitlements;

CREATE POLICY "user_can_select_tenant_entitlements"
  ON core.entitlements
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- 3. FIX TENANT_ACCESS_POLICIES TABLE (formerly context_access_policies)
-- Check if the table was renamed correctly
SELECT 'Checking table existence' as status, tablename
FROM pg_tables
WHERE schemaname = 'core'
AND tablename IN ('context_access_policies', 'tenant_access_policies');

-- Fix policies on tenant_access_policies if they exist
DROP POLICY IF EXISTS "user_can_select_context_content_access_policies" ON core.tenant_access_policies;
DROP POLICY IF EXISTS "user_can_select_tenant_content_access_policies" ON core.tenant_access_policies;

CREATE POLICY "user_can_select_tenant_content_access_policies"
  ON core.tenant_access_policies
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- 4. IF CONTEXT_ACCESS_POLICIES TABLE STILL EXISTS, FIX ITS POLICIES
DROP POLICY IF EXISTS "user_can_select_context_content_access_policies" ON core.context_access_policies;
CREATE POLICY "user_can_select_tenant_content_access_policies_legacy"
  ON core.context_access_policies
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- 5. CHECK CONVERSATION TABLES FOR CONTEXT_KEY REFERENCES
DROP POLICY IF EXISTS "user_can_access_context_conversations" ON core.conversations;
CREATE POLICY "user_can_access_tenant_conversations"
  ON core.conversations
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

DROP POLICY IF EXISTS "user_can_access_context_conversation_events" ON core.conversation_events;
CREATE POLICY "user_can_access_tenant_conversation_events"
  ON core.conversation_events
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- 6. VERIFICATION - Check what policies still have context_key references
SELECT
    'REMAINING: Policies still with context_key' as status,
    schemaname,
    tablename,
    policyname,
    qual as policy_condition
FROM pg_policies
WHERE
    (qual ILIKE '%context_key%' OR with_check ILIKE '%context_key%')
    AND schemaname = 'core';

-- 7. FINAL STATUS CHECK
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'core'
            AND (qual ILIKE '%context_key%' OR with_check ILIKE '%context_key%')
        ) THEN '❌ STILL INCOMPLETE: Check remaining policies above'
        ELSE '✅ MIGRATION COMPLETE: All policies now use tenant_key'
    END as final_migration_status;