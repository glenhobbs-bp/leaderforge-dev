-- Get detailed structure of modules.user_progress table
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'modules'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'modules'
    AND table_name = 'user_progress'
) as table_exists;

-- Get the actual CREATE TABLE statement
SELECT
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE
            WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE
            WHEN column_default IS NOT NULL
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
    ) || ');' as create_statement
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE c.table_schema = 'modules'
  AND c.table_name = 'user_progress'
GROUP BY schemaname, tablename;