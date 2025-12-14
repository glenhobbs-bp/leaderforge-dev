# LeaderForge LMS - Fresh Start Implementation

A multi-tenant Learning Management System supporting Platform > Organization > Team > User hierarchy.

**Decision:** Start fresh with clean architecture, archiving existing ANA (Agent-Native Architecture) codebase for reference/cherry-picking.

**MVP Scope:** Content Delivery → User Progress Tracking → Organization Admin Features → Gamification (Streaks + Leaderboards)

---

## 📊 Progress Tracking Table

| ✅ | Phase | Step | Description |
|---|------|------|-------------|
| ✅ | 0. Setup | 0.1 | Archive existing codebase |
| ✅ | 0. Setup | 0.2 | Create clean directory structure |
| ✅ | 1. Foundation | 1.1 | Review and refine Cursor rules |
| ✅ | 1. Foundation | 1.2 | Define architecture principles |
| ✅ | 1. Foundation | 1.3 | Define design system |
| ✅ | 1. Foundation | 1.4 | Define/refine PRDs |
| ✅ | 2. Design | 2.1 | Design database schema |
| ✅ | 2. Design | 2.2 | Define API contracts |
| ✅ | 2. Design | 2.3 | Design component architecture |
| ✅ | 3. Build - Core | 3.1 | Setup Next.js + Supabase project |
| ✅ | 3. Build - Core | 3.2 | Implement authentication |
| ⬜ | 3. Build - Core | 3.3 | Implement multi-tenant foundation |
| ⬜ | 4. Build - Content | 4.1 | Content management backend |
| ⬜ | 4. Build - Content | 4.2 | Content delivery frontend |
| ⬜ | 5. Build - Progress | 5.1 | Progress tracking backend |
| ⬜ | 5. Build - Progress | 5.2 | Progress tracking frontend |
| ⬜ | 5. Build - Progress | 5.3 | Gamification backend (streaks, points) |
| ⬜ | 5. Build - Progress | 5.4 | Gamification frontend (leaderboards) |
| ⬜ | 6. Build - Admin | 6.1 | Organization admin backend |
| ⬜ | 6. Build - Admin | 6.2 | Organization admin frontend |
| ⬜ | 7. Polish | 7.1 | Testing and QA |
| ⬜ | 7. Polish | 7.2 | Documentation |

**Legend:**
- ✅ = Completed
- 🔄 = In Progress
- ⬜ = Not Started

---

## 📋 Detailed Task Information

### Phase 0: Setup

#### 0.1 Archive Existing Codebase
**Status:** ✅ Completed

Moved all existing code to `_archive/` directory for reference:
- ✅ Moved `apps/`, `packages/`, `agent/`, `docs/` to `_archive/`
- ✅ Moved root SQL files to `_archive/sql/`
- ✅ Kept `.cursor/rules/` in place (will be refined)
- ✅ Moved config files (`package.json`, `tsconfig.json`, etc.) to `_archive/`
- ✅ Created fresh `README.md`

**Cherry-pick candidates documented:**
- SSR authentication patterns (`_archive/apps/web/app/lib/supabaseServerClient.ts`)
- RLS policy patterns (`_archive/sql/*.sql`)
- Progress tracking schema (`_archive/sql/create_universal_progress_table.sql`)
- Type definitions (`_archive/apps/web/app/lib/types.ts`)

**Relevant Files:**
- `_archive/` - All archived code and documentation

---

#### 0.2 Create Clean Directory Structure
**Status:** ✅ Completed

Created fresh directory structure:

```
leaderforge-dev/
├── .cursor/
│   └── rules/                   # Cursor rules (kept from previous)
├── docs/
│   ├── architecture/
│   │   ├── adr/                 # Architecture Decision Records
│   │   └── schemas/             # Database schema docs
│   ├── product/
│   │   └── prds/                # Product Requirements Documents
│   └── design-system/           # Design system documentation
├── apps/
│   └── web/                     # Next.js application (empty)
├── packages/
│   ├── database/                # Supabase types & utilities (empty)
│   ├── ui/                      # Shared UI components (empty)
│   └── services/                # Business logic services (empty)
├── supabase/
│   └── migrations/              # Database migrations (empty)
├── _archive/                    # Archived old codebase
├── TASKS.md                     # This file
└── README.md                    # Project readme
```

**Relevant Files:**
- `docs/architecture/README.md` - Architecture docs overview
- `docs/product/README.md` - Product docs overview
- `docs/design-system/README.md` - Design system overview
- `README.md` - Fresh project readme

---

### Phase 1: Foundation

#### 1.1 Review and Refine Cursor Rules
**Status:** ✅ Completed

Reviewed and refactored all Cursor rules for LMS architecture:

**Rules Created (New):**
- `architecture.mdc` - LMS architecture principles (multi-tenant, SSR auth, service layer)
- `senior-engineer.mdc` - Core engineering task execution (simplified from ANA version)
- `senior-designer.mdc` - Design system and UI principles
- `senior-product-manager.mdc` - Feature requirements and PM process
- `senior-qa.mdc` - Consolidated QA and testing standards
- `supabase-patterns.mdc` - Supabase-specific development patterns

**Rules Kept:**
- `task-list-1.mdc` - Task list management (excellent pattern, unchanged)

**Rules Removed (ANA-Specific):**
- `architecture-rules.mdc` - Replaced with simplified `architecture.mdc`
- `senior-architect-rule-ana.mdc` - Merged into `architecture.mdc`
- `senior-engineer-rule-ana.mdc` - Replaced with `senior-engineer.mdc`
- `senior-designer-rule-ana.mdc` - Replaced with `senior-designer.mdc`
- `senior-product-manager-rule-ana.mdc` - Replaced with `senior-product-manager.mdc`
- `senior-qa-engineer.mdc` - Consolidated into `senior-qa.mdc`
- `senior-qa-rule-ana.mdc` - Consolidated into `senior-qa.mdc`
- `senior-qa-rule-documentation-ana.mdc` - Consolidated into `senior-qa.mdc`

**Key Changes:**
- ✅ Removed agent-native composition requirements
- ✅ Removed Universal Widget Schema requirements
- ✅ Added multi-tenant hierarchy patterns (Platform > Org > Team > User)
- ✅ Simplified to modular monolith with Supabase coordination
- ✅ Kept SSR-first authentication requirement
- ✅ Kept RLS-first data security requirement
- ✅ Added Supabase-specific development patterns

**Relevant Files:**
- `.cursor/rules/architecture.mdc` - Core architecture principles
- `.cursor/rules/senior-engineer.mdc` - Engineering standards
- `.cursor/rules/senior-designer.mdc` - Design standards
- `.cursor/rules/senior-product-manager.mdc` - PM standards
- `.cursor/rules/senior-qa.mdc` - QA standards
- `.cursor/rules/supabase-patterns.mdc` - Database patterns
- `.cursor/rules/task-list-1.mdc` - Task management (unchanged)

---

#### 1.2 Define Architecture Principles
**Status:** ✅ Completed

Created architecture documentation with core principles and ADRs:

**Core Principles Documented:**
1. ✅ **Multi-Tenant Data Isolation** - Tenant > Org > Team > User hierarchy
2. ✅ **Theming & Branding (Option 2)** - Tenant full + Org partial override
3. ✅ **SSR-First Authentication** - Server-side auth with Supabase
4. ✅ **Service Layer Architecture** - UI → Services → Database
5. ✅ **Modular Monolith** - Single deployment, domain-based modules

**Architecture Decision Records:**
- ADR-0001: Fresh Start with Simplified Architecture
- ADR-0002: Theming Strategy (Option 2 - Tenant + Org Override)

**Deferred Features (documented):**
- Agent-native composition
- Dynamic UI composition
- LangGraph/AI orchestration
- CopilotKit integration

**Relevant Files:**
- `docs/architecture/README.md` - Architecture overview
- `docs/architecture/adr/README.md` - ADR index and template
- `docs/architecture/adr/0001-fresh-start-architecture.md` - Fresh start decision
- `docs/architecture/adr/0002-theming-strategy.md` - Theming approach

---

#### 1.3 Define Design System
**Status:** ✅ Completed

Created comprehensive design system documentation:

**Design System Elements Documented:**
- ✅ Color palette with theming support (CSS custom properties)
- ✅ Typography scale (Inter default, tenant customizable)
- ✅ Spacing scale (4px base unit system)
- ✅ Component patterns (shadcn/ui base + LMS-specific)
- ✅ Layout patterns (page, dashboard, card grids)
- ✅ Responsive breakpoints (mobile-first)

**LMS-Specific Components Defined:**
- ProgressBar (with completion states)
- ContentCard (video, document, course types)
- UserAvatar (with status indicator)
- CompletionBadge
- CourseNavigation
- TeamSelector

**Technology Stack:**
- Tailwind CSS for styling
- shadcn/ui for base components
- Lucide icons
- CSS custom properties for theming

**Relevant Files:**
- `docs/design-system/README.md` - Design system overview
- `docs/design-system/colors.md` - Colors & theming implementation
- `docs/design-system/typography.md` - Typography scale & patterns
- `docs/design-system/spacing.md` - Spacing, layout & breakpoints
- `docs/design-system/components.md` - Component library

---

#### 1.4 Define/Refine PRDs
**Status:** ✅ Completed

Created comprehensive Product Requirements Documents for MVP features:

**PRDs Created:**
1. ✅ **PRD-001: Multi-Tenant Foundation**
   - Tenant/org/team/user hierarchy
   - Role-based access control
   - Theming system
   - Data model and RLS requirements

2. ✅ **PRD-002: Content Delivery**
   - Content library with filtering/search
   - Video player with resume capability
   - Entitlement-based access control
   - Content card and detail views

3. ✅ **PRD-003: Progress Tracking**
   - Video progress (position, watch time, completion)
   - Universal progress schema (cherry-picked from archive)
   - Progress display and dashboard
   - Team/org progress views

4. ✅ **PRD-004: Organization Admin**
   - User management and invitation
   - Team management
   - Organization settings and branding
   - Admin dashboard and audit logging

5. ✅ **PRD-005: Content Marketplace & Licensing**
   - Three content sources: LeaderForge, Tenant, Marketplace
   - Phased implementation (MVP: platform only)
   - Architecture designed for future without refactor
   - Full data model for all phases

6. ✅ **PRD-006: AI & Analytics Platform** (Added)
   - Natural Language Analytics ("Who's stuck?")
   - Deep Search (transcripts + embeddings)
   - Proactive Nudges (engagement triggers)
   - Adaptive Learning (Ebbinghaus curve - future)
   - Phased implementation (schema ready, features post-MVP)

7. ✅ **PRD-007: Gamification & Engagement** (Added - MVP)
   - Daily/weekly streaks
   - Team and org leaderboards
   - Points system with configurable values
   - Achievements/badges (post-MVP)

**Additional Documentation:**
- Product README with MVP scope and user personas
- Feature priority definitions (P0/P1/P2)
- PRD-002 updated with Tribe Social CMS integration for MVP
- Content ownership model documented

**Relevant Files:**
- `docs/product/README.md` - Product documentation overview
- `docs/product/prds/001-multi-tenant-foundation.md`
- `docs/product/prds/002-content-delivery.md` (includes Tribe CMS details)
- `docs/product/prds/003-progress-tracking.md`
- `docs/product/prds/004-organization-admin.md`
- `docs/product/prds/005-content-marketplace.md`
- `docs/product/prds/006-ai-analytics.md`
- `docs/product/prds/007-gamification.md`

---

### Phase 2: Design

#### 2.1 Design Database Schema
**Status:** ✅ Completed

Designed comprehensive database schema with multi-tenant hierarchy:

**Core Schema (8 tables):**
- ✅ `core.tenants` - Platform tenants with full theming
- ✅ `core.organizations` - Customer organizations with branding overrides
- ✅ `core.teams` - Teams within organizations
- ✅ `core.users` - Platform users (extends auth.users)
- ✅ `core.memberships` - User-org-team relationships with roles
- ✅ `core.invitations` - User invitation system
- ✅ `core.audit_log` - Admin action audit trail

**Content Schema (8 tables):**
- ✅ `content.items` - Content items with ownership model (platform/tenant)
- ✅ `content.entitlements` - Named access packages
- ✅ `content.content_entitlements` - Links content to entitlements
- ✅ `content.entitlement_assignments` - Assigns entitlements to orgs
- ✅ `content.licenses` - Tenant-to-tenant licensing (Phase 3 ready)
- ✅ `content.marketplace_listings` - Marketplace (Phase 3 ready)
- ✅ `content.transcripts` - Video transcripts for AI search (future)
- ✅ `content.transcript_chunks` - Timestamped segments with embeddings (future)

**Progress Schema (5 tables):**
- ✅ `progress.user_progress` - Universal progress tracking with type-specific metadata
- ✅ `progress.user_streaks` - Daily/weekly streak tracking (MVP gamification)
- ✅ `progress.points_ledger` - Points earning history (MVP gamification)
- ✅ `progress.leaderboard_cache` - Materialized leaderboard for fast queries
- ✅ `progress.points_config` - Configurable point values per activity

**Key Design Decisions:**
- All tables have `tenant_id` for multi-tenant isolation
- RLS policies enforce tenant/org/team boundaries (13 policies created)
- Service role bypass for system operations
- Future-proofed for content marketplace (Phase 3)
- Triggers for auto-timestamp updates and user creation

**Migration Files Created (19 files):**
- `001_create_schemas.sql` - Create schemas
- `002_core_tenants.sql` through `008_core_audit_log.sql` - Core tables
- `009_content_items.sql` through `011_content_licenses.sql` - Content tables
- `012_progress.sql` - Progress table
- `013_rls_policies.sql` - All RLS policies
- `014_triggers.sql` - Triggers and helper functions
- `015_seed_data.sql` - Development seed data
- `016_gamification_streaks.sql` - Streak tracking table
- `017_gamification_points.sql` - Points and leaderboard tables
- `018_ai_transcripts_placeholder.sql` - Transcript tables (future AI)
- `019_gamification_functions.sql` - Helper functions and config

**Database Applied:** ✅ Migrations executed via Supabase MCP
- Existing schemas dropped (core, content, progress, modules)
- All 19 migrations applied successfully
- Seed data loaded (2 tenants, 1 org, 2 teams, 4 content items)
- RLS policies active on all tables
- Gamification tables added (streaks, points, leaderboards)
- AI-ready tables added (transcripts, chunks)
- TypeScript types generated

**Relevant Files:**
- `docs/architecture/schemas/database-schema.md` - Full schema documentation
- `supabase/migrations/` - 15 migration files
- `supabase/config.toml` - Supabase configuration

---

#### 2.2 Define API Contracts
**Status:** ✅ Completed

Comprehensive API contracts defined for all MVP endpoints:

**API Groups Defined:**
- ✅ **Auth API** - Login, register, logout, password reset, session
- ✅ **Tenant API** - Tenant info and theming
- ✅ **Organization API** - Org CRUD, settings, branding
- ✅ **Team API** - Team management
- ✅ **User API** - User management, role updates
- ✅ **Invitation API** - Create, accept, revoke invitations
- ✅ **Content API** - Content library, details, Tribe proxy
- ✅ **Progress API** - Progress tracking, team progress
- ✅ **Gamification API** - Streaks, leaderboards, points
- ✅ **Audit API** - Admin audit log

**Key Patterns Documented:**
- Consistent response format (`ApiResponse<T>`)
- Error codes and HTTP status mapping
- Service layer delegation pattern
- Rate limiting guidelines
- TypeScript types for all entities

**Endpoint Summary:**
| Category | Endpoints |
|----------|-----------|
| Auth | 6 |
| Tenant | 1 |
| Organization | 3 |
| Team | 5 |
| User | 5 |
| Invitation | 4 |
| Content | 3 |
| Progress | 4 |
| Gamification | 3 |
| Audit | 1 |
| **Total** | **35 endpoints** |

**Relevant Files:**
- `docs/architecture/api-contracts.md` - Full API documentation

---

#### 2.3 Design Component Architecture
**Status:** ✅ Completed

Comprehensive component architecture designed:

**Route Structure:**
- ✅ Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/invite/[token]`
- ✅ Dashboard routes: `/`, `/content`, `/content/[id]`, `/progress`, `/leaderboard`, `/settings`
- ✅ Admin routes: `/admin`, `/admin/users`, `/admin/teams`, `/admin/organization`, `/admin/audit`

**Layout Components:**
- ✅ `AppShell` - Main app container with sidebar
- ✅ `Sidebar` - Desktop navigation
- ✅ `Header` - Top bar with user menu
- ✅ `MobileNav` - Responsive navigation

**Feature Components:**
- ✅ **Content**: `ContentGrid`, `ContentCard`, `VideoPlayer`, `DocumentViewer`, `ContentProgress`
- ✅ **Progress**: `ProgressDashboard`, `ProgressCard`, `ProgressChart`, `RecentActivity`
- ✅ **Gamification**: `StreakWidget`, `LeaderboardWidget`, `LeaderboardTable`, `PointsDisplay`
- ✅ **Admin**: `UserTable`, `TeamCard`, `InviteModal`, `RoleSelector`, `AuditLog`

**Hooks Defined:**
- `useUser`, `useOrganization`, `useProgress`, `useStreak`, `useContent`
- `useProgressMutation` for saving progress with streak/points updates

**UI Components (shadcn):**
- Button, Card, Input, Modal, Avatar, Badge, Progress, Skeleton, Toast, Tabs, Table, etc.

**State Management:**
- TanStack Query for server state
- React Context for auth/theme
- URL state for filters/pagination

**Relevant Files:**
- `docs/architecture/component-architecture.md` - Full component documentation

---

### Phase 3: Build - Core

#### 3.1 Setup Next.js + Supabase Project
**Status:** ✅ Completed

Fresh Next.js 15 project initialized with full stack setup:

**Monorepo Configuration:**
- ✅ Root `package.json` with pnpm workspaces
- ✅ `pnpm-workspace.yaml` for apps/* and packages/*
- ✅ `turbo.json` for build orchestration
- ✅ Root `tsconfig.json` base configuration

**Next.js App (`apps/web/`):**
- ✅ Next.js 15.1.0 with App Router + Turbopack
- ✅ TypeScript 5.7 strict mode
- ✅ Tailwind CSS 3.4 with design tokens
- ✅ React 19 + React Query
- ✅ shadcn/ui configuration (`components.json`)
- ✅ Core UI components: Button, Card, Input, Label, Progress, Avatar, Badge, Skeleton

**Supabase Setup:**
- ✅ `@supabase/ssr` for SSR-first auth
- ✅ Server client (`src/lib/supabase/server.ts`)
- ✅ Browser client (`src/lib/supabase/client.ts`)
- ✅ Middleware for session refresh (`src/middleware.ts`)

**Providers & Layouts:**
- ✅ Root layout with providers
- ✅ ThemeProvider (next-themes)
- ✅ QueryClient provider
- ✅ Global styles with CSS variables

**Packages:**
- ✅ `@leaderforge/database` - Database types
- ✅ `@leaderforge/services` - All service layer (auth, user, org, team, content, progress, gamification)
- ✅ `@leaderforge/ui` - Shared UI utilities

**Files Created:**
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/components.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/styles/globals.css`
- `apps/web/src/lib/supabase/*.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/components/ui/*.tsx`
- `packages/database/src/*.ts`
- `packages/services/src/*.ts`
- `packages/ui/src/*.ts`

---

#### 3.2 Implement Authentication
**Status:** ✅ Completed

Full SSR-first authentication implemented:

**Auth Pages Created:**
- ✅ Login page with form validation
- ✅ Register page with password confirmation
- ✅ Forgot password page
- ✅ Reset password page
- ✅ Invitation acceptance page (`/invite/[token]`)

**Auth Infrastructure:**
- ✅ Auth callback route (`/auth/callback`)
- ✅ Middleware for session refresh
- ✅ Protected route redirects
- ✅ Auth layout (centered card design)

**Dashboard Layout:**
- ✅ AppShell component (main layout container)
- ✅ Sidebar navigation (desktop)
- ✅ Mobile navigation drawer
- ✅ Header with user menu
- ✅ Theme toggle (light/dark)
- ✅ Logout functionality

**Hooks:**
- ✅ `useUser` hook for client-side user context
- ✅ `hasRole` utility for role checks

**Files Created:**
- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/login/login-form.tsx`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(auth)/register/register-form.tsx`
- `apps/web/src/app/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/(auth)/forgot-password/forgot-password-form.tsx`
- `apps/web/src/app/(auth)/reset-password/page.tsx`
- `apps/web/src/app/(auth)/reset-password/reset-password-form.tsx`
- `apps/web/src/app/(auth)/invite/[token]/page.tsx`
- `apps/web/src/app/(auth)/invite/[token]/invite-form.tsx`
- `apps/web/src/app/auth/callback/route.ts`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/components/layout/app-shell.tsx`
- `apps/web/src/components/layout/sidebar.tsx`
- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/layout/mobile-nav.tsx`
- `apps/web/src/hooks/use-user.ts`

---

#### 3.3 Implement Multi-Tenant Foundation
**Status:** ⬜ Not Started

Implement multi-tenant hierarchy:
- Database migrations for tenant/org/team/user tables
- RLS policies for data isolation
- Tenant context management
- Organization context management

**Relevant Files:**
- `supabase/migrations/`
- `packages/services/tenant.service.ts`
- `packages/services/organization.service.ts`

---

### Phase 4: Build - Content

#### 4.1 Content Management Backend
**Status:** ⬜ Not Started

Implement content management:
- Content CRUD operations
- Course/module organization
- Entitlement management
- Content access control

**Relevant Files:**
- `packages/services/content.service.ts`
- `apps/web/app/api/content/`

---

#### 4.2 Content Delivery Frontend
**Status:** ⬜ Not Started

Implement content UI:
- Content library page
- Content detail/player page
- Course navigation
- Video player component

**Relevant Files:**
- `apps/web/app/(dashboard)/content/`
- `packages/ui/content/`

---

### Phase 5: Build - Progress

#### 5.1 Progress Tracking Backend
**Status:** ⬜ Not Started

Implement progress tracking:
- Progress recording API
- Completion tracking
- Progress queries

**Cherry-pick from archive:**
- `_archive/create_universal_progress_table.sql` (schema design)
- `_archive/packages/agent-core/tools/UserProgressTool.ts` (logic patterns)

**Relevant Files:**
- `packages/services/progress.service.ts`
- `apps/web/app/api/progress/`

---

#### 5.2 Progress Tracking Frontend
**Status:** ⬜ Not Started

Implement progress UI:
- Progress dashboard
- Course completion status
- Video progress indicators

**Relevant Files:**
- `apps/web/app/(dashboard)/progress/`
- `packages/ui/progress/`

---

#### 5.3 Gamification Backend
**Status:** ⬜ Not Started

Implement gamification services:
- Streak tracking service (daily/weekly)
- Points awarding on content completion
- Leaderboard calculation and caching
- Points configuration per tenant

**Database Tables (already created):**
- `progress.user_streaks`
- `progress.points_ledger`
- `progress.leaderboard_cache`
- `progress.points_config`

**Helper Functions (already created):**
- `update_streak()` - Update streak on activity
- `award_points()` - Award points for actions

**Relevant Files:**
- `packages/services/gamification.service.ts`
- `apps/web/app/api/gamification/`

---

#### 5.4 Gamification Frontend
**Status:** ⬜ Not Started

Implement gamification UI:
- Streak widget (current streak, best streak)
- Leaderboard widget (team/org rankings)
- Points display
- Streak milestone celebrations

**Relevant Files:**
- `apps/web/app/(dashboard)/` - Dashboard widgets
- `packages/ui/gamification/` - Streak, leaderboard components

---

### Phase 6: Build - Admin

#### 6.1 Organization Admin Backend
**Status:** ⬜ Not Started

Implement org admin features:
- Organization settings API
- Team management API
- User invitation/management API
- Role management

**Relevant Files:**
- `packages/services/admin.service.ts`
- `apps/web/app/api/organizations/`

---

#### 6.2 Organization Admin Frontend
**Status:** ⬜ Not Started

Implement admin UI:
- Organization settings page
- Team management page
- User management page
- Invitation flow

**Relevant Files:**
- `apps/web/app/(dashboard)/organization/`
- `packages/ui/admin/`

---

### Phase 7: Polish

#### 7.1 Testing and QA
**Status:** ⬜ Not Started

Implement testing:
- Unit tests for services
- Integration tests for API
- E2E tests for critical flows

**Relevant Files:**
- `apps/web/__tests__/`
- `packages/services/__tests__/`

---

#### 7.2 Documentation
**Status:** ⬜ Not Started

Finalize documentation:
- README with setup instructions
- API documentation
- Deployment guide

**Relevant Files:**
- `README.md`
- `docs/`

---

## 📝 Notes

### Cherry-Pick Reference

**From `_archive/`:**

| Pattern | Source File | Use In |
|---------|-------------|--------|
| SSR Auth | `apps/web/app/lib/supabaseServerClient.ts` | `apps/web/lib/auth/` |
| Auth Provider | `apps/web/components/SupabaseProvider.tsx` | `apps/web/providers/` |
| Progress Schema | `create_universal_progress_table.sql` | `supabase/migrations/` |
| Type Patterns | `apps/web/app/lib/types.ts` | `packages/database/types/` |
| RLS Patterns | `*.sql` (various) | `supabase/migrations/` |

### Key Architectural Decisions

1. **No Agent-Native Composition** - Traditional React components
2. **Simplified Widget System** - Standard shadcn/ui components
3. **Multi-Tenant from Day 1** - Proper hierarchy built in
4. **Tribe CMS for MVP** - Content from Tribe Social API initially
5. **Supabase as Future CMS** - Architecture ready for migration
6. **AI-Ready Schema** - Transcripts and embeddings tables pre-created
7. **Gamification in MVP** - Streaks and leaderboards from day 1

### Tribe Social CMS (MVP)

| Config | Value |
|--------|-------|
| API URL | `https://edge.tribesocial.io` |
| CDN URL | `https://cdn.tribesocial.io` |
| Auth | Cookie-based token |
| Collection ID | `99735660` |

**Environment Variables:**
```
TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
TRIBE_SOCIAL_TOKEN=<token>
```

### Database Summary (20 Tables)

| Schema | Tables | Purpose |
|--------|--------|---------|
| `core` | 7 | Tenants, orgs, teams, users, memberships |
| `content` | 8 | Items, entitlements, licenses, transcripts |
| `progress` | 5 | Progress, streaks, points, leaderboards |

---

**Last Updated:** 2024-12-14
**Current Phase:** 2. Design (2.1 Complete)

