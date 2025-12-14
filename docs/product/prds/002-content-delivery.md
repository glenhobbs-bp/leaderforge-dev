# PRD-002: Content Delivery

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Content Delivery |
| **Status** | Draft |
| **Priority** | P0 (MVP Required) |
| **Owner** | Content Team |
| **Dependencies** | PRD-001 (Multi-Tenant Foundation) |

## Problem Statement

Users need to access learning content (videos, documents) through the platform. Content must be:

- Organized into a browsable library
- Playable with progress tracking (for videos)
- Access-controlled based on entitlements
- Scoped to tenant context

## User Stories

### As a Learner
- I want to browse available content in a library view
- I want to watch videos with a reliable player
- I want to resume videos where I left off
- I want to see my progress on each content item
- I want to mark content as complete

### As a Content Manager (Tenant Admin)
- I want to add content to the library
- I want to organize content into categories
- I want to assign content to organizations via entitlements
- I want to see which content is most viewed

### As an Organization Admin
- I want to see what content my organization has access to
- I want to view content engagement metrics for my org

## Requirements

### Functional Requirements

#### FR-1: Content Library
- [ ] Display content items in a grid/list view
- [ ] Filter by type (video, document, course)
- [ ] Filter by category/tag
- [ ] Search by title/description
- [ ] Sort by date, title, popularity

#### FR-2: Content Items
- [ ] Support content types: video, document (PDF), link
- [ ] Content has: title, description, thumbnail, duration
- [ ] Content belongs to a tenant
- [ ] Content can be categorized with tags

#### FR-3: Video Player
- [ ] Embedded video player (YouTube, Vimeo, or self-hosted)
- [ ] Play/pause, seek, volume controls
- [ ] Fullscreen support
- [ ] Quality selection (if supported by source)
- [ ] Resume from last position
- [ ] Track watch time and completion

#### FR-4: Content Access Control
- [ ] Content access controlled by entitlements
- [ ] Entitlements assigned at organization level
- [ ] Users see only content they have access to
- [ ] Graceful handling of no-access scenarios

#### FR-5: Content Detail View
- [ ] Show content metadata (title, description, duration)
- [ ] Show progress status (not started, in progress, completed)
- [ ] Related content suggestions (future)
- [ ] Download option for documents

### Non-Functional Requirements

#### NFR-1: Performance
- Content library loads in < 2 seconds
- Video starts playing in < 3 seconds
- Thumbnail images optimized and cached

#### NFR-2: Reliability
- Video player handles network interruptions gracefully
- Progress saves automatically (no manual save needed)
- Offline indicator when connection lost

#### NFR-3: Accessibility
- Video player keyboard accessible
- Captions/subtitles support (if available)
- Screen reader compatible library view

## Data Model

### Content Tables

```
content.items
├── id (UUID, PK)
├── tenant_id (UUID, FK → tenants)
├── type (TEXT: video, document, link)
├── title (TEXT)
├── description (TEXT)
├── thumbnail_url (TEXT)
├── content_url (TEXT) -- video URL or document URL
├── duration_seconds (INTEGER) -- for videos
├── metadata (JSONB) -- type-specific data
├── tags (TEXT[])
├── is_active (BOOLEAN)
├── created_at, updated_at

content.entitlements
├── id (UUID, PK)
├── tenant_id (UUID, FK)
├── name (TEXT)
├── description (TEXT)
├── created_at, updated_at

content.entitlement_assignments
├── id (UUID, PK)
├── tenant_id (UUID, FK)
├── entitlement_id (UUID, FK → entitlements)
├── organization_id (UUID, FK → organizations)
├── granted_at (TIMESTAMPTZ)
├── revoked_at (TIMESTAMPTZ, nullable)

content.content_entitlements
├── id (UUID, PK)
├── content_id (UUID, FK → items)
├── entitlement_id (UUID, FK → entitlements)
├── created_at
```

## UI/UX Requirements

### Content Library Page
- Grid of content cards with thumbnails
- Each card shows: thumbnail, title, type icon, duration, progress indicator
- Filter sidebar (type, category)
- Search bar
- Responsive: 1 column mobile, 2-3 columns tablet, 4 columns desktop

### Content Card Component
```
┌─────────────────────────┐
│    [Thumbnail Image]    │
│    ▶ (play overlay)     │
├─────────────────────────┤
│ [Video] 15:30           │
│ Content Title Here      │
│ ████████░░ 75%         │
└─────────────────────────┘
```

### Video Player Page
- Large video player (16:9 aspect ratio)
- Content title and description below
- Progress indicator
- "Mark Complete" button (if not auto-completed)
- Back to library navigation

### Empty States
- No content: "No content available. Check back soon!"
- No access: "You don't have access to this content."
- Loading: Skeleton cards

## Success Metrics

| Metric | Target |
|--------|--------|
| Content library load time | < 2 seconds |
| Video start time | < 3 seconds |
| Progress save reliability | > 99.9% |
| User engagement (videos started) | Track baseline |

## Dependencies

- PRD-001: Multi-Tenant Foundation (tenant context, entitlements)
- PRD-003: Progress Tracking (progress persistence)
- Video hosting (YouTube, Vimeo, or Supabase Storage)

## Content Management System

### MVP: Tribe Social Integration

For MVP, content is hosted on **Tribe Social** and accessed via their API:

| Config | Value |
|--------|-------|
| API URL | `https://edge.tribesocial.io` |
| CDN URL | `https://cdn.tribesocial.io` |
| Auth | Cookie-based token |
| LeaderForge Collection | `99735660` |

**Environment Variables:**
```bash
TRIBE_SOCIAL_API_URL=https://edge.tribesocial.io
TRIBE_SOCIAL_TOKEN=<your_token>
```

### Future: Supabase-Hosted Content

Post-MVP, content may migrate to Supabase storage with:
- Direct video hosting (Supabase Storage or external CDN)
- Full content management UI
- Transcription and embedding support for AI features

## Content Ownership Architecture

> **Note**: See [PRD-005: Content Marketplace](./005-content-marketplace.md) for full content ownership model.

For MVP, all content is **LeaderForge platform content** (via Tribe). However, the database schema is designed to support:

| Phase | Content Source | Implementation |
|-------|----------------|----------------|
| **MVP** | LeaderForge platform | `owner_type = 'platform'` |
| **Phase 2** | Tenant-created | `owner_type = 'tenant'` |
| **Phase 3** | Marketplace licensed | Via `content.licenses` table |

The `content.items` table includes `owner_type` and `owner_tenant_id` fields from day 1 to enable future phases without schema migration.

## Out of Scope (MVP)

- Course/module organization (content grouping)
- SCORM package support
- Interactive content (quizzes within videos)
- Content upload UI (admin adds via database initially)
- Comments/discussions on content
- Content recommendations
- Tenant-created content (Phase 2)
- Content marketplace (Phase 3)

## Open Questions

1. Video hosting strategy: YouTube embeds, Vimeo, or self-hosted?
2. Should we support offline viewing (PWA)?
3. How to handle very long videos (chapters/segments)?

## Timeline

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| Design | UI mockups, API contracts | 1 week |
| Build | Content tables, services | 1 week |
| Build | Content library UI | 1 week |
| Build | Video player integration | 1 week |
| Test | QA, performance testing | 1 week |

