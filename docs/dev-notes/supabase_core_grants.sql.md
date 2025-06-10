# Supabase Core Table Grants & RLS Policies

This script enables RLS, grants SELECT to the `authenticated` role, and creates a permissive SELECT policy for all core tables.

---

```sql
-- Table: organizations
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.organizations TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'organizations' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.organizations FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: users
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.users TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'users' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.users FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: user_organizations
ALTER TABLE core.user_organizations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.user_organizations TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'user_organizations' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.user_organizations FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: entitlements
ALTER TABLE core.entitlements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.entitlements TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'entitlements' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.entitlements FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: user_entitlements
ALTER TABLE core.user_entitlements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.user_entitlements TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'user_entitlements' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.user_entitlements FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: conversation_events
ALTER TABLE core.conversation_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.conversation_events TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'conversation_events' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.conversation_events FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: conversations
ALTER TABLE core.conversations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.conversations TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'conversations' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.conversations FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: email_validations
ALTER TABLE core.email_validations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.email_validations TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'email_validations' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.email_validations FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: nav_options
ALTER TABLE core.nav_options ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.nav_options TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'nav_options' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.nav_options FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: ab_test_groups
ALTER TABLE core.ab_test_groups ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.ab_test_groups TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'ab_test_groups' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.ab_test_groups FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: org_entitlements
ALTER TABLE core.org_entitlements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.org_entitlements TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'org_entitlements' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.org_entitlements FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: content_access_policies
ALTER TABLE core.content_access_policies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.content_access_policies TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'content_access_policies' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.content_access_policies FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: entitlement_audit_log
ALTER TABLE core.entitlement_audit_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.entitlement_audit_log TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'entitlement_audit_log' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.entitlement_audit_log FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: context_access_policies
ALTER TABLE core.context_access_policies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.context_access_policies TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'context_access_policies' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.context_access_policies FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: context_configs
ALTER TABLE core.context_configs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.context_configs TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'context_configs' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.context_configs FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: ui_layouts
ALTER TABLE core.ui_layouts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.ui_layouts TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'ui_layouts' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.ui_layouts FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: component_layout
ALTER TABLE core.component_layout ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.component_layout TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'component_layout' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.component_layout FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;

-- Table: agents
ALTER TABLE core.agents ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON core.agents TO authenticated;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'core' AND tablename = 'agents' AND policyname = 'Allow authenticated read'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow authenticated read" ON core.agents FOR SELECT TO authenticated USING (true);';
  END IF;
END $$;
```