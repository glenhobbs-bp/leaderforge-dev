# PRD-003: Progress Tracking

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Progress Tracking |
| **Status** | Draft |
| **Priority** | P0 (MVP Required) |
| **Owner** | Platform Team |
| **Dependencies** | PRD-001, PRD-002 |

## Problem Statement

Users need to track their learning progress across content items. The system must:

- Track video watch progress (position, completion)
- Track document/content completion status
- Persist progress across sessions
- Enable users to resume where they left off
- Provide progress visibility to users and managers

## User Stories

### As a Learner
- I want to see my progress on each content item
- I want to resume videos from where I stopped
- I want to see my overall completion percentage
- I want to mark content as complete manually if needed
- I want to see my learning activity history

### As a Team Manager
- I want to see my team's overall progress
- I want to see which team members have completed required content
- I want to identify team members who may need support

### As an Organization Admin
- I want to see organization-wide progress metrics
- I want to export progress reports
- I want to see completion rates by content item

## Requirements

### Functional Requirements

#### FR-1: Video Progress Tracking
- [ ] Track current playback position
- [ ] Track total watch time
- [ ] Auto-save progress every 10 seconds during playback
- [ ] Save progress on pause, seek, and close
- [ ] Mark as complete when 90%+ watched
- [ ] Support manual "Mark Complete" override

#### FR-2: Content Progress Tracking
- [ ] Track progress percentage (0-100)
- [ ] Track completion status (not started, in progress, completed)
- [ ] Track completion timestamp
- [ ] Track total sessions (number of times accessed)

#### FR-3: Progress Persistence
- [ ] Progress tied to user + content + tenant context
- [ ] Progress survives browser refresh
- [ ] Progress syncs across devices
- [ ] Handle offline gracefully (queue updates)

#### FR-4: Progress Display
- [ ] Show progress bar on content cards
- [ ] Show completion badge for finished items
- [ ] Show "Continue Watching" section for in-progress videos
- [ ] Show overall completion stats on dashboard

#### FR-5: Progress Reporting
- [ ] User can view their own progress summary
- [ ] Managers can view team progress summary
- [ ] Admins can view org-wide progress
- [ ] Export progress data (CSV) - future

### Non-Functional Requirements

#### NFR-1: Reliability
- Progress never lost due to system issues
- Conflict resolution for simultaneous updates
- Eventual consistency acceptable (< 5 second delay)

#### NFR-2: Performance
- Progress updates: < 100ms response time
- Progress queries: < 200ms for user's full progress
- Batch queries efficient for team/org views

#### NFR-3: Scalability
- Support millions of progress records
- Efficient queries for large organizations
- Archival strategy for old progress data

## Data Model

### Progress Table

```
progress.user_progress
├── id (UUID, PK)
├── tenant_id (UUID, FK → tenants)
├── user_id (UUID, FK → users)
├── content_id (UUID, FK → content.items)
├── progress_type (TEXT: video, document, course)
├── progress_percentage (INTEGER, 0-100)
├── completion_count (INTEGER) -- times completed
├── total_sessions (INTEGER)
├── started_at (TIMESTAMPTZ)
├── last_viewed_at (TIMESTAMPTZ)
├── completed_at (TIMESTAMPTZ, nullable)
├── metadata (JSONB)
│   └── video: { watch_time_seconds, last_position_seconds }
│   └── document: { pages_viewed, scroll_position }
├── UNIQUE (user_id, content_id, tenant_id)
```

### Progress Summary View

```sql
-- Materialized view for efficient queries
CREATE MATERIALIZED VIEW progress.user_summary AS
SELECT 
  user_id,
  tenant_id,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_items,
  AVG(progress_percentage) as avg_progress,
  MAX(last_viewed_at) as last_activity
FROM progress.user_progress
GROUP BY user_id, tenant_id;
```

## UI/UX Requirements

### Progress Indicators

#### Content Card Progress
```
████████░░ 75%    (in progress)
✓ Completed       (done)
○ Not started     (new)
```

#### Video Player Progress
- Scrubber bar shows watched segments
- Resume prompt: "Continue from 12:34?"
- Completion toast: "Great job! Content marked as complete."

### Continue Watching Section
```
┌─────────────────────────────────────────┐
│ Continue Watching                        │
├─────────────────────────────────────────┤
│ [Card 1]  [Card 2]  [Card 3]  →         │
│ 75%       45%       30%                 │
└─────────────────────────────────────────┘
```

### Progress Dashboard (User)
```
┌─────────────────────────────────────────┐
│ Your Progress                           │
├─────────────────────────────────────────┤
│ Overall: 68% complete                   │
│ ████████████████░░░░░░░░░ 68%          │
│                                         │
│ Completed: 12 items                     │
│ In Progress: 5 items                    │
│ Not Started: 8 items                    │
│                                         │
│ Last Activity: 2 hours ago              │
└─────────────────────────────────────────┘
```

### Team Progress View (Manager)
```
┌─────────────────────────────────────────┐
│ Team Progress                           │
├─────────────────────────────────────────┤
│ Name          | Progress | Last Active  │
│ ─────────────────────────────────────── │
│ John Doe      | 85%      | Today        │
│ Jane Smith    | 72%      | Yesterday    │
│ Bob Wilson    | 45%      | 3 days ago   │
└─────────────────────────────────────────┘
```

## API Design

### Save Progress
```
POST /api/progress
{
  "contentId": "uuid",
  "progressPercentage": 75,
  "metadata": {
    "watchTimeSeconds": 450,
    "lastPositionSeconds": 450
  }
}
```

### Get User Progress
```
GET /api/progress?userId={userId}
Response: {
  "summary": { totalItems, completedItems, avgProgress },
  "items": [{ contentId, progress, status, lastViewed }]
}
```

### Get Content Progress (for a user)
```
GET /api/progress/{contentId}
Response: {
  "progressPercentage": 75,
  "status": "in_progress",
  "metadata": { ... },
  "lastViewed": "2024-01-15T10:30:00Z"
}
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Progress save success rate | > 99.9% |
| Progress sync latency | < 5 seconds |
| Resume accuracy | Within 5 seconds of saved position |
| User progress visibility | 100% accurate display |

## Dependencies

- PRD-001: Multi-Tenant Foundation (user context)
- PRD-002: Content Delivery (content items, video player)
- Supabase real-time (optional, for live sync)

## Out of Scope (MVP)

- Learning paths / sequential content
- Completion certificates
- Gamification (badges, points)
- Detailed analytics (time-on-task, engagement metrics)
- Progress export (CSV/PDF reports)
- Offline progress sync

## Cherry-Pick from Archive

The archived codebase has an excellent progress tracking schema:
- `_archive/sql/create_universal_progress_table.sql`
- `_archive/packages/agent-core/tools/UserProgressTool.ts`

These can be adapted for the new implementation.

## Open Questions

1. What percentage constitutes video "completion" (90%? 95%? 100%)?
2. Should rewatching content increment completion_count?
3. How long to retain detailed progress data (archival policy)?

## Timeline

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| Design | Schema finalization, API contracts | 3 days |
| Build | Progress table, RLS, services | 1 week |
| Build | Video player integration | 3 days |
| Build | Progress UI components | 1 week |
| Test | Reliability testing | 3 days |

