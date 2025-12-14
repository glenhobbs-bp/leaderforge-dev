-- Migration: 003_core_organizations
-- Description: Create organizations table
-- Date: 2024-12-14

CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  
  -- Branding overrides (partial - logo and primary color only)
  branding JSONB DEFAULT '{
    "logo_url": null,
    "primary_color": null,
    "display_name": null,
    "use_tenant_theme": true
  }'::jsonb,
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_tenant ON core.organizations(tenant_id);
CREATE INDEX idx_organizations_active ON core.organizations(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE core.organizations IS 'Customer companies within a tenant';
COMMENT ON COLUMN core.organizations.branding IS 'Partial branding overrides: logo, primary color, display name';
COMMENT ON COLUMN core.organizations.settings IS 'Organization-specific settings';

-- Grant permissions
GRANT SELECT ON core.organizations TO authenticated;
GRANT ALL ON core.organizations TO service_role;

