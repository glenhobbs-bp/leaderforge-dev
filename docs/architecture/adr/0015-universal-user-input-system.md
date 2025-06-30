# ADR-0015: Universal User Input System

**Status:** Proposed
**Date:** 2024-01-04
**Supersedes:** N/A
**Superceded by:** N/A
**Related:** ADR-0016 (Schema-Driven Forms Architecture)

## Summary

Design and implement a Universal User Input System that handles all forms of user input (structured forms, free-form text, voice, images) through a unified architecture, enabling consistent processing, storage, and derivation of downstream features like progress tracking and leaderboards.

## Context

### Current State
- Mockup feedback only logs to console (no persistence)
- Multiple disconnected input mechanisms planned: worksheets, journaling, chat, bug reports
- Progress tracking and leaderboard systems need input from various sources
- Risk of building fragmented, incompatible systems

### Key Insight
**All user inputs share common patterns:**
- Input mechanism (form, text, voice, image)
- Context (personal, team, platform)
- Privacy requirements (encrypted, user-scoped, org-scoped, platform)
- Processing needs (agent-based, direct, real-time)

## Decision

Implement a **Universal User Input System** that:

1. **Captures all user inputs** through a unified schema and API
2. **Routes intelligently** based on context and privacy requirements
3. **Enables derivation** of all downstream features from core input data
4. **Supports agent-native processing** where appropriate

## Architecture

### Core Components

#### 1. Universal Input Schema
```sql
CREATE TABLE core.universal_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    session_id UUID,

    -- Input classification
    input_type TEXT NOT NULL CHECK (input_type IN ('form', 'text', 'voice', 'image', 'multimodal')),
    input_data JSONB NOT NULL,
    attached_files TEXT[] DEFAULT '{}', -- Array of file_ids from core.user_files

    -- Context and routing
    context_type TEXT NOT NULL CHECK (context_type IN ('personal_development', 'team_organizational', 'platform_feedback', 'real_time_interaction')),
    context_metadata JSONB DEFAULT '{}',
    privacy_level TEXT NOT NULL CHECK (privacy_level IN ('user_private', 'hierarchy_accessible', 'admin_accessible')),

    -- Processing directives
    requires_agent BOOLEAN DEFAULT false,
    processing_priority TEXT DEFAULT 'normal' CHECK (processing_priority IN ('immediate', 'normal', 'batch')),

    -- Agent processing
    assigned_agent_id UUID REFERENCES core.agents(id),
    processing_result JSONB,

    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),

    -- Source context (for derivation)
    source_context TEXT, -- e.g., "mockup:TeamLeaderMockup", "worksheet:leadership-assessment"
    tenant_key TEXT NOT NULL
);
```

#### 2. Input Classification Agent
```typescript
interface InputClassifierAgent {
  async classifyInput(rawInput: RawInput): Promise<{
    context_type: 'personal_development' | 'team_organizational' | 'platform_feedback' | 'real_time_interaction';
    privacy_level: 'user_private' | 'hierarchy_accessible' | 'admin_accessible';
    requires_agent: boolean;
    processing_priority: 'immediate' | 'normal' | 'batch';
    target_storage: StorageBackend;
    derivation_triggers: string[]; // e.g., ['progress_tracking', 'leaderboard_scoring']
  }>;
}
```

#### 3. Storage Router
Routes inputs to appropriate storage based on privacy and context:
- **Encrypted Local**: Personal journaling, private notes
- **User-Scoped DB**: Individual progress, preferences
- **Org-Scoped DB**: Team worksheets, organizational data
- **Platform DB**: Feedback, bug reports, feature requests

#### 4. Derivation Engine
Automatically triggers downstream feature updates:
```typescript
interface DerivationEngine {
  async triggerDerivations(input: UniversalInput): Promise<void> {
    // Examples:
    await this.updateProgressTracking(input);
    await this.updateLeaderboardScoring(input);
    await this.updateAnalytics(input);
    await this.triggerNotifications(input);
  }
}
```

## Priority Implementation: Worksheets → Progress → Leaderboards

### Worksheet Completion Flow
```typescript
// 1. User completes worksheet
const worksheetInput: UniversalInput = {
  input_type: 'form',
  input_data: {
    worksheet_id: 'leadership-assessment-1',
    responses: { /* form responses */ },
    completion_percentage: 100,
    time_spent_minutes: 15
  },
  context_type: 'team_organizational',
  privacy_level: 'hierarchy_accessible',
  source_context: 'worksheet:leadership-assessment-1',
  requires_agent: true // For analysis and feedback
};

// 2. Agent processes worksheet
const worksheetAgent = new WorksheetProcessingAgent();
await worksheetAgent.process(worksheetInput);

// 3. Derivation engine triggers
await derivationEngine.updateProgressTracking({
  user_id: input.user_id,
  content_id: 'leadership-assessment-1',
  tenant_key: input.tenant_key,
  progress_type: 'worksheet',
  progress_percentage: 100,
  completed_at: NOW(),
  metadata: {
    time_spent: 15,
    score: calculatedScore,
    source_input_id: input.id
  }
});

await derivationEngine.updateLeaderboardScoring({
  user_id: input.user_id,
  action_type: 'worksheet_completed',
  points: calculatePoints(input.input_data),
  context: 'leadership-assessment-1'
});
```

### Progress Tracking Integration
Progress tracking integrates with existing `core.user_progress` table via database triggers:

```sql
-- Automatic progress updates from universal_inputs
CREATE OR REPLACE FUNCTION update_progress_from_input()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.source_context LIKE 'worksheet:%' AND NEW.input_data->>'completion_percentage' = '100' THEN
        INSERT INTO core.user_progress (
            user_id, content_id, tenant_key, progress_type,
            progress_percentage, completed_at, metadata
        ) VALUES (
            NEW.user_id,
            NEW.source_context,
            NEW.tenant_key,
            'worksheet',
            100,
            NEW.created_at,
            jsonb_build_object('source_input_id', NEW.id, 'time_spent', NEW.input_data->>'time_spent_minutes')
        )
        ON CONFLICT (user_id, content_id, tenant_key)
        DO UPDATE SET
            progress_percentage = 100,
            completed_at = NEW.created_at,
            metadata = jsonb_build_object('source_input_id', NEW.id, 'time_spent', NEW.input_data->>'time_spent_minutes');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Leaderboard Scoring Derivation
```sql
-- Automatically derived scoring
CREATE VIEW core.derived_leaderboard_scores AS
SELECT
    ui.user_id,
    ui.tenant_key,
    COUNT(*) FILTER (WHERE ui.source_context LIKE 'worksheet:%' AND ui.input_data->>'completion_percentage' = '100') * 10 as worksheet_points,
    COUNT(*) FILTER (WHERE ui.context_type = 'platform' AND ui.input_data->>'rating'::int >= 4) * 2 as feedback_points,
    -- Add more scoring rules as needed
    ui.created_at::date as score_date
FROM core.universal_inputs ui
GROUP BY ui.user_id, ui.tenant_key, ui.created_at::date;
```

## Benefits

### 1. Single Source of Truth
- All user inputs captured in one place
- Consistent timestamps and user attribution
- Full audit trail of all interactions

### 2. Derived Features
- **Progress tracking** derived from input completion
- **Leaderboard scoring** calculated from input patterns
- **Analytics** aggregated from input data
- **Notifications** triggered by input events

### 3. Privacy by Design
- Privacy level determined at input time
- Automatic routing to appropriate storage
- Encryption for sensitive data

### 4. Agent-Native Integration
- Inputs can trigger agent processing
- Agents can enrich input data
- Results stored alongside original input

### 5. Extensibility
- New input types easily added
- New derivation rules can tap into existing data
- No need to modify existing systems

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create `core.universal_inputs` table
- [ ] Build Universal Input API (`/api/input/universal`)
- [ ] Implement basic classification agent
- [ ] Create storage router

### Phase 2: Worksheets (Weeks 3-4)
- [ ] Worksheet form renderer using universal input
- [ ] Worksheet processing agent
- [ ] Progress derivation from worksheet completion
- [ ] Leaderboard scoring integration

### Phase 3: Additional Input Types (Weeks 5-6)
- [ ] Mockup feedback through universal input
- [ ] Bug reporting with image upload
- [ ] Simple journaling capability

### Phase 4: Analytics & Insights (Weeks 7-8)
- [ ] Universal analytics dashboard
- [ ] Cross-input-type insights
- [ ] Performance optimization

## Examples

### Worksheet Completion
```json
{
  "input_type": "form",
  "input_data": {
    "worksheet_id": "leadership-assessment",
    "responses": {
      "q1": "Collaborative leadership",
      "q2": 4,
      "q3": ["delegation", "communication"]
    },
    "completion_percentage": 100,
    "time_spent_minutes": 12
  },
  "context_type": "team_organizational",
  "privacy_level": "hierarchy_accessible",
  "source_context": "worksheet:leadership-assessment",
  "requires_agent": true
}
```

### Mockup Feedback
```json
{
  "input_type": "form",
  "input_data": {
    "rating": 4,
    "feedback_text": "Great layout, colors need work",
    "mockup_component": "TeamLeaderMockup"
  },
  "context_type": "platform_feedback",
  "privacy_level": "admin_accessible",
  "source_context": "mockup:TeamLeaderMockup",
  "requires_agent": true
}
```

### Voice Journaling
```json
{
  "input_type": "voice",
  "input_data": {
    "audio_url": "encrypted://local/audio123.wav",
    "transcript": "Today I learned about delegation...",
    "duration_seconds": 45
  },
  "context_type": "personal_development",
  "privacy_level": "user_private",
  "source_context": "journal:daily-reflection",
  "requires_agent": false
}
```

## Risks and Mitigations

### Risk: Performance with Large Input Volume
**Mitigation**:
- Partition tables by tenant_key and date
- Use appropriate indexes
- Archive old data

### Risk: Privacy Compliance
**Mitigation**:
- Built-in privacy levels
- Automatic encryption for sensitive data
- Clear data retention policies

### Risk: Agent Processing Bottlenecks
**Mitigation**:
- Async processing for non-critical inputs
- Priority queues for immediate processing
- Graceful degradation

## Success Criteria

- [ ] All user inputs flow through universal system
- [ ] Progress tracking automatically derived from inputs
- [ ] Leaderboard scoring calculated from input patterns
- [ ] Zero data duplication across systems
- [ ] Sub-100ms input capture latency
- [ ] Full privacy compliance for all input types

## Notes

This architecture enables the "capture once, derive everything" pattern that eliminates data silos and ensures consistency across all user interaction tracking systems.