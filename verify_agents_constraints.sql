-- =====================================================
-- Verify core.agents Table Constraints
-- =====================================================
-- Check what constraints already exist

-- Show all constraints on agents table
SELECT 'EXISTING_CONSTRAINTS' as check_type,
       constraint_name,
       constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'core' AND table_name = 'agents';

-- Verify the type constraint exists and works
SELECT 'TYPE_CONSTRAINT_TEST' as check_type,
       'PASSED' as result
WHERE EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'core'
      AND table_name = 'agents'
      AND constraint_name = 'agents_type_check'
      AND constraint_type = 'CHECK'
);

-- Show current agents and their types
SELECT 'CURRENT_AGENTS' as check_type,
       name,
       type,
       display_name
FROM core.agents
ORDER BY created_at;