-- =====================================================
-- Add Type Constraint to core.agents Table
-- =====================================================
-- Safe to run since we confirmed only 'langgraph' type exists

-- Add the type constraint
ALTER TABLE core.agents
ADD CONSTRAINT agents_type_check
CHECK (type IN ('llm', 'langgraph', 'tool', 'workflow'));

-- Verify the constraint was added
SELECT 'CONSTRAINT_ADDED' as result,
       constraint_name,
       constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'core'
  AND table_name = 'agents'
  AND constraint_name = 'agents_type_check';