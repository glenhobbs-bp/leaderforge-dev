-- Debug navigation options for LeaderForge tenant
SELECT
    id,
    nav_key,
    label,
    tenant_key,
    agent_id,
    "order",
    section,
    section_order,
    created_at
FROM core.nav_options
WHERE tenant_key = 'leaderforge'
ORDER BY section_order, "order";

-- Check for the specific UUID that's failing
SELECT
    id,
    nav_key,
    label,
    tenant_key
FROM core.nav_options
WHERE id = '3202016b-05fa-4db6-bbc7-c785ba898e2f';

-- Check if there are any nav options with similar labels
SELECT
    id,
    nav_key,
    label,
    tenant_key
FROM core.nav_options
WHERE label ILIKE '%library%' OR label ILIKE '%leadership%';