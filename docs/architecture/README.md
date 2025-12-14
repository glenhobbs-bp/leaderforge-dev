# LeaderForge LMS Architecture

## Overview

LeaderForge is a multi-tenant Learning Management System designed for leadership development and employee training. The platform supports a hierarchical structure where training providers (tenants) can onboard multiple customer organizations, each with their own teams and users.

## Multi-Tenant Hierarchy

```
Platform (LeaderForge)
└── Tenant (e.g., i49 Group - Training Provider)
    └── Organization (Customer Company)
        └── Team (Department/Group)
            └── User (Employee)
```

### Entity Descriptions

| Entity | Description | Example |
|--------|-------------|---------|
| **Platform** | LeaderForge itself | LeaderForge LMS |
| **Tenant** | Training provider or reseller with full platform access | i49 Group |
| **Organization** | Customer company purchasing training | Acme Corp |
| **Team** | Group within an organization | Sales Team |
| **User** | Individual learner | John Smith |

## Core Architecture Principles

### 1. Multi-Tenant Data Isolation
All data is scoped by tenant and organization. Row Level Security (RLS) policies enforce boundaries at the database level, ensuring users can only access data within their tenant and organization.

### 2. Theming & Branding (Option 2)
- **Tenant-level**: Full theme control (colors, logo, typography)
- **Organization-level**: Partial override (logo, primary color)
- **Extensible**: Database schema supports full org theming for future expansion

### 3. SSR-First Authentication
All authentication happens server-side using Supabase Auth. Client components receive user context as props from Server Components. This ensures security and enables proper SEO.

### 4. Service Layer Architecture
Business logic resides in service modules, not in UI components or API routes:
```
UI Components → API Routes → Services → Database
```

### 5. Modular Monolith
Single deployment with clear module boundaries. Modules are organized by domain (auth, content, progress) rather than technical layer.

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Hosting** | Vercel (recommended) |
| **Package Manager** | pnpm |

## Project Structure

```
leaderforge-dev/
├── .cursor/rules/       # AI assistant rules
├── docs/
│   ├── architecture/    # This directory
│   │   ├── adr/         # Architecture Decision Records
│   │   └── schemas/     # Database schema docs
│   ├── product/         # PRDs and requirements
│   └── design-system/   # Design system docs
├── apps/
│   └── web/             # Next.js application
│       ├── app/         # App Router pages
│       │   ├── (auth)/  # Auth route group
│       │   ├── (dashboard)/ # Main app routes
│       │   └── api/     # API routes
│       └── lib/         # App utilities
├── packages/
│   ├── database/        # Supabase types & utilities
│   ├── services/        # Business logic
│   └── ui/              # Shared UI components
├── supabase/
│   └── migrations/      # Database migrations
└── _archive/            # Previous codebase (reference)
```

## Database Architecture

### Schema Organization

| Schema | Purpose | Tables |
|--------|---------|--------|
| `core` | Platform fundamentals | tenants, organizations, teams, users, memberships |
| `content` | Learning content | items, courses, modules, entitlements |
| `progress` | User tracking | user_progress, completions, milestones |

### Key Design Patterns

1. **Tenant Scoping**: All tables include `tenant_id` foreign key
2. **RLS Policies**: Every user-facing table has row-level security
3. **Soft Deletes**: Use `deleted_at` timestamp instead of hard deletes
4. **Audit Fields**: All tables have `created_at`, `updated_at`

## API Design

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### Route Organization
```
/api/
├── auth/           # Authentication
├── tenants/        # Tenant management (admin)
├── organizations/  # Organization management
├── teams/          # Team management
├── users/          # User management
├── content/        # Content delivery
└── progress/       # Progress tracking
```

## Security Model

### Authentication
- Supabase Auth with SSR patterns
- JWT tokens with secure cookie storage
- Session refresh handling

### Authorization
- Role-based access control (RBAC)
- Tenant isolation via RLS
- Organization and team scoping

### Data Protection
- All data encrypted at rest (Supabase default)
- HTTPS for all connections
- No PII in application logs

## Related Documentation

- [Architecture Decision Records](./adr/) - Key decisions and rationale
- [Database Schemas](./schemas/) - Detailed schema documentation
- [Design System](../design-system/) - UI/UX standards
- [Product Requirements](../product/prds/) - Feature specifications

## Reference

The `_archive/` directory contains the previous Agent-Native Architecture (ANA) codebase. Useful patterns to reference:

| Pattern | Location |
|---------|----------|
| SSR Authentication | `_archive/apps/web/app/lib/supabaseServerClient.ts` |
| RLS Policies | `_archive/sql/` |
| Progress Tracking | `_archive/sql/create_universal_progress_table.sql` |
| Type Definitions | `_archive/apps/web/app/lib/types.ts` |
