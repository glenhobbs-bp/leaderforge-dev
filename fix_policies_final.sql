-- FINAL POLICY FIX - Only update policies on existing tables
-- This avoids errors from trying to update policies on renamed/non-existent tables

-- 1. IDENTIFY EXACTLY WHICH POLICIES STILL HAVE CONTEXT_KEY
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

-- 2. CHECK WHICH TABLES ACTUALLY EXIST
SELECT 'Existing tables:' as status, tablename
FROM pg_tables
WHERE schemaname = 'core'
AND tablename IN ('entitlements', 'tenants', 'tenant_access_policies', 'nav_options', 'conversation_events', 'conversations', 'user_progress')
ORDER BY tablename;

-- 3. FIX ENTITLEMENTS POLICIES (table definitely exists)
DROP POLICY IF EXISTS "user_can_select_context_entitlements" ON core.entitlements;
CREATE POLICY "user_can_select_tenant_entitlements"
  ON core.entitlements
  FOR SELECT
  USING (
    tenant_key = current_setting('app.current_tenant', true)
  );

-- 4. FIX TENANT_ACCESS_POLICIES POLICIES (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'core' AND tablename = 'tenant_access_policies') THEN
    DROP POLICY IF EXISTS "user_can_select_context_content_access_policies" ON core.tenant_access_policies;
    DROP POLICY IF EXISTS "user_can_select_tenant_content_access_policies" ON core.tenant_access_policies;

    CREATE POLICY "user_can_select_tenant_content_access_policies"
      ON core.tenant_access_policies
      FOR SELECT
      USING (
        tenant_key = current_setting('app.current_tenant', true)
      );

    RAISE NOTICE 'Fixed policies on core.tenant_access_policies';
  ELSE
    RAISE NOTICE 'Table core.tenant_access_policies does not exist, skipping';
  END IF;
END $$;

-- 5. FIX CONVERSATION POLICIES (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'core' AND tablename = 'conversations') THEN
    DROP POLICY IF EXISTS "user_can_access_context_conversations" ON core.conversations;
    CREATE POLICY "user_can_access_tenant_conversations"
      ON core.conversations
      FOR SELECT
      USING (
        tenant_key = current_setting('app.current_tenant', true)
      );
    RAISE NOTICE 'Fixed policies on core.conversations';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'core' AND tablename = 'conversation_events') THEN
    DROP POLICY IF EXISTS "user_can_access_context_conversation_events" ON core.conversation_events;
    CREATE POLICY "user_can_access_tenant_conversation_events"
      ON core.conversation_events
      FOR SELECT
      USING (
        tenant_key = current_setting('app.current_tenant', true)
      );
    RAISE NOTICE 'Fixed policies on core.conversation_events';
  END IF;
END $$;

-- 6. VERIFICATION - Check remaining context_key references
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