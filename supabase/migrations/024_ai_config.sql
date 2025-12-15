-- Migration: 024_ai_config
-- Description: Platform-level AI configuration for prompts and settings
-- Date: 2024-12-15

-- Create platform schema if not exists
CREATE SCHEMA IF NOT EXISTS platform;

-- Platform-level AI configuration (defaults)
CREATE TABLE platform.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_type TEXT NOT NULL CHECK (config_type IN ('system_prompt', 'user_prompt_template', 'settings', 'terminology')),
  config_value JSONB NOT NULL,
  description TEXT,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  max_tokens INTEGER DEFAULT 1024,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES core.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform AI config version history
CREATE TABLE platform.ai_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES platform.ai_config(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  version INTEGER NOT NULL,
  changed_by UUID REFERENCES core.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_note TEXT
);

-- Indexes
CREATE INDEX idx_ai_config_key ON platform.ai_config(config_key);
CREATE INDEX idx_ai_config_type ON platform.ai_config(config_type);
CREATE INDEX idx_ai_config_active ON platform.ai_config(is_active);
CREATE INDEX idx_ai_config_history_config ON platform.ai_config_history(config_id);

-- RLS (Platform admins only)
ALTER TABLE platform.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.ai_config_history ENABLE ROW LEVEL SECURITY;

-- Platform admins can read/write
CREATE POLICY "platform_admin_ai_config" ON platform.ai_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM core.users 
      WHERE id = auth.uid() AND is_platform_admin = true
    )
  );

CREATE POLICY "platform_admin_ai_config_history" ON platform.ai_config_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM core.users 
      WHERE id = auth.uid() AND is_platform_admin = true
    )
  );

-- Service role full access
CREATE POLICY "service_role_ai_config" ON platform.ai_config FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_ai_config_history" ON platform.ai_config_history FOR ALL TO service_role USING (true);

-- Grants
GRANT USAGE ON SCHEMA platform TO authenticated;
GRANT SELECT ON platform.ai_config TO authenticated;
GRANT SELECT ON platform.ai_config_history TO authenticated;
GRANT ALL ON platform.ai_config TO service_role;
GRANT ALL ON platform.ai_config_history TO service_role;

-- Seed default AI configurations
INSERT INTO platform.ai_config (config_key, config_type, config_value, description) VALUES

-- Reflection Prompts - Fully Completed
('reflection_fully_completed', 'system_prompt', '{
  "system": "You are an expert leadership coach helping a learner reflect on completing a bold action commitment. Be celebratory yet focused on deepening learning.",
  "tone": "celebratory",
  "focus": ["learning extraction", "pattern recognition", "future application"]
}'::jsonb, 'System prompt for fully completed bold action reflections'),

-- Reflection Prompts - Partially Completed
('reflection_partially_completed', 'system_prompt', '{
  "system": "You are an expert leadership coach helping a learner reflect on partially completing a bold action. Be supportive while gently exploring barriers.",
  "tone": "supportive",
  "focus": ["acknowledging progress", "understanding barriers", "next steps"]
}'::jsonb, 'System prompt for partially completed bold action reflections'),

-- Reflection Prompts - Blocked
('reflection_blocked', 'system_prompt', '{
  "system": "You are an expert leadership coach helping a learner understand why they were blocked from completing a bold action. Be compassionate and focus on learning without judgment.",
  "tone": "compassionate",
  "focus": ["understanding obstacles", "reframing failure", "smaller steps"]
}'::jsonb, 'System prompt for blocked bold action reflections'),

-- Cheat Sheet Main Prompt
('cheat_sheet_system_prompt', 'system_prompt', '{
  "system": "You are an expert leadership coach helping a team leader prepare for a 5-minute check-in meeting with a team member. You help them have productive, growth-focused conversations.",
  "tone": "coaching",
  "focus": ["bold action calibration", "accountability", "growth mindset"]
}'::jsonb, 'System prompt for check-in cheat sheet generation'),

-- Conversation Starter Templates
('conversation_starters', 'user_prompt_template', '{
  "templates": [
    "Start by acknowledging their progress: {progress_summary}",
    "Ask about their bold action: How did \"{bold_action}\" go?",
    "If they have a streak, celebrate it: {streak_celebration}",
    "Calibration question: On a scale of 1-10, how achievable was this bold action?",
    "Forward focus: What would make next week even better?"
  ],
  "conditions": {
    "show_streak": "streak >= 3",
    "show_challenge": "challenge_level >= 3"
  }
}'::jsonb, 'Templates for conversation starters in cheat sheets'),

-- Terminology Mapping (default)
('terminology_default', 'terminology', '{
  "bold_action": "Bold Action",
  "check_in": "Check-in",
  "module": "Module",
  "worksheet": "Worksheet",
  "team_leader": "Team Leader",
  "learner": "Learner"
}'::jsonb, 'Default terminology for AI-generated content'),

-- AI Model Settings
('ai_model_settings', 'settings', '{
  "default_model": "claude-sonnet-4-20250514",
  "fallback_model": "claude-sonnet-4-20250514",
  "max_retries": 2,
  "timeout_ms": 30000,
  "rate_limit_per_minute": 60
}'::jsonb, 'Global AI model settings');

COMMENT ON TABLE platform.ai_config IS 'Platform-level AI prompt and settings configuration';
COMMENT ON TABLE platform.ai_config_history IS 'Version history for AI configuration changes';
