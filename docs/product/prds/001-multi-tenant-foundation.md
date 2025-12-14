# PRD-001: Multi-Tenant Foundation

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Multi-Tenant Foundation |
| **Status** | Draft |
| **Priority** | P0 (MVP Required) |
| **Owner** | Platform Team |

## Problem Statement

LeaderForge needs to support multiple training providers (tenants) who each serve multiple customer organizations. Each organization has teams and users. The system must:

- Isolate data between tenants and organizations
- Support customizable branding at tenant and organization levels
- Enable role-based access control at each hierarchy level
- Scale to support many tenants, organizations, and users

## User Stories

### As a Platform Admin
- I want to create and manage tenants so training providers can use the platform
- I want to configure platform-wide settings

### As a Tenant Admin
- I want to customize my tenant's branding (logo, colors, fonts)
- I want to create and manage organizations under my tenant
- I want to view analytics across all my organizations

### As an Organization Admin
- I want to manage users in my organization
- I want to create and manage teams
- I want to optionally override branding (logo, primary color)
- I want to view my organization's analytics

### As a User
- I want to see my organization's branding when I log in
- I want to be assigned to one or more teams
- I want to access content based on my entitlements

## Requirements

### Functional Requirements

#### FR-1: Tenant Management
- [ ] Create, read, update tenants
- [ ] Tenant has: key (unique slug), display name, theme configuration
- [ ] Tenant theme includes: logo, favicon, colors, font, border radius
- [ ] Tenants are isolated - cannot see other tenants' data

#### FR-2: Organization Management
- [ ] Organizations belong to exactly one tenant
- [ ] Create, read, update, delete organizations
- [ ] Organization has: name, branding overrides (optional)
- [ ] Organization branding: logo, primary color, display name
- [ ] Organizations isolated within tenant

#### FR-3: Team Management
- [ ] Teams belong to exactly one organization
- [ ] Create, read, update, delete teams
- [ ] Team has: name, description
- [ ] Teams are for grouping users (e.g., departments)

#### FR-4: User Management
- [ ] Users authenticate via Supabase Auth
- [ ] Users have profile: name, email, avatar
- [ ] Users belong to one organization (primary)
- [ ] Users can be members of multiple teams
- [ ] User memberships have roles (member, manager, admin)

#### FR-5: Role-Based Access Control
- [ ] Roles: platform_admin, tenant_admin, org_admin, team_manager, member
- [ ] Permissions enforced at API and database (RLS) levels
- [ ] Role hierarchy respects organizational boundaries

#### FR-6: Theming
- [ ] Theme resolved: Platform defaults → Tenant → Org override
- [ ] Theme applied via CSS custom properties
- [ ] Theme changes reflected immediately (no cache issues)

### Non-Functional Requirements

#### NFR-1: Security
- Row Level Security on all tables
- Tenant isolation verified via automated tests
- No cross-tenant data leakage

#### NFR-2: Performance
- Tenant/org resolution < 50ms
- Theme resolution < 10ms
- Support 100+ tenants, 1000+ orgs, 100K+ users

#### NFR-3: Scalability
- Database partitioning strategy for large tenants
- Efficient tenant context queries

## Data Model

### Core Tables

```
core.tenants
├── id (UUID, PK)
├── tenant_key (TEXT, unique slug)
├── display_name (TEXT)
├── theme (JSONB)
├── settings (JSONB)
├── created_at, updated_at

core.organizations
├── id (UUID, PK)
├── tenant_id (UUID, FK → tenants)
├── name (TEXT)
├── branding (JSONB)
├── settings (JSONB)
├── created_at, updated_at

core.teams
├── id (UUID, PK)
├── tenant_id (UUID, FK)
├── organization_id (UUID, FK → organizations)
├── name (TEXT)
├── description (TEXT)
├── created_at, updated_at

core.users (extends Supabase auth.users)
├── id (UUID, PK, FK → auth.users)
├── tenant_id (UUID, FK)
├── email (TEXT)
├── full_name (TEXT)
├── avatar_url (TEXT)
├── preferences (JSONB)
├── created_at, updated_at

core.memberships
├── id (UUID, PK)
├── tenant_id (UUID, FK)
├── user_id (UUID, FK → users)
├── organization_id (UUID, FK → organizations)
├── team_id (UUID, FK → teams, nullable)
├── role (TEXT: member, manager, admin)
├── created_at, updated_at
```

## UI/UX Requirements

### Tenant Admin Dashboard
- Organization list with user counts
- Tenant settings and branding editor
- Cross-org analytics (future)

### Organization Admin Dashboard
- User list with team assignments
- Team management
- Organization settings and branding

### User Experience
- See organization logo/branding on login
- Team context visible in navigation
- Seamless experience within organizational context

## Success Metrics

| Metric | Target |
|--------|--------|
| Tenant isolation test coverage | 100% |
| Theme resolution time | < 10ms |
| User context resolution | < 50ms |
| Zero cross-tenant data leaks | 0 incidents |

## Dependencies

- Supabase Auth for authentication
- Supabase Database for storage
- RLS policies for security

## Out of Scope (MVP)

- Multi-organization user membership (user in multiple orgs)
- Organization hierarchies (parent/child orgs)
- Custom roles beyond predefined set
- SSO/SAML integration
- API key management for tenants

## Open Questions

1. Should users be able to switch between organizations if they belong to multiple?
2. What's the maximum team nesting depth needed?
3. Should tenant admins be able to impersonate org users for support?

## Timeline

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| Design | Database schema, API contracts | 1 week |
| Build | Core tables, RLS, services | 2 weeks |
| Build | Admin UIs | 1 week |
| Test | Security audit, load testing | 1 week |

