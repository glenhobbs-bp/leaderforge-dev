# LeaderForge LMS - Fresh Start Implementation

A multi-tenant Learning Management System supporting Platform > Organization > Team > User hierarchy.

**Decision:** Start fresh with clean architecture, archiving existing ANA (Agent-Native Architecture) codebase for reference/cherry-picking.

**MVP Scope:** Content Delivery → User Progress Tracking → 4-Step Module Completion → Organization Admin Features → Gamification (Streaks + Leaderboards)

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
| ✅ | 3. Build - Core | 3.3 | Implement multi-tenant foundation |
| ✅ | 3. Build - Core | 3.4 | Polish dashboard UI/styling |
| ✅ | 4. Build - Content | 4.1 | Content management backend (Tribe Social) |
| ✅ | 4. Build - Content | 4.2 | Content delivery frontend |
| ✅ | 4. Build - Content | 4.3 | Video progress tracking |
| ✅ | 4. Build - Content | 4.4 | Worksheet functionality |
| ✅ | 4. Build - Content | 4.5 | Bold action capture & tracking |
| ✅ | 4. Build - Content | 4.6 | Check-in request system |
| ✅ | 4. Build - Content | 4.7 | Bold action signoff UI |
| ✅ | 4. Build - Content | 4.8 | **Bold Action Completion Reflection** (closes learning loop) |
| ✅ | 5. Build - Progress | 5.1 | 4-step progress calculation |
| ✅ | 5. Build - Progress | 5.2 | Team leader dashboard |
| ⬜ | 5. Build - Progress | 5.3 | Org admin progress dashboard |
| ✅ | 5. Build - AI | 5.4 | **AI Check-in Cheat Sheet** (first AI feature!) |
| ⬜ | 5. Build - Gamification | 5.5 | Gamification backend (streaks, points) |
| ⬜ | 5. Build - Gamification | 5.6 | Gamification frontend (leaderboards) |
| ⬜ | 6. Build - Admin | 6.1 | Organization admin backend |
| ⬜ | 6. Build - Admin | 6.2 | Organization admin frontend |
| ⬜ | 6. Build - Admin | 6.3 | Signoff mode configuration |
| ⬜ | 6. Build - Admin | 6.4 | Content sequencing backend |
| ⬜ | 6. Build - Admin | 6.5 | Learning path configuration UI |
| ⬜ | 6. Build - Admin | 6.6 | Unlock mode settings |
| ✅ | 6. Build - Platform | 6.7 | **Platform Admin placeholder** (role + route structure) |
| ⬜ | 7. Future | 7.1 | Calendar integration (Google/Outlook) |
| ⬜ | 7. Future | 7.2 | Manager/coach assignment override |
| ⬜ | 7. Future | 7.3 | AI Organization Diagnostic |
| ⬜ | 7. Future | 7.4 | AI-recommended content sequence |
| ⬜ | 7. Future | 7.5 | **AI-Enhanced Reflection Prompts** (context-aware questions) |
| ⬜ | 7. Future | 7.6 | Voice input for reflections (mobile-friendly) |
| ⬜ | 7. Future | 7.7 | Reflection pattern recognition & insights |
| ⬜ | 7. Future | 7.8 | **Platform Admin** - Tenant management dashboard |
| ⬜ | 7. Future | 7.9 | **Platform Admin** - System health & monitoring |
| ⬜ | 7. Future | 7.10 | **AI Configuration** - Platform-level prompt management |
| ⬜ | 7. Future | 7.11 | **AI Configuration** - Tenant-level AI customization |
| ⬜ | 7. Future | 7.12 | **AI Configuration** - A/B testing framework |
| ⬜ | 8. Polish | 8.1 | Testing and QA |
| ⬜ | 8. Polish | 8.2 | Documentation |

**Legend:**
- ✅ = Completed
- 🔄 = In Progress
- ⬜ = Not Started

---

## 📋 4-Step Module Completion Model (NEW)

Each learning module follows a 4-step completion sequence:

| Step | Action | Owner | Progress | Status |
|------|--------|-------|----------|--------|
| 1 | **Watch Video** | User | 25% | ✅ Implemented |
| 2 | **Complete Worksheet** | User | 50% | ✅ Implemented |
| 3 | **Team Leader Check-in** | User + Leader | 75% | ✅ Implemented |
| 4 | **Bold Action Signoff** | User OR Leader | 100% | ✅ Implemented |

**Key Design Decisions:**
- Team Leader = User's manager (with future coach override option)
- Calendar integration for check-ins (Phase 2: Google/Outlook)
- Self-certification preferred (accountability without policing)
- Check-in purpose: calibrate bold action difficulty, review past actions
- Leader dashboard for team visibility
- Admin dashboard for org-wide visibility

**See:** PRD-008 for full specification

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
   - **Updated:** Now references 4-step workflow (PRD-008)

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

8. ✅ **PRD-008: Module Completion Workflow** (NEW)
   - 4-step completion: Video → Worksheet → Check-in → Signoff
   - Bold Action commitment capture
   - Team leader check-in requests
   - Self-certify vs leader approval (org configurable)
   - Team leader dashboard
   - Org admin dashboard

9. ✅ **PRD-009: Content Sequencing & Unlocking** (NEW)
   - Learning paths with ordered modules
   - Three unlock modes: Time-based, Completion-based, Hybrid
   - Org admin controls sequence and pacing
   - Locked content visibility with unlock dates
   - Future: AI-powered org diagnostic for optimal sequence

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
- `docs/product/prds/008-module-completion-workflow.md` (NEW)

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
- ✅ `core.memberships` - User-org-team relationships with roles + manager_id
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

**Progress Schema (8 tables):**
- ✅ `progress.user_progress` - Universal progress tracking with type-specific metadata
- ✅ `progress.user_streaks` - Daily/weekly streak tracking (MVP gamification)
- ✅ `progress.points_ledger` - Points earning history (MVP gamification)
- ✅ `progress.leaderboard_cache` - Materialized leaderboard for fast queries
- ✅ `progress.points_config` - Configurable point values per activity
- ✅ `progress.worksheet_submissions` - Worksheet responses (NEW)
- ✅ `progress.bold_actions` - Bold action tracking (NEW - schema ready)
- ✅ `progress.checkin_requests` - Check-in requests (NEW - schema ready)

**Key Design Decisions:**
- All tables have `tenant_id` for multi-tenant isolation
- RLS policies enforce tenant/org/team boundaries (13 policies created)
- Service role bypass for system operations
- Future-proofed for content marketplace (Phase 3)
- Triggers for auto-timestamp updates and user creation
- **Manager relationship** via `memberships.manager_id` for check-in workflow

**Database Applied:** ✅ Migrations executed via Supabase MCP
- Existing schemas dropped (core, content, progress, modules)
- All 19 migrations applied successfully
- Seed data loaded (2 tenants, 1 org, 2 teams, 4 content items)
- RLS policies active on all tables
- Gamification tables added (streaks, points, leaderboards)
- AI-ready tables added (transcripts, chunks)
- TypeScript types generated
- **NEW:** worksheet_submissions table added

**Relevant Files:**
- `docs/architecture/schemas/database-schema.md` - Full schema documentation
- `supabase/migrations/` - Migration files

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
- 🔄 **Worksheet API** - Worksheet submissions (NEW)
- ⬜ **Bold Action API** - Bold action tracking (NEW)
- ⬜ **Check-in API** - Check-in requests (NEW)

**Key Patterns Documented:**
- Consistent response format (`ApiResponse<T>`)
- Error codes and HTTP status mapping
- Service layer delegation pattern
- Rate limiting guidelines
- TypeScript types for all entities

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
- ⬜ Team leader routes: `/team/progress`, `/team/checkins` (NEW)

**Layout Components:**
- ✅ `AppShell` - Main app container with sidebar
- ✅ `Sidebar` - Desktop navigation
- ✅ `Header` - Top bar with user menu
- ✅ `MobileNav` - Responsive navigation

**Feature Components:**
- ✅ **Content**: `ContentGrid`, `ContentCard`, `VideoPlayer`, `ContentViewer`
- ✅ **Progress**: `ProgressDashboard`, `ProgressCard`
- 🔄 **Worksheet**: `WorksheetModal` (partial)
- ⬜ **Check-in**: `CheckinRequestButton`, `CheckinPendingList`
- ⬜ **Bold Action**: `BoldActionCard`, `SignoffButton`
- ⬜ **Gamification**: `StreakWidget`, `LeaderboardWidget`, `LeaderboardTable`, `PointsDisplay`
- ⬜ **Admin**: `UserTable`, `TeamCard`, `InviteModal`, `RoleSelector`, `AuditLog`

**Relevant Files:**
- `docs/architecture/component-architecture.md` - Full component documentation

---

### Phase 3: Build - Core

#### 3.1 Setup Next.js + Supabase Project
**Status:** ✅ Completed

Fresh Next.js 16 project initialized with full stack setup.

---

#### 3.2 Implement Authentication
**Status:** ✅ Completed

Full SSR-first authentication implemented with login, register, password reset, and invitation flows.

---

#### 3.3 Implement Multi-Tenant Foundation
**Status:** ✅ Completed

Multi-tenant theming and context implemented with CSS custom properties.

---

#### 3.4 Polish Dashboard UI/Styling
**Status:** ✅ Completed

Dashboard UI improved with i49 Group branding, proper logos, and refined styling.

---

### Phase 4: Build - Content

#### 4.1 Content Management Backend
**Status:** ✅ Completed

Tribe Social integration complete:
- ✅ Content collection fetch from Tribe API
- ✅ Individual content item fetch
- ✅ API route proxying
- ✅ HLS video URL extraction

---

#### 4.2 Content Delivery Frontend
**Status:** ✅ Completed

Content UI implemented:
- ✅ Content library page with grid layout
- ✅ Content cards with thumbnails and metadata
- ✅ Content detail page
- ✅ Video player with HLS.js support

---

#### 4.3 Video Progress Tracking
**Status:** ✅ Completed

Video progress implemented:
- ✅ Progress API routes (GET/POST)
- ✅ Progress saves as video plays (debounced)
- ✅ Progress bars on content cards
- ✅ Completion badges

---

#### 4.4 Worksheet Functionality
**Status:** ✅ Completed

Worksheet modal with bold action capture:
- ✅ Database table created (`progress.worksheet_submissions`)
- ✅ Worksheet API routes (GET/POST)
- ✅ Worksheet modal UI with key takeaways + bold action fields
- ✅ Required field validation
- ✅ Auto-creates bold action on submit

---

#### 4.5 Bold Action Capture & Tracking
**Status:** ✅ Completed

Bold action tracking implemented:
- ✅ Bold action field in worksheet (required)
- ✅ `progress.bold_actions` table created
- ✅ Bold action API routes (GET/PUT)
- ✅ Status tracking (pending → completed → signed_off)
- ✅ Visual status on content cards

---

#### 4.6 Check-in Request System
**Status:** ✅ Completed

Team leader check-in system:
- ✅ `progress.checkin_requests` table with RLS
- ✅ `manager_id` added to memberships
- ✅ Request check-in API (POST /api/checkins/[contentId])
- ✅ Self-certification option
- ✅ Pending check-ins API for leaders
- ✅ Visual status on content cards (Requested/Scheduled/Met)

---

#### 4.7 Bold Action Signoff
**Status:** ✅ Completed

Self-certification and signoff:
- ✅ Self-certification flow (skip check-in)
- ✅ Mark bold action as completed
- ✅ Visual completion status on cards
- ✅ 4-corner visual indicators on content cards

---

### Phase 5: Build - Progress

#### 5.1 4-Step Progress Calculation
**Status:** ✅ Completed

Overall module progress calculated and displayed:
- ✅ 25% for video completion (≥90% watched)
- ✅ 50% for worksheet submission + bold action
- ✅ 75% for check-in completion
- ✅ 100% for bold action signoff
- ✅ Progress ring on content cards (X/4)
- ✅ 4-segment progress bar below card title
- ✅ Full green checkmark when all 4 steps complete

---

#### 5.2 Team Leader Dashboard
**Status:** ⬜ Not Started

Dashboard for team leaders:
- Pending check-in requests
- Team member progress by step
- Bold actions pending signoff (if configured)

---

#### 5.3 Org Admin Progress Dashboard
**Status:** ⬜ Not Started

Organization-wide progress view:
- Progress by team
- Progress by individual
- Bottleneck identification
- Completion trends

---

#### 5.4 AI Check-in Cheat Sheet (First AI Feature!)
**Status:** ⬜ Not Started

AI-powered preparation tool for team leaders:
- Generate context-aware cheat sheet before each 5-min check-in
- Include progress snapshot, bold action calibration, history, activation tips
- Uses Claude API (Anthropic)
- Cached for 1 hour to avoid regeneration

**Components:**
- [ ] Cheat sheet data aggregation service
- [ ] Claude API integration
- [ ] Prompt engineering for coaching tone
- [ ] API endpoint (`GET /api/checkins/:id/cheat-sheet`)
- [ ] Cheat sheet display component in leader dashboard
- [ ] Caching layer

**See:** PRD-006 and PRD-008 for full specification

---

#### 5.5 Gamification Backend
**Status:** ⬜ Not Started

- Streak tracking service
- Points awarding on completion
- Leaderboard calculation

---

#### 5.5 Gamification Frontend
**Status:** ⬜ Not Started

- Streak widget
- Leaderboard display
- Points display

---

### Phase 6: Build - Admin

#### 6.1 Organization Admin Backend
**Status:** ⬜ Not Started

---

#### 6.2 Organization Admin Frontend
**Status:** ⬜ Not Started

---

#### 6.3 Signoff Mode Configuration
**Status:** ⬜ Not Started

- Org setting: self-certify vs leader approval
- Admin UI to toggle setting

---

#### 6.4 Content Sequencing Backend
**Status:** ⬜ Not Started

- Learning path data model
- Module sequence assignment
- Unlock status calculation

**Database Tables:**
- [ ] `content.learning_paths` - Path configuration per org
- [ ] `content.learning_path_items` - Ordered modules in path
- [ ] Unlock status view/function

**See:** PRD-009 for full specification

---

#### 6.5 Learning Path Configuration UI
**Status:** ⬜ Not Started

Admin interface for:
- Creating/editing learning paths
- Drag-and-drop module reordering
- Setting unlock mode and timing

---

#### 6.6 Unlock Mode Settings
**Status:** ⬜ Not Started

**Decisions Made:**
- Sequencing is **Organization-wide** (all users follow same sequence)
- Time is **relative to org enrollment** (Week 1, Week 2, etc.)
- Default mode is **Hybrid** (time schedule + completion required)
- Locked modules are **visible (grayed out)** with unlock info

Three unlock modes:
- **Time-based (Cohort)**: Modules unlock on schedule for everyone
- **Completion-based (Self-paced)**: Complete Module N to unlock N+1
- **Hybrid** (default): Time schedule + completion requirement

---

### Phase 7: Future Enhancements

#### 7.1 Calendar Integration
**Status:** ⬜ Future

- Google Calendar integration
- Outlook Calendar integration
- Auto-create check-in events

---

#### 7.2 Manager/Coach Assignment Override
**Status:** ⬜ Future

- Add coach_id to memberships
- UI for assigning coaches
- Coach dashboard access

---

#### 7.3 AI Organization Diagnostic
**Status:** ⬜ Future

AI-powered assessment to recommend optimal training sequence:
- Survey questions about org culture, challenges, goals
- AI analysis of gaps and priorities
- Recommended module sequence
- Suggested pacing based on team size

**See:** PRD-006 and PRD-009 for full specification

---

#### 7.4 AI-Recommended Content Sequence
**Status:** ⬜ Future

Output of org diagnostic:
- Prioritized module order
- Expected outcomes
- Launch talking points

---

### Phase 8: Polish

#### 8.1 Testing and QA
**Status:** ⬜ Not Started

---

#### 8.2 Documentation
**Status:** ⬜ Not Started

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
| Worksheet Pattern | `apps/web/components/ui/legacy_training_library.tsx` | `apps/web/components/content/` |

### Key Architectural Decisions

1. **No Agent-Native Composition** - Traditional React components
2. **Simplified Widget System** - Standard shadcn/ui components
3. **Multi-Tenant from Day 1** - Proper hierarchy built in
4. **Tribe CMS for MVP** - Content from Tribe Social API initially
5. **Supabase as Future CMS** - Architecture ready for migration
6. **AI-Ready Schema** - Transcripts and embeddings tables pre-created
7. **Gamification in MVP** - Streaks and leaderboards from day 1
8. **4-Step Module Completion** - Video → Worksheet → Check-in → Signoff
9. **Self-Certification Preferred** - Accountability without micromanaging
10. **AI Check-in Cheat Sheet** - First AI feature, activating team leaders
11. **Content Sequencing** - Org admin controls module order and unlock pacing
12. **Three Unlock Modes** - Time-based, Completion-based, Hybrid

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

### Database Summary (23+ Tables)

| Schema | Tables | Purpose |
|--------|--------|---------|
| `core` | 7 | Tenants, orgs, teams, users, memberships |
| `content` | 8 | Items, entitlements, licenses, transcripts |
| `progress` | 8 | Progress, streaks, points, worksheets, bold actions, check-ins |

---

**Last Updated:** 2024-12-14
**Current Phase:** 5. Build - Progress (5.2 Team Leader Dashboard)
