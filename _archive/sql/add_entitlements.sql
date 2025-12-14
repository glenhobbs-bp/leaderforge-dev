-- Add entitlements for glen.hobbs@brilliantperspectives.com
-- User ID: 47f9db16-f24f-4868-8155-256cfa2edc2c

-- First, let's create any missing entitlements that the agent route expects
INSERT INTO core.entitlements (name, display_name, description, context_key, features) VALUES
-- Basic access entitlements
('coaching-access', 'Coaching Access', 'Access to coaching features', 'brilliant', '{"coaching": true}'),
('library-access', 'Library Access', 'Access to video library', 'brilliant', '{"library": true}'),
('community-access', 'Community Access', 'Access to community features', 'brilliant', '{"community": true}'),
('business-access', 'Business Access', 'Access to business features', 'leaderforge', '{"business": true}'),
('business-coaching', 'Business Coaching', 'Access to business coaching', 'leaderforge', '{"businessCoaching": true}'),
('training-access', 'Training Access', 'Access to training modules', 'leaderforge', '{"training": true}'),

-- Standard entitlements from the documentation
('movement-member', 'Movement Member', 'Full access to Brilliant Movement platform', 'brilliant-movement', '{"brilliantPlus": true, "gatherings": true, "smallGroups": true, "events": true}'),
('movement-ambassador', 'Movement Ambassador', 'Ambassador access with commission tracking', 'brilliant-movement', '{"canPromote": true, "referralTracking": true, "commissionAccess": true}'),
('leaderforge-basic', 'LeaderForge Basic', 'Basic business leadership training', 'leaderforge-business', '{"trainingModules": true, "basicDashboard": true}'),
('leaderforge-premium', 'LeaderForge Premium', 'Advanced leadership training with team features', 'leaderforge-business', '{"trainingModules": true, "teamDashboard": true, "boldActions": true, "analytics": true}'),
('ceo-inner-circle', 'CEO Inner Circle', 'Executive leadership circle with personal coaching', 'leaderforge-business', '{"allFeatures": true, "personalCoaching": true, "executiveSessions": true}'),
('wealth-basic', 'Wealth Basic', 'Biblical financial stewardship basics', 'wealth-with-god', '{"basicContent": true, "budgetTools": true}'),
('wealth-premium', 'Wealth Premium', 'Advanced wealth building with personal guidance', 'wealth-with-god', '{"allContent": true, "personalGuidance": true, "advancedTools": true}'),
('wealth-partner', 'Wealth Partner', 'Partner access for financial advisors', 'wealth-with-god', '{"clientManagement": true, "advisorTools": true, "whiteLabel": true}'),
('bsol-student', 'BSOL Student', 'Brilliant School of Leadership student access', 'brilliant-school', '{"curriculum": true, "assignments": true, "cohortAccess": true}'),
('bsol-graduate', 'BSOL Graduate', 'Graduate access to resources and community', 'brilliant-school', '{"graduateResources": true, "mentorNetwork": true, "continuingEducation": true}'),
('smallgroup-member', 'Small Group Member', 'Small group participation access', 'small-group-hub', '{"groupAccess": true, "studies": true, "events": true}'),
('smallgroup-leader', 'Small Group Leader', 'Small group leadership tools and training', 'small-group-hub', '{"leaderTools": true, "facilitationGuides": true, "groupManagement": true}')
ON CONFLICT (name) DO NOTHING;

-- Now grant ALL of these entitlements to Glen's user account
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_by, grant_reason)
SELECT
  '47f9db16-f24f-4868-8155-256cfa2edc2c'::uuid as user_id,
  e.id as entitlement_id,
  '47f9db16-f24f-4868-8155-256cfa2edc2c'::uuid as granted_by,
  'Admin grant - full access for testing' as grant_reason
FROM core.entitlements e
WHERE e.name IN (
  'coaching-access',
  'library-access',
  'community-access',
  'business-access',
  'business-coaching',
  'training-access',
  'movement-member',
  'movement-ambassador',
  'leaderforge-basic',
  'leaderforge-premium',
  'ceo-inner-circle',
  'wealth-basic',
  'wealth-premium',
  'wealth-partner',
  'bsol-student',
  'bsol-graduate',
  'smallgroup-member',
  'smallgroup-leader'
)
ON CONFLICT (user_id, entitlement_id) DO NOTHING;

-- Verify the grants
SELECT
  u.email,
  e.name as entitlement_name,
  e.display_name,
  e.context_key,
  ue.granted_at
FROM core.user_entitlements ue
JOIN core.users u ON u.id = ue.user_id
JOIN core.entitlements e ON e.id = ue.entitlement_id
WHERE u.email = 'glen@brilliantperspectives.com'
  AND ue.revoked_at IS NULL
ORDER BY e.context_key, e.name;