-- Check current database schema status for context vs tenant migration

-- Check if context_configs table exists
SELECT 'context_configs table exists' as status FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'context_configs';

-- Check if tenants table exists
SELECT 'tenants table exists' as status FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'tenants';

-- Check columns in user_progress table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'core' AND table_name = 'user_progress'
AND column_name LIKE '%context%' OR column_name LIKE '%tenant%';

-- Check nav_options table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nav_options'
AND column_name LIKE '%context%' OR column_name LIKE '%tenant%';

-- Check content table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'content'
AND column_name LIKE '%context%' OR column_name LIKE '%tenant%';

-- Sample data from tenants table if it exists
SELECT tenant_key, name FROM tenants LIMIT 5;

-- Sample data from context_configs table if it exists
SELECT context_key, name FROM context_configs LIMIT 5;