-- =============================================
-- User Context Preferences Table (Phase 2)
-- =============================================
-- Purpose: Track which prompt contexts each user has enabled/disabled
-- Dependencies: Requires Phase 1 prompt_contexts table

-- Create the user context preferences table
CREATE TABLE core.user_context_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context_id UUID NOT NULL REFERENCES core.prompt_contexts(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    tenant_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Ensure one preference record per user per context per tenant
    UNIQUE(user_id, context_id, tenant_key)
);

-- Create indexes for performance
CREATE INDEX idx_user_context_preferences_user_tenant
    ON core.user_context_preferences(user_id, tenant_key);

CREATE INDEX idx_user_context_preferences_context
    ON core.user_context_preferences(context_id);

-- Enable RLS
ALTER TABLE core.user_context_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own preferences within their tenant
CREATE POLICY "user_context_preferences_isolation" ON core.user_context_preferences
    USING (
        tenant_key = current_setting('app.current_tenant', true)
        AND user_id = auth.uid()
    );

-- Policy for admins to manage user preferences
CREATE POLICY "admin_user_context_preferences_access" ON core.user_context_preferences
    FOR ALL USING (
        tenant_key = current_setting('app.current_tenant', true)
        AND (
            -- User can access their own
            user_id = auth.uid()
            OR
            -- Admins can access all within tenant
            EXISTS (
                SELECT 1 FROM core.user_entitlements ue
                WHERE ue.user_id = auth.uid()
                AND ue.entitlement_id IN (
                    'i49_super_admin', 'platform_admin', 'tenant_admin'
                )
                AND ue.tenant_key = current_setting('app.current_tenant', true)
            )
        )
    );

-- Function to automatically create default preferences when user gets access to new contexts
CREATE OR REPLACE FUNCTION core.create_default_context_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new prompt context is created, create default enabled preferences for all users
    -- This ensures new contexts are enabled by default for existing users
    INSERT INTO core.user_context_preferences (user_id, context_id, is_enabled, tenant_key)
    SELECT
        u.id,
        NEW.id,
        true, -- Default to enabled
        NEW.tenant_key
    FROM auth.users u
    WHERE EXISTS (
        -- Only for users who have some entitlements in this tenant (are active users)
        SELECT 1 FROM core.user_entitlements ue
        WHERE ue.user_id = u.id
        AND ue.tenant_key = NEW.tenant_key
    )
    ON CONFLICT (user_id, context_id, tenant_key) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences for new contexts
CREATE TRIGGER trigger_create_default_context_preferences
    AFTER INSERT ON core.prompt_contexts
    FOR EACH ROW
    EXECUTE FUNCTION core.create_default_context_preferences();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION core.create_user_default_context_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user gets their first entitlement, create default preferences for all contexts
    INSERT INTO core.user_context_preferences (user_id, context_id, is_enabled, tenant_key)
    SELECT
        NEW.user_id,
        pc.id,
        true, -- Default to enabled
        NEW.tenant_key
    FROM core.prompt_contexts pc
    WHERE pc.tenant_key = NEW.tenant_key
    AND pc.is_active = true
    ON CONFLICT (user_id, context_id, tenant_key) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences for new users (on first entitlement)
CREATE TRIGGER trigger_create_user_default_context_preferences
    AFTER INSERT ON core.user_entitlements
    FOR EACH ROW
    EXECUTE FUNCTION core.create_user_default_context_preferences();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_context_preferences TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE core.user_context_preferences_id_seq TO authenticated;