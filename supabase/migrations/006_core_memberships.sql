-- Migration: 006_core_memberships
-- Description: Create memberships table (user-org-team relationships)
-- Date: 2024-12-14

CREATE TABLE core.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL,
  
  -- Role
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'manager', 'admin', 'owner')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User can only have one membership per org
  UNIQUE (user_id, organization_id)
);

-- Indexes
CREATE INDEX idx_memberships_user ON core.memberships(user_id);
CREATE INDEX idx_memberships_org ON core.memberships(organization_id);
CREATE INDEX idx_memberships_team ON core.memberships(team_id);
CREATE INDEX idx_memberships_tenant ON core.memberships(tenant_id);
CREATE INDEX idx_memberships_active ON core.memberships(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE core.memberships IS 'User membership in organizations and teams';
COMMENT ON COLUMN core.memberships.role IS 'User role: member, manager, admin, or owner';

-- Grant permissions
GRANT SELECT ON core.memberships TO authenticated;
GRANT ALL ON core.memberships TO service_role;

