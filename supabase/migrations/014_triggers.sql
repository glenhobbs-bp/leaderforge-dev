-- Migration: 014_triggers
-- Description: Triggers and functions
-- Date: 2024-12-14

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON content.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON content.entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON content.licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON content.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON progress.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- USER CREATION (from auth.users)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from metadata or use default
  v_tenant_id := COALESCE(
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    (SELECT id FROM core.tenants WHERE is_active = true LIMIT 1)
  );
  
  -- Create user record
  INSERT INTO core.users (id, email, tenant_id, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- AUDIT LOGGING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_tenant_id UUID,
  p_organization_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO core.audit_log (
    tenant_id, organization_id, actor_id, action, target_type, target_id, details
  ) VALUES (
    p_tenant_id, p_organization_id, p_actor_id, p_action, p_target_type, p_target_id, p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INVITATION TOKEN GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PROGRESS UPDATE HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_progress(
  p_tenant_id UUID,
  p_user_id UUID,
  p_content_id UUID,
  p_progress_type TEXT,
  p_progress_percentage INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
  v_completed_at TIMESTAMPTZ;
BEGIN
  -- Set completed_at if progress is 100%
  IF p_progress_percentage >= 100 THEN
    v_completed_at := NOW();
  END IF;
  
  INSERT INTO progress.user_progress (
    tenant_id, user_id, content_id, progress_type, 
    progress_percentage, metadata, last_viewed_at, completed_at
  ) VALUES (
    p_tenant_id, p_user_id, p_content_id, p_progress_type,
    p_progress_percentage, p_metadata, NOW(), v_completed_at
  )
  ON CONFLICT (user_id, content_id, tenant_id) DO UPDATE SET
    progress_percentage = GREATEST(progress.user_progress.progress_percentage, EXCLUDED.progress_percentage),
    metadata = progress.user_progress.metadata || EXCLUDED.metadata,
    last_viewed_at = NOW(),
    completed_at = COALESCE(progress.user_progress.completed_at, EXCLUDED.completed_at),
    total_sessions = progress.user_progress.total_sessions + 1,
    completion_count = CASE 
      WHEN EXCLUDED.completed_at IS NOT NULL AND progress.user_progress.completed_at IS NULL 
      THEN progress.user_progress.completion_count + 1 
      ELSE progress.user_progress.completion_count 
    END
  RETURNING id INTO v_progress_id;
  
  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CONTENT ACCESS CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION can_access_content(
  p_user_id UUID,
  p_content_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM content.items ci
    WHERE ci.id = p_content_id
    AND (
      -- Platform content with entitlement
      (ci.owner_type = 'platform' AND EXISTS (
        SELECT 1 FROM content.content_entitlements ce
        JOIN content.entitlement_assignments ea ON ce.entitlement_id = ea.entitlement_id
        JOIN core.memberships m ON ea.organization_id = m.organization_id
        WHERE ce.content_id = ci.id
        AND m.user_id = p_user_id
        AND ea.revoked_at IS NULL
      ))
      OR
      -- Tenant's own content
      (ci.owner_type = 'tenant' AND ci.owner_tenant_id IN (
        SELECT tenant_id FROM core.memberships WHERE user_id = p_user_id
      ))
      OR
      -- Licensed content
      (ci.visibility = 'licensable' AND EXISTS (
        SELECT 1 FROM content.licenses l
        JOIN core.memberships m ON l.licensee_tenant_id = m.tenant_id
        WHERE l.content_id = ci.id
        AND m.user_id = p_user_id
        AND l.status = 'active'
        AND (l.expires_at IS NULL OR l.expires_at > NOW())
      ))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

