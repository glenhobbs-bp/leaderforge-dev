# Product Documentation

## Overview

This directory contains product documentation for LeaderForge LMS, including Product Requirements Documents (PRDs) for all features.

## MVP Scope

LeaderForge MVP focuses on four core capabilities:

1. **Content Delivery** - Video and document content library
2. **4-Step Module Completion** - Structured learning workflow (Video → Worksheet → Check-in → Signoff)
3. **Progress Tracking** - User progress and completion tracking with team/org visibility
4. **Organization Admin** - Team and user management

All features are built on a **Multi-Tenant Foundation** that supports:
- Platform > Tenant > Organization > Team > User hierarchy
- Tenant-level theming with organization overrides
- Role-based access control

### 4-Step Module Completion Model

Each learning module follows a structured completion sequence:

| Step | Action | Owner |
|------|--------|-------|
| 1 | Watch Video | User |
| 2 | Complete Worksheet (Key Takeaways + Bold Action) | User |
| 3 | Team Leader Check-in (5 min) | User + Leader |
| 4 | Bold Action Signoff | User (self-certify) or Leader (configurable) |

**Design Principles:**
- Accountability without micromanaging
- Self-certification preferred (leader approval optional)
- Check-ins are supportive, not policing
- Bold actions should be appropriately challenging

### First AI Feature: Check-in Cheat Sheet

Before each 5-minute check-in, team leaders receive an AI-generated "cheat sheet" that includes:
- Progress snapshot
- Bold action calibration (under/over-stretched?)
- Completion history patterns
- Activation tips (conversation starters)

**Goal:** Help leaders maximize the value of every check-in conversation.

## PRD Index

| PRD | Feature | Status | Priority |
|-----|---------|--------|----------|
| [PRD-001](./prds/001-multi-tenant-foundation.md) | Multi-Tenant Foundation | Draft | P0 (MVP) |
| [PRD-002](./prds/002-content-delivery.md) | Content Delivery | Draft | P0 (MVP) |
| [PRD-003](./prds/003-progress-tracking.md) | Progress Tracking | Draft | P0 (MVP) |
| [PRD-004](./prds/004-organization-admin.md) | Organization Admin | Draft | P0 (MVP) |
| [PRD-005](./prds/005-content-marketplace.md) | Content Marketplace & Licensing | Draft | P1 (Phased) |
| [PRD-006](./prds/006-ai-analytics.md) | AI & Analytics Platform | Draft | P1 (Post-MVP) |
| [PRD-007](./prds/007-gamification.md) | Gamification & Engagement | Draft | P0 (MVP) |
| [PRD-008](./prds/008-module-completion-workflow.md) | 4-Step Module Completion | Draft | P0 (MVP) |
| [PRD-009](./prds/009-content-sequencing.md) | Content Sequencing & Unlocking | Draft | P0 (MVP) |

## Feature Priority

### P0 - Must Have (MVP)
- User authentication and authorization
- Tenant/organization context
- Content library browsing
- Video playback with progress
- Basic progress tracking
- User profile management

### P1 - Should Have (MVP+)
- Team management
- User invitation flow
- Course/module organization
- Progress dashboard
- Completion certificates

### P2 - Nice to Have (Future)
- Advanced analytics
- Custom reports
- API access
- Mobile app
- AI-powered features

## User Personas

### Learner (End User)
- Accesses content assigned by their organization
- Tracks their own progress
- Belongs to one or more teams

### Team Manager
- Views team progress and completion
- Cannot manage users directly
- Reports to org admin

### Organization Admin
- Manages users within their organization
- Creates and manages teams
- Views organization-wide analytics
- Assigns content/entitlements

### Tenant Admin
- Manages organizations under their tenant
- Configures tenant branding/theming
- Views cross-organization analytics
- Manages content library

### Platform Admin (LeaderForge)
- Manages tenants
- Platform-wide configuration
- System administration

## Related Documentation

- [Architecture](../architecture/) - Technical architecture
- [Design System](../design-system/) - UI/UX standards
