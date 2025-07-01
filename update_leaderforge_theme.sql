-- Update LeaderForge Theme to Use Database Configuration
-- This script checks and updates the theme data for the LeaderForge tenant
-- so you can easily change colors via the database without code changes

-- First, let's see the current theme data
SELECT
    tenant_key,
    name,
    theme,
    pg_typeof(theme) as theme_type
FROM core.tenants
WHERE tenant_key IN ('leaderforge', 'brilliant');

-- Check if theme is stored as string or JSONB object
DO $$
DECLARE
    current_theme_type text;
    current_theme_value text;
BEGIN
    -- Get current LeaderForge theme
    SELECT pg_typeof(theme)::text, theme::text
    INTO current_theme_type, current_theme_value
    FROM core.tenants
    WHERE tenant_key = 'leaderforge';

    RAISE NOTICE 'Current LeaderForge theme type: %, value: %', current_theme_type, current_theme_value;

    -- Update LeaderForge theme to proper JSONB object with i49 brand colors
    UPDATE core.tenants
    SET theme = jsonb_build_object(
        'primary', '#001848',        -- Deep navy for selected states and primary actions
        'secondary', '#008ee6',      -- Light blue for secondary elements
        'accent', '#008ee6',         -- Light blue for accents
        'bg_light', '#f7f9fc',       -- Light grey background (not pinkish)
        'bg_neutral', '#e0f7ff',     -- Light blue accents for cards
        'text_primary', '#001848',   -- Deep navy for primary text
        'text_secondary', '#666666', -- Grey for secondary text
        'bg_gradient', 'linear-gradient(135deg, #008ee6 0%, #e0f7ff 50%, #f0f4ff 100%)'
    ),
    updated_at = NOW()
    WHERE tenant_key = 'leaderforge';

    RAISE NOTICE 'Updated LeaderForge theme to JSONB object with i49 brand colors';

END $$;

-- Verify the update
SELECT
    tenant_key,
    name,
    theme,
    pg_typeof(theme) as theme_type,
    theme->>'primary' as primary_color,
    theme->>'secondary' as secondary_color,
    theme->>'bg_light' as background_color
FROM core.tenants
WHERE tenant_key = 'leaderforge';

-- Also show Brilliant theme for comparison
SELECT
    tenant_key,
    name,
    theme,
    pg_typeof(theme) as theme_type
FROM core.tenants
WHERE tenant_key = 'brilliant';

-- Instructions for future theme updates:
-- To change LeaderForge colors in the future, run SQL like this:
-- UPDATE core.tenants
-- SET theme = jsonb_set(theme, '{primary}', '"#NEW_COLOR"')
-- WHERE tenant_key = 'leaderforge';
--
-- Or to update multiple colors at once:
-- UPDATE core.tenants
-- SET theme = theme || jsonb_build_object(
--     'primary', '#NEW_PRIMARY_COLOR',
--     'secondary', '#NEW_SECONDARY_COLOR'
-- )
-- WHERE tenant_key = 'leaderforge';