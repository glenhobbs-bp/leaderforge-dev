-- Setup User Registration Flow
-- Purpose: Automatically create user profiles when new users sign up via Supabase Auth
-- This ensures new users get proper access to the LeaderForge platform

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into core.users table with default settings
  INSERT INTO core.users (
    id,
    email,
    full_name,
    first_name,
    last_name,
    enabled_modules,
    current_module,
    preferences,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    ARRAY['leaderforge'], -- Default module access
    'leaderforge', -- Default current module
    '{"welcome_completed": false, "onboarding_step": 1}'::jsonb,
    'active'::user_status,
    '{}'::jsonb,
    NOW(),
    NOW()
  );

  -- Grant basic LeaderForge entitlements to new users
  INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_by, grant_reason)
  SELECT
    NEW.id,
    id,
    NEW.id, -- Self-granted for auto-signup
    'automatic_signup_grant'
  FROM core.entitlements
  WHERE name IN (
    'leaderforge.access',
    'leaderforge.content.basic'
  )
  ON CONFLICT (user_id, entitlement_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO service_role;

-- Ensure basic entitlements exist for new users
INSERT INTO core.entitlements (name, display_name, description, tenant_key) VALUES
  ('leaderforge.access', 'LeaderForge Access', 'Basic access to LeaderForge platform', 'leaderforge'),
  ('leaderforge.content.basic', 'Basic Content Access', 'Access to basic LeaderForge content', 'leaderforge')
ON CONFLICT (name) DO NOTHING;

-- Test the setup with a verification query
SELECT
  'User registration setup completed' as status,
  'New users will automatically get core.users profile and basic entitlements' as description;