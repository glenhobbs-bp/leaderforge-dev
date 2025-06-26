-- COMPLETE CONTEXT TO TENANT MIGRATION SCRIPT
-- Run this to finish the migration from context_* to tenant_* architecture
-- BACKUP FIRST: pg_dump your_database > backup_before_final_migration.sql

BEGIN;

-- 1. CORE.USER_PROGRESS TABLE (this is critical for UserProgressTool)
-- Add tenant_key column and migrate data from context_key
DO $$
BEGIN
    -- Check if context_key column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'user_progress'
        AND column_name = 'context_key'
    ) THEN
        -- Add tenant_key column
        ALTER TABLE core.user_progress ADD COLUMN IF NOT EXISTS tenant_key TEXT;

        -- Migrate data from context_key to tenant_key
        UPDATE core.user_progress SET tenant_key = context_key WHERE tenant_key IS NULL;

        -- Make tenant_key NOT NULL
        ALTER TABLE core.user_progress ALTER COLUMN tenant_key SET NOT NULL;

        -- Drop old constraint and create new one
        ALTER TABLE core.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_content_id_context_key_key;
        ALTER TABLE core.user_progress ADD CONSTRAINT user_progress_user_id_content_id_tenant_key_key
            UNIQUE (user_id, content_id, tenant_key);

        -- Create new index
        CREATE INDEX IF NOT EXISTS idx_user_progress_tenant ON core.user_progress(tenant_key);

        -- Drop old index and column
        DROP INDEX IF EXISTS idx_user_progress_context;
        ALTER TABLE core.user_progress DROP COLUMN context_key;

        RAISE NOTICE 'Migrated core.user_progress: context_key → tenant_key';
    ELSE
        RAISE NOTICE 'core.user_progress already has tenant_key column';
    END IF;
END $$;

-- 2. CORE.TENANTS TABLE (fix column names)
-- Check if tenants table has wrong column names and fix them
DO $$
BEGIN
    -- Check if tenant_key column exists, if not rename context_key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'tenants'
        AND column_name = 'tenant_key'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'tenants'
        AND column_name = 'context_key'
    ) THEN
        ALTER TABLE core.tenants RENAME COLUMN context_key TO tenant_key;
        RAISE NOTICE 'Renamed core.tenants.context_key → tenant_key';
    END IF;

    -- Add missing columns if they don't exist
    ALTER TABLE core.tenants ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE core.tenants ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE core.tenants ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
    ALTER TABLE core.tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE core.tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

    -- Update any existing records without names
    UPDATE core.tenants SET name = tenant_key WHERE name IS NULL OR name = '';

    -- Make name NOT NULL after populating
    ALTER TABLE core.tenants ALTER COLUMN name SET NOT NULL;

    RAISE NOTICE 'Updated core.tenants table structure';
END $$;

-- 3. CORE.ENTITLEMENTS TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'entitlements'
        AND column_name = 'context_key'
    ) THEN
        ALTER TABLE core.entitlements ADD COLUMN IF NOT EXISTS tenant_key TEXT;
        UPDATE core.entitlements SET tenant_key = context_key WHERE tenant_key IS NULL;
        ALTER TABLE core.entitlements ALTER COLUMN tenant_key SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_entitlements_tenant ON core.entitlements(tenant_key);
        DROP INDEX IF EXISTS idx_entitlements_context;
        ALTER TABLE core.entitlements DROP COLUMN context_key;
        RAISE NOTICE 'Migrated core.entitlements: context_key → tenant_key';
    END IF;
END $$;

-- 4. CORE.NAV_OPTIONS TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core'
        AND table_name = 'nav_options'
        AND column_name = 'context_key'
    ) THEN
        ALTER TABLE core.nav_options ADD COLUMN IF NOT EXISTS tenant_key TEXT;
        UPDATE core.nav_options SET tenant_key = context_key WHERE tenant_key IS NULL;

        -- Update foreign key constraint
        ALTER TABLE core.nav_options DROP CONSTRAINT IF EXISTS nav_options_context_key_fkey;
        ALTER TABLE core.nav_options ADD CONSTRAINT nav_options_tenant_key_fkey
          FOREIGN KEY (tenant_key) REFERENCES core.tenants(tenant_key) ON DELETE CASCADE;

        ALTER TABLE core.nav_options ALTER COLUMN tenant_key SET NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_nav_options_tenant ON core.nav_options(tenant_key);
        DROP INDEX IF EXISTS idx_nav_options_context;
        ALTER TABLE core.nav_options DROP COLUMN context_key;
        RAISE NOTICE 'Migrated core.nav_options: context_key → tenant_key';
    END IF;
END $$;

-- 5. INSERT DEFAULT TENANT DATA IF TENANTS TABLE IS EMPTY
INSERT INTO core.tenants (tenant_key, name, description, config)
SELECT 'leaderforge', 'LeaderForge', 'LeaderForge leadership development content', '{}'
WHERE NOT EXISTS (SELECT 1 FROM core.tenants WHERE tenant_key = 'leaderforge');

INSERT INTO core.tenants (tenant_key, name, description, config)
SELECT 'brilliant', 'Brilliant Perspectives', 'Brilliant Perspectives content library', '{}'
WHERE NOT EXISTS (SELECT 1 FROM core.tenants WHERE tenant_key = 'brilliant');

-- 6. VERIFY MIGRATION SUCCESS
DO $$
DECLARE
    user_progress_count INTEGER;
    tenants_count INTEGER;
    entitlements_count INTEGER;
    nav_options_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_progress_count FROM core.user_progress;
    SELECT COUNT(*) INTO tenants_count FROM core.tenants;
    SELECT COUNT(*) INTO entitlements_count FROM core.entitlements;
    SELECT COUNT(*) INTO nav_options_count FROM core.nav_options;

    RAISE NOTICE 'MIGRATION COMPLETE!';
    RAISE NOTICE 'Records: user_progress=%, tenants=%, entitlements=%, nav_options=%',
        user_progress_count, tenants_count, entitlements_count, nav_options_count;
    RAISE NOTICE 'All tables now use tenant_key instead of context_key';
END $$;

COMMIT;

-- POST-MIGRATION VERIFICATION QUERIES
-- Uncomment to verify the migration worked:
-- SELECT 'user_progress' as table_name, COUNT(*) as records FROM core.user_progress;
-- SELECT 'tenants' as table_name, COUNT(*) as records FROM core.tenants;
-- SELECT 'entitlements' as table_name, COUNT(*) as records FROM core.entitlements;
-- SELECT 'nav_options' as table_name, COUNT(*) as records FROM core.nav_options;
-- SELECT tenant_key, name FROM core.tenants;