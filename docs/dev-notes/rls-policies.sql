-- USERS
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_profile
  ON core.users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY user_can_update_own_profile
  ON core.users
  FOR UPDATE
  USING (id = auth.uid());

-- ORGANIZATIONS
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_orgs
  ON core.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations
      WHERE user_id = auth.uid()
        AND org_id = organizations.id
    )
  );

CREATE POLICY org_admin_can_update_org
  ON core.organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations
      WHERE user_id = auth.uid()
        AND org_id = organizations.id
        AND role IN ('owner', 'admin')
    )
  );

-- USER_ORGANIZATIONS
ALTER TABLE core.user_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_memberships
  ON core.user_organizations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY org_admin_can_select_org_memberships
  ON core.user_organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations AS admin
      WHERE admin.user_id = auth.uid()
        AND admin.org_id = user_organizations.org_id
        AND admin.role IN ('owner', 'admin')
    )
  );

-- ENTITLEMENTS
ALTER TABLE core.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_context_entitlements
  ON core.entitlements
  FOR SELECT
  USING (
    context_key = current_setting('app.current_context', true)
  );

-- ORG_ENTITLEMENTS
ALTER TABLE core.org_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_admin_can_select_org_entitlements
  ON core.org_entitlements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations
      WHERE user_id = auth.uid()
        AND org_id = org_entitlements.org_id
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY org_admin_can_update_org_entitlements
  ON core.org_entitlements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations
      WHERE user_id = auth.uid()
        AND org_id = org_entitlements.org_id
        AND role IN ('owner', 'admin')
    )
  );

-- USER_ENTITLEMENTS
ALTER TABLE core.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_entitlements
  ON core.user_entitlements
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY org_admin_can_select_org_user_entitlements
  ON core.user_entitlements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations
      WHERE user_id = auth.uid()
        AND org_id = (
          SELECT org_id FROM core.org_entitlements
          WHERE id = user_entitlements.org_entitlement_id
        )
        AND role IN ('owner', 'admin')
    )
  );

-- CONTENT_ACCESS_POLICIES
ALTER TABLE core.content_access_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_context_content_access_policies
  ON core.content_access_policies
  FOR SELECT
  USING (
    context_key = current_setting('app.current_context', true)
  );

-- AB_TEST_GROUPS
ALTER TABLE core.ab_test_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_ab_test_groups
  ON core.ab_test_groups
  FOR SELECT
  USING (user_id = auth.uid());

-- EMAIL_VALIDATIONS
ALTER TABLE core.email_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_email_validations
  ON core.email_validations
  FOR SELECT
  USING (user_id = auth.uid());

-- ENTITLEMENT_AUDIT_LOG (optional/future)
ALTER TABLE core.entitlement_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_can_select_own_audit_log
  ON core.entitlement_audit_log
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY org_admin_can_select_org_audit_log
  ON core.entitlement_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core.user_organizations
      WHERE user_id = auth.uid()
        AND org_id = entitlement_audit_log.org_id
        AND role IN ('owner', 'admin')
    )
  );