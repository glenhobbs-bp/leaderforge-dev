-- Debug current navigation options for leaderforge tenant
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

-- Check if the specific failing UUID exists anywhere
SELECT
    id,
    nav_key,
    label,
    tenant_key
FROM core.nav_options
WHERE id = '3202016b-05fa-4db6-bbc7-c785ba898e2f';

-- Check for any nav options with "Leadership Library" or similar labels
SELECT
    id,
    nav_key,
    label,
    tenant_key
FROM core.nav_options
WHERE (label ILIKE '%leadership%' OR label ILIKE '%library%')
AND tenant_key = 'leaderforge';