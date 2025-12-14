-- Verify entitlements for glen@brilliantperspectives.com
-- User ID: 47f9db16-f24f-4868-8155-256cfa2edc2c

-- Check if the user exists in core.users
SELECT 'USER CHECK:' as check_type,
       id, email, full_name
FROM core.users
WHERE id = '47f9db16-f24f-4868-8155-256cfa2edc2c' OR email = 'glen@brilliantperspectives.com';

-- Check if admin entitlements exist in core.entitlements
SELECT 'ENTITLEMENT CHECK:' as check_type,
       id, name, display_name, context_key
FROM core.entitlements
WHERE name IN ('brilliant-admin', 'leaderforge-admin');

-- Check user_entitlements table for this user
SELECT 'USER ENTITLEMENTS:' as check_type,
       ue.user_id,
       e.name as entitlement_name,
       e.display_name,
       e.context_key,
       ue.granted_at,
       ue.grant_reason
FROM core.user_entitlements ue
JOIN core.entitlements e ON e.id = ue.entitlement_id
WHERE ue.user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c';

-- Check if there are ANY entitlements for this user
SELECT 'ENTITLEMENT COUNT:' as check_type,
       COUNT(*) as total_entitlements
FROM core.user_entitlements
WHERE user_id = '47f9db16-f24f-4868-8155-256cfa2edc2c';

-- Show all users who have entitlements (for debugging)
SELECT 'ALL USER ENTITLEMENTS:' as check_type,
       u.email,
       e.name as entitlement_name,
       ue.granted_at
FROM core.user_entitlements ue
JOIN core.users u ON u.id = ue.user_id
JOIN core.entitlements e ON e.id = ue.entitlement_id
ORDER BY u.email, e.name;