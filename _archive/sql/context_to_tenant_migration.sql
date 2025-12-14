-- CONTEXT TO TENANT MIGRATION SCRIPT
-- Handles RLS policies, constraints, and all dependencies
-- BACKUP FIRST: pg_dump your_database > backup_before_context_migration.sql

BEGIN;

-- 1. DROP DEPENDENT RLS POLICIES FIRST
DROP POLICY IF EXISTS "user_can_select_context_entitlements" ON core.entitlements;
DROP POLICY IF EXISTS "Allow authenticated read" ON core.context_configs;
DROP POLICY IF EXISTS "Allow authenticated read" ON core.context_access_policies;

-- 2. CORE.ENTITLEMENTS
ALTER TABLE core.entitlements ADD COLUMN tenant_key TEXT;
UPDATE core.entitlements SET tenant_key = context_key;
ALTER TABLE core.entitlements ALTER COLUMN tenant_key SET NOT NULL;
CREATE INDEX idx_entitlements_tenant ON core.entitlements(tenant_key);
DROP INDEX IF EXISTS idx_entitlements_context;
ALTER TABLE core.entitlements DROP COLUMN context_key;

-- Recreate entitlements RLS policy with new column
CREATE POLICY "user_can_select_tenant_entitlements" ON core.entitlements
  FOR SELECT
  USING (tenant_key = current_setting('app.current_tenant', true));

-- 3. CORE.CONTEXT_CONFIGS → CORE.TENANTS (rename table and column)
ALTER TABLE core.context_configs RENAME TO tenants;
ALTER TABLE core.tenants RENAME COLUMN context_key TO tenant_key;

-- Recreate tenants RLS policy
CREATE POLICY "Allow authenticated read" ON core.tenants
  FOR SELECT TO authenticated, service_role
  USING (true);

-- 4. CORE.NAV_OPTIONS
ALTER TABLE core.nav_options ADD COLUMN tenant_key TEXT;
UPDATE core.nav_options SET tenant_key = context_key;
-- Update foreign key constraint
ALTER TABLE core.nav_options DROP CONSTRAINT IF EXISTS nav_options_context_key_fkey;
ALTER TABLE core.nav_options ADD CONSTRAINT nav_options_tenant_key_fkey
  FOREIGN KEY (tenant_key) REFERENCES core.tenants(tenant_key) ON DELETE CASCADE;
ALTER TABLE core.nav_options ALTER COLUMN tenant_key SET NOT NULL;
CREATE INDEX idx_nav_options_tenant ON core.nav_options(tenant_key);
DROP INDEX IF EXISTS idx_nav_options_context;
ALTER TABLE core.nav_options DROP COLUMN context_key;

-- 5. CORE.CONVERSATION_EVENTS
ALTER TABLE core.conversation_events ADD COLUMN tenant_key TEXT;
UPDATE core.conversation_events SET tenant_key = context_key;
ALTER TABLE core.conversation_events ALTER COLUMN tenant_key SET NOT NULL;
CREATE INDEX idx_conversation_events_tenant ON core.conversation_events(tenant_key);
DROP INDEX IF EXISTS idx_conversation_events_context;
ALTER TABLE core.conversation_events DROP COLUMN context_key;

-- 6. CORE.CONVERSATIONS
ALTER TABLE core.conversations ADD COLUMN tenant_key TEXT;
UPDATE core.conversations SET tenant_key = context_key;
ALTER TABLE core.conversations ALTER COLUMN tenant_key SET NOT NULL;
CREATE INDEX idx_conversations_tenant ON core.conversations(tenant_key);
DROP INDEX IF EXISTS idx_conversations_context;
ALTER TABLE core.conversations DROP COLUMN context_key;

-- 7. CORE.CONTEXT_ACCESS_POLICIES → CORE.TENANT_ACCESS_POLICIES
ALTER TABLE core.context_access_policies RENAME TO tenant_access_policies;
ALTER TABLE core.tenant_access_policies RENAME COLUMN context_key TO tenant_key;
ALTER TABLE core.tenant_access_policies DROP CONSTRAINT IF EXISTS unique_context_policy;
ALTER TABLE core.tenant_access_policies ADD CONSTRAINT unique_tenant_policy UNIQUE (tenant_key);

-- Recreate tenant access policies RLS policy
CREATE POLICY "Allow authenticated read" ON core.tenant_access_policies
  FOR SELECT TO authenticated, service_role
  USING (true);

-- 8. MODULES.CONTENT (available_contexts → available_tenants)
ALTER TABLE modules.content ADD COLUMN available_tenants TEXT[];
UPDATE modules.content SET available_tenants = available_contexts;
ALTER TABLE modules.content ALTER COLUMN available_tenants SET NOT NULL;
CREATE INDEX idx_content_tenants ON modules.content USING GIN(available_tenants);
DROP INDEX IF EXISTS idx_content_contexts;
ALTER TABLE modules.content DROP COLUMN available_contexts;

-- 9. ANALYTICS.LEARNING_EVENTS (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'analytics' AND table_name = 'learning_events') THEN
        ALTER TABLE analytics.learning_events ADD COLUMN tenant_key TEXT;
        UPDATE analytics.learning_events SET tenant_key = context_key;
        ALTER TABLE analytics.learning_events ALTER COLUMN tenant_key SET NOT NULL;
        CREATE INDEX idx_learning_events_tenant ON analytics.learning_events(tenant_key);
        DROP INDEX IF EXISTS idx_learning_events_context;
        ALTER TABLE analytics.learning_events DROP COLUMN context_key;
    END IF;
END $$;

-- 10. CHECK IF UI_LAYOUTS EXISTS AND MIGRATE IF NEEDED
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'ui_layouts') THEN
        -- Drop any dependent policies first
        DROP POLICY IF EXISTS "Allow authenticated read" ON core.ui_layouts;

        ALTER TABLE core.ui_layouts ADD COLUMN tenant_key TEXT;
        UPDATE core.ui_layouts SET tenant_key = context_key WHERE context_key IS NOT NULL;
        ALTER TABLE core.ui_layouts DROP COLUMN context_key;

        -- Recreate policy
        CREATE POLICY "Allow authenticated read" ON core.ui_layouts
          FOR SELECT TO authenticated, service_role
          USING (true);
    END IF;
END $$;

-- 11. UPDATE FUNCTION NAMES (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_can_access_context') THEN
        DROP FUNCTION IF EXISTS core.user_can_access_context(UUID, TEXT);
    END IF;
END $$;

-- Recreate function with new name
CREATE OR REPLACE FUNCTION core.user_can_access_tenant(
    p_user_id UUID,
    p_tenant_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_required_entitlements TEXT[];
    v_access_mode TEXT;
    v_has_access BOOLEAN := FALSE;
BEGIN
    -- Get tenant requirements
    SELECT required_entitlements, access_mode
    INTO v_required_entitlements, v_access_mode
    FROM core.tenant_access_policies
    WHERE tenant_key = p_tenant_key;

    -- No policy means open access
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;

    -- Check entitlements based on mode
    IF v_access_mode = 'any' THEN
        SELECT EXISTS (
            SELECT 1
            FROM unnest(v_required_entitlements) AS required
            WHERE core.user_has_entitlement(p_user_id, required)
        ) INTO v_has_access;
    ELSE
        SELECT NOT EXISTS (
            SELECT 1
            FROM unnest(v_required_entitlements) AS required
            WHERE NOT core.user_has_entitlement(p_user_id, required)
        ) INTO v_has_access;
    END IF;

    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 12. VERIFY MIGRATION
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables migrated: entitlements, tenants (was context_configs), nav_options, conversation_events, conversations, tenant_access_policies, content, learning_events';
    RAISE NOTICE 'Functions updated: user_can_access_tenant (was user_can_access_context)';
    RAISE NOTICE 'All RLS policies recreated with new column names';
END $$;

COMMIT;

-- VERIFICATION QUERIES (run after migration)
-- SELECT COUNT(*) FROM core.entitlements WHERE tenant_key IS NOT NULL;
-- SELECT COUNT(*) FROM core.tenants WHERE tenant_key IS NOT NULL;
-- SELECT COUNT(*) FROM core.nav_options WHERE tenant_key IS NOT NULL;
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'core' AND tablename IN ('entitlements', 'tenants', 'tenant_access_policies');