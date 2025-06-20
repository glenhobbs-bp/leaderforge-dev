-- =====================================================
-- Detailed Check Constraints Inspection
-- =====================================================
-- PostgreSQL-specific queries to find CHECK constraints

-- 1. Check constraints using pg_constraint (most reliable)
SELECT
    'PG_CONSTRAINTS' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    CASE contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        ELSE contype::text
    END as constraint_type_desc,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class
    WHERE relname = 'agents'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')
);

-- 2. Check if the specific type constraint exists
SELECT
    'TYPE_CONSTRAINT_EXISTS' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = (
            SELECT oid FROM pg_class
            WHERE relname = 'agents'
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')
        )
        AND contype = 'c'
        AND conname = 'agents_type_check'
    ) THEN 'YES' ELSE 'NO' END as result;

-- 3. Show all CHECK constraints on agents table
SELECT
    'CHECK_CONSTRAINTS_ONLY' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class
    WHERE relname = 'agents'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')
)
AND contype = 'c';

-- 4. Test if we can insert invalid types (this will fail if constraint exists)
-- Note: This is just a query to show what would happen, not actually inserting
SELECT
    'CONSTRAINT_TEST' as check_type,
    'Would this INSERT work?' as question,
    'INSERT INTO core.agents (name, type) VALUES (''test'', ''invalid_type'')' as test_query,
    'If constraint exists, this would fail with CHECK constraint violation' as expected_result;