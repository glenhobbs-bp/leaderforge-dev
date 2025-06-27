-- Convert navigation state from nav_keys to UUIDs if needed
-- Step 1: Check current navigation state
SELECT
    id,
    preferences->'navigationState' as current_nav_state
FROM core.users
WHERE preferences->'navigationState' IS NOT NULL;

-- Step 2: Update navigation state to use proper UUIDs
-- This will convert any nav_key references to proper UUIDs by looking them up
UPDATE core.users
SET preferences = jsonb_set(
    preferences,
    '{navigationState,lastNavOption}',
    (
        SELECT to_jsonb(nav_options.id)
        FROM core.nav_options
        WHERE nav_options.nav_key = (preferences->'navigationState'->>'lastNavOption')
        AND nav_options.tenant_key = (preferences->'navigationState'->>'lastTenant')
        LIMIT 1
    )
)
WHERE
    preferences->'navigationState'->'lastNavOption' IS NOT NULL
    AND preferences->'navigationState'->'lastTenant' IS NOT NULL
    -- Only update if lastNavOption is a nav_key (not already a UUID)
    AND length(preferences->'navigationState'->>'lastNavOption') < 36;

-- Step 3: Verify the update
SELECT
    id,
    preferences->'navigationState' as updated_nav_state,
    'Updated navigation state to use UUIDs' as status
FROM core.users
WHERE preferences->'navigationState' IS NOT NULL;