-- Migration: 004_core_teams
-- Description: Create teams table
-- Date: 2024-12-14

CREATE TABLE core.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_teams_org ON core.teams(organization_id);
CREATE INDEX idx_teams_tenant ON core.teams(tenant_id);
CREATE INDEX idx_teams_active ON core.teams(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE core.teams IS 'Groups within organizations for organizing users';
COMMENT ON COLUMN core.teams.description IS 'Optional description of team purpose';

-- Grant permissions
GRANT SELECT ON core.teams TO authenticated;
GRANT ALL ON core.teams TO service_role;

