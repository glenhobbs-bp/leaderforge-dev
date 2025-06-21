-- Check all existing agents
SELECT
  id,
  name,
  type,
  description,
  config,
  tools,
  created_at
FROM core.agents
ORDER BY created_at DESC;