-- Insert test tenant data if the tenants table exists
DO $$
BEGIN
    -- Check if tenants table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'core'
        AND table_name = 'tenants'
    ) THEN
        -- Insert test tenants if they don't exist
        INSERT INTO core.tenants (tenant_key, name, description, theme, is_active, created_at, updated_at)
        VALUES
            ('brilliant', 'Brilliant Leadership', 'AI-powered leadership development platform', 'brilliant', true, NOW(), NOW()),
            ('leaderforge', 'LeaderForge', 'Professional leadership training and development', 'leaderforge', true, NOW(), NOW())
        ON CONFLICT (tenant_key) DO NOTHING;

        RAISE NOTICE 'Test tenant data inserted successfully';

        -- Show current tenant count
        DECLARE
            tenant_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO tenant_count FROM core.tenants;
            RAISE NOTICE 'Total tenants in database: %', tenant_count;
        END;
    ELSE
        RAISE WARNING 'Tenants table does not exist - run context_to_tenant_migration.sql first';
    END IF;
END $$;