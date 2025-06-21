-- =====================================================
-- Create LeaderForge Content Library Agent
-- =====================================================
-- This script creates the leaderforgeContentLibrary agent in core.agents table

-- Insert the leaderforgeContentLibrary agent
INSERT INTO core.agents (
  id,
  name,
  display_name,
  description,
  type,
  prompt,
  tools,
  model,
  parameters,
  config,
  version,
  enabled,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'leaderforgeContentLibrary',
  'LeaderForge Content Library',
  'Library of all LeaderForge training videos and supporting content with progress tracking',
  'langgraph',
  'You are the LeaderForge Content Library Agent. Generate a dynamic, interactive content panel showing all available LeaderForge training videos and supporting materials. Use TribeSocialContentTool to fetch real content data and return it as a Grid ComponentSchema with Card items.',
  '["TribeSocialContentTool", "UserProgressTool"]'::jsonb,
  'claude-3-opus',
  '{"temperature": 0.2}'::jsonb,
  '{"graphId": "default", "endpoint": "http://localhost:8000"}'::jsonb,
  1,
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  prompt = EXCLUDED.prompt,
  tools = EXCLUDED.tools,
  model = EXCLUDED.model,
  parameters = EXCLUDED.parameters,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Verify the agent was created
SELECT
  'AGENT_CREATED' as result,
  id,
  name,
  display_name,
  type,
  enabled
FROM core.agents
WHERE name = 'leaderforgeContentLibrary';