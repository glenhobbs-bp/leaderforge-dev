-- =====================================================
-- Update core.agents Table with Type Constraints
-- =====================================================
-- This script checks current state and applies type constraints
-- Run this against your Supabase database

-- First, let's check if the core.agents table exists and its current structure
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING CURRENT STATE ===';

    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'agents') THEN
        RAISE NOTICE 'core.agents table EXISTS';
    ELSE
        RAISE NOTICE 'core.agents table DOES NOT EXIST - needs to be created';
    END IF;
END $$;

-- Check current table structure and constraints
SELECT
    'CURRENT SCHEMA' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'core' AND table_name = 'agents'
ORDER BY ordinal_position;

-- Check existing constraints
SELECT
    'EXISTING CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'core' AND tc.table_name = 'agents';

-- Check if our specific type constraint already exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_schema = 'core'
        AND constraint_name LIKE '%agent_type%'
        OR check_clause LIKE '%type%IN%'
    ) THEN
        RAISE NOTICE 'Type constraint ALREADY EXISTS';
    ELSE
        RAISE NOTICE 'Type constraint DOES NOT EXIST - will be added';
    END IF;
END $$;

-- =====================================================
-- CREATE TABLE IF NOT EXISTS
-- =====================================================
-- Create the table with proper constraints if it doesn't exist
CREATE TABLE IF NOT EXISTS core.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('llm', 'langgraph', 'tool', 'workflow')),
    prompt TEXT,
    tools JSONB DEFAULT '[]'::jsonb,
    model TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    version INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD MISSING CONSTRAINTS TO EXISTING TABLE
-- =====================================================
-- If table exists but constraints are missing, add them

-- Add type constraint if it doesn't exist
DO $$
BEGIN
    -- Check if constraint doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_schema = 'core'
        AND table_name = 'agents'
        AND (constraint_name LIKE '%agent_type%' OR check_clause LIKE '%type%IN%')
    ) THEN
        -- First check if there are any invalid type values
        DECLARE
            invalid_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO invalid_count
            FROM core.agents
            WHERE type NOT IN ('llm', 'langgraph', 'tool', 'workflow');

            IF invalid_count > 0 THEN
                RAISE NOTICE 'WARNING: Found % agents with invalid type values:', invalid_count;
                -- Show the invalid values
                FOR rec IN
                    SELECT id, name, type
                    FROM core.agents
                    WHERE type NOT IN ('llm', 'langgraph', 'tool', 'workflow')
                LOOP
                    RAISE NOTICE '  Agent: % (%) has invalid type: %', rec.name, rec.id, rec.type;
                END LOOP;

                RAISE NOTICE 'Please fix these values before adding the constraint.';
                RAISE NOTICE 'Valid types are: llm, langgraph, tool, workflow';
            ELSE
                -- Safe to add constraint
                ALTER TABLE core.agents
                ADD CONSTRAINT valid_agent_type
                CHECK (type IN ('llm', 'langgraph', 'tool', 'workflow'));

                RAISE NOTICE 'SUCCESS: Added type constraint to core.agents table';
            END IF;
        END;
    ELSE
        RAISE NOTICE 'Type constraint already exists on core.agents table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not check/add constraint. Table may not exist yet.';
END $$;

-- =====================================================
-- ADD MISSING COLUMNS IF NEEDED
-- =====================================================
-- Add any missing columns that are in the recommended schema

-- Add display_name if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Added display_name column';
    END IF;
END $$;

-- Add description if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'description'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
END $$;

-- Add tools if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'tools'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN tools JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added tools column';
    END IF;
END $$;

-- Add model if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'model'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN model TEXT;
        RAISE NOTICE 'Added model column';
    END IF;
END $$;

-- Add parameters if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'parameters'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN parameters JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added parameters column';
    END IF;
END $$;

-- Add config if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'config'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added config column';
    END IF;
END $$;

-- Add version if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'version'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN version INTEGER DEFAULT 1;
        RAISE NOTICE 'Added version column';
    END IF;
END $$;

-- Add enabled if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'core' AND table_name = 'agents' AND column_name = 'enabled'
    ) THEN
        ALTER TABLE core.agents ADD COLUMN enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added enabled column';
    END IF;
END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
RAISE NOTICE '=== FINAL STATE VERIFICATION ===';

-- Show final table structure
SELECT
    'FINAL SCHEMA' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'core' AND table_name = 'agents'
ORDER BY ordinal_position;

-- Show all constraints
SELECT
    'FINAL CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'core' AND tc.table_name = 'agents';

-- Show any existing agents
SELECT
    'EXISTING AGENTS' as check_type,
    id,
    name,
    type,
    enabled,
    created_at
FROM core.agents
ORDER BY created_at;

RAISE NOTICE '=== SCRIPT COMPLETE ===';
RAISE NOTICE 'The core.agents table is now ready with proper type constraints';
RAISE NOTICE 'Valid agent types: llm, langgraph, tool, workflow';