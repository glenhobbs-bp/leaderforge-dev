# PRD-004: Organization Admin

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Organization Administration |
| **Status** | Draft |
| **Priority** | P0 (MVP Required) |
| **Owner** | Platform Team |
| **Dependencies** | PRD-001 |

## Problem Statement

Organization administrators need tools to manage their organization's users, teams, and settings. The admin experience must be:

- Simple and intuitive
- Secure (role-based access)
- Efficient for common tasks
- Scalable for large organizations

## User Stories

### As an Organization Admin
- I want to view all users in my organization
- I want to invite new users to join
- I want to assign users to teams
- I want to change user roles
- I want to deactivate users who leave
- I want to create and manage teams
- I want to customize my organization's branding
- I want to view organization analytics

### As a Team Manager
- I want to view my team members
- I want to see my team's progress
- I want to request new team members (via admin)

### As a User Being Onboarded
- I want to receive an invitation email
- I want to set up my account easily
- I want to be guided through initial setup

## Requirements

### Functional Requirements

#### FR-1: User Management
- [ ] View list of all organization users
- [ ] Search/filter users by name, email, team, role
- [ ] View user details (profile, teams, activity)
- [ ] Edit user profile information
- [ ] Change user role (member, manager, admin)
- [ ] Deactivate/reactivate users
- [ ] Bulk actions (deactivate multiple)

#### FR-2: User Invitation
- [ ] Invite users by email address
- [ ] Invite multiple users at once (CSV upload - future)
- [ ] Set initial role on invitation
- [ ] Assign to team on invitation (optional)
- [ ] Resend invitation if not accepted
- [ ] Revoke pending invitations
- [ ] Invitation expiry (7 days default)

#### FR-3: Team Management
- [ ] Create new teams
- [ ] Edit team name and description
- [ ] Add users to teams
- [ ] Remove users from teams
- [ ] Delete teams (with user reassignment)
- [ ] View team member list

#### FR-4: Organization Settings
- [ ] Edit organization name
- [ ] Upload organization logo
- [ ] Set primary color override
- [ ] Toggle "use tenant theme" option
- [ ] View organization ID and metadata

#### FR-5: Organization Dashboard
- [ ] User count (active, inactive, pending)
- [ ] Team count
- [ ] Recent activity feed
- [ ] Quick actions (invite user, create team)

### Non-Functional Requirements

#### NFR-1: Security
- Only org admins can access admin features
- Audit log of admin actions
- Cannot modify users outside organization
- Cannot escalate to tenant admin

#### NFR-2: Usability
- Common tasks completable in < 3 clicks
- Clear confirmation for destructive actions
- Helpful empty states and guidance
- Mobile-responsive admin UI

#### NFR-3: Performance
- User list loads < 2 seconds (up to 1000 users)
- Search results in < 500ms
- Invitation sent in < 2 seconds

## Data Model

### Invitation Table

```
core.invitations
├── id (UUID, PK)
├── tenant_id (UUID, FK)
├── organization_id (UUID, FK)
├── email (TEXT)
├── role (TEXT: member, manager, admin)
├── team_id (UUID, FK, nullable)
├── invited_by (UUID, FK → users)
├── token (TEXT, unique) -- secure random token
├── expires_at (TIMESTAMPTZ)
├── accepted_at (TIMESTAMPTZ, nullable)
├── revoked_at (TIMESTAMPTZ, nullable)
├── created_at
```

### Audit Log Table

```
core.audit_log
├── id (UUID, PK)
├── tenant_id (UUID, FK)
├── organization_id (UUID, FK)
├── actor_id (UUID, FK → users)
├── action (TEXT: user.invited, user.deactivated, team.created, etc.)
├── target_type (TEXT: user, team, organization)
├── target_id (UUID)
├── details (JSONB) -- action-specific data
├── created_at
```

## UI/UX Requirements

### Admin Navigation
```
Organization Admin
├── Dashboard
├── Users
│   ├── All Users
│   ├── Invitations
│   └── [User Detail]
├── Teams
│   ├── All Teams
│   └── [Team Detail]
└── Settings
    ├── General
    └── Branding
```

### Users List Page
```
┌─────────────────────────────────────────────────────────┐
│ Users                                    [+ Invite User] │
├─────────────────────────────────────────────────────────┤
│ [Search...]  [Filter: All ▼]  [Role: All ▼]             │
├─────────────────────────────────────────────────────────┤
│ ○ Avatar | Name          | Email           | Role | Team│
│ ─────────────────────────────────────────────────────── │
│ ○ JD     | John Doe      | john@...        | Admin| Sales│
│ ○ JS     | Jane Smith    | jane@...        | Member| Eng │
│ ○ BW     | Bob Wilson    | bob@...         | Manager| -  │
├─────────────────────────────────────────────────────────┤
│ Showing 1-25 of 150 users                    < 1 2 3 > │
└─────────────────────────────────────────────────────────┘
```

### Invite User Modal
```
┌─────────────────────────────────────────┐
│ Invite User                          ✕  │
├─────────────────────────────────────────┤
│ Email Address *                         │
│ [user@example.com                    ]  │
│                                         │
│ Role *                                  │
│ [Member ▼                            ]  │
│                                         │
│ Team (optional)                         │
│ [Select team... ▼                    ]  │
│                                         │
│ [Cancel]              [Send Invitation] │
└─────────────────────────────────────────┘
```

### User Detail Page
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Users                                         │
├─────────────────────────────────────────────────────────┤
│ ○ John Doe                               [Edit] [•••]   │
│ john.doe@example.com                                    │
│ Admin • Sales Team                                      │
├─────────────────────────────────────────────────────────┤
│ Profile | Teams | Activity | Progress                   │
├─────────────────────────────────────────────────────────┤
│ Name: John Doe                                          │
│ Email: john.doe@example.com                             │
│ Role: Admin                                             │
│ Joined: Jan 15, 2024                                    │
│ Last Active: 2 hours ago                                │
└─────────────────────────────────────────────────────────┘
```

### Teams Page
```
┌─────────────────────────────────────────────────────────┐
│ Teams                                    [+ Create Team] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ Sales       │ │ Engineering │ │ Marketing   │        │
│ │ 12 members  │ │ 8 members   │ │ 5 members   │        │
│ │ [View →]    │ │ [View →]    │ │ [View →]    │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Settings - Branding
```
┌─────────────────────────────────────────────────────────┐
│ Branding                                                │
├─────────────────────────────────────────────────────────┤
│ □ Use tenant default theme                              │
│                                                         │
│ Organization Logo                                       │
│ ┌─────────────┐                                        │
│ │   [Logo]    │  [Upload New Logo]                     │
│ └─────────────┘                                        │
│ Recommended: 200x50px, PNG or SVG                       │
│                                                         │
│ Primary Color                                           │
│ [#2563eb] [■]  [Reset to default]                      │
│                                                         │
│                                    [Save Changes]       │
└─────────────────────────────────────────────────────────┘
```

## Email Templates

### Invitation Email
```
Subject: You're invited to join [Organization] on LeaderForge

Hi,

[Inviter Name] has invited you to join [Organization] on LeaderForge.

LeaderForge is a learning platform where you can access training content 
and track your progress.

[Accept Invitation] (button)

This invitation expires in 7 days.

If you have questions, contact your organization administrator.

- The LeaderForge Team
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Invitation acceptance rate | > 80% |
| Time to complete common tasks | < 3 clicks |
| Admin task completion rate | > 95% |
| Support tickets for admin issues | < 5% of admins |

## Dependencies

- PRD-001: Multi-Tenant Foundation
- Email service (Resend, SendGrid, or Supabase)
- File storage for logos (Supabase Storage)

## Out of Scope (MVP)

- Bulk user import (CSV)
- SSO/SAML configuration
- Custom role creation
- Organization hierarchies
- Advanced audit log filtering/export
- User self-service (password reset handled by Supabase)
- Organization deletion

## Open Questions

1. Should deactivated users lose access immediately or after session expires?
2. What happens to a user's progress when they're deactivated?
3. Should org admins be able to see detailed user progress?

## Timeline

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| Design | UI mockups, flows | 1 week |
| Build | Invitation system | 1 week |
| Build | User management UI | 1 week |
| Build | Team management | 3 days |
| Build | Settings/branding | 3 days |
| Test | QA, security review | 1 week |

