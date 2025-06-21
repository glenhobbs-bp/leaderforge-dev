-- Get the structure of core.users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check current_module field specifically
SELECT current_module, COUNT(*) as user_count
FROM core.users
WHERE current_module IS NOT NULL
GROUP BY current_module;