-- Dump all entitlements from core.entitlements table
-- Shows complete entitlement definitions with formatted output

SELECT
  e.id,
  e.name,
  e.display_name,
  e.description,
  e.context_key,
  jsonb_pretty(e.features) as features_formatted,
  e.features as features_raw,
  e.created_at,
  e.updated_at
FROM core.entitlements e
ORDER BY e.context_key, e.name;

-- Summary by context with feature details
SELECT
  e.context_key,
  COUNT(*) as entitlement_count,
  STRING_AGG(e.name, ', ' ORDER BY e.name) as entitlement_names,
  STRING_AGG(e.features::text, E'\n' ORDER BY e.name) as all_features
FROM core.entitlements e
GROUP BY e.context_key
ORDER BY e.context_key;

-- Check user entitlements for Glen with features
SELECT
  u.email,
  e.name as entitlement_name,
  e.display_name,
  e.context_key,
  jsonb_pretty(e.features) as features_formatted,
  e.features as features_raw,
  ue.granted_at,
  ue.grant_reason
FROM core.user_entitlements ue
JOIN core.users u ON u.id = ue.user_id
JOIN core.entitlements e ON e.id = ue.entitlement_id
WHERE u.email = 'glen.hobbs@brilliantperspectives.com'
ORDER BY e.context_key, e.name;

-- Feature analysis - what features are available
SELECT
  e.context_key,
  e.name,
  jsonb_object_keys(e.features) as feature_key,
  e.features ->> jsonb_object_keys(e.features) as feature_value
FROM core.entitlements e,
     jsonb_object_keys(e.features)
ORDER BY e.context_key, e.name, feature_key;