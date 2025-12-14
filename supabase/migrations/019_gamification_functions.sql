-- Migration: 019_gamification_functions
-- Description: Helper functions and config for gamification
-- Date: 2024-12-14

-- Award points function
CREATE OR REPLACE FUNCTION award_points(
  p_tenant_id UUID,
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_source_type TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_week_start DATE;
BEGIN
  -- Calculate start of week (Monday)
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  INSERT INTO progress.points_ledger (
    tenant_id, user_id, points, reason, source_type, source_id, period_week
  ) VALUES (
    p_tenant_id, p_user_id, p_points, p_reason, p_source_type, p_source_id, v_week_start
  ) RETURNING id INTO v_entry_id;
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update streak function
CREATE OR REPLACE FUNCTION update_streak(
  p_tenant_id UUID,
  p_user_id UUID,
  p_streak_type TEXT DEFAULT 'daily'
)
RETURNS progress.user_streaks AS $$
DECLARE
  v_streak progress.user_streaks;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get or create streak record
  SELECT * INTO v_streak
  FROM progress.user_streaks
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
  
  IF NOT FOUND THEN
    -- Create new streak
    INSERT INTO progress.user_streaks (
      tenant_id, user_id, streak_type, current_streak, streak_start_date, 
      last_activity_date, total_active_days, total_activities
    ) VALUES (
      p_tenant_id, p_user_id, p_streak_type, 1, v_today, v_today, 1, 1
    ) RETURNING * INTO v_streak;
    
    -- Award points for starting streak
    PERFORM award_points(p_tenant_id, p_user_id, 2, 'streak_daily', 'streak', v_streak.id);
    
    RETURN v_streak;
  END IF;
  
  -- Already active today
  IF v_streak.last_activity_date = v_today THEN
    UPDATE progress.user_streaks
    SET total_activities = total_activities + 1, updated_at = NOW()
    WHERE id = v_streak.id
    RETURNING * INTO v_streak;
    RETURN v_streak;
  END IF;
  
  -- Continue streak from yesterday
  IF v_streak.last_activity_date = v_yesterday THEN
    UPDATE progress.user_streaks
    SET 
      current_streak = current_streak + 1,
      last_activity_date = v_today,
      total_active_days = total_active_days + 1,
      total_activities = total_activities + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      longest_streak_end = CASE WHEN current_streak + 1 > longest_streak THEN v_today ELSE longest_streak_end END,
      updated_at = NOW()
    WHERE id = v_streak.id
    RETURNING * INTO v_streak;
    
    -- Award points for maintaining streak
    PERFORM award_points(p_tenant_id, p_user_id, 2, 'streak_daily', 'streak', v_streak.id);
    
    RETURN v_streak;
  END IF;
  
  -- Streak broken, start new
  UPDATE progress.user_streaks
  SET 
    current_streak = 1,
    streak_start_date = v_today,
    last_activity_date = v_today,
    total_active_days = total_active_days + 1,
    total_activities = total_activities + 1,
    updated_at = NOW()
  WHERE id = v_streak.id
  RETURNING * INTO v_streak;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Points config (can be updated without code changes)
CREATE TABLE IF NOT EXISTS progress.points_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES core.tenants(id),
  reason TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, reason)
);

-- Default points config
INSERT INTO progress.points_config (tenant_id, reason, points, description) VALUES
  (NULL, 'video_complete', 10, 'Complete a video (>= 90%)'),
  (NULL, 'document_complete', 5, 'Complete reading a document'),
  (NULL, 'streak_daily', 2, 'Maintain daily streak'),
  (NULL, 'streak_weekly', 5, 'Maintain weekly streak'),
  (NULL, 'quiz_pass', 15, 'Pass a quiz'),
  (NULL, 'course_complete', 50, 'Complete a full course')
ON CONFLICT DO NOTHING;

GRANT SELECT ON progress.points_config TO authenticated;
GRANT ALL ON progress.points_config TO service_role;

COMMENT ON FUNCTION award_points IS 'Award points to a user for an activity';
COMMENT ON FUNCTION update_streak IS 'Update user streak on activity';
COMMENT ON TABLE progress.points_config IS 'Configurable points values per activity type';

