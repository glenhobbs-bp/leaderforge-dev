-- Fix RLS policies for service role access to core tables
-- This addresses the permission denied errors when service role tries to access users and other core tables
-- ADR-0009 compliant: Service role needs full access for backend operations

-- Allow service role full access to users table
DROP POLICY IF EXISTS "Service role can read all users" ON core.users;
DROP POLICY IF EXISTS "Service role can write all users" ON core.users;
CREATE POLICY "Service role full access to users"
ON core.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role full access to user_entitlements table
DROP POLICY IF EXISTS "Service role can read all user_entitlements" ON core.user_entitlements;
DROP POLICY IF EXISTS "Service role can write all user_entitlements" ON core.user_entitlements;
CREATE POLICY "Service role full access to user_entitlements"
ON core.user_entitlements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role full access to entitlements table
DROP POLICY IF EXISTS "Service role can read all entitlements" ON core.entitlements;
DROP POLICY IF EXISTS "Service role can write all entitlements" ON core.entitlements;
CREATE POLICY "Service role full access to entitlements"
ON core.entitlements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role full access to user_organizations table
DROP POLICY IF EXISTS "Service role can read all user_organizations" ON core.user_organizations;
DROP POLICY IF EXISTS "Service role can write all user_organizations" ON core.user_organizations;
CREATE POLICY "Service role full access to user_organizations"
ON core.user_organizations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service role full access to user_progress table
DROP POLICY IF EXISTS "Service role full access" ON core.user_progress;
DROP POLICY IF EXISTS "service_role_all_access" ON core.user_progress;
CREATE POLICY "Service role full access to user_progress"
ON core.user_progress
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can read their own data
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

-- Users can read and update their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON core.users;
CREATE POLICY "Users can manage own profile"
ON core.users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can manage their own progress
DROP POLICY IF EXISTS "Users can manage own progress" ON core.user_progress;
CREATE POLICY "Users can manage own progress"
ON core.user_progress
FOR ALL
TO authenticated
USING (user_id::uuid = auth.uid())
WITH CHECK (user_id::uuid = auth.uid());

-- Grant necessary permissions to service role
GRANT ALL ON core.users TO service_role;
GRANT ALL ON core.user_entitlements TO service_role;
GRANT ALL ON core.entitlements TO service_role;
GRANT ALL ON core.user_organizations TO service_role;
GRANT ALL ON core.user_progress TO service_role;

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON core.users TO authenticated;
GRANT SELECT ON core.user_entitlements TO authenticated;
GRANT SELECT ON core.entitlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_progress TO authenticated;

-- Verification query
SELECT
    'SERVICE ROLE POLICIES CREATED:' as status,
    policyname,
    tablename,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('user_entitlements', 'entitlements', 'users', 'user_organizations', 'user_progress')
  AND 'service_role' = ANY(roles::text[])
ORDER BY tablename, policyname;