UPDATE core.users 
SET preferences = jsonb_set(
  jsonb_set(
    preferences,
    '{navigationState,lastTenant}',
    preferences->'navigationState'->'lastContext'
  ),
  '{navigationState}',
  (preferences->'navigationState') - 'lastContext'
)
WHERE preferences->'navigationState'->'lastContext' IS NOT NULL;

SELECT preferences->'navigationState' FROM core.users WHERE id = '47f9db16-f24f-4868-8155-256cfa2edc2c';
