-- =====================================================
-- Add Context Preferences Navigation Option
-- =====================================================
-- This script adds navigation menu item for the context preferences page

-- Add navigation option for Context Preferences
INSERT INTO core.nav_options (
    id,
    tenant_key,
    nav_key,
    label,
    icon,
    href,
    section,
    section_order,
    "order",
    description,
    required_entitlements,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'leaderforge',
    'context-preferences',
    'Prompt Context Management',
    'settings',
    '/context/preferences',
    'AI Settings',
    2,
    1,
    'Configure how AI understands and responds to you',
    ARRAY['prompt-contexts-basic', 'prompt-contexts-premium', 'prompt-contexts-enterprise'],
    true,
    NOW(),
    NOW()
);

-- Add for Brilliant tenant as well (if needed)
INSERT INTO core.nav_options (
    id,
    tenant_key,
    nav_key,
    label,
    icon,
    href,
    section,
    section_order,
    "order",
    description,
    required_entitlements,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'brilliant',
    'context-preferences',
    'AI Context Settings',
    'settings',
    '/context/preferences',
    'AI Settings',
    2,
    1,
    'Personalize your AI experience',
    ARRAY['prompt-contexts-basic', 'prompt-contexts-premium', 'prompt-contexts-enterprise'],
    true,
    NOW(),
    NOW()
);

-- Verify the navigation options were created
SELECT
    'Context Preferences nav options created' as result,
    tenant_key,
    nav_key,
    label,
    section,
    "order"
FROM core.nav_options
WHERE nav_key = 'context-preferences'
ORDER BY tenant_key;