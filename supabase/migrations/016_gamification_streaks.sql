-- Migration: 016_gamification_streaks
-- Description: User streak tracking for gamification
-- Date: 2024-12-14

CREATE TABLE progress.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Streak type
  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily', 'weekly')),
  
  -- Current streak
  current_streak INTEGER DEFAULT 0,
  streak_start_date DATE,
  last_activity_date DATE,
  
  -- Records
  longest_streak INTEGER DEFAULT 0,
  longest_streak_start DATE,
  longest_streak_end DATE,
  
  -- Stats
  total_active_days INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, streak_type)
);

CREATE INDEX idx_streaks_user ON progress.user_streaks(user_id);
CREATE INDEX idx_streaks_tenant ON progress.user_streaks(tenant_id);
CREATE INDEX idx_streaks_current ON progress.user_streaks(current_streak DESC);
CREATE INDEX idx_streaks_type ON progress.user_streaks(streak_type);

-- RLS
ALTER TABLE progress.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_own" ON progress.user_streaks FOR ALL USING (user_id = auth.uid());

CREATE POLICY "streaks_manager_read" ON progress.user_streaks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM core.memberships m1
    JOIN core.memberships m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = auth.uid()
    AND m1.role IN ('manager', 'admin', 'owner')
    AND m2.user_id = progress.user_streaks.user_id
  )
);

CREATE POLICY "streaks_service_role" ON progress.user_streaks FOR ALL TO service_role USING (true);

GRANT SELECT, INSERT, UPDATE ON progress.user_streaks TO authenticated;
GRANT ALL ON progress.user_streaks TO service_role;

COMMENT ON TABLE progress.user_streaks IS 'User engagement streaks (daily/weekly)';

