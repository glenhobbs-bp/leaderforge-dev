# PRD-008: Module Completion Workflow (4-Step Model)

## Overview

Each learning module in LeaderForge follows a structured 4-step completion workflow designed to ensure learning translates into action while maintaining a supportive (not policing) culture.

## Problem Statement

Traditional LMS systems track video completion as the primary metric, but watching a video doesn't guarantee behavior change. LeaderForge needs a completion model that:
- Ensures reflection on key learnings
- Commits users to specific actions
- Provides accountability through team leader support
- Tracks completion of committed actions
- Balances accountability with autonomy

## 4-Step Completion Sequence

### Step 1: Watch Video (25%)
**Owner:** User

Standard video progress tracking:
- Video plays with progress saved
- Completion at 90%+ watched
- Resume capability for partial views

### Step 2: Complete Worksheet (50%)
**Owner:** User

Reflection and commitment capture:
- **Key Takeaways**: What did you learn?
- **One Bold Action**: Specific action commitment

**Bold Action Requirements:**
- Should be specific and measurable
- Appropriately challenging (not too easy, not overwhelming)
- Time-bound (implicit: before next module)

### Step 3: Team Leader Check-in (75%)
**Owner:** User + Team Leader

5-minute structured check-in meeting:
- User requests meeting via calendar integration
- Team leader can: Accept, Reschedule, or Mark Complete
- **AI-powered Cheat Sheet** provided to leader before check-in (MVP)
- Meeting purpose:
  - Review bold action commitment
  - Ensure appropriate challenge level
  - Discuss previous bold action (if applicable)
  - Provide support/coaching

**NOT the purpose:**
- Policing or micromanaging
- Grading or judging
- Creating anxiety

#### AI Check-in Cheat Sheet (MVP Feature)

Before each check-in, the team leader receives an AI-generated "cheat sheet" to maximize the 5-minute conversation:

**Cheat Sheet Contents:**

| Section | Description |
|---------|-------------|
| **Progress Snapshot** | Current module, overall %, days since last activity |
| **Bold Action Review** | Current commitment text, calibration assessment |
| **Stretch Analysis** | Is this user appropriately challenged? Under/over-stretched? |
| **Completion History** | Past bold actions completed/incomplete, success patterns |
| **Activation Tips** | Specific conversation starters and coaching prompts |

**Example Cheat Sheet:**
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

**AI Implementation:**
- Uses Claude API (Anthropic) for generation
- Context: User progress data, bold action history, module content
- Prompt engineered for coaching tone, not judgmental
- Generated on-demand when leader views check-in request
- Cached for the duration of the check-in (not regenerated)

### Step 4: Bold Action Signoff (100%)
**Owner:** User OR Team Leader (configurable)

Confirmation that bold action was completed:
- **Self-Certify Mode** (preferred): User marks their own action complete
- **Leader Approval Mode**: Team leader confirms completion

**Configuration:**
- Org Admin sets mode per organization
- Default: Self-certify
- No time limit on bold action completion
- Honor system with visibility

#### Bold Action Completion Reflection (MVP Feature)

When marking a bold action complete, users complete a brief reflection to close the learning loop:

**Required:**
- **Completion Status**: Fully completed / Partially completed / Blocked/Unable to complete

**Optional (but encouraged):**
- **Reflection**: Quick reflection on what was learned (1-2 sentences)
- **Challenge Level**: 😌 Easy → 💪 Moderate → 🔥 Hard → 🌋 Very Hard
- **Would Repeat**: 👍 Yes, valuable / 🤷 Maybe / 👎 Not worth it

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Complete Bold Action                                        │
│                                                                 │
│  Your commitment:                                               │
│  "Block 2 hours of focus time on calendar for next week"       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  How did it go? *                                               │
│  ○ ✅ Fully completed                                           │
│  ○ 🔄 Partially completed                                       │
│  ○ ❌ Blocked/Unable to complete                                │
│                                                                 │
│  Quick reflection (optional):                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ What did you learn from doing this?                     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Challenge level:  😌  💪  🔥  🌋                               │
│                                                                 │
│  Would you do this again?  👍  🤷  👎                           │
│                                                                 │
│                    [Cancel]  [Mark Complete →]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why This Matters:**
- Closes the learning loop with reflection
- Provides data for AI calibration insights
- Helps team leaders understand what's working
- Creates accountability without friction (only 1 required field)
- Enables pattern recognition over time

**Data Captured:**
```sql
-- Add to progress.bold_actions or new table:
completion_status TEXT, -- 'fully', 'partially', 'blocked'
reflection_text TEXT,
challenge_level INT, -- 1-4
would_repeat TEXT, -- 'yes', 'maybe', 'no'
```

#### AI-Enhanced Reflection Prompts (Phase 2)

After MVP, enhance with AI-generated reflection prompts:

- **Context-Aware Questions**: AI generates specific questions based on the bold action and module content
- **Voice Input**: Allow voice recording → transcription for mobile users
- **Sentiment Analysis**: Track engagement and identify struggling users
- **Pattern Recognition**: AI identifies:
  - What types of actions this user succeeds at
  - Common blockers
  - Optimal challenge level for growth

**Example AI-Generated Prompts:**
> "You committed to blocking focus time. Did you find 2 hours was enough, or would more/less work better?"

> "This was your 3rd consecutive bold action on time management. What's the biggest change you've noticed?"

## User Stories

### As a Learner
- I can watch videos and track my progress
- I can complete worksheets capturing my learnings and bold action
- I can request a 5-min check-in with my team leader
- I can self-certify completion of my bold action (if org allows)
- I can see my progress through all 4 steps

### As a Team Leader
- I can see which team members need check-ins
- I can accept, reschedule, or complete check-in requests
- I can view team members' bold action commitments
- I can approve bold action completions (if org requires)
- I have a dashboard showing team progress through all steps

### As an Org Admin
- I can configure signoff mode (self-certify vs leader approval)
- I can see organization-wide progress through all steps
- I can identify users stuck at any step
- I can see completion trends and bottlenecks

## Data Model

### Bold Actions Table
```sql
progress.bold_actions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content_id TEXT NOT NULL,
  
  -- The committed action
  action_description TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL, -- 'pending', 'completed', 'cancelled'
  committed_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Signoff
  signoff_type TEXT, -- 'self', 'leader'
  signed_off_by UUID, -- user_id of person who signed off
  signed_off_at TIMESTAMPTZ,
  
  -- Notes
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Check-in Requests Table
```sql
progress.checkin_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL, -- requester
  leader_id UUID NOT NULL, -- team leader
  content_id TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL, -- 'requested', 'scheduled', 'completed', 'cancelled'
  
  -- Calendar integration
  requested_at TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- External calendar
  calendar_event_id TEXT, -- Google/Outlook event ID
  calendar_provider TEXT, -- 'google', 'outlook'
  
  -- Notes
  leader_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Organization Settings Extension
```sql
-- Add to core.organizations.settings JSONB:
{
  "bold_action_signoff": "self" | "leader",
  "checkin_duration_minutes": 5
}
```

### Team Leader Assignment
```sql
-- Add to core.memberships:
manager_id UUID REFERENCES core.users(id), -- User's team leader/manager
coach_id UUID REFERENCES core.users(id)    -- Optional explicit coach override
```

## Progress Calculation

| Step | Condition | Progress |
|------|-----------|----------|
| Video | progress_percentage >= 90 | 25% |
| Worksheet | worksheet submitted | 50% |
| Check-in | checkin_request.status = 'completed' | 75% |
| Signoff | bold_action.status = 'completed' | 100% |

**Overall Module Progress:**
```
progress = (video_complete ? 25 : video_progress/4) +
           (worksheet_complete ? 25 : 0) +
           (checkin_complete ? 25 : 0) +
           (signoff_complete ? 25 : 0)
```

## UI Components

### User View - Content Detail Page
```
┌─────────────────────────────────────────────┐
│ [Video Player]                               │
├─────────────────────────────────────────────┤
│ Your Progress                      75%      │
│ ■■■■■■■■■■■■■■■■■■■□□□□□□                   │
│                                              │
│ ✓ Video Watched                             │
│ ✓ Worksheet Completed                       │
│ ✓ Check-in with Sarah (Dec 12)              │
│ ○ Bold Action: Pending                      │
│                                              │
│ [Complete Bold Action]                      │
└─────────────────────────────────────────────┘
```

### User View - Worksheet Modal
```
┌─────────────────────────────────────────────┐
│ Learning Worksheet                    [X]   │
├─────────────────────────────────────────────┤
│ Key Takeaways                               │
│ ┌─────────────────────────────────────────┐ │
│ │ What were your main learnings?          │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ One Bold Action                             │
│ ┌─────────────────────────────────────────┐ │
│ │ What specific action will you take?     │ │
│ │ Make it challenging but achievable.     │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│              [Cancel] [Submit & Request Check-in] │
└─────────────────────────────────────────────┘
```

### Team Leader Dashboard
```
┌─────────────────────────────────────────────┐
│ Team Progress                               │
├─────────────────────────────────────────────┤
│ Pending Check-ins (3)                       │
│ ┌─────────────────────────────────────────┐ │
│ │ 👤 John Smith - Module 3.1              │ │
│ │    Requested Dec 13     [Schedule]      │ │
│ │ 👤 Jane Doe - Module 2.4                │ │
│ │    Requested Dec 12     [Schedule]      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Team Member Progress                         │
│ ┌───────────────┬───┬───┬───┬───┬────────┐ │
│ │ Member        │ V │ W │ C │ S │ Module │ │
│ ├───────────────┼───┼───┼───┼───┼────────┤ │
│ │ John Smith    │ ✓ │ ✓ │ ○ │ ○ │ 3.1    │ │
│ │ Jane Doe      │ ✓ │ ✓ │ ○ │ ○ │ 2.4    │ │
│ │ Bob Johnson   │ ✓ │ ✓ │ ✓ │ ✓ │ 4.2    │ │
│ └───────────────┴───┴───┴───┴───┴────────┘ │
└─────────────────────────────────────────────┘
```

## API Endpoints

### Bold Actions
- `POST /api/bold-actions` - Create bold action commitment
- `GET /api/bold-actions/:contentId` - Get user's bold action for content
- `PATCH /api/bold-actions/:id/complete` - Mark bold action complete

### Check-in Requests
- `POST /api/checkins` - Request check-in with team leader
- `GET /api/checkins/pending` - Get pending check-in requests (for leaders)
- `PATCH /api/checkins/:id/schedule` - Schedule check-in
- `PATCH /api/checkins/:id/complete` - Mark check-in complete

### AI Check-in Cheat Sheet (MVP)
- `GET /api/checkins/:id/cheat-sheet` - Generate AI cheat sheet for check-in
  - Returns cached version if generated within last hour
  - Includes progress snapshot, calibration, history, tips

### Team Leader Dashboard
- `GET /api/team/progress` - Get team members' 4-step progress
- `GET /api/team/pending-checkins` - Get pending check-in requests

### Org Admin Dashboard
- `GET /api/org/progress` - Get organization-wide progress
- `PATCH /api/org/settings` - Update signoff configuration

## Calendar Integration

### Phase 1 (MVP)
- Manual scheduling (no calendar integration)
- Email notification to team leader
- Leader marks as scheduled/completed manually

### Phase 2 (Post-MVP)
- Google Calendar integration
- Outlook Calendar integration
- Auto-create calendar events
- Sync status from calendar

## Configuration Options

| Setting | Values | Default | Level |
|---------|--------|---------|-------|
| bold_action_signoff | `self`, `leader` | `self` | Organization |
| checkin_duration_minutes | 5, 10, 15, 30 | 5 | Organization |
| calendar_provider | `none`, `google`, `outlook` | `none` | User |

## Success Metrics

- **Completion Rate**: % of users completing all 4 steps per module
- **Check-in Request Rate**: % of worksheets leading to check-in requests
- **Bold Action Completion Rate**: % of committed actions marked complete
- **Time to Complete**: Average days from video watch to signoff
- **Bottleneck Identification**: Which step has highest drop-off

## Implementation Phases

### MVP (Phase 1)
- [x] Video progress (existing)
- [x] Worksheet with bold action capture
- [x] Check-in request (manual scheduling)
- [x] Bold action signoff (self-certify)
- [x] Basic progress display
- [ ] **Bold Action Completion Reflection** (closes learning loop)
- [ ] **AI Check-in Cheat Sheet** (first AI feature)
- [x] Team leader dashboard (basic)
- [ ] Org admin dashboard (basic)

### Phase 2
- [ ] Leader approval signoff mode
- [ ] Email notifications
- [ ] Enhanced AI insights
- [ ] Cheat sheet feedback loop (was it helpful?)
- [ ] **AI-Enhanced Reflection Prompts** (context-aware questions)
- [ ] Voice input for reflection (mobile-friendly)

### Phase 3
- [ ] Calendar integration (Google)
- [ ] Calendar integration (Outlook)
- [ ] Progress analytics
- [ ] Gamification integration (points for completion)
- [ ] AI-powered nudges based on patterns
- [ ] Reflection pattern recognition & insights

## Acceptance Criteria

### Step 1: Video
- [ ] Video progress tracked accurately
- [ ] 90%+ = complete
- [ ] Resume from last position

### Step 2: Worksheet
- [ ] Worksheet captures key takeaways
- [ ] Worksheet captures bold action commitment
- [ ] Both fields required for submission
- [ ] Can edit after submission

### Step 3: Check-in
- [ ] User can request check-in after worksheet
- [ ] Team leader notified of request
- [ ] Leader can schedule/complete check-in
- [ ] Status visible to user

### Step 4: Signoff
- [ ] Self-certify mode works
- [ ] Leader approval mode works (if configured)
- [ ] Completion notes optional
- [ ] Module marked 100% complete

## Open Questions

1. Should bold actions carry over if not completed before next module?
2. Should there be reminders for pending bold actions?
3. Should past bold actions be visible in future modules for review?
4. Should gamification points differ by step (more for bold action completion)?

