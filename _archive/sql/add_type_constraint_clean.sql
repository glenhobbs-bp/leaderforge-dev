-- =====================================================
-- Add Type Constraint to core.agents (Clean)
-- =====================================================
-- This script safely adds the type constraint

-- First, try to drop the constraint if it exists (ignore errors)
DO $$
BEGIN
    ALTER TABLE core.agents DROP CONSTRAINT IF EXISTS agents_type_check;
    RAISE NOTICE 'Dropped existing constraint (if any)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No existing constraint to drop';
END $$;

-- Now add the constraint fresh
ALTER TABLE core.agents
ADD CONSTRAINT agents_type_check
CHECK (type IN ('llm', 'langgraph', 'tool', 'workflow'));

-- Verify it was added
SELECT
    'CONSTRAINT_ADDED' as result,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class
    WHERE relname = 'agents'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')
)
AND contype = 'c'
AND conname = 'agents_type_check';