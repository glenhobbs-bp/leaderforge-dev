# PRD-007: Gamification & Engagement

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Gamification System |
| **Status** | Draft |
| **Priority** | P0 (MVP) |
| **Owner** | Platform Team |
| **Dependencies** | PRD-003 (Progress Tracking) |

## Executive Summary

Gamification increases learner engagement and completion rates. LeaderForge will implement streaks, leaderboards, and achievements to motivate users and create healthy competition within organizations.

## MVP Scope

| Feature | MVP | Post-MVP |
|---------|-----|----------|
| **Daily Streaks** | ✅ | |
| **Weekly Streaks** | ✅ | |
| **Team Leaderboards** | ✅ | |
| **Org Leaderboards** | ✅ | |
| **Achievements/Badges** | | ✅ |
| **Points System** | | ✅ |
| **Rewards/Prizes** | | ✅ |

---

## Feature 1: Streaks

### Problem Statement

Users lack motivation to engage consistently. Streaks create a "don't break the chain" psychology that drives daily/weekly habits.

### User Stories

- As a **Learner**, I want to see my current streak so I'm motivated to maintain it
- As a **Learner**, I want to see my longest streak ever as a personal record
- As a **Learner**, I want to be reminded when my streak is at risk
- As a **Learner**, I want to see streak milestones (7 days, 30 days, etc.)

### Streak Rules

| Streak Type | Requirement | Grace Period |
|-------------|-------------|--------------|
| **Daily** | Complete any learning activity | Until midnight local time |
| **Weekly** | Complete at least 3 activities in a week | Sunday 11:59 PM |

**Activity = any of:**
- Watch ≥ 50% of a video
- Complete a document
- Pass a quiz

### UI/UX

**Dashboard Widget:**
```
┌─────────────────────────────────────┐
│ 🔥 Your Streak                      │
│                                     │
│    ████████████░░░░  12 days        │
│                                     │
│    Best: 23 days                    │
│    Keep it going! Learn today.      │
└─────────────────────────────────────┘
```

**Streak Milestones:**
- 🔥 3 days - Getting started!
- 🔥🔥 7 days - One week strong!
- 🔥🔥🔥 14 days - Two weeks!
- ⭐ 30 days - Monthly master!
- 🏆 100 days - Century club!

### Data Model

```sql
CREATE TABLE progress.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  user_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Streak type
  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily', 'weekly')),
  
  -- Current streak
  current_streak INTEGER DEFAULT 0,
  streak_start_date DATE,
  last_activity_date DATE,
  
  -- Records
  longest_streak INTEGER DEFAULT 0,
  longest_streak_start DATE,
  longest_streak_end DATE,
  
  -- Stats
  total_active_days INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, streak_type)
);

CREATE INDEX idx_streaks_user ON progress.user_streaks(user_id);
CREATE INDEX idx_streaks_current ON progress.user_streaks(current_streak DESC);
```

### Streak Update Logic

```typescript
async function recordActivity(userId: string, tenantId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get or create streak record
  const streak = await getOrCreateStreak(userId, 'daily');
  
  if (streak.last_activity_date === today) {
    // Already active today, just increment activity count
    return;
  }
  
  const yesterday = getYesterday();
  
  if (streak.last_activity_date === yesterday) {
    // Continue streak
    streak.current_streak += 1;
  } else if (!streak.last_activity_date || streak.last_activity_date < yesterday) {
    // Streak broken, start new
    streak.current_streak = 1;
    streak.streak_start_date = today;
  }
  
  // Update records
  if (streak.current_streak > streak.longest_streak) {
    streak.longest_streak = streak.current_streak;
    streak.longest_streak_end = today;
  }
  
  streak.last_activity_date = today;
  streak.total_active_days += 1;
  
  await saveStreak(streak);
}
```

---

## Feature 2: Leaderboards

### Problem Statement

Learning in isolation lacks motivation. Seeing how you compare to peers creates healthy competition and social proof.

### User Stories

- As a **Learner**, I want to see how I rank against my team
- As a **Learner**, I want to see the top performers in my organization
- As a **Team Manager**, I want to see team rankings to identify engagement
- As an **Org Admin**, I want to see overall engagement metrics

### Leaderboard Types

| Type | Scope | Metric |
|------|-------|--------|
| **Team** | Within user's team | Points/completion |
| **Organization** | All org users | Points/completion |
| **Weekly** | Current week only | Reset Sundays |
| **All-Time** | Cumulative | Never resets |

### Ranking Algorithm

**Points System (MVP - Simple):**
| Activity | Points |
|----------|--------|
| Complete video | 10 |
| Complete document | 5 |
| Daily streak maintained | 2 |
| Weekly streak maintained | 5 |

### UI/UX

**Leaderboard Widget:**
```
┌─────────────────────────────────────────┐
│ 🏆 Team Leaderboard - This Week         │
├─────────────────────────────────────────┤
│  1. 🥇 Sarah J.        145 pts  (+23)   │
│  2. 🥈 Mike T.         132 pts  (+15)   │
│  3. 🥉 Alex K.         128 pts  (+8)    │
│  ────────────────────────────────────   │
│  7. 👤 You             98 pts   (+12)   │
│                                         │
│  [View Full Leaderboard]                │
└─────────────────────────────────────────┘
```

### Data Model

```sql
-- Points ledger (detailed tracking)
CREATE TABLE progress.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  user_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Points details
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'video_complete', 'streak_daily', etc.
  source_id UUID, -- content_id or streak_id
  
  -- Timestamps
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  period_week DATE, -- For weekly leaderboards (start of week)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_user ON progress.points_ledger(user_id);
CREATE INDEX idx_points_week ON progress.points_ledger(period_week);
CREATE INDEX idx_points_earned ON progress.points_ledger(earned_at DESC);

-- Materialized leaderboard (for fast queries)
CREATE TABLE progress.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  user_id UUID NOT NULL REFERENCES core.users(id),
  organization_id UUID REFERENCES core.organizations(id),
  team_id UUID REFERENCES core.teams(id),
  
  -- Period
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  period_start DATE,
  
  -- Scores
  total_points INTEGER DEFAULT 0,
  rank_org INTEGER,
  rank_team INTEGER,
  
  -- Activity
  videos_completed INTEGER DEFAULT 0,
  documents_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_org ON progress.leaderboard_cache(organization_id, period_type, total_points DESC);
CREATE INDEX idx_leaderboard_team ON progress.leaderboard_cache(team_id, period_type, total_points DESC);
```

### Leaderboard Refresh

```typescript
// Run via scheduled job (every 15 minutes or on-demand)
async function refreshLeaderboard(orgId: string, periodType: string) {
  // 1. Calculate points for each user in org
  const userPoints = await calculateUserPoints(orgId, periodType);
  
  // 2. Rank users
  const ranked = userPoints.sort((a, b) => b.points - a.points);
  
  // 3. Upsert into cache
  for (let i = 0; i < ranked.length; i++) {
    await upsertLeaderboardEntry({
      user_id: ranked[i].userId,
      rank_org: i + 1,
      total_points: ranked[i].points,
      // ... other fields
    });
  }
}
```

---

## Feature 3: Achievements (Post-MVP)

### Overview

Achievements are unlockable badges that recognize milestones and behaviors.

### Example Achievements

| Badge | Name | Criteria |
|-------|------|----------|
| 🌟 | First Steps | Complete first video |
| 📚 | Bookworm | Complete 10 documents |
| 🔥 | On Fire | 7-day streak |
| 🏆 | Champion | Top of leaderboard for a week |
| 🎓 | Graduate | Complete a full course |
| 👑 | Century | 100-day streak |

### Data Model (Post-MVP)

```sql
-- Achievement definitions
CREATE TABLE gamification.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  category TEXT, -- 'streak', 'completion', 'social'
  criteria JSONB, -- { type: 'streak', threshold: 7 }
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocks)
CREATE TABLE gamification.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id),
  achievement_id UUID NOT NULL REFERENCES gamification.achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  UNIQUE (user_id, achievement_id)
);
```

---

## Success Metrics

### MVP Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Streak Adoption** | 60% of users have active streak | Weekly |
| **7-Day Streaks** | 30% maintain 7+ days | Monthly |
| **Leaderboard Views** | 50% view weekly | Analytics |
| **Engagement Lift** | +25% DAU | Pre/post comparison |

### Long-Term Metrics

| Metric | Target |
|--------|--------|
| Completion rate improvement | +30% |
| Average session duration | +20% |
| User retention (30-day) | +15% |

---

## Implementation Plan

### MVP Sprint

1. **Database** - Create streak and leaderboard tables
2. **Backend** - Streak tracking service, points calculation
3. **Frontend** - Dashboard widgets (streak, leaderboard)
4. **Integration** - Hook into progress tracking events

### Post-MVP

1. Achievements system
2. Advanced points rules
3. Streak recovery (e.g., use a "freeze")
4. Social features (celebrate teammates)

---

## Privacy Considerations

- Leaderboards show first name + last initial by default
- Users can opt out of leaderboards (still earn points privately)
- Team leaderboards only visible to team members
- No individual data shared outside organization

---

## Open Questions

1. **Streak timezone**: Use user's timezone or org timezone?
2. **Leaderboard opt-out**: Required for compliance?
3. **Point values**: Should be configurable per tenant?
4. **Reset frequency**: Weekly leaderboards reset Sunday or Monday?

