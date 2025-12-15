-- Migration: 020_learning_paths
-- Description: Create learning paths and items tables for content sequencing
-- Date: 2024-12-15

-- =============================================================================
-- LEARNING PATHS TABLE
-- =============================================================================
-- Organization-level configuration for content unlock sequencing

CREATE TABLE content.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Path configuration
  name TEXT NOT NULL DEFAULT 'Learning Path',
  description TEXT,
  
  -- Unlock mode: how content becomes available
  -- time_based: modules unlock on schedule (cohort model)
  -- completion_based: complete module N to unlock N+1 (self-paced)
  -- hybrid: both time schedule AND completion required
  unlock_mode TEXT NOT NULL DEFAULT 'hybrid' 
    CHECK (unlock_mode IN ('time_based', 'completion_based', 'hybrid')),
  
  -- Time-based settings
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unlock_interval_days INTEGER NOT NULL DEFAULT 7,
  
  -- Completion requirement for unlock
  -- video_only: 90% video progress
  -- worksheet: video + worksheet completed
  -- full: video + worksheet + check-in + bold action signoff
  completion_requirement TEXT NOT NULL DEFAULT 'full'
    CHECK (completion_requirement IN ('video_only', 'worksheet', 'full')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One active learning path per org
  UNIQUE (organization_id, is_active) WHERE is_active = true
);

-- Indexes
CREATE INDEX idx_learning_paths_org ON content.learning_paths(organization_id);
CREATE INDEX idx_learning_paths_tenant ON content.learning_paths(tenant_id);
CREATE INDEX idx_learning_paths_active ON content.learning_paths(organization_id, is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE content.learning_paths IS 'Organization-level learning path configuration for content sequencing';
COMMENT ON COLUMN content.learning_paths.unlock_mode IS 'How content unlocks: time_based (cohort), completion_based (self-paced), or hybrid (both)';
COMMENT ON COLUMN content.learning_paths.enrollment_date IS 'Reference date for time-based unlocks (org start date)';
COMMENT ON COLUMN content.learning_paths.unlock_interval_days IS 'Days between module unlocks for time-based mode';
COMMENT ON COLUMN content.learning_paths.completion_requirement IS 'What counts as completion: video_only, worksheet, or full 4-step';

-- =============================================================================
-- LEARNING PATH ITEMS TABLE
-- =============================================================================
-- Ordered modules within a learning path

CREATE TABLE content.learning_path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL REFERENCES content.learning_paths(id) ON DELETE CASCADE,
  
  -- Content reference (external ID from Tribe Social)
  content_id TEXT NOT NULL,
  
  -- Sequence position (1-indexed)
  sequence_order INTEGER NOT NULL,
  
  -- Optional override for time-based unlock date
  unlock_date DATE,
  
  -- Optional modules don't block next module unlock
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique sequence position within path
  UNIQUE (learning_path_id, sequence_order),
  -- Each content appears once per path
  UNIQUE (learning_path_id, content_id)
);

-- Indexes
CREATE INDEX idx_learning_path_items_path ON content.learning_path_items(learning_path_id);
CREATE INDEX idx_learning_path_items_content ON content.learning_path_items(content_id);
CREATE INDEX idx_learning_path_items_order ON content.learning_path_items(learning_path_id, sequence_order);

-- Comments
COMMENT ON TABLE content.learning_path_items IS 'Ordered content modules within a learning path';
COMMENT ON COLUMN content.learning_path_items.content_id IS 'External content ID from Tribe Social';
COMMENT ON COLUMN content.learning_path_items.sequence_order IS 'Position in sequence (1-indexed)';
COMMENT ON COLUMN content.learning_path_items.unlock_date IS 'Optional override for time-based unlock';
COMMENT ON COLUMN content.learning_path_items.is_optional IS 'If true, does not block next module unlock';

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE content.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.learning_path_items ENABLE ROW LEVEL SECURITY;

-- Learning Paths: Users can read their org's learning path
CREATE POLICY "learning_paths_select" ON content.learning_paths
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Learning Paths: Admins can insert for their org
CREATE POLICY "learning_paths_insert" ON content.learning_paths
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM core.memberships 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND role IN ('admin', 'owner')
    )
  );

-- Learning Paths: Admins can update their org's learning path
CREATE POLICY "learning_paths_update" ON content.learning_paths
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships 
      WHERE user_id = auth.uid() 
        AND is_active = true 
        AND role IN ('admin', 'owner')
    )
  );

-- Learning Path Items: Users can read items for paths they can access
CREATE POLICY "learning_path_items_select" ON content.learning_path_items
  FOR SELECT USING (
    learning_path_id IN (
      SELECT lp.id FROM content.learning_paths lp
      JOIN core.memberships m ON m.organization_id = lp.organization_id
      WHERE m.user_id = auth.uid() AND m.is_active = true
    )
  );

-- Learning Path Items: Admins can insert items
CREATE POLICY "learning_path_items_insert" ON content.learning_path_items
  FOR INSERT WITH CHECK (
    learning_path_id IN (
      SELECT lp.id FROM content.learning_paths lp
      JOIN core.memberships m ON m.organization_id = lp.organization_id
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND m.role IN ('admin', 'owner')
    )
  );

-- Learning Path Items: Admins can update items
CREATE POLICY "learning_path_items_update" ON content.learning_path_items
  FOR UPDATE USING (
    learning_path_id IN (
      SELECT lp.id FROM content.learning_paths lp
      JOIN core.memberships m ON m.organization_id = lp.organization_id
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND m.role IN ('admin', 'owner')
    )
  );

-- Learning Path Items: Admins can delete items
CREATE POLICY "learning_path_items_delete" ON content.learning_path_items
  FOR DELETE USING (
    learning_path_id IN (
      SELECT lp.id FROM content.learning_paths lp
      JOIN core.memberships m ON m.organization_id = lp.organization_id
      WHERE m.user_id = auth.uid() 
        AND m.is_active = true 
        AND m.role IN ('admin', 'owner')
    )
  );

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON content.learning_paths TO authenticated;
GRANT INSERT, UPDATE ON content.learning_paths TO authenticated;
GRANT ALL ON content.learning_paths TO service_role;

GRANT SELECT ON content.learning_path_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON content.learning_path_items TO authenticated;
GRANT ALL ON content.learning_path_items TO service_role;
