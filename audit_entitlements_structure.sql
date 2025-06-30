-- Audit current entitlements table structure
-- Check what columns actually exist after migrations

-- 1. Get the exact table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'entitlements'
ORDER BY ordinal_position;

-- 2. Get sample data to see actual structure
SELECT * FROM core.entitlements LIMIT 3;

-- 3. Check user_entitlements table structure too
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'user_entitlements'
ORDER BY ordinal_position;

-- 4. Get sample user_entitlements data
SELECT * FROM core.user_entitlements LIMIT 3;

-- 5. Check if there are any existing entitlements
SELECT COUNT(*) as total_entitlements FROM core.entitlements;

-- 6. Check existing entitlements by tenant_key (if that column exists)
SELECT
    COALESCE(tenant_key, 'NO_TENANT_KEY') as tenant_key,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as entitlement_names
FROM core.entitlements
GROUP BY tenant_key
ORDER BY tenant_key;