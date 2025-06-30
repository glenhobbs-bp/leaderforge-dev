-- Mockup Feedback System Schema
-- Purpose: Comprehensive feedback collection and analysis for agent-native mockups
-- Based on existing patterns: core.conversation_events, core.form_responses

-- =============================================================================
-- MOCKUP FEEDBACK TABLES
-- =============================================================================

-- Mockup feedback entries - Individual feedback submissions
CREATE TABLE IF NOT EXISTS core.mockup_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and mockup identification
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    mockup_name TEXT NOT NULL,
    agent_id UUID REFERENCES core.agents(id),

    -- Feedback content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT NOT NULL,

    -- Context and metadata
    tenant_key TEXT NOT NULL,
    session_id UUID,
    user_agent TEXT,
    ip_address INET,
    device_info JSONB DEFAULT '{}',

    -- Categorization and analysis
    feedback_category TEXT, -- auto-categorized: 'positive', 'negative', 'suggestion', 'bug'
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0 from sentiment analysis
    keywords TEXT[], -- extracted keywords for search/analysis

    -- Status and workflow
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'addressed', 'closed')),
    reviewed_by UUID REFERENCES core.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Administrative
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate feedback from same user for same mockup
    CONSTRAINT unique_user_mockup_feedback UNIQUE (user_id, mockup_name)
);

-- Mockup feedback analytics - Aggregated statistics per mockup
CREATE TABLE IF NOT EXISTS core.mockup_feedback_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Mockup identification
    mockup_name TEXT NOT NULL UNIQUE,
    agent_id UUID REFERENCES core.agents(id),

    -- Aggregate statistics
    total_feedback_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}',

    -- Sentiment analysis
    positive_sentiment_count INTEGER DEFAULT 0,
    negative_sentiment_count INTEGER DEFAULT 0,
    neutral_sentiment_count INTEGER DEFAULT 0,
    average_sentiment_score DECIMAL(3,2) DEFAULT 0.00,

    -- Common themes
    common_keywords TEXT[],
    top_positive_themes TEXT[],
    top_negative_themes TEXT[],

    -- Status tracking
    last_feedback_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback action items - Trackable improvements from feedback
CREATE TABLE IF NOT EXISTS core.mockup_feedback_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Related feedback
    mockup_name TEXT NOT NULL,
    feedback_id UUID REFERENCES core.mockup_feedback(id),

    -- Action details
    action_title TEXT NOT NULL,
    action_description TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('ui_improvement', 'feature_request', 'bug_fix', 'content_update')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Assignment and tracking
    assigned_to UUID REFERENCES core.users(id),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Primary feedback table indexes
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_user ON core.mockup_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_mockup ON core.mockup_feedback(mockup_name);
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_agent ON core.mockup_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_rating ON core.mockup_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_status ON core.mockup_feedback(status);
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_created ON core.mockup_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_tenant ON core.mockup_feedback(tenant_key);

-- Text search for feedback content
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_text_search ON core.mockup_feedback USING gin(to_tsvector('english', feedback_text));
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_keywords ON core.mockup_feedback USING gin(keywords);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_mockup_analytics_rating ON core.mockup_feedback_analytics(average_rating);
CREATE INDEX IF NOT EXISTS idx_mockup_analytics_sentiment ON core.mockup_feedback_analytics(average_sentiment_score);
CREATE INDEX IF NOT EXISTS idx_mockup_analytics_updated ON core.mockup_feedback_analytics(last_updated_at);

-- Action items indexes
CREATE INDEX IF NOT EXISTS idx_feedback_actions_mockup ON core.mockup_feedback_actions(mockup_name);
CREATE INDEX IF NOT EXISTS idx_feedback_actions_status ON core.mockup_feedback_actions(status);
CREATE INDEX IF NOT EXISTS idx_feedback_actions_priority ON core.mockup_feedback_actions(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_actions_assigned ON core.mockup_feedback_actions(assigned_to);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on feedback tables
ALTER TABLE core.mockup_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.mockup_feedback_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.mockup_feedback_actions ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback and submit new feedback
CREATE POLICY "Users can manage own feedback" ON core.mockup_feedback
    FOR ALL
    USING (user_id = auth.uid());

-- Analytics are viewable by all authenticated users (aggregated data)
CREATE POLICY "Analytics viewable by authenticated users" ON core.mockup_feedback_analytics
    FOR SELECT
    TO authenticated
    USING (true);

-- Service role has full access to all tables
CREATE POLICY "Service role full access feedback" ON core.mockup_feedback
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role full access analytics" ON core.mockup_feedback_analytics
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Service role full access actions" ON core.mockup_feedback_actions
    FOR ALL
    TO service_role
    USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON core.mockup_feedback TO authenticated;
GRANT SELECT ON core.mockup_feedback_analytics TO authenticated;
GRANT USAGE ON SCHEMA core TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON core.mockup_feedback TO service_role;
GRANT ALL ON core.mockup_feedback_analytics TO service_role;
GRANT ALL ON core.mockup_feedback_actions TO service_role;
GRANT ALL ON SCHEMA core TO service_role;

-- =============================================================================
-- FUNCTIONS FOR ANALYTICS
-- =============================================================================

-- Function to update mockup analytics when feedback is added/updated
CREATE OR REPLACE FUNCTION core.update_mockup_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update analytics record
    INSERT INTO core.mockup_feedback_analytics (
        mockup_name,
        agent_id,
        total_feedback_count,
        average_rating,
        rating_distribution,
        last_feedback_at
    )
    SELECT
        NEW.mockup_name,
        NEW.agent_id,
        COUNT(*),
        ROUND(AVG(rating), 2),
        jsonb_build_object(
            '1', COUNT(*) FILTER (WHERE rating = 1),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '5', COUNT(*) FILTER (WHERE rating = 5)
        ),
        MAX(created_at)
    FROM core.mockup_feedback
    WHERE mockup_name = NEW.mockup_name
    GROUP BY mockup_name, agent_id
    ON CONFLICT (mockup_name) DO UPDATE SET
        total_feedback_count = EXCLUDED.total_feedback_count,
        average_rating = EXCLUDED.average_rating,
        rating_distribution = EXCLUDED.rating_distribution,
        last_feedback_at = EXCLUDED.last_feedback_at,
        last_updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update analytics
CREATE TRIGGER update_mockup_analytics_trigger
    AFTER INSERT OR UPDATE ON core.mockup_feedback
    FOR EACH ROW
    EXECUTE FUNCTION core.update_mockup_analytics();

-- =============================================================================
-- VIEWS FOR EASY QUERYING
-- =============================================================================

-- View for feedback summary by mockup
CREATE OR REPLACE VIEW core.mockup_feedback_summary AS
SELECT
    mf.mockup_name,
    a.name as agent_name,
    COUNT(*) as total_feedback,
    ROUND(AVG(mf.rating), 2) as avg_rating,
    COUNT(*) FILTER (WHERE mf.rating >= 4) as positive_feedback,
    COUNT(*) FILTER (WHERE mf.rating <= 2) as negative_feedback,
    MAX(mf.created_at) as last_feedback_date,
    COUNT(DISTINCT mf.user_id) as unique_users
FROM core.mockup_feedback mf
LEFT JOIN core.agents a ON mf.agent_id = a.id
GROUP BY mf.mockup_name, a.name;

-- View for recent feedback with user details
CREATE OR REPLACE VIEW core.recent_mockup_feedback AS
SELECT
    mf.id,
    mf.mockup_name,
    u.email as user_email,
    u.full_name as user_name,
    mf.rating,
    mf.feedback_text,
    mf.status,
    mf.created_at,
    a.name as agent_name
FROM core.mockup_feedback mf
JOIN core.users u ON mf.user_id = u.id
LEFT JOIN core.agents a ON mf.agent_id = a.id
ORDER BY mf.created_at DESC;

-- =============================================================================
-- INITIAL DATA SETUP
-- =============================================================================

-- Sample analytics for existing mockups (if any)
INSERT INTO core.mockup_feedback_analytics (mockup_name, agent_id)
SELECT DISTINCT
    (config->>'component')::text as mockup_name,
    id as agent_id
FROM core.agents
WHERE type = 'mockup'
ON CONFLICT (mockup_name) DO NOTHING;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION core.update_mockup_analytics() TO service_role;

-- Create indexes on views for performance
CREATE INDEX IF NOT EXISTS idx_mockup_feedback_summary_rating ON core.mockup_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_recent_feedback_created ON core.mockup_feedback(created_at DESC);

COMMENT ON TABLE core.mockup_feedback IS 'Individual feedback submissions for mockup components';
COMMENT ON TABLE core.mockup_feedback_analytics IS 'Aggregated analytics and statistics per mockup';
COMMENT ON TABLE core.mockup_feedback_actions IS 'Action items and improvements based on feedback';

COMMENT ON VIEW core.mockup_feedback_summary IS 'Summary statistics for all mockups';
COMMENT ON VIEW core.recent_mockup_feedback IS 'Recent feedback with user details for admin review';