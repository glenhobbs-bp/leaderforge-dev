-- Get the structure of modules.user_progress table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'modules'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Also check if the table exists and get constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'modules'
  AND tc.table_name = 'user_progress';