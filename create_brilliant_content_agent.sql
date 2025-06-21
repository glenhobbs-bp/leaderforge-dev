-- Create Brilliant Content Library Agent and link to nav option
-- This completes the agent framework setup for both contexts

-- Insert the Brilliant content library agent
INSERT INTO core.agents (
  id,
  name,
  display_name,
  type,
  description,
  prompt,
  tools,
  model,
  config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'brilliantContentLibrary',
  'Brilliant Content Library Agent',
  'langgraph',
  'Agent for searching and presenting Brilliant Movement content library',
  'You are a content library assistant for the Brilliant Movement. Help users find relevant videos, courses, and resources from the Brilliant+ library.',
  ARRAY['TribeSocialContentTool', 'UserProgressTool'],
  'claude-3-sonnet',
  jsonb_build_object(
    'collectionId', 99735660,
    'context', 'brilliant',
    'responseFormat', 'grid'
  ),
  NOW(),
  NOW()
) RETURNING id, name;

-- Update the Brilliant Library nav option to use this agent
UPDATE core.nav_options
SET
  agent_id = (
    SELECT id FROM core.agents
    WHERE name = 'brilliantContentLibrary'
    LIMIT 1
  ),
  updated_at = NOW()
WHERE context_key = 'brilliant'
  AND label = 'Brilliant+ Library'
  AND href = '/library';

-- Verify the setup
SELECT
  no.id,
  no.context_key,
  no.label,
  no.agent_id,
  a.name as agent_name,
  a.type as agent_type
FROM core.nav_options no
LEFT JOIN core.agents a ON no.agent_id = a.id
WHERE no.href = '/library'
ORDER BY no.context_key;