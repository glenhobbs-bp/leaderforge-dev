-- Migration: 002_core_tenants
-- Description: Create tenants table
-- Date: 2024-12-14

CREATE TABLE core.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT UNIQUE NOT NULL,  -- URL-safe slug (e.g., 'i49-group')
  display_name TEXT NOT NULL,
  
  -- Theming (full control at tenant level)
  theme JSONB DEFAULT '{
    "logo_url": null,
    "favicon_url": null,
    "primary": "#2563eb",
    "secondary": "#64748b",
    "accent": "#f59e0b",
    "background": "#ffffff",
    "surface": "#f8fafc",
    "text_primary": "#0f172a",
    "text_secondary": "#64748b",
    "font_family": "Inter",
    "border_radius": "0.5rem"
  }'::jsonb,
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_key ON core.tenants(tenant_key);
CREATE INDEX idx_tenants_active ON core.tenants(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE core.tenants IS 'Platform tenants (training providers)';
COMMENT ON COLUMN core.tenants.tenant_key IS 'URL-safe unique identifier for tenant';
COMMENT ON COLUMN core.tenants.theme IS 'Full theming configuration: colors, fonts, logos';
COMMENT ON COLUMN core.tenants.settings IS 'Tenant-specific settings and feature flags';

-- Grant permissions
GRANT SELECT ON core.tenants TO authenticated;
GRANT ALL ON core.tenants TO service_role;

