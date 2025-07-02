-- Enable User Registration for LeaderForge
-- Run this in your Supabase SQL Editor to enable user signup

-- 1. Create function to automatically set up new users
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
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    ARRAY['leaderforge'],
    'leaderforge',
    '{"welcome_completed": false}'::jsonb,
    'active',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger to run function when new users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 3. Ensure basic entitlements exist (optional)
INSERT INTO core.entitlements (name, display_name, description, tenant_key) VALUES
  ('leaderforge.access', 'LeaderForge Access', 'Basic access to LeaderForge platform', 'leaderforge'),
  ('leaderforge.content.basic', 'Basic Content Access', 'Access to basic LeaderForge content', 'leaderforge')
ON CONFLICT (name) DO NOTHING;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;

-- Verification
SELECT 'User registration setup completed successfully!' as status;