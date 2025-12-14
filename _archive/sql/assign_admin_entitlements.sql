-- Assign admin entitlements to glen@brilliantperspectives.com
-- User ID: 47f9db16-f24f-4868-8155-256cfa2edc2c

-- Insert user entitlements for admin access
-- Using conditional INSERT to avoid duplicates

-- Assign brilliant-admin entitlement
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_at, grant_reason)
SELECT
  '47f9db16-f24f-4868-8155-256cfa2edc2c' as user_id,
  e.id as entitlement_id,
  NOW() as granted_at,
  'Admin access granted by system' as grant_reason
FROM core.entitlements e
WHERE e.name = 'brilliant-admin'
AND NOT EXISTS (
  SELECT 1 FROM core.user_entitlements ue
  WHERE ue.user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c'
  AND ue.entitlement_id = e.id
);

-- Assign leaderforge-admin entitlement
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_at, grant_reason)
SELECT
  '47f9db16-f24f-4868-8155-256cfa2edc2c' as user_id,
  e.id as entitlement_id,
  NOW() as granted_at,
  'Admin access granted by system' as grant_reason
FROM core.entitlements e
WHERE e.name = 'leaderforge-admin'
AND NOT EXISTS (
  SELECT 1 FROM core.user_entitlements ue
  WHERE ue.user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c'
  AND ue.entitlement_id = e.id
);

-- Verify the assignments
SELECT
  u.email,
  e.name as entitlement_name,
  e.display_name,
  e.context_key,
  jsonb_pretty(e.features) as features,
  ue.granted_at,
  ue.grant_reason
FROM core.user_entitlements ue
JOIN core.users u ON u.id = ue.user_id
JOIN core.entitlements e ON e.id = ue.entitlement_id
WHERE u.email = 'glen@brilliantperspectives.com'
ORDER BY e.context_key, e.name;