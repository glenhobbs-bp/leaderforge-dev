# PRD-006: AI & Analytics Platform

## Overview

| Field | Value |
|-------|-------|
| **Feature** | AI-Powered Analytics & Intelligence |
| **Status** | Draft |
| **Priority** | P0 (MVP) for Check-in Cheat Sheet, P1 for others |
| **Owner** | Platform Team |
| **Dependencies** | PRD-003 (Progress Tracking), PRD-008 (Module Completion) |

## Executive Summary

LeaderForge will leverage AI to provide intelligent insights, natural language querying, deep content search, and adaptive learning experiences. This PRD defines the AI capabilities in phases.

**First AI Feature (MVP):** AI-powered Check-in Cheat Sheets for team leaders.

## Implementation Phases

| Phase | Feature | Timeline |
|-------|---------|----------|
| **MVP** | **Check-in Cheat Sheet** (first AI feature!) | Phase 4 Build |
| **MVP** | Schema foundation (tables ready) | Phase 3 Build |
| **Phase 1** | NL Analytics ("Who's stuck?") | Post-MVP |
| **Phase 1** | **Organization Diagnostic** | Post-MVP |
| **Phase 2** | Deep Search (transcripts + embeddings) | Post-MVP |
| **Phase 3** | Proactive Nudges | Future |
| **Phase 4** | Adaptive Learning | Future |

---

## MVP: AI Check-in Cheat Sheet

> **This is the FIRST AI feature in LeaderForge MVP.**
> See PRD-008 for full 4-step module completion workflow.

### Problem Statement

Team leaders have 5 minutes to conduct meaningful check-ins with their team members. Without preparation, these conversations become superficial. Leaders need quick, actionable context to maximize the value of each check-in.

### User Story

- As a **Team Leader**, I want an AI-generated cheat sheet before each check-in so I can have a more effective 5-minute conversation that activates and supports my team member.

### What the Cheat Sheet Provides

| Section | Content | Data Source |
|---------|---------|-------------|
| **Progress Snapshot** | Module status, streak, last activity | user_progress, user_streaks |
| **Bold Action Review** | Current commitment, calibration | bold_actions, worksheet_submissions |
| **Stretch Analysis** | Under/over-stretched assessment | AI inference from history |
| **Completion History** | Success rate, patterns | historical bold_actions |
| **Activation Tips** | Conversation starters | AI-generated coaching prompts |

### Example Output

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 CHECK-IN CHEAT SHEET: John Smith                         │
│ Module: 3.1 Deep Work                                       │
├─────────────────────────────────────────────────────────────┤
│ 📊 PROGRESS SNAPSHOT                                        │
│ • Overall: 68% complete (12 of 18 modules)                  │
│ • Current streak: 5 days                                    │
│ • Last activity: Yesterday                                  │
│                                                             │
│ 🎯 BOLD ACTION                                              │
│ "Block 2 hours of focus time on calendar for next week"     │
│                                                             │
│ ⚖️ CALIBRATION: Slightly Under-Stretched                    │
│ John has completed 4/4 recent bold actions. This one        │
│ seems achievable given his track record. Consider           │
│ encouraging something more challenging.                     │
│                                                             │
│ 📈 HISTORY                                                  │
│ • 4/5 bold actions completed (80%)                          │
│ • Tends to set safe goals                                   │
│ • Strong on follow-through when committed                   │
│                                                             │
│ 💡 ACTIVATION TIPS                                          │
│ • "What would make this bold action feel more exciting?"    │
│ • "What's something you've been avoiding that this          │
│    module made you think about?"                            │
│ • "How did blocking focus time work out last time?"         │
└─────────────────────────────────────────────────────────────┘
```

### Technical Implementation

**Stack:**
- Claude API (Anthropic) for generation
- Server-side API route (`/api/checkins/:id/cheat-sheet`)
- Supabase for data retrieval

**Data Collected for AI Context:**
```typescript
interface CheatSheetContext {
  // User info
  user: { name: string; joinedAt: string };
  
  // Current module
  currentModule: { title: string; description: string };
  
  // Progress data
  progress: {
    overall: number;
    completedModules: number;
    totalModules: number;
    currentStreak: number;
    lastActivity: string;
  };
  
  // Bold action history
  boldActions: Array<{
    description: string;
    status: 'completed' | 'pending' | 'cancelled';
    moduleTitle: string;
    date: string;
  }>;
  
  // Current bold action
  currentBoldAction: {
    description: string;
    committedAt: string;
  };
}
```

**Prompt Engineering:**
- Coaching tone, not judgmental
- Focused on activation and support
- Specific, actionable tips
- Brief (readable in < 30 seconds)

### API Endpoint

```
GET /api/checkins/:id/cheat-sheet

Response:
{
  "success": true,
  "data": {
    "userId": "uuid",
    "userName": "John Smith",
    "moduleTitle": "3.1 Deep Work",
    "progressSnapshot": { ... },
    "boldAction": { ... },
    "calibration": {
      "assessment": "under-stretched",
      "reasoning": "..."
    },
    "history": { ... },
    "activationTips": [
      "What would make this bold action feel more exciting?",
      ...
    ],
    "generatedAt": "2024-12-14T...",
    "cachedUntil": "2024-12-14T..." // 1 hour cache
  }
}
```

### Success Metrics

| Metric | Target |
|--------|--------|
| Generation time | < 3 seconds |
| Leader satisfaction | > 4/5 |
| Check-in quality improvement | Survey feedback |
| Cheat sheet usage rate | > 80% of check-ins |

### Privacy Considerations

- Only leader can access their team member's cheat sheet
- Data stays within tenant boundary
- No personal data sent to AI without context
- Cheat sheet content not permanently stored (cached only)

---

## Phase 1a: Organization Diagnostic

> **Supports PRD-009 (Content Sequencing)**

### Problem Statement

Org admins don't know the optimal sequence of training content for their organization. They need guidance on:
- Which modules address their organization's gaps
- What order maximizes learning impact
- What pace is appropriate for their team size

### User Story

- As an **Org Admin**, I want an AI-powered diagnostic that assesses my organization's needs and recommends the optimal training sequence.

### How It Works

**Step 1: Assessment Survey**
- Org admin answers 10-15 questions about their organization
- Topics: culture, challenges, goals, team dynamics, previous training
- Optional: Aggregate team survey responses

**Step 2: AI Analysis**
- Analyzes responses against training content catalog
- Identifies gaps and development priorities
- Maps content to organizational needs

**Step 3: Recommendations**
- Prioritized module sequence
- Suggested pacing based on team size
- Talking points for program launch
- Expected outcomes

### Example Output
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 ORGANIZATION DIAGNOSTIC RESULTS                          │
│ Acme Corp - Completed Dec 14, 2024                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ KEY FINDINGS:                                               │
│ • Strong individual contributor culture                     │
│ • Delegation is a significant gap (7 mentions)              │
│ • Feedback skills need development                          │
│ • Team collaboration could improve                          │
│                                                             │
│ RECOMMENDED SEQUENCE:                                       │
│ 1. Self-Awareness (foundation for all growth)               │
│ 2. Delegation ⭐ (addresses primary gap)                    │
│ 3. Feedback ⭐ (complements delegation skills)              │
│ 4. Communication (builds on feedback)                       │
│ 5. Deep Work (individual effectiveness)                     │
│ 6. Team Building (capstone module)                          │
│                                                             │
│ SUGGESTED PACING:                                           │
│ Weekly unlocks (team of 25 can maintain this pace)          │
│                                                             │
│ LAUNCH TALKING POINTS:                                      │
│ • "We identified delegation as our biggest opportunity"     │
│ • "This sequence builds skills progressively"               │
│ • "We'll learn together, one module per week"               │
│                                                             │
│            [Apply This Sequence] [Customize]                │
└─────────────────────────────────────────────────────────────┘
```

### Technical Approach

**Stack:**
- Claude API for analysis and recommendations
- Survey questions stored in database
- Content catalog with tags/categories for matching

**AI Context:**
```typescript
interface DiagnosticContext {
  organization: { name, size, industry };
  surveyResponses: Array<{ question, answer }>;
  contentCatalog: Array<{ 
    id, title, description, 
    tags: string[], // e.g., ['delegation', 'leadership', 'communication']
    prerequisites: string[] 
  }>;
}
```

### Success Metrics

| Metric | Target |
|--------|--------|
| Admin satisfaction with recommendations | > 4/5 |
| Sequence adoption rate | > 70% |
| Time to launch program | < 30 minutes |

---

## Phase 1b: Natural Language Analytics

### Problem Statement

Traditional LMS dashboards show static reports. Managers and admins struggle to find actionable insights without learning complex interfaces.

### User Stories

- As an **Org Admin**, I want to ask "Which users haven't logged in this week?" and get an immediate answer
- As a **Team Manager**, I want to ask "Who's falling behind on the leadership module?" and see specific users
- As an **Org Admin**, I want to ask "What content is most popular?" and see engagement metrics
- As an **Org Admin**, I want to ask "Show me users who might need help" and see at-risk learners

### Technical Approach

```
User Query → LLM → SQL Generation → Execute → Format Response
     ↓
"Who's stuck?"
     ↓
SELECT u.full_name, p.progress_percentage 
FROM core.users u
JOIN progress.user_progress p ON u.id = p.user_id
WHERE p.progress_percentage < 50 
AND p.last_viewed_at < NOW() - INTERVAL '7 days'
```

**Stack:**
- OpenAI GPT-4 for query understanding
- Schema context for SQL generation
- Supabase for query execution
- Response formatting for natural language

### Data Model

No new tables required - queries against existing progress and user data.

### Success Metrics

| Metric | Target |
|--------|--------|
| Query success rate | > 85% |
| Response time | < 5s |
| User satisfaction | > 4/5 |

---

## Phase 2: Deep Content Search

### Problem Statement

Users want to find specific information within videos. "Where did they talk about delegation?" requires watching entire videos to find the relevant section.

### User Stories

- As a **Learner**, I want to search for "delegation" and find the exact timestamp in videos
- As a **Learner**, I want to search conceptually ("how to give feedback") and find semantically related content
- As an **Admin**, I want to see what topics are covered across all content

### Technical Approach

**Phase 2a: Transcript Search (Keyword)**
```
1. Transcribe all videos (Whisper API or Tribe transcripts)
2. Store transcripts with timestamps
3. Enable full-text search
```

**Phase 2b: Semantic Search (Embeddings)**
```
1. Chunk transcripts into segments
2. Generate embeddings (OpenAI ada-002)
3. Store in pgvector
4. Enable semantic search
```

### Data Model

```sql
-- Content transcripts (Phase 2a)
content.transcripts
├── id UUID PRIMARY KEY
├── content_id UUID → content.items
├── full_text TEXT
├── word_count INTEGER
├── language TEXT DEFAULT 'en'
├── source TEXT -- 'whisper', 'tribe', 'manual'
├── created_at TIMESTAMPTZ

-- Transcript chunks with timestamps (Phase 2a)
content.transcript_chunks
├── id UUID PRIMARY KEY
├── transcript_id UUID → transcripts
├── chunk_index INTEGER
├── text TEXT
├── start_time_seconds DECIMAL
├── end_time_seconds DECIMAL
├── embedding VECTOR(1536) -- Phase 2b: pgvector

-- Search index (full-text)
CREATE INDEX ON content.transcript_chunks 
  USING GIN(to_tsvector('english', text));

-- Vector index (semantic - Phase 2b)
CREATE INDEX ON content.transcript_chunks 
  USING ivfflat (embedding vector_cosine_ops);
```

### UI/UX

```
┌────────────────────────────────────────┐
│ 🔍 Search: "giving feedback"           │
├────────────────────────────────────────┤
│ Results:                               │
│                                        │
│ 📹 Effective Communication             │
│    "...giving feedback is about..."    │
│    ⏱️ Jump to 12:34                    │
│                                        │
│ 📹 Leadership Foundations              │
│    "...constructive feedback helps..." │
│    ⏱️ Jump to 23:45                    │
└────────────────────────────────────────┘
```

### Success Metrics

| Metric | Target |
|--------|--------|
| Search result relevance | > 80% |
| Time to find answer | < 30s |
| Jump-to-timestamp accuracy | ± 5s |

---

## Phase 3: Proactive Nudges

### Problem Statement

Users disengage without intervention. The platform should proactively reach out to users who may need encouragement or are at risk of falling behind.

### User Stories

- As a **Learner**, I want to receive a reminder when I haven't logged in for 3 days
- As a **Learner**, I want to be congratulated when I complete a milestone
- As a **Team Manager**, I want to be notified when team members are struggling
- As an **Admin**, I want to configure nudge rules for my organization

### Technical Approach

**Nudge Engine:**
```
1. Scheduled job analyzes user behavior
2. Triggers match against nudge rules
3. Notifications sent via email/in-app
4. Responses tracked for optimization
```

### Data Model

```sql
-- Nudge rule definitions
engagement.nudge_rules
├── id UUID PRIMARY KEY
├── tenant_id UUID → tenants
├── name TEXT
├── description TEXT
├── trigger_type TEXT -- 'inactivity', 'progress_stall', 'completion', 'streak'
├── trigger_config JSONB -- { days_inactive: 3, threshold: 50 }
├── action_type TEXT -- 'email', 'in_app', 'push'
├── message_template TEXT
├── is_active BOOLEAN
├── created_at TIMESTAMPTZ

-- Nudge delivery history
engagement.nudge_history
├── id UUID PRIMARY KEY
├── rule_id UUID → nudge_rules
├── user_id UUID → users
├── triggered_at TIMESTAMPTZ
├── delivered_at TIMESTAMPTZ
├── action_taken_at TIMESTAMPTZ -- If user engaged
├── metadata JSONB
```

### Example Nudge Rules

| Trigger | Condition | Action |
|---------|-----------|--------|
| Inactivity | No login for 3 days | Email reminder |
| Progress Stall | < 50% for 7 days | Encouragement email |
| Streak Risk | About to break streak | Push notification |
| Completion | Finished module | Congratulations + next steps |

---

## Phase 4: Adaptive Learning (Future)

### Problem Statement

Not all learners are the same. Content should adapt to individual learning styles, retention patterns, and pace.

### Concepts

**Ebbinghaus Forgetting Curve:**
- Space repetition for better retention
- Review prompts at optimal intervals
- Reinforcement quizzes

**Learning Style Adaptation:**
- Track engagement patterns
- Recommend content format (video vs reading)
- Adjust difficulty/pace

### Data Model (Future-Proofing)

```sql
-- Learning profile (preferences, patterns)
progress.learning_profiles
├── id UUID PRIMARY KEY
├── user_id UUID → users
├── preferred_content_type TEXT[] -- ['video', 'document']
├── optimal_session_length INTEGER -- minutes
├── best_time_of_day TEXT -- 'morning', 'afternoon', 'evening'
├── retention_scores JSONB -- { topic: score }
├── learning_velocity DECIMAL -- Relative pace
├── created_at TIMESTAMPTZ
├── updated_at TIMESTAMPTZ

-- Spaced repetition schedule
progress.review_schedule
├── id UUID PRIMARY KEY
├── user_id UUID → users
├── content_id UUID → items
├── next_review_at TIMESTAMPTZ
├── interval_days INTEGER
├── ease_factor DECIMAL -- SM-2 algorithm
├── repetitions INTEGER
```

---

## Architecture Considerations

### AI Service Integration

```
┌─────────────────────────────────────────────────────────┐
│                    LeaderForge App                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│  NL Analytics │  Deep Search │    Nudges    │  Adaptive  │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                    AI Service Layer                       │
│  - OpenAI API (GPT-4, Embeddings)                        │
│  - Supabase pgvector                                     │
│  - Background job processing                             │
└──────────────────────────────────────────────────────────┘
```

### Privacy & Security

- All AI queries scoped to user's tenant/org
- No user data sent to external APIs without anonymization
- Opt-out options for adaptive learning tracking

---

## Open Questions

1. **Transcription source**: Use Tribe transcripts if available, or run Whisper ourselves?
2. **Embedding model**: OpenAI ada-002 vs open-source alternatives?
3. **Nudge delivery**: Email provider? (SendGrid, Resend, Postmark?)
4. **Rate limits**: How many NL queries per user per day?

---

## Summary

| Phase | Feature | MVP Impact |
|-------|---------|------------|
| **MVP** | **Check-in Cheat Sheet** | ✅ First AI feature! |
| Schema | Tables ready for future | ✅ Include |
| Phase 1 | NL Analytics | Quick win post-MVP |
| Phase 2 | Deep Search | Differentiator |
| Phase 3 | Nudges | Engagement boost |
| Phase 4 | Adaptive | Long-term value |

---

## Why Check-in Cheat Sheet is the Perfect First AI Feature

1. **Bounded scope** - One user, one context, clear input/output
2. **High value** - Directly improves a core workflow
3. **Low risk** - Advisory only, doesn't make decisions
4. **Quick feedback loop** - Leaders can tell us if it's helpful
5. **Demonstrates AI value** - Shows what AI can do for LeaderForge
6. **Data already available** - Uses existing progress/action data

