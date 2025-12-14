-- Fix RLS policies for service role access to user_entitlements
-- This addresses the 403 error when service role tries to read entitlements

-- Create or update policy to allow service role to bypass RLS
-- This policy allows service_role to read all user_entitlements
DROP POLICY IF EXISTS "Service role can read all user_entitlements" ON core.user_entitlements;
CREATE POLICY "Service role can read all user_entitlements"
ON core.user_entitlements
FOR SELECT
TO service_role
USING (true);

-- Allow service role to read entitlements table
DROP POLICY IF EXISTS "Service role can read all entitlements" ON core.entitlements;
CREATE POLICY "Service role can read all entitlements"
ON core.entitlements
FOR SELECT
TO service_role
USING (true);

-- Allow service role to read users table
DROP POLICY IF EXISTS "Service role can read all users" ON core.users;
CREATE POLICY "Service role can read all users"
ON core.users
FOR SELECT
TO service_role
USING (true);

-- Allow service role to read user_organizations table
DROP POLICY IF EXISTS "Service role can read all user_organizations" ON core.user_organizations;
CREATE POLICY "Service role can read all user_organizations"
ON core.user_organizations
FOR SELECT
TO service_role
USING (true);

-- Also ensure authenticated users can read their own entitlements
DROP POLICY IF EXISTS "Users can read own entitlements" ON core.user_entitlements;
CREATE POLICY "Users can read own entitlements"
ON core.user_entitlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can read entitlement definitions
DROP POLICY IF EXISTS "Authenticated users can read entitlements" ON core.entitlements;
CREATE POLICY "Authenticated users can read entitlements"
ON core.entitlements
FOR SELECT
TO authenticated
USING (true);

-- Simple verification query
SELECT 'POLICY CREATED:' as status, policyname, tablename, roles
FROM pg_policies
WHERE tablename IN ('user_entitlements', 'entitlements', 'users', 'user_organizations')
  AND 'service_role' = ANY(roles::text[])
ORDER BY tablename, policyname;