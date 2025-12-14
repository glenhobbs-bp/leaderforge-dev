-- Migration: 005_core_users
-- Description: Create users table (extends auth.users)
-- Date: 2024-12-14

CREATE TABLE core.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  
  -- Profile
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "theme": "system",
    "notifications": true,
    "email_digest": "weekly"
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_tenant ON core.users(tenant_id);
CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_active ON core.users(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE core.users IS 'Platform users, extends Supabase auth.users';
COMMENT ON COLUMN core.users.preferences IS 'User preferences: theme, notifications, etc.';

-- Grant permissions
GRANT SELECT ON core.users TO authenticated;
GRANT ALL ON core.users TO service_role;

