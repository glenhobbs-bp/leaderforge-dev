-- Check current navigation options and their assigned agents
SELECT
    no.nav_key,
    no.label,
    no.tenant_key,
    no.agent_id,
    a.name as agent_name,
    a.type as agent_type,
    a.enabled as agent_enabled
FROM core.nav_options no
LEFT JOIN core.agents a ON no.agent_id = a.id
WHERE no.tenant_key IN ('brilliant', 'leaderforge')
ORDER BY no.tenant_key, no.order;