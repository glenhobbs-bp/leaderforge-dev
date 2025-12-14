# PRD-009: Content Sequencing & Unlocking

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Content Sequencing & Unlock Control |
| **Status** | Draft |
| **Priority** | P0 (MVP) |
| **Owner** | Platform Team |
| **Dependencies** | PRD-002 (Content), PRD-008 (Module Completion) |

## Problem Statement

Organizations need control over how learning content is delivered to their users:
- **What** content is available
- **In what order** it's presented
- **When** each module becomes available

Without sequencing controls, users might:
- Skip foundational content
- Feel overwhelmed by too many options
- Miss the cohort learning experience

## User Stories

### As an Org Admin
- I want to define which modules are included in our learning path
- I want to set the order of modules
- I want to choose between time-based or completion-based unlocking
- I want to set the pace (e.g., one module per week)
- I want to see which modules are currently unlocked for my org

### As a Learner
- I want to see my learning path and what's coming next
- I want to understand why certain modules are locked
- I want to know when the next module will unlock
- I want to feel progress as I move through the sequence

### As a Team Leader
- I want to see which team members are keeping pace
- I want to see who's ahead and who's behind

## Content Sequence Model

### Learning Path
A **Learning Path** defines the sequence of content for an organization.

```
Learning Path: "Leadership Foundations 2024"
├── Module 1: Self-Awareness       (unlocked)
├── Module 2: Communication        (unlocked)
├── Module 3: Deep Work            (locked - unlocks Jan 15)
├── Module 4: Delegation           (locked)
├── Module 5: Feedback             (locked)
└── Module 6: Team Building        (locked)
```

### Unlock Modes

#### Mode 1: Time-Based (Cohort Learning)
All users in the org unlock modules together on a schedule, **relative to org enrollment date**.

| Setting | Description | Example |
|---------|-------------|---------|
| `enrollment_date` | When the org starts the program | Jan 1, 2024 |
| `unlock_interval_days` | Days between unlocks | 7 (weekly) |

**Example Schedule (Org enrolled Jan 1):**
- Module 1: Week 1 (Jan 1) - immediate
- Module 2: Week 2 (Jan 8)
- Module 3: Week 3 (Jan 15)
- etc.

**Why Relative to Enrollment:**
- Different orgs can start at different times
- Same "Week 1, Week 2" experience for everyone
- Easy to communicate: "This is a 6-week program"

**Pros:** Team learns together, shared discussions, cohort experience
**Cons:** Fast learners wait, slow learners fall behind

#### Mode 2: Completion-Based (Self-Paced)
Users unlock the next module by completing the previous one.

| Setting | Description | Example |
|---------|-------------|---------|
| `require_completion` | What counts as "complete" | 4-step completion (100%) |
| `min_time_between` | Optional: minimum days between | 3 days |

**Example Flow:**
- User completes Module 1 (all 4 steps) → Module 2 unlocks
- User completes Module 2 → Module 3 unlocks
- etc.

**Pros:** Self-paced, rewards completion, no waiting
**Cons:** Team out of sync, no cohort discussions

#### Mode 3: Hybrid (Time + Completion Gate)
Modules unlock on schedule, BUT user must complete previous module.

| Setting | Description |
|---------|-------------|
| `unlock_type` | `hybrid` |
| `time_unlock` | When module CAN unlock |
| `completion_gate` | Previous module must be complete |

**Example:**
- Module 2 becomes AVAILABLE on Jan 8
- BUT user still needs to complete Module 1 to ACCESS it
- Shows: "Module 2 - Available Jan 8 (requires Module 1 completion)"

**Pros:** Best of both worlds - pacing + accountability
**Cons:** More complex to understand

## Data Model

### Learning Paths Table
```sql
content.learning_paths (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  organization_id UUID NOT NULL REFERENCES core.organizations(id),
  
  -- Path metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Unlock configuration (default: hybrid)
  unlock_mode TEXT NOT NULL DEFAULT 'hybrid'
    CHECK (unlock_mode IN ('time_based', 'completion_based', 'hybrid')),
  
  -- Time-based settings (relative to enrollment)
  enrollment_date DATE NOT NULL, -- When org started the program
  unlock_interval_days INTEGER DEFAULT 7, -- Days between unlocks (default: weekly)
  
  -- Completion-based settings
  completion_requirement TEXT DEFAULT 'full' 
    CHECK (completion_requirement IN ('video_only', 'worksheet', 'full')),
  -- 'full' = all 4 steps (video, worksheet, check-in, signoff)
  -- 'worksheet' = video + worksheet
  -- 'video_only' = just video
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (organization_id) -- One active path per org
)
```

### Learning Path Items Table
```sql
content.learning_path_items (
  id UUID PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES content.learning_paths(id),
  content_id TEXT NOT NULL, -- References Tribe content ID
  
  -- Sequence
  sequence_order INTEGER NOT NULL,
  
  -- Optional overrides
  unlock_date DATE, -- Override: specific unlock date for this module
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (learning_path_id, sequence_order)
)
```

### User Unlock Status (Computed View)
```sql
-- View that computes unlock status for each user
CREATE VIEW content.user_unlock_status AS
SELECT
  lpi.id as path_item_id,
  lpi.content_id,
  lpi.sequence_order,
  lp.organization_id,
  u.id as user_id,
  
  -- Is this module unlocked?
  CASE
    -- Time-based: check if unlock date has passed
    WHEN lp.unlock_mode = 'time_based' THEN
      (lp.start_date + (lpi.sequence_order - 1) * lp.unlock_interval_days) <= CURRENT_DATE
    
    -- Completion-based: check if previous module is complete
    WHEN lp.unlock_mode = 'completion_based' THEN
      lpi.sequence_order = 1 OR EXISTS (
        SELECT 1 FROM progress.user_progress up
        WHERE up.user_id = u.id
        AND up.content_id = prev_item.content_id
        AND up.progress_percentage >= 100
      )
    
    -- Hybrid: both conditions
    WHEN lp.unlock_mode = 'hybrid' THEN
      (lp.start_date + (lpi.sequence_order - 1) * lp.unlock_interval_days) <= CURRENT_DATE
      AND (lpi.sequence_order = 1 OR EXISTS (...previous completion check...))
  END as is_unlocked,
  
  -- When does this unlock? (for time-based/hybrid)
  (lp.start_date + (lpi.sequence_order - 1) * lp.unlock_interval_days) as unlock_date
  
FROM content.learning_path_items lpi
JOIN content.learning_paths lp ON lpi.learning_path_id = lp.id
CROSS JOIN core.users u
WHERE u.tenant_id = lp.tenant_id;
```

## API Endpoints

### Learning Paths (Admin)
- `GET /api/org/learning-path` - Get organization's learning path
- `POST /api/org/learning-path` - Create/update learning path
- `PUT /api/org/learning-path/items` - Update module sequence
- `PATCH /api/org/learning-path/settings` - Update unlock settings

### Content Unlock (User)
- `GET /api/content/sequence` - Get user's content sequence with unlock status
- `GET /api/content/:id/unlock-status` - Check if specific content is unlocked

## UI/UX

### Learner View - Learning Path (Hybrid Mode)

Shows all modules with clear unlock requirements:

```
┌─────────────────────────────────────────────────────────────┐
│ Your Learning Path                          Week 2 of 6     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Module 1: Self-Awareness                                │
│     Completed Dec 10 ✓                                      │
│                                                             │
│  🔄 Module 2: Communication                    ← CURRENT    │
│     75% complete (Check-in pending)                         │
│                                                             │
│  ░░ Module 3: Deep Work                        [LOCKED]     │
│     Week 3 • Requires Module 2 completion                   │
│                                                             │
│  ░░ Module 4: Delegation                       [LOCKED]     │
│     Week 4                                                  │
│                                                             │
│  ░░ Module 5: Feedback                         [LOCKED]     │
│     Week 5                                                  │
│                                                             │
│  ░░ Module 6: Team Building                    [LOCKED]     │
│     Week 6                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Legend:
✅ = Completed
🔄 = In Progress (current)
░░ = Locked (grayed out, visible)
```

**Locked Module Details (on hover/tap):**
```
┌─────────────────────────────────────────────────────────────┐
│ Module 3: Deep Work                            [LOCKED]     │
├─────────────────────────────────────────────────────────────┤
│ This module unlocks when:                                   │
│ • Week 3 arrives (Dec 22)                        ⏳ 5 days  │
│ • You complete Module 2                          ○ Pending  │
│                                                             │
│ Preview: Learn techniques for sustained focus and           │
│ eliminating distractions in your work environment.          │
└─────────────────────────────────────────────────────────────┘
```

### Admin View - Sequence Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ Learning Path Configuration                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Program Name: [Leadership Foundations 2024]                 │
│                                                             │
│ Enrollment Date: [Jan 1, 2024]    (when your org started)  │
│ Unlock Interval: [Weekly ▼]       (one module per week)    │
│                                                             │
│ Unlock Mode:                                                │
│ ○ Time-based only (unlock by schedule)                      │
│ ○ Completion-based only (self-paced)                        │
│ ● Hybrid (schedule + completion required) ← RECOMMENDED    │
│                                                             │
│ Completion Requirement: [Full 4-Step ▼]                    │
│   (Video + Worksheet + Check-in + Signoff)                  │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Module Sequence:                          [Drag to reorder] │
│                                                             │
│ ☰ 1. Self-Awareness           Week 1 (immediate)           │
│ ☰ 2. Communication            Week 2                       │
│ ☰ 3. Deep Work                Week 3                       │
│ ☰ 4. Delegation               Week 4                       │
│ ☰ 5. Feedback                 Week 5                       │
│ ☰ 6. Team Building            Week 6                       │
│                                                             │
│ Total Program Duration: 6 weeks                             │
│                                                             │
│                              [Save Changes]                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### MVP (Phase 1)
- [ ] Learning path data model
- [ ] Basic sequence assignment (admin)
- [ ] Time-based unlock mode
- [ ] Completion-based unlock mode
- [ ] Content library respects unlock status
- [ ] Locked content UI (grayed out, shows unlock date)

### Phase 2
- [ ] Hybrid unlock mode
- [ ] Admin drag-and-drop sequence editor
- [ ] Progress tracking against sequence
- [ ] Team pacing dashboard

### Future (AI-Powered)
- [ ] Organization diagnostic assessment
- [ ] AI-recommended optimal sequence
- [ ] Adaptive pacing based on org progress

## Organization Diagnostic (Future AI Feature)

> See PRD-006 for full AI specification

Before setting up a learning path, the org admin can run an AI-powered diagnostic:

**Diagnostic Assessment:**
1. Survey questions about org culture, challenges, goals
2. Optional: Team-wide assessment (360-style)
3. AI analyzes responses

**Output:**
- Identified gaps (e.g., "Communication is a key development area")
- Recommended module sequence (optimized for this org)
- Suggested pacing based on org size and urgency
- Talking points for launching the program

**Example:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 ORGANIZATION DIAGNOSTIC RESULTS                          │
│ Acme Corp - Completed Dec 14, 2024                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ KEY FINDINGS:                                               │
│ • Strong individual contributor culture                     │
│ • Delegation is a significant gap                           │
│ • Feedback skills need development                          │
│ • Team collaboration could improve                          │
│                                                             │
│ RECOMMENDED SEQUENCE:                                       │
│ 1. Self-Awareness (foundation)                              │
│ 2. Delegation ⭐ (high priority gap)                        │
│ 3. Feedback ⭐ (high priority gap)                          │
│ 4. Communication                                            │
│ 5. Deep Work                                                │
│ 6. Team Building                                            │
│                                                             │
│ SUGGESTED PACING: Weekly (your team of 25 can handle it)   │
│                                                             │
│            [Apply This Sequence] [Customize]                │
└─────────────────────────────────────────────────────────────┘
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Sequence completion rate | > 70% |
| On-pace users | > 60% |
| Admin setup time | < 10 minutes |
| Content access errors (trying locked) | < 5% |

## Design Decisions

| Question | Decision | Notes |
|----------|----------|-------|
| Scope | **Organization-wide** | All users in org follow same sequence |
| Time-based mode | **Relative to enrollment** | Week 1, Week 2, etc. from org start date |
| Default unlock mode | **Hybrid** | Time schedule + completion gate |
| Locked content visibility | **Show (grayed out)** | Users see what's coming, with unlock info |

## Open Questions

1. Should there be a "catch-up" mode for late joiners?
2. Can admins manually unlock modules for specific users?
3. What happens if admin changes sequence mid-program?

## Acceptance Criteria

### MVP
- [ ] Org admin can create a learning path
- [ ] Org admin can set module sequence
- [ ] Org admin can choose time-based or completion-based unlock
- [ ] Users see their learning path with unlock status
- [ ] Locked content shows why it's locked and when it unlocks
- [ ] Content library filters by "available to me"

