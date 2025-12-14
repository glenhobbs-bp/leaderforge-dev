-- Migration: 013_rls_policies
-- Description: Row Level Security policies for all tables
-- Date: 2024-12-14

-- ============================================================================
-- CORE SCHEMA RLS
-- ============================================================================

-- Tenants: Public read (for tenant lookup), service role for management
ALTER TABLE core.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_public_read" ON core.tenants
  FOR SELECT USING (is_active = true);

CREATE POLICY "tenants_service_role" ON core.tenants
  FOR ALL TO service_role USING (true);

-- Organizations: Users see their tenant's organizations
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_tenant_read" ON core.organizations
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_service_role" ON core.organizations
  FOR ALL TO service_role USING (true);

-- Teams: Users see teams in their organization
ALTER TABLE core.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_org_read" ON core.teams
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "teams_service_role" ON core.teams
  FOR ALL TO service_role USING (true);

-- Users: See users in same org, update own profile
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_org_read" ON core.users
  FOR SELECT USING (
    id IN (
      SELECT m2.user_id FROM core.memberships m1
      JOIN core.memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.user_id = auth.uid()
    )
    OR id = auth.uid()
  );

CREATE POLICY "users_own_update" ON core.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_service_role" ON core.users
  FOR ALL TO service_role USING (true);

-- Memberships: See memberships in your org
ALTER TABLE core.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_org_read" ON core.memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "memberships_service_role" ON core.memberships
  FOR ALL TO service_role USING (true);

-- Invitations: See invitations for your org (if admin/owner)
ALTER TABLE core.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_admin_read" ON core.invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "invitations_service_role" ON core.invitations
  FOR ALL TO service_role USING (true);

-- Audit log: Read own org's audit log (if admin/owner)
ALTER TABLE core.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_read" ON core.audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "audit_service_role" ON core.audit_log
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- CONTENT SCHEMA RLS
-- ============================================================================

-- Content items: Complex access based on entitlements, ownership, and licenses
ALTER TABLE content.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_entitled_access" ON content.items
  FOR SELECT USING (
    -- Platform content with valid entitlement
    (owner_type = 'platform' AND EXISTS (
      SELECT 1 FROM content.content_entitlements ce
      JOIN content.entitlement_assignments ea ON ce.entitlement_id = ea.entitlement_id
      JOIN core.memberships m ON ea.organization_id = m.organization_id
      WHERE ce.content_id = content.items.id
      AND m.user_id = auth.uid()
      AND ea.revoked_at IS NULL
    ))
    OR
    -- Tenant's own content (Phase 2)
    (owner_type = 'tenant' AND owner_tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    ))
    OR
    -- Licensed content (Phase 3)
    (visibility = 'licensable' AND EXISTS (
      SELECT 1 FROM content.licenses l
      JOIN core.memberships m ON l.licensee_tenant_id = m.tenant_id
      WHERE l.content_id = content.items.id
      AND m.user_id = auth.uid()
      AND l.status = 'active'
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
    ))
  );

CREATE POLICY "content_service_role" ON content.items
  FOR ALL TO service_role USING (true);

-- Entitlements: Read only for authenticated
ALTER TABLE content.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entitlements_tenant_read" ON content.entitlements
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "entitlements_service_role" ON content.entitlements
  FOR ALL TO service_role USING (true);

-- Content-Entitlements: Read only
ALTER TABLE content.content_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_ent_read" ON content.content_entitlements
  FOR SELECT USING (true);  -- Visible if content is visible

CREATE POLICY "content_ent_service_role" ON content.content_entitlements
  FOR ALL TO service_role USING (true);

-- Entitlement Assignments: Read own org's assignments
ALTER TABLE content.entitlement_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ent_assign_org_read" ON content.entitlement_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ent_assign_service_role" ON content.entitlement_assignments
  FOR ALL TO service_role USING (true);

-- Licenses: Read own tenant's licenses
ALTER TABLE content.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licenses_tenant_read" ON content.licenses
  FOR SELECT USING (
    licensee_tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    )
    OR licensor_tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "licenses_service_role" ON content.licenses
  FOR ALL TO service_role USING (true);

-- Marketplace listings: Public read for active listings
ALTER TABLE content.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_public_read" ON content.marketplace_listings
  FOR SELECT USING (is_active = true);

CREATE POLICY "listings_service_role" ON content.marketplace_listings
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- PROGRESS SCHEMA RLS
-- ============================================================================

ALTER TABLE progress.user_progress ENABLE ROW LEVEL SECURITY;

-- Users manage their own progress
CREATE POLICY "progress_own_all" ON progress.user_progress
  FOR ALL USING (user_id = auth.uid());

-- Managers/admins can view team/org progress
CREATE POLICY "progress_manager_read" ON progress.user_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM core.memberships m1
      JOIN core.memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.user_id = auth.uid()
      AND m1.role IN ('manager', 'admin', 'owner')
      AND m2.user_id = progress.user_progress.user_id
    )
  );

CREATE POLICY "progress_service_role" ON progress.user_progress
  FOR ALL TO service_role USING (true);

