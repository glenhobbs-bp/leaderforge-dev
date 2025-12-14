-- =====================================================
-- Update Nav Options with Agent ID References
-- =====================================================
-- This script updates core.nav_options to reference the leaderforgeContentLibrary agent

-- Update LeaderForge Content Library nav option
UPDATE core.nav_options
SET agent_id = (
  SELECT id FROM core.agents WHERE name = 'leaderforgeContentLibrary'
)
WHERE context_key = 'leaderforge'
  AND label ILIKE '%library%'
  AND agent_id IS NULL;

-- Update Brilliant+ Library nav option (can use same agent)
UPDATE core.nav_options
SET agent_id = (
  SELECT id FROM core.agents WHERE name = 'leaderforgeContentLibrary'
)
WHERE context_key = 'brilliant'
  AND label ILIKE '%library%'
  AND agent_id IS NULL;

-- Verify the updates
SELECT
  'NAV_OPTIONS_UPDATED' as result,
  context_key,
  label,
  agent_id,
  (SELECT name FROM core.agents WHERE id = nav_options.agent_id) as agent_name
FROM core.nav_options
WHERE agent_id IS NOT NULL
ORDER BY context_key, label;