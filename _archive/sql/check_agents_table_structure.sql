-- =====================================================
-- Simple Check: core.agents Table Structure
-- =====================================================
-- Basic table structure check - no complex joins

-- 1. Check if table exists
SELECT 'TABLE_EXISTS' as check_type,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'core' AND table_name = 'agents'
       ) THEN 'YES' ELSE 'NO' END as result;

-- 2. Show table columns
SELECT 'COLUMNS' as check_type,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_schema = 'core' AND table_name = 'agents'
ORDER BY ordinal_position;

-- 3. Show basic constraint info
SELECT 'CONSTRAINTS' as check_type,
       constraint_name,
       constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'core' AND table_name = 'agents';

-- 4. Count records
SELECT 'RECORD_COUNT' as check_type,
       COUNT(*)::text as result
FROM core.agents;

-- 5. Show current type values
SELECT 'TYPE_VALUES' as check_type,
       type,
       COUNT(*)::text as count
FROM core.agents
GROUP BY type;