-- Create service role policies for entitlement access
-- This fixes the 403 error when service role tries to read entitlements

-- Enable service role to read user_entitlements
DROP POLICY IF EXISTS "Service role can read all user_entitlements" ON core.user_entitlements;
CREATE POLICY "Service role can read all user_entitlements"
ON core.user_entitlements
FOR SELECT
TO service_role
USING (true);

-- Enable service role to read entitlements
DROP POLICY IF EXISTS "Service role can read all entitlements" ON core.entitlements;
CREATE POLICY "Service role can read all entitlements"
ON core.entitlements
FOR SELECT
TO service_role
USING (true);

-- Enable service role to read users
DROP POLICY IF EXISTS "Service role can read all users" ON core.users;
CREATE POLICY "Service role can read all users"
ON core.users
FOR SELECT
TO service_role
USING (true);

-- Enable service role to read user_organizations
DROP POLICY IF EXISTS "Service role can read all user_organizations" ON core.user_organizations;
CREATE POLICY "Service role can read all user_organizations"
ON core.user_organizations
FOR SELECT
TO service_role
USING (true);

-- Enable authenticated users to read their own entitlements
DROP POLICY IF EXISTS "Users can read own entitlements" ON core.user_entitlements;
CREATE POLICY "Users can read own entitlements"
ON core.user_entitlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Enable authenticated users to read entitlement definitions
DROP POLICY IF EXISTS "Authenticated users can read entitlements" ON core.entitlements;
CREATE POLICY "Authenticated users can read entitlements"
ON core.entitlements
FOR SELECT
TO authenticated
USING (true);

-- Verify policies were created successfully
SELECT 'SUCCESS: Policy created for ' || tablename as result, policyname
FROM pg_policies
WHERE policyname LIKE '%Service role%'
ORDER BY tablename, policyname;