-- Create service role policies for entitlement tables
-- This allows the service role to manage entitlements

-- Service role can read/write entitlements table
CREATE POLICY IF NOT EXISTS "service_role_entitlements_all"
ON core.entitlements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'core'
AND tablename IN ('entitlements')
ORDER BY tablename, policyname;