-- Add User Dashboard Mockup entitlement for development and testing
-- Safe version that checks for existing entries

-- Create the user dashboard mockup entitlement if it doesn't exist
INSERT INTO core.entitlements (name, display_name, description, tenant_key, features)
SELECT name, display_name, description, tenant_key, features::jsonb FROM (
  VALUES
    ('user-dashboard-mockup', 'User Dashboard Mockup', 'Access to view the user dashboard mockup interface (Marcus dashboard prototype)', 'platform', '{"mockup": true, "userDashboard": true}')
) AS new_entitlements(name, display_name, description, tenant_key, features)
WHERE NOT EXISTS (
  SELECT 1 FROM core.entitlements e WHERE e.name = new_entitlements.name
);

-- Grant user dashboard mockup entitlement to Glen (only if not already granted)
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_by, grant_reason)
SELECT
  '47f9db16-f24f-4868-8155-256cfa2edc2c'::uuid as user_id,
  e.id as entitlement_id,
  '47f9db16-f24f-4868-8155-256cfa2edc2c'::uuid as granted_by,
  'Platform feature - user dashboard mockup access for UX testing' as grant_reason
FROM core.entitlements e
WHERE e.name = 'user-dashboard-mockup'
  AND NOT EXISTS (
    SELECT 1 FROM core.user_entitlements ue
    WHERE ue.user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c'::uuid
      AND ue.entitlement_id = e.id
      AND ue.revoked_at IS NULL
  );

-- Verify the new entitlement
SELECT
  e.name,
  e.display_name,
  e.tenant_key,
  jsonb_pretty(e.features) as features
FROM core.entitlements e
WHERE e.name = 'user-dashboard-mockup';

-- Verify the grant
SELECT
  u.email,
  e.name as entitlement_name,
  e.display_name,
  ue.granted_at,
  ue.grant_reason
FROM core.user_entitlements ue
JOIN core.users u ON u.id = ue.user_id
JOIN core.entitlements e ON e.id = ue.entitlement_id
WHERE u.id = '47f9db16-f24f-4868-8155-256cfa2edc2c'::uuid
  AND e.name = 'user-dashboard-mockup'
  AND ue.revoked_at IS NULL;