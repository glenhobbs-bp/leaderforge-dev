-- Migration: 017_gamification_points
-- Description: Points ledger and leaderboard cache for gamification
-- Date: 2024-12-14

-- Points ledger (detailed tracking)
CREATE TABLE progress.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Points details
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'video_complete', 'document_complete', 'streak_daily', 'streak_weekly'
  source_type TEXT, -- 'content', 'streak', 'achievement'
  source_id UUID, -- content_id or streak_id
  
  -- Period tracking
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  period_week DATE, -- Start of week (for weekly leaderboards)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_user ON progress.points_ledger(user_id);
CREATE INDEX idx_points_tenant ON progress.points_ledger(tenant_id);
CREATE INDEX idx_points_week ON progress.points_ledger(period_week);
CREATE INDEX idx_points_earned ON progress.points_ledger(earned_at DESC);
CREATE INDEX idx_points_reason ON progress.points_ledger(reason);

-- Materialized leaderboard cache (for fast queries)
CREATE TABLE progress.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES core.organizations(id),
  team_id UUID REFERENCES core.teams(id),
  
  -- Period
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  period_start DATE,
  
  -- Scores
  total_points INTEGER DEFAULT 0,
  rank_org INTEGER,
  rank_team INTEGER,
  
  -- Activity counts
  videos_completed INTEGER DEFAULT 0,
  documents_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_org ON progress.leaderboard_cache(organization_id, period_type, total_points DESC);
CREATE INDEX idx_leaderboard_team ON progress.leaderboard_cache(team_id, period_type, total_points DESC);
CREATE INDEX idx_leaderboard_tenant ON progress.leaderboard_cache(tenant_id, period_type);

-- RLS for points_ledger
ALTER TABLE progress.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points_own" ON progress.points_ledger FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "points_service_role" ON progress.points_ledger FOR ALL TO service_role USING (true);

-- RLS for leaderboard_cache
ALTER TABLE progress.leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard_org_read" ON progress.leaderboard_cache FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM core.memberships WHERE user_id = auth.uid())
);
CREATE POLICY "leaderboard_service_role" ON progress.leaderboard_cache FOR ALL TO service_role USING (true);

GRANT SELECT ON progress.points_ledger TO authenticated;
GRANT SELECT ON progress.leaderboard_cache TO authenticated;
GRANT ALL ON progress.points_ledger TO service_role;
GRANT ALL ON progress.leaderboard_cache TO service_role;

COMMENT ON TABLE progress.points_ledger IS 'Detailed points earning history';
COMMENT ON TABLE progress.leaderboard_cache IS 'Materialized leaderboard for fast queries';

