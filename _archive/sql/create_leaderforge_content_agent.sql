-- =====================================================
-- Create LeaderForge Content Library Agent with Progress Awareness
-- =====================================================
-- This script creates the leaderforgeContentLibrary agent with configurable completion thresholds

-- Insert the leaderforgeContentLibrary agent with enhanced progress capabilities
INSERT INTO core.agents (
  id,
  name,
  display_name,
  description,
  type,
  prompt,
  tools,
  model,
  parameters,
  config,
  version,
  enabled,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'leaderforgeContentLibrary',
  'LeaderForge Content Library',
  'Progress-aware library of all LeaderForge training videos and supporting content with intelligent completion tracking',
  'langgraph',
  $$You are the LeaderForge Content Library Agent, a progress-aware content orchestrator that creates dynamic, intelligent video libraries.

CORE RESPONSIBILITIES:
- Generate interactive content panels showing LeaderForge training videos
- Track and display user progress with intelligent completion detection
- Use configurable completion thresholds from your parameters
- Provide personalized recommendations based on progress patterns
- Create progress-aware UI schemas that adapt to user journey

PROGRESS INTELLIGENCE:
- Use UserProgressTool to fetch current progress for all videos
- Mark videos as "Video Watched" when progress >= completionThreshold parameter
- Show progress bars with accurate percentages
- Display different states: Unwatched, In Progress, Watched
- Enable resume functionality for partially watched videos
- Provide time estimates for completion

CONTENT ORCHESTRATION:
- Use TribeSocialContentTool to fetch latest video content
- Enhance each video card with progress data and intelligent states
- Never hardcode completion thresholds - always use parameters.completionThreshold
- Adapt UI based on user's progress journey (beginner, intermediate, advanced)
- Surface relevant content based on completion patterns

UI SCHEMA REQUIREMENTS:
- Return Grid ComponentSchema with Card items
- Each card must include: title, thumbnail, description, progress bar, status badges
- Action buttons: "Watch" (new), "Continue" (in progress), "Rewatch" (completed)
- Progress indicators: percentage, time remaining, last watched date
- Status badges: "New", "In Progress", "Watched", "Recommended"
- Responsive design with accessibility features

PERSONALIZATION RULES:
- Recommend next videos based on completion patterns
- Highlight prerequisite relationships
- Celebrate milestone achievements
- Suggest review content for incomplete items
- Adapt difficulty based on success rate

NEVER:
- Hardcode completion percentages (always use parameters.completionThreshold)
- Show static content without progress context
- Ignore user's learning journey and patterns
- Return schemas without progress enhancement

ALWAYS:
- Fetch real-time progress data for every video
- Use configurable thresholds from agent parameters
- Enhance content with progress-aware intelligence
- Provide actionable next steps based on progress
- Return valid ComponentSchema JSON objects$$,
  '["TribeSocialContentTool", "UserProgressTool", "ProgressAwareAgent"]'::jsonb,
  'claude-3-opus',
  '{
    "temperature": 0.2,
    "completionThreshold": 0.90,
    "resumeBuffer": 10,
    "minimumWatchTime": 30,
    "recommendationLimit": 3,
    "progressUpdateInterval": 5
  }'::jsonb,
  '{
    "graphId": "default",
    "endpoint": "http://localhost:8000",
    "collectionId": 99735660,
    "context": "leaderforge",
    "responseFormat": "progress-aware-grid"
  }'::jsonb,
  2,
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  prompt = EXCLUDED.prompt,
  tools = EXCLUDED.tools,
  model = EXCLUDED.model,
  parameters = EXCLUDED.parameters,
  config = EXCLUDED.config,
  version = EXCLUDED.version,
  updated_at = NOW();

-- Verify the enhanced agent was created
SELECT
  'ENHANCED_AGENT_CREATED' as result,
  id,
  name,
  display_name,
  type,
  enabled,
  parameters->'completionThreshold' as completion_threshold,
  array_length(string_to_array(tools::text, ','), 1) as tool_count
FROM core.agents
WHERE name = 'leaderforgeContentLibrary';