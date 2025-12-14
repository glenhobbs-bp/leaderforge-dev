-- =====================================================
-- Rename href to nav_key in nav_options Table (FIXED)
-- This handles duplicate nav_key values before creating constraints
-- =====================================================

BEGIN;

-- 1. First, let's see what duplicates we have
SELECT 'BEFORE MIGRATION - Checking for duplicates' as status;
SELECT tenant_key, href as current_href, COUNT(*) as duplicate_count
FROM core.nav_options
GROUP BY tenant_key, href
HAVING COUNT(*) > 1;

-- 2. Rename existing href column to nav_key
ALTER TABLE core.nav_options
RENAME COLUMN href TO nav_key;

-- 3. Update nav_keys to ensure uniqueness by adding sequence numbers to duplicates
WITH duplicates AS (
  SELECT
    id,
    nav_key,
    tenant_key,
    label,
    ROW_NUMBER() OVER (PARTITION BY tenant_key, nav_key ORDER BY created_at, id) as rn
  FROM core.nav_options
),
updated_nav_keys AS (
  SELECT
    d.id,
    CASE
      WHEN d.rn = 1 THEN
        -- First occurrence: clean up the nav_key
        LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(d.nav_key, d.label), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
      ELSE
        -- Subsequent occurrences: add sequence number
        LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(d.nav_key, d.label), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || d.rn::text
    END as new_nav_key
  FROM duplicates d
)
UPDATE core.nav_options
SET nav_key = unk.new_nav_key
FROM updated_nav_keys unk
WHERE core.nav_options.id = unk.id;

-- 4. Handle any remaining null nav_keys
UPDATE core.nav_options
SET nav_key = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(label, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE nav_key IS NULL OR nav_key = '';

-- 5. Final cleanup: ensure all nav_keys are unique within tenant
WITH final_duplicates AS (
  SELECT
    id,
    nav_key,
    tenant_key,
    ROW_NUMBER() OVER (PARTITION BY tenant_key, nav_key ORDER BY created_at, id) as rn
  FROM core.nav_options
),
final_updates AS (
  SELECT
    fd.id,
    CASE
      WHEN fd.rn > 1 THEN fd.nav_key || '-' || fd.rn::text
      ELSE fd.nav_key
    END as final_nav_key
  FROM final_duplicates fd
  WHERE fd.rn > 1
)
UPDATE core.nav_options
SET nav_key = fu.final_nav_key
FROM final_updates fu
WHERE core.nav_options.id = fu.id;

-- 6. Verify no duplicates remain
SELECT 'AFTER CLEANUP - Checking for remaining duplicates' as status;
SELECT tenant_key, nav_key, COUNT(*) as count
FROM core.nav_options
GROUP BY tenant_key, nav_key
HAVING COUNT(*) > 1;

-- 7. Create index for performance (nav_key will be used for lookups)
CREATE INDEX IF NOT EXISTS idx_nav_options_nav_key
ON core.nav_options(nav_key);

-- 8. Create unique constraint to prevent duplicate nav_keys within same tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_nav_options_tenant_nav_key_unique
ON core.nav_options(tenant_key, nav_key)
WHERE nav_key IS NOT NULL;

-- 9. Show final results
SELECT 'MIGRATION COMPLETED - Final nav_key assignments' as status;
SELECT
  tenant_key,
  nav_key,
  label,
  "order",
  id
FROM core.nav_options
WHERE tenant_key IN ('brilliant', 'leaderforge')
ORDER BY tenant_key, "order";

COMMIT;

-- Post-migration verification
SELECT
  'Migration completed successfully. Nav options now use unique nav_key identifiers.' as status,
  COUNT(*) as total_nav_options,
  COUNT(DISTINCT nav_key) as unique_nav_keys,
  COUNT(DISTINCT CONCAT(tenant_key, ':', nav_key)) as unique_tenant_nav_keys
FROM core.nav_options;