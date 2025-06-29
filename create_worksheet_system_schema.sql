-- Worksheet System Schema for LeaderForge
-- Purpose: Support Marcus dashboard with worksheets, progress tracking, and Bold Actions
-- Based on PRD: User Input & Response System

-- Forms/Worksheets table - Schema-driven form definitions
CREATE TABLE IF NOT EXISTS core.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    form_type VARCHAR(50) NOT NULL DEFAULT 'worksheet', -- 'worksheet', 'assessment', 'survey'
    schema_definition JSONB NOT NULL, -- Full form schema with questions, validation, etc
    video_id UUID, -- Link to content/video
    tenant_key VARCHAR(100) NOT NULL,
    estimated_time_minutes INTEGER DEFAULT 5,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT forms_type_check CHECK (form_type IN ('worksheet', 'assessment', 'survey', 'feedback'))
);

-- Form Responses table - User submissions to forms
CREATE TABLE IF NOT EXISTS core.form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES core.forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible response data
    metadata JSONB DEFAULT '{}'::jsonb, -- completion_time, device_type, etc
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT form_responses_status_check CHECK (status IN ('draft', 'submitted')),
    UNIQUE(form_id, user_id) -- One response per user per form
);

-- Bold Actions table - Actionable commitments from worksheets
CREATE TABLE IF NOT EXISTS core.bold_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_response_id UUID REFERENCES core.form_responses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    timeframe VARCHAR(20) DEFAULT '1 week', -- From worksheet dropdown
    deadline DATE,
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'complete', 'deferred'
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT bold_actions_status_check CHECK (status IN ('planned', 'in_progress', 'complete', 'deferred')),
    CONSTRAINT bold_actions_timeframe_check CHECK (timeframe IN ('1 week', '2 weeks', '3 weeks'))
);

-- Video Progress table - Track video watching progress
CREATE TABLE IF NOT EXISTS core.video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL, -- Reference to content system
    tenant_key VARCHAR(100) NOT NULL,
    current_time_seconds INTEGER DEFAULT 0,
    total_duration_seconds INTEGER,
    percentage_watched DECIMAL(5,2) DEFAULT 0.00,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    completion_threshold DECIMAL(5,2) DEFAULT 80.00, -- 80% = completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, video_id),
    CONSTRAINT video_progress_percentage_check CHECK (percentage_watched >= 0 AND percentage_watched <= 100)
);

-- User Progress Summary - Materialized view for dashboard performance
CREATE TABLE IF NOT EXISTS core.user_progress_summary (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_key VARCHAR(100) NOT NULL,
    team_id UUID, -- For team grouping

    -- Video progress
    total_videos INTEGER DEFAULT 0,
    videos_watched INTEGER DEFAULT 0,
    video_progress_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Worksheet progress
    total_worksheets INTEGER DEFAULT 0,
    worksheets_completed INTEGER DEFAULT 0,
    worksheet_completion_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Bold Actions
    total_bold_actions INTEGER DEFAULT 0,
    bold_actions_completed INTEGER DEFAULT 0,
    bold_actions_in_progress INTEGER DEFAULT 0,

    -- Leaderboard scoring
    leaderboard_score INTEGER DEFAULT 0,
    team_rank INTEGER,
    company_rank INTEGER,

    -- Activity tracking
    last_activity_at TIMESTAMPTZ,
    last_video_watched UUID,
    next_recommended_video UUID,

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team leaderboard entries - For team competition
CREATE TABLE IF NOT EXISTS core.team_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_key VARCHAR(100) NOT NULL,
    team_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    rank_position INTEGER,
    videos_completed INTEGER DEFAULT 0,
    worksheets_completed INTEGER DEFAULT 0,
    bold_actions_completed INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(team_id, user_id),
    UNIQUE(team_id, rank_position) -- Each rank position unique per team
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_tenant_type ON core.forms(tenant_key, form_type);
CREATE INDEX IF NOT EXISTS idx_forms_video_id ON core.forms(video_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user ON core.form_responses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_form_responses_form ON core.form_responses(form_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_bold_actions_user ON core.bold_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bold_actions_deadline ON core.bold_actions(deadline, status);
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON core.video_progress(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_video_progress_video ON core.video_progress(video_id, tenant_key);
CREATE INDEX IF NOT EXISTS idx_user_progress_tenant ON core.user_progress_summary(tenant_key, team_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_team ON core.team_leaderboard(team_id, rank_position);

-- RLS Policies
ALTER TABLE core.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.bold_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_progress_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_leaderboard ENABLE ROW LEVEL SECURITY;

-- Forms: readable by tenant users
CREATE POLICY "Forms readable by tenant users" ON core.forms
    FOR SELECT USING (
        tenant_key IN (
            SELECT u.tenant_key FROM core.users u WHERE u.id = auth.uid()
        )
    );

-- Form responses: user owns their responses
CREATE POLICY "Form responses owned by user" ON core.form_responses
    FOR ALL USING (user_id = auth.uid());

-- Bold actions: user owns their actions
CREATE POLICY "Bold actions owned by user" ON core.bold_actions
    FOR ALL USING (user_id = auth.uid());

-- Video progress: user owns their progress
CREATE POLICY "Video progress owned by user" ON core.video_progress
    FOR ALL USING (user_id = auth.uid());

-- User progress summary: user sees own, managers see team
CREATE POLICY "User progress summary access" ON core.user_progress_summary
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM core.users u
            WHERE u.id = auth.uid()
            AND (u.role = 'team_leader' OR u.role = 'admin')
            AND u.tenant_key = core.user_progress_summary.tenant_key
        )
    );

-- Team leaderboard: team members see team rankings
CREATE POLICY "Team leaderboard team access" ON core.team_leaderboard
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM core.users u
            WHERE u.id = auth.uid()
            AND u.tenant_key = core.team_leaderboard.tenant_key
        )
    );

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON core.forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_responses_updated_at BEFORE UPDATE ON core.form_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bold_actions_updated_at BEFORE UPDATE ON core.bold_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_progress_updated_at BEFORE UPDATE ON core.video_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_summary_updated_at BEFORE UPDATE ON core.user_progress_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_leaderboard_updated_at BEFORE UPDATE ON core.team_leaderboard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();