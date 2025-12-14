-- Migration: 007_core_invitations
-- Description: Create invitations table
-- Date: 2024-12-14

CREATE TABLE core.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Invitee details
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'manager', 'admin')),
  team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL,
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES core.users(id),
  token TEXT UNIQUE NOT NULL,  -- Secure random token
  message TEXT,  -- Optional personal message
  
  -- Status
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invitations_token ON core.invitations(token);
CREATE INDEX idx_invitations_email ON core.invitations(email);
CREATE INDEX idx_invitations_org ON core.invitations(organization_id);
CREATE INDEX idx_invitations_pending ON core.invitations(expires_at) 
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- Comments
COMMENT ON TABLE core.invitations IS 'User invitations to organizations';
COMMENT ON COLUMN core.invitations.token IS 'Secure random token for invitation URL';
COMMENT ON COLUMN core.invitations.expires_at IS 'Invitation expiry, default 7 days';

-- Grant permissions
GRANT SELECT ON core.invitations TO authenticated;
GRANT ALL ON core.invitations TO service_role;

