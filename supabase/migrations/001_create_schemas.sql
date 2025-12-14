-- Migration: 001_create_schemas
-- Description: Create database schemas for LeaderForge
-- Date: 2024-12-14

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS progress;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA core TO authenticated;
GRANT USAGE ON SCHEMA content TO authenticated;
GRANT USAGE ON SCHEMA progress TO authenticated;

-- Grant usage to service role
GRANT ALL ON SCHEMA core TO service_role;
GRANT ALL ON SCHEMA content TO service_role;
GRANT ALL ON SCHEMA progress TO service_role;

COMMENT ON SCHEMA core IS 'Platform fundamentals: tenants, organizations, teams, users';
COMMENT ON SCHEMA content IS 'Learning content: items, entitlements, licenses';
COMMENT ON SCHEMA progress IS 'User tracking: progress, completions';

