-- Dump current agents and nav_options configuration
-- Run this in Supabase SQL editor to see existing setup

-- Current agents
SELECT
  id,
  name,
  type,
  description,
  config,
  tools,
  created_at,
  updated_at
FROM core.agents
ORDER BY created_at DESC;

-- Nav options with agent references
SELECT
  id,
  context_key,
  label,
  icon,
  description,
  href,
  agent_id,
  agent_prompt,
  schema_hint,
  "order",
  section,
  section_order
FROM core.nav_options
WHERE agent_id IS NOT NULL
ORDER BY context_key, "order";

-- Show the specific library entry
SELECT
  no.*,
  a.name as agent_name,
  a.type as agent_type,
  a.config as agent_config
FROM core.nav_options no
LEFT JOIN core.agents a ON no.agent_id = a.id
WHERE no.href = '/library' OR no.label ILIKE '%library%'
ORDER BY no.context_key;