-- Marcus Dashboard Test Data
-- Purpose: Sample data to test the worksheet system and dashboard functionality
-- Based on PRD user stories and Marcus persona

-- First, let's get the existing test user
DO $$
DECLARE
    test_user_id UUID;
    brilliant_tenant VARCHAR(100) := 'brilliant';
BEGIN
    -- Get existing test user or create one
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'marcus@brilliant.org'
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Test user not found. Please create user marcus@brilliant.org first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found test user: %', test_user_id;

    -- Create sample forms (worksheets)
    INSERT INTO core.forms (id, name, title, description, form_type, video_id, tenant_key, estimated_time_minutes, schema_definition, created_by) VALUES
    (
        'f1e8d123-4567-8901-2345-678901234567',
        'deep_work_part1_worksheet',
        'Deep Work Part 1 - Reflection Worksheet',
        'Reflection questions for Deep Work Part 1 video content',
        'worksheet',
        'video-1', -- Matches our dashboard sample
        brilliant_tenant,
        5,
        '{
            "sections": [
                {
                    "title": "Key Insights",
                    "questions": [
                        {
                            "id": "top_insights",
                            "type": "textarea",
                            "label": "What are your top 3 insights from this video?",
                            "placeholder": "List the most important takeaways...",
                            "required": true,
                            "rows": 4
                        }
                    ]
                },
                {
                    "title": "Application",
                    "questions": [
                        {
                            "id": "big_idea",
                            "type": "textarea",
                            "label": "One Big Idea",
                            "placeholder": "What is the one big idea you want to focus on?",
                            "required": true,
                            "rows": 3
                        },
                        {
                            "id": "timeframe",
                            "type": "select",
                            "label": "Expected Timeframe",
                            "required": true,
                            "options": [
                                {"value": "1 week", "label": "1 week"},
                                {"value": "2 weeks", "label": "2 weeks"},
                                {"value": "3 weeks", "label": "3 weeks"}
                            ]
                        },
                        {
                            "id": "bold_action",
                            "type": "textarea",
                            "label": "Bold Action",
                            "placeholder": "What specific action will you take?",
                            "required": true,
                            "rows": 3
                        }
                    ]
                },
                {
                    "title": "Future Planning",
                    "questions": [
                        {
                            "id": "future_ideas",
                            "type": "textarea",
                            "label": "Future Ideas",
                            "placeholder": "Other ideas to explore later...",
                            "required": false,
                            "rows": 3
                        }
                    ]
                }
            ]
        }'::jsonb,
        test_user_id
    ),
    (
        'f2e8d123-4567-8901-2345-678901234568',
        'leadership_basics_worksheet',
        'Leadership Fundamentals Worksheet',
        'Core leadership principles reflection',
        'worksheet',
        'video-2',
        brilliant_tenant,
        7,
        '{
            "sections": [
                {
                    "title": "Leadership Reflection",
                    "questions": [
                        {
                            "id": "leadership_style",
                            "type": "textarea",
                            "label": "Describe your current leadership style",
                            "required": true,
                            "rows": 4
                        },
                        {
                            "id": "growth_areas",
                            "type": "textarea",
                            "label": "Top 3 areas for leadership growth",
                            "required": true,
                            "rows": 3
                        }
                    ]
                }
            ]
        }'::jsonb,
        test_user_id
    );

    -- Create a completed form response for Marcus
    INSERT INTO core.form_responses (id, form_id, user_id, responses, status, started_at, submitted_at) VALUES
    (
        'r1e8d123-4567-8901-2345-678901234567',
        'f1e8d123-4567-8901-2345-678901234567',
        test_user_id,
        '{
            "top_insights": "1. Deep work requires intentional focus blocks\n2. Distractions are the enemy of meaningful work\n3. Quality thinking time produces exponentially better results",
            "big_idea": "Implement 2-hour morning deep work blocks with zero distractions",
            "timeframe": "2 weeks",
            "bold_action": "Block 7-9 AM daily for strategic planning with phone in airplane mode",
            "future_ideas": "Consider dedicated deep work space setup\nExplore team deep work policies"
        }'::jsonb,
        'submitted',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    );

    -- Create Bold Action from the worksheet
    INSERT INTO core.bold_actions (id, user_id, form_response_id, title, description, timeframe, deadline, status, priority) VALUES
    (
        'ba1e8d123-4567-8901-2345-678901234567',
        test_user_id,
        'r1e8d123-4567-8901-2345-678901234567',
        'Daily Deep Work Blocks',
        'Block 7-9 AM daily for strategic planning with phone in airplane mode',
        '2 weeks',
        CURRENT_DATE + INTERVAL '2 weeks',
        'in_progress',
        1
    );

    -- Create video progress for Marcus
    INSERT INTO core.video_progress (id, user_id, video_id, tenant_key, current_time_seconds, total_duration_seconds, percentage_watched, completed, last_watched_at) VALUES
    (
        'vp1e8d123-4567-8901-2345-678901234567',
        test_user_id,
        'video-1',
        brilliant_tenant,
        480, -- 8 minutes
        600, -- 10 minutes total
        80.0,
        true,
        NOW() - INTERVAL '1 day'
    ),
    (
        'vp2e8d123-4567-8901-2345-678901234568',
        test_user_id,
        'video-2',
        brilliant_tenant,
        150,
        450,
        33.3,
        false,
        NOW() - INTERVAL '5 days'
    );

    -- Create user progress summary for Marcus
    INSERT INTO core.user_progress_summary (
        user_id, tenant_key, team_id,
        total_videos, videos_watched, video_progress_percentage,
        total_worksheets, worksheets_completed, worksheet_completion_percentage,
        total_bold_actions, bold_actions_completed, bold_actions_in_progress,
        leaderboard_score, team_rank, company_rank,
        last_activity_at, last_video_watched, next_recommended_video
    ) VALUES (
        test_user_id,
        brilliant_tenant,
        'team-alpha-001',
        12, -- total videos in curriculum
        2,  -- videos watched
        16.7, -- 2/12 = 16.7%
        12, -- total worksheets
        1,  -- worksheets completed
        8.3, -- 1/12 = 8.3%
        1,  -- total bold actions
        0,  -- completed bold actions
        1,  -- in progress bold actions
        85, -- leaderboard score
        3,  -- team rank
        12, -- company rank
        NOW() - INTERVAL '1 day',
        'video-1',
        'video-3'
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_videos = EXCLUDED.total_videos,
        videos_watched = EXCLUDED.videos_watched,
        video_progress_percentage = EXCLUDED.video_progress_percentage,
        total_worksheets = EXCLUDED.total_worksheets,
        worksheets_completed = EXCLUDED.worksheets_completed,
        worksheet_completion_percentage = EXCLUDED.worksheet_completion_percentage,
        total_bold_actions = EXCLUDED.total_bold_actions,
        bold_actions_completed = EXCLUDED.bold_actions_completed,
        bold_actions_in_progress = EXCLUDED.bold_actions_in_progress,
        leaderboard_score = EXCLUDED.leaderboard_score,
        team_rank = EXCLUDED.team_rank,
        company_rank = EXCLUDED.company_rank,
        last_activity_at = EXCLUDED.last_activity_at,
        last_video_watched = EXCLUDED.last_video_watched,
        next_recommended_video = EXCLUDED.next_recommended_video,
        updated_at = NOW();

    -- Create team leaderboard entries
    -- First, create some additional team members
    INSERT INTO core.team_leaderboard (id, tenant_key, team_id, user_id, score, rank_position, videos_completed, worksheets_completed, bold_actions_completed, last_activity_at) VALUES
    (
        'tl1e8d123-4567-8901-2345-678901234567',
        brilliant_tenant,
        'team-alpha-001',
        test_user_id,
        85,
        3,
        2,
        1,
        0,
        NOW() - INTERVAL '1 day'
    );

    -- Add some mock team members for leaderboard
    -- Note: These UUIDs are fictional for leaderboard display
    INSERT INTO core.team_leaderboard (id, tenant_key, team_id, user_id, score, rank_position, videos_completed, worksheets_completed, bold_actions_completed, last_activity_at) VALUES
    (
        'tl2e8d123-4567-8901-2345-678901234568',
        brilliant_tenant,
        'team-alpha-001',
        'u1000000-0000-0000-0000-000000000001', -- Sarah - Team Leader
        150,
        1,
        8,
        6,
        3,
        NOW() - INTERVAL '2 hours'
    ),
    (
        'tl3e8d123-4567-8901-2345-678901234569',
        brilliant_tenant,
        'team-alpha-001',
        'u1000000-0000-0000-0000-000000000002', -- Alex - High Performer
        120,
        2,
        6,
        4,
        2,
        NOW() - INTERVAL '1 day'
    ),
    (
        'tl4e8d123-4567-8901-2345-678901234570',
        brilliant_tenant,
        'team-alpha-001',
        'u1000000-0000-0000-0000-000000000003', -- Jordan - Getting Started
        65,
        4,
        3,
        2,
        1,
        NOW() - INTERVAL '3 days'
    ),
    (
        'tl5e8d123-4567-8901-2345-678901234571',
        brilliant_tenant,
        'team-alpha-001',
        'u1000000-0000-0000-0000-000000000004', -- Casey - New Member
        40,
        5,
        2,
        1,
        0,
        NOW() - INTERVAL '1 week'
    );

    -- Insert mock user records for leaderboard names (simplified)
    INSERT INTO core.users (id, tenant_key, full_name, role) VALUES
    ('u1000000-0000-0000-0000-000000000001', brilliant_tenant, 'Sarah Chen', 'team_leader'),
    ('u1000000-0000-0000-0000-000000000002', brilliant_tenant, 'Alex Rodriguez', 'user'),
    ('u1000000-0000-0000-0000-000000000003', brilliant_tenant, 'Jordan Smith', 'user'),
    ('u1000000-0000-0000-0000-000000000004', brilliant_tenant, 'Casey Johnson', 'user')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;

    RAISE NOTICE 'Successfully created Marcus dashboard test data!';
    RAISE NOTICE 'Marcus has completed 1 worksheet, has 1 active Bold Action, and ranks #3 on team';
    RAISE NOTICE 'Use /api/dashboard/% to view the dashboard data', test_user_id;

END $$;