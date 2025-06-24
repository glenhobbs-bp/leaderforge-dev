-- Inspect current user progress table structure
-- Run this to understand the existing video-focused schema

-- Check if the table exists and its structure
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'modules'
  AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'modules.user_progress'::regclass;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'modules'
  AND tablename = 'user_progress';

-- Sample data (if any exists - should be empty per user)
SELECT COUNT(*) as row_count FROM modules.user_progress;

-- Check all schemas to understand current structure
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;