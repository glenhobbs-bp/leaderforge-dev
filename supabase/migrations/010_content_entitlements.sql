-- Migration: 010_content_entitlements
-- Description: Create entitlements system (named content packages)
-- Date: 2024-12-14

-- Entitlements: Named access packages
CREATE TABLE content.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entitlements_tenant ON content.entitlements(tenant_id);
CREATE INDEX idx_entitlements_active ON content.entitlements(is_active) WHERE is_active = true;

COMMENT ON TABLE content.entitlements IS 'Named content access packages';

-- Content-Entitlement links: Which content is in which entitlement
CREATE TABLE content.content_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES content.entitlements(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (content_id, entitlement_id)
);

CREATE INDEX idx_content_ent_content ON content.content_entitlements(content_id);
CREATE INDEX idx_content_ent_ent ON content.content_entitlements(entitlement_id);

COMMENT ON TABLE content.content_entitlements IS 'Links content items to entitlements';

-- Entitlement Assignments: Which organizations have which entitlements
CREATE TABLE content.entitlement_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES content.entitlements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_by UUID REFERENCES core.users(id),
  
  -- Status
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  UNIQUE (entitlement_id, organization_id)
);

CREATE INDEX idx_ent_assign_org ON content.entitlement_assignments(organization_id);
CREATE INDEX idx_ent_assign_ent ON content.entitlement_assignments(entitlement_id);
CREATE INDEX idx_ent_assign_active ON content.entitlement_assignments(revoked_at) 
  WHERE revoked_at IS NULL;

COMMENT ON TABLE content.entitlement_assignments IS 'Assigns entitlements to organizations';

-- Grant permissions
GRANT SELECT ON content.entitlements TO authenticated;
GRANT SELECT ON content.content_entitlements TO authenticated;
GRANT SELECT ON content.entitlement_assignments TO authenticated;
GRANT ALL ON content.entitlements TO service_role;
GRANT ALL ON content.content_entitlements TO service_role;
GRANT ALL ON content.entitlement_assignments TO service_role;

