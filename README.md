# LeaderForge LMS

A multi-tenant Learning Management System for leadership development.

## Architecture

**Multi-Tenant Hierarchy:**
```
Platform (LeaderForge)
└── Tenant (e.g., i49 Group)
    └── Organization (Customer Company)
        └── Team (Department/Group)
            └── User (Employee)
```

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI Components:** shadcn/ui
- **Package Manager:** pnpm

## Project Structure

```
leaderforge-dev/
├── .cursor/rules/       # Cursor AI rules
├── docs/                # Documentation
│   ├── architecture/    # Architecture docs & ADRs
│   ├── product/         # PRDs
│   └── design-system/   # Design system
├── apps/
│   └── web/             # Next.js application
├── packages/
│   ├── database/        # Supabase types & utilities
│   ├── ui/              # Shared UI components
│   └── services/        # Business logic
├── supabase/
│   └── migrations/      # Database migrations
├── _archive/            # Archived previous codebase (reference)
└── TASKS.md             # Implementation task list
```

## Getting Started

> 🚧 **Work in Progress** - See `TASKS.md` for implementation status.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Documentation

- [Task List](./TASKS.md) - Implementation progress
- [Architecture](./docs/architecture/) - Architecture decisions
- [PRDs](./docs/product/prds/) - Product requirements

## Archive Reference

The `_archive/` directory contains the previous Agent-Native Architecture (ANA) codebase. Key patterns to reference:

| Pattern | Location |
|---------|----------|
| SSR Authentication | `_archive/apps/web/app/lib/supabaseServerClient.ts` |
| RLS Policies | `_archive/sql/` |
| Progress Tracking | `_archive/sql/create_universal_progress_table.sql` |
| Type Definitions | `_archive/apps/web/app/lib/types.ts` |

---

**Status:** Foundation Phase - See [TASKS.md](./TASKS.md)

