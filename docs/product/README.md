# Product Documentation

## Overview

This directory contains product documentation for LeaderForge LMS, including Product Requirements Documents (PRDs) for all features.

## MVP Scope

LeaderForge MVP focuses on three core capabilities:

1. **Content Delivery** - Video and document content library
2. **Progress Tracking** - User progress and completion tracking
3. **Organization Admin** - Team and user management

All features are built on a **Multi-Tenant Foundation** that supports:
- Platform > Tenant > Organization > Team > User hierarchy
- Tenant-level theming with organization overrides
- Role-based access control

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
