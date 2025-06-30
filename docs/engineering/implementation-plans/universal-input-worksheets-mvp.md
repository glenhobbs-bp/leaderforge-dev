# Universal Input System: Worksheets MVP Implementation Plan

**Priority:** High
**Timeline:** 2-3 weeks
**Dependencies:** Universal Input System foundation

## Objective

Implement forms-based worksheets that automatically feed into progress tracking and leaderboard systems through the Universal Input System, demonstrating the "capture once, derive everything" pattern.

## Implementation Steps

### **Week 1: Foundation**

#### 1. Universal Input Schema & API
```sql
-- Create the core table
CREATE TABLE core.universal_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    session_id UUID,

    input_type TEXT NOT NULL CHECK (input_type IN ('form', 'text', 'voice', 'image', 'multimodal')),
    input_data JSONB NOT NULL,

    context_type TEXT NOT NULL CHECK (context_type IN ('personal', 'team', 'platform', 'chat')),
    privacy_level TEXT NOT NULL CHECK (privacy_level IN ('encrypted', 'user', 'team', 'org', 'platform')),

    requires_agent BOOLEAN DEFAULT false,
    assigned_agent_id UUID REFERENCES core.agents(id),
    processing_result JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),

    source_context TEXT, -- "worksheet:leadership-assessment-1"
    tenant_key TEXT NOT NULL,

    -- Indexes
    INDEX idx_universal_inputs_user_context (user_id, source_context),
    INDEX idx_universal_inputs_tenant_type (tenant_key, context_type),
    INDEX idx_universal_inputs_source (source_context),
    INDEX idx_universal_inputs_created (created_at)
);
```

#### 2. Universal Input API
```typescript
// /api/input/universal - POST endpoint
interface UniversalInputRequest {
  input_type: 'form' | 'text' | 'voice' | 'image' | 'multimodal';
  input_data: Record<string, unknown>;
  source_context: string; // e.g., "worksheet:leadership-assessment"
  context_type?: 'personal' | 'team' | 'platform' | 'chat'; // auto-classified if not provided
  requires_agent?: boolean;
}

interface UniversalInputResponse {
  success: boolean;
  input_id: string;
  processing_status: 'immediate' | 'queued' | 'error';
  derivations_triggered: string[]; // e.g., ['progress_tracking', 'leaderboard']
}
```

### **Week 2: Worksheet Forms & Processing**

#### 3. Video Worksheet Schema (Actual Structure)
```json
{
  "worksheet_id": "video-reflection-worksheet",
  "title": "Video Reflection Worksheet",
  "description": "Capture insights and action items from leadership video content",
  "context_required": {
    "video_id": "string",
    "video_title": "string",
    "video_duration": "string"
  },
  "fields": [
    {
      "id": "insights",
      "type": "text_array",
      "label": "Top 3 Insights from this video",
      "required": true,
      "max_items": 3,
      "placeholder": "Insight {index}"
    },
    {
      "id": "big_idea",
      "type": "textarea",
      "label": "One Big Idea I want to implement",
      "required": true,
      "placeholder": "Describe the one big idea you want to focus on..."
    },
    {
      "id": "timeframe",
      "type": "select",
      "label": "Expected Timeframe",
      "required": true,
      "options": ["1 week", "2 weeks", "3 weeks"],
      "default": "1 week"
    },
    {
      "id": "bold_action",
      "type": "textarea",
      "label": "My Bold Action",
      "required": true,
      "placeholder": "What specific action will you take to implement this idea?"
    },
    {
      "id": "future_ideas",
      "type": "textarea_array",
      "label": "Future Ideas to explore",
      "required": false,
      "min_items": 1,
      "max_items": 10,
      "dynamic": true,
      "add_button_text": "Add another idea",
      "placeholder": "Future idea {index}...",
      "description": "Users can dynamically add/remove multiple future ideas using + button"
    }
  ]
}
```

#### 4. Video Worksheet Form Component
```typescript
// components/forms/VideoWorksheetForm.tsx
interface VideoWorksheetFormProps {
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  onSubmit?: (result: UniversalInputResponse) => void;
}

export function VideoWorksheetForm({ videoId, videoTitle, videoDuration, onSubmit }: VideoWorksheetFormProps) {
  const [insights, setInsights] = useState(['', '', '']);
  const [bigIdea, setBigIdea] = useState('');
  const [timeframe, setTimeframe] = useState('1 week');
  const [boldAction, setBoldAction] = useState('');
  const [futureIdeas, setFutureIdeas] = useState(['']);

  const addFutureIdea = () => {
    if (futureIdeas.length < 10) {
      setFutureIdeas([...futureIdeas, '']);
    }
  };

  const handleFutureIdeaChange = (index: number, value: string) => {
    const newIdeas = [...futureIdeas];
    newIdeas[index] = value;
    setFutureIdeas(newIdeas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      insights: insights.filter(i => i.trim()),
      big_idea: bigIdea,
      timeframe,
      bold_action: boldAction,
      future_ideas: futureIdeas.filter(i => i.trim()) // Array of multiple ideas
    };

    const response = await fetch('/api/input/universal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_type: 'form',
        input_data: {
          worksheet_id: 'video-reflection-worksheet',
          video_context: {
            video_id: videoId,
            video_title: videoTitle,
            video_duration: videoDuration
          },
          responses: formData,
          completion_percentage: 100,
          time_spent_minutes: calculateTimeSpent(),
          completion_timestamp: new Date().toISOString()
        },
        source_context: `worksheet:video-reflection:${videoId}`,
        context_type: 'team',
        requires_agent: true
      })
    });

    const result = await response.json();
    onSubmit?.(result);
  };

  // Form rendering matches MarcusDashboardMockup structure:
  // - 3 fixed insight inputs
  // - Single big idea textarea
  // - Timeframe select dropdown
  // - Single bold action textarea
  // - Dynamic future ideas array with "Add another idea" button
  // - Submit/Cancel buttons
}
```

#### 5. Worksheet Processing Agent
```typescript
// agents/WorksheetProcessingAgent.ts
export class WorksheetProcessingAgent implements Agent {
  async process(input: UniversalInput): Promise<ProcessingResult> {
    if (!input.source_context?.startsWith('worksheet:')) {
      return { success: false, reason: 'Not a worksheet input' };
    }

    const worksheetData = input.input_data;

    // Generate personalized feedback
    const feedback = await this.generateFeedback(worksheetData);

    // Calculate insights
    const insights = await this.calculateInsights(worksheetData);

    // Store processing result
    return {
      success: true,
      result: {
        feedback,
        insights,
        recommendations: await this.generateRecommendations(worksheetData),
        processed_at: new Date().toISOString()
      }
    };
  }

  private async generateFeedback(data: any): Promise<string> {
    // Use LLM to generate personalized feedback based on responses
    // This could integrate with existing agent infrastructure
  }
}
```

### **Week 3: Progress & Leaderboard Integration**

#### 6. Progress Tracking Derivation
```sql
-- Create derived progress view for video worksheets
CREATE VIEW core.derived_worksheet_progress AS
SELECT
    ui.user_id,
    ui.source_context as content_id,
    SPLIT_PART(ui.source_context, ':', 3) as video_id, -- Extract video_id from worksheet:video-reflection:VIDEO_ID
    SPLIT_PART(ui.source_context, ':', 2) as worksheet_type, -- video-reflection
    (ui.input_data->>'video_context'->>'video_title') as video_title,
    ui.tenant_key,
    'worksheet' as progress_type,
    COALESCE((ui.input_data->>'completion_percentage')::integer, 0) as progress_percentage,
    ui.created_at as started_at,
    CASE
        WHEN (ui.input_data->>'completion_percentage')::integer = 100 THEN ui.created_at
        ELSE NULL
    END as completed_at,
    (ui.input_data->>'time_spent_minutes')::integer as time_spent_minutes,
    -- Extract insights count and content quality as scoring factors
    jsonb_array_length(ui.input_data->'responses'->'insights') as insights_count,
    length(ui.input_data->>'responses'->>'big_idea') as big_idea_length,
    length(ui.input_data->>'responses'->>'bold_action') as bold_action_length,
    jsonb_array_length(ui.input_data->'responses'->'future_ideas') as future_ideas_count,
    ui.processing_result as feedback,
    ui.id as source_input_id
FROM core.universal_inputs ui
WHERE ui.context_type = 'team'
  AND ui.source_context LIKE 'worksheet:video-reflection:%'
  AND ui.status = 'completed';

-- Integration with existing progress system
INSERT INTO core.user_progress (
    user_id, content_id, tenant_key, progress_type,
    progress_percentage, started_at, completed_at, metadata
)
SELECT
    user_id, content_id, tenant_key, progress_type,
    progress_percentage, started_at, completed_at,
    jsonb_build_object(
        'time_spent_minutes', time_spent_minutes,
        'video_id', video_id,
        'video_title', video_title,
        'insights_count', insights_count,
        'content_quality_score', (insights_count * 10) + (big_idea_length / 10) + (bold_action_length / 10),
        'source_input_id', source_input_id,
        'worksheet_type', worksheet_type
    )
FROM core.derived_worksheet_progress
WHERE completed_at IS NOT NULL
ON CONFLICT (user_id, content_id, tenant_key) DO UPDATE SET
    progress_percentage = EXCLUDED.progress_percentage,
    completed_at = EXCLUDED.completed_at,
    metadata = EXCLUDED.metadata;
```

#### 7. Scoring Strategy Decision

**Question:** Should we include scoring in the worksheet schema, or have the leaderboard calculate scoring dynamically?

**Approach A: Schema-Based Scoring**
```json
{
  "worksheet_id": "video-reflection-worksheet",
  "scoring": {
    "completion_points": 50,
    "quality_multipliers": {
      "insights_per_item": 10,
      "big_idea_min_chars": 100,
      "bold_action_min_chars": 50
    },
    "time_bonus": {
      "under_5_minutes": 10,
      "under_10_minutes": 5
    }
  }
}
```

**Pros:**
- ✅ **Immediate feedback**: Users see their score right after submission
- ✅ **Consistent scoring**: Same rules applied every time
- ✅ **Transparent**: Users know exactly how they'll be scored
- ✅ **Caching**: Scores are pre-calculated and stored

**Cons:**
- ❌ **Inflexible**: Hard to adjust scoring without schema changes
- ❌ **Version conflicts**: Old submissions use old scoring rules
- ❌ **Limited context**: Can't factor in user history or performance trends
- ❌ **Schema complexity**: Scoring logic embedded in config

**Approach B: Dynamic Leaderboard Calculation**
```sql
-- Leaderboard calculates scores from raw input data
CREATE OR REPLACE FUNCTION calculate_worksheet_score(input_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    insights_count INTEGER;
    big_idea_length INTEGER;
    bold_action_length INTEGER;
    future_ideas_count INTEGER;
BEGIN
    -- Base completion points
    score := 50;

    -- Quality scoring
    insights_count := jsonb_array_length(input_data->'responses'->'insights');
    score := score + (insights_count * 10);

    big_idea_length := length(input_data->>'responses'->>'big_idea');
    IF big_idea_length >= 100 THEN score := score + 20; END IF;

    bold_action_length := length(input_data->>'responses'->>'bold_action');
    IF bold_action_length >= 50 THEN score := score + 15; END IF;

    -- Future ideas bonus (5 points per additional idea beyond first)
    future_ideas_count := jsonb_array_length(input_data->'responses'->'future_ideas');
    IF future_ideas_count > 1 THEN
        score := score + ((future_ideas_count - 1) * 5);
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;
```

**Pros:**
- ✅ **Flexible**: Can adjust scoring rules without touching submissions
- ✅ **Context-aware**: Can factor in user history, team performance, etc.
- ✅ **Evolutive**: Scoring can improve over time with ML/AI insights
- ✅ **A/B testable**: Different scoring approaches for different users
- ✅ **Clean separation**: Business logic separate from data structure

**Cons:**
- ❌ **Performance**: Recalculated every time leaderboard is accessed
- ❌ **Complexity**: Scoring logic in database functions
- ❌ **Debugging**: Harder to trace why a specific score was assigned
- ❌ **Delayed feedback**: Users don't immediately see their score

**Recommendation: Hybrid Approach**
```typescript
// Store calculated score at submission time, but allow recalculation
interface WorksheetSubmission {
  responses: WorksheetResponses;
  calculated_score: number;      // Immediate feedback
  scoring_version: string;       // Track which rules were used
  scoring_factors: {             // Store the breakdown
    completion_points: number;
    quality_points: number;
    time_bonus: number;
    total: number;
  };
}

// Leaderboard can recalculate if needed
function getLeaderboardScore(submission: WorksheetSubmission): number {
  // Use stored score for current version, recalculate for old versions
  if (submission.scoring_version === CURRENT_SCORING_VERSION) {
    return submission.calculated_score;
  }
  return calculateCurrentScore(submission.responses);
}
```

**Benefits of Hybrid:**
- ✅ **Immediate feedback** + **Future flexibility**
- ✅ **Performance** + **Accuracy**
- ✅ **Transparency** + **Evolution**

#### 8. Leaderboard Scoring Integration
```sql
-- Derived leaderboard points from video worksheets (with hybrid scoring)
CREATE VIEW core.derived_worksheet_leaderboard AS
SELECT
    ui.user_id,
    ui.tenant_key,
    COUNT(*) as worksheets_completed,
    -- Use stored calculated_score if available, otherwise calculate dynamically
    SUM(
        COALESCE(
            (ui.input_data->>'calculated_score')::integer,
            calculate_worksheet_score(ui.input_data)
        )
    ) as total_score,
    COUNT(DISTINCT SPLIT_PART(ui.source_context, ':', 3)) as unique_videos_completed,
    AVG((ui.input_data->>'time_spent_minutes')::integer) as avg_time_spent,
    MAX(ui.created_at) as last_worksheet_date,
    -- Quality metrics
    AVG(jsonb_array_length(ui.input_data->'responses'->'insights')) as avg_insights_per_worksheet,
    AVG(length(ui.input_data->>'responses'->>'big_idea')) as avg_big_idea_length
FROM core.universal_inputs ui
WHERE ui.context_type = 'team'
  AND ui.source_context LIKE 'worksheet:video-reflection:%'
  AND (ui.input_data->>'completion_percentage')::integer = 100
  AND ui.status = 'completed'
GROUP BY ui.user_id, ui.tenant_key;

-- Function to update team leaderboard with hybrid scoring
CREATE OR REPLACE FUNCTION update_leaderboard_from_worksheets()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process completed video reflection worksheets
    IF NEW.source_context LIKE 'worksheet:video-reflection:%'
       AND (NEW.input_data->>'completion_percentage')::integer = 100
       AND NEW.status = 'completed' THEN

        -- Calculate score if not already stored (for immediate submissions)
        IF NEW.input_data->>'calculated_score' IS NULL THEN
            NEW.input_data := NEW.input_data || jsonb_build_object(
                'calculated_score', calculate_worksheet_score(NEW.input_data),
                'scoring_version', '1.0',
                'scored_at', NOW()
            );

            -- Update the record with the calculated score
            UPDATE core.universal_inputs
            SET input_data = NEW.input_data
            WHERE id = NEW.id;
        END IF;

        -- Upsert team leaderboard entry
        INSERT INTO core.team_leaderboard (
            tenant_key, user_id, worksheets_completed, videos_completed,
            score, last_activity_at, quality_metrics
        )
        SELECT
            tenant_key, user_id, worksheets_completed, unique_videos_completed,
            total_score,
            last_worksheet_date,
            jsonb_build_object(
                'avg_insights', avg_insights_per_worksheet,
                'avg_big_idea_length', avg_big_idea_length,
                'avg_time_spent', avg_time_spent
            )
        FROM core.derived_worksheet_leaderboard
        WHERE user_id = NEW.user_id AND tenant_key = NEW.tenant_key
        ON CONFLICT (tenant_key, user_id) DO UPDATE SET
            worksheets_completed = EXCLUDED.worksheets_completed,
            videos_completed = EXCLUDED.videos_completed,
            score = EXCLUDED.score,
            last_activity_at = EXCLUDED.last_activity_at,
            quality_metrics = EXCLUDED.quality_metrics;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update leaderboard
CREATE TRIGGER update_leaderboard_from_universal_inputs
    AFTER INSERT OR UPDATE ON core.universal_inputs
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard_from_worksheets();
```

#### 8. Agent Integration
```typescript
// Register worksheet processing agent
const worksheetAgent = new WorksheetProcessingAgent();
await agentRegistry.register('worksheet-processor', worksheetAgent);

// Universal input processor
export async function processUniversalInput(input: UniversalInput) {
  if (input.requires_agent && input.source_context?.startsWith('worksheet:')) {
    const agent = await agentRegistry.get('worksheet-processor');
    const result = await agent.process(input);

    // Update processing result
    await supabase
      .from('universal_inputs')
      .update({
        processing_result: result.result,
        processed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', input.id);
  }
}
```

## Testing & Validation

### **Data Flow Verification**
1. **Input Capture**: User submits worksheet → stored in `universal_inputs`
2. **Agent Processing**: Worksheet agent generates feedback → stored in `processing_result`
3. **Progress Derivation**: Progress automatically appears in `derived_worksheet_progress`
4. **Leaderboard Update**: Points automatically added via trigger
5. **User Experience**: User sees completion, feedback, and leaderboard update

### **Test Scenarios**
- [ ] Complete leadership assessment worksheet
- [ ] Verify progress tracking shows 100% completion
- [ ] Verify leaderboard awards 10 points + score bonus
- [ ] Verify personalized feedback generated by agent
- [ ] Test partial completion (save/resume functionality)
- [ ] Test multiple users competing on leaderboard

## Benefits Realized

### **Single Source of Truth**
- All worksheet data in `universal_inputs`
- Progress and leaderboard derive from same data
- No sync issues between systems

### **Agent-Native Processing**
- Worksheets can trigger intelligent feedback
- Results stored alongside original input
- Extensible for future processing needs

### **Automatic Derivation**
- Progress tracking requires no additional code
- Leaderboard updates automatically via triggers
- Analytics available across all input types

### **Extensibility**
- New worksheet types: just add new schema
- New scoring rules: update derivation logic
- New agents: register for worksheet processing

## Success Metrics

- [ ] Worksheet completion rate > 80%
- [ ] Progress tracking accuracy 100% (matches input data)
- [ ] Leaderboard updates within 1 second of completion
- [ ] Agent feedback generated for 100% of completions
- [ ] Zero data inconsistencies between systems

This implementation demonstrates the Universal Input System's power: **capture worksheet completion once, automatically derive progress tracking, leaderboard scoring, and agent-generated insights**.