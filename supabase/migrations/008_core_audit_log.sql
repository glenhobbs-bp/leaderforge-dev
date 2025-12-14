-- Migration: 008_core_audit_log
-- Description: Create audit log table
-- Date: 2024-12-14

CREATE TABLE core.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  organization_id UUID REFERENCES core.organizations(id),
  
  -- Actor
  actor_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Action details
  action TEXT NOT NULL,  -- e.g., 'user.invited', 'team.created', 'content.assigned'
  target_type TEXT NOT NULL,  -- e.g., 'user', 'team', 'organization', 'content'
  target_id UUID,
  
  -- Additional details
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_tenant ON core.audit_log(tenant_id);
CREATE INDEX idx_audit_org ON core.audit_log(organization_id);
CREATE INDEX idx_audit_actor ON core.audit_log(actor_id);
CREATE INDEX idx_audit_action ON core.audit_log(action);
CREATE INDEX idx_audit_target ON core.audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON core.audit_log(created_at DESC);

-- Partition by month for performance (optional, enable if high volume expected)
-- CREATE TABLE core.audit_log_partitioned ... PARTITION BY RANGE (created_at);

-- Comments
COMMENT ON TABLE core.audit_log IS 'Admin action audit trail';
COMMENT ON COLUMN core.audit_log.action IS 'Action performed, format: entity.verb';
COMMENT ON COLUMN core.audit_log.details IS 'Additional context for the action';

-- Grant permissions (read-only for authenticated, full for service)
GRANT SELECT ON core.audit_log TO authenticated;
GRANT ALL ON core.audit_log TO service_role;

