# LeaderForge API Contracts

## Overview

LeaderForge uses a **thin API route** pattern where routes delegate to service layer functions. All APIs follow consistent response formats and error handling.

### Base URL
```
/api/v1/
```

### Authentication
All endpoints (except auth) require a valid Supabase session. Auth is handled via:
- Server-side session cookies (SSR)
- Bearer token in Authorization header (API calls)

### Response Format

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication API

### POST /api/v1/auth/login

Login with email and password.

**Request:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
  tenant_key?: string; // Optional, for tenant-specific login
}
```

**Response:**
```typescript
interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  tenant: {
    id: string;
    tenant_key: string;
    display_name: string;
    theme: TenantTheme;
  };
  organization: {
    id: string;
    name: string;
    branding: OrgBranding;
  } | null;
  role: 'member' | 'manager' | 'admin' | 'owner';
}
```

### POST /api/v1/auth/register

Register a new user (typically via invitation).

**Request:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  invitation_token?: string; // If registering via invitation
}
```

### POST /api/v1/auth/logout

Logout current session.

### POST /api/v1/auth/forgot-password

Request password reset.

**Request:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

### POST /api/v1/auth/reset-password

Reset password with token.

**Request:**
```typescript
interface ResetPasswordRequest {
  token: string;
  password: string;
}
```

### GET /api/v1/auth/session

Get current session info.

**Response:**
```typescript
interface SessionResponse {
  user: User;
  tenant: Tenant;
  organization: Organization | null;
  memberships: Membership[];
}
```

---

## Tenant API

### GET /api/v1/tenants/:tenantKey

Get tenant info (public, for theming).

**Response:**
```typescript
interface TenantResponse {
  id: string;
  tenant_key: string;
  display_name: string;
  theme: {
    logo_url: string | null;
    favicon_url: string | null;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text_primary: string;
    text_secondary: string;
    font_family: string;
    border_radius: string;
  };
}
```

---

## Organization API

### GET /api/v1/organizations

List organizations for current user's tenant (admin only).

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)

**Response:**
```typescript
interface OrganizationsResponse {
  organizations: Organization[];
  meta: { page: number; limit: number; total: number };
}
```

### GET /api/v1/organizations/:id

Get organization details.

**Response:**
```typescript
interface OrganizationResponse {
  id: string;
  tenant_id: string;
  name: string;
  branding: {
    logo_url: string | null;
    primary_color: string | null;
    display_name: string | null;
    use_tenant_theme: boolean;
  };
  settings: Record<string, unknown>;
  created_at: string;
  user_count: number;
  team_count: number;
}
```

### PUT /api/v1/organizations/:id

Update organization (admin/owner only).

**Request:**
```typescript
interface UpdateOrganizationRequest {
  name?: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    display_name?: string;
    use_tenant_theme?: boolean;
  };
  settings?: Record<string, unknown>;
}
```

---

## Team API

### GET /api/v1/teams

List teams in user's organization.

**Query Parameters:**
- `organization_id` (string, required)
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```typescript
interface TeamsResponse {
  teams: Team[];
  meta: { page: number; limit: number; total: number };
}
```

### POST /api/v1/teams

Create a new team (admin/owner only).

**Request:**
```typescript
interface CreateTeamRequest {
  organization_id: string;
  name: string;
  description?: string;
}
```

### GET /api/v1/teams/:id

Get team details.

**Response:**
```typescript
interface TeamResponse {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  member_count: number;
  members: TeamMember[];
  created_at: string;
}
```

### PUT /api/v1/teams/:id

Update team (manager/admin/owner).

**Request:**
```typescript
interface UpdateTeamRequest {
  name?: string;
  description?: string;
}
```

### DELETE /api/v1/teams/:id

Delete team (admin/owner only).

---

## User API

### GET /api/v1/users

List users in organization.

**Query Parameters:**
- `organization_id` (string, required)
- `team_id` (string, optional)
- `role` (string, optional)
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)

**Response:**
```typescript
interface UsersResponse {
  users: UserWithMembership[];
  meta: { page: number; limit: number; total: number };
}

interface UserWithMembership {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  membership: {
    role: string;
    team_id: string | null;
    team_name: string | null;
    is_active: boolean;
    created_at: string;
  };
  last_sign_in_at: string | null;
}
```

### GET /api/v1/users/:id

Get user details.

### PUT /api/v1/users/:id

Update user (self or admin).

**Request:**
```typescript
interface UpdateUserRequest {
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    email_digest?: 'daily' | 'weekly' | 'never';
  };
}
```

### PUT /api/v1/users/:id/role

Update user role (admin/owner only).

**Request:**
```typescript
interface UpdateRoleRequest {
  role: 'member' | 'manager' | 'admin';
  team_id?: string | null;
}
```

### DELETE /api/v1/users/:id/membership

Remove user from organization (admin/owner only).

---

## Invitation API

### GET /api/v1/invitations

List pending invitations (admin/owner).

**Query Parameters:**
- `organization_id` (string, required)
- `status` (string, optional): 'pending' | 'expired'

**Response:**
```typescript
interface InvitationsResponse {
  invitations: Invitation[];
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  team_id: string | null;
  team_name: string | null;
  invited_by: {
    id: string;
    full_name: string;
  };
  expires_at: string;
  created_at: string;
}
```

### POST /api/v1/invitations

Create invitation (admin/owner).

**Request:**
```typescript
interface CreateInvitationRequest {
  organization_id: string;
  email: string;
  role: 'member' | 'manager' | 'admin';
  team_id?: string;
  message?: string;
}
```

**Response:**
```typescript
interface CreateInvitationResponse {
  invitation: Invitation;
  invite_url: string;
}
```

### POST /api/v1/invitations/:token/accept

Accept invitation.

**Request:**
```typescript
interface AcceptInvitationRequest {
  password: string; // If new user
  full_name?: string;
}
```

### DELETE /api/v1/invitations/:id

Revoke invitation (admin/owner).

---

## Content API

### GET /api/v1/content

List content library.

**Query Parameters:**
- `type` (string, optional): 'video' | 'document' | 'course'
- `tags` (string[], optional)
- `search` (string, optional)
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `sort` (string, default: 'sort_order'): 'title' | 'created_at' | 'sort_order'

**Response:**
```typescript
interface ContentListResponse {
  items: ContentItem[];
  meta: { page: number; limit: number; total: number };
}

interface ContentItem {
  id: string;
  type: 'video' | 'document' | 'link' | 'course';
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[];
  // User's progress (if any)
  progress?: {
    percentage: number;
    completed: boolean;
    last_viewed_at: string;
  };
}
```

### GET /api/v1/content/:id

Get content details.

**Response:**
```typescript
interface ContentDetailResponse {
  id: string;
  type: 'video' | 'document' | 'link' | 'course';
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_url: string | null;
  duration_seconds: number | null;
  metadata: {
    // Video-specific
    video_id?: string;
    hls_url?: string;
    captions_url?: string;
    // Document-specific
    page_count?: number;
    file_type?: string;
  };
  tags: string[];
  progress: UserProgress | null;
}
```

### GET /api/v1/content/tribe/:collectionId

Fetch content from Tribe Social (proxy endpoint).

**Response:**
```typescript
interface TribeContentResponse {
  items: TribeContentItem[];
}

interface TribeContentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  thumbnail_url: string | null;
  video_url: string | null;
  published_date: string | null;
}
```

---

## Progress API

### GET /api/v1/progress

Get user's progress across all content.

**Query Parameters:**
- `content_type` (string, optional)
- `status` (string, optional): 'in_progress' | 'completed' | 'not_started'
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```typescript
interface ProgressListResponse {
  progress: UserProgressItem[];
  stats: {
    total_items: number;
    completed: number;
    in_progress: number;
    completion_rate: number;
  };
  meta: { page: number; limit: number; total: number };
}

interface UserProgressItem {
  content_id: string;
  content_title: string;
  content_type: string;
  progress_percentage: number;
  completed_at: string | null;
  last_viewed_at: string;
  metadata: Record<string, unknown>;
}
```

### GET /api/v1/progress/:contentId

Get progress for specific content.

**Response:**
```typescript
interface ProgressResponse {
  content_id: string;
  progress_type: string;
  progress_percentage: number;
  completion_count: number;
  total_sessions: number;
  started_at: string;
  last_viewed_at: string;
  completed_at: string | null;
  metadata: {
    // Video
    watch_time_seconds?: number;
    last_position_seconds?: number;
    // Document
    pages_viewed?: number[];
    scroll_position?: number;
  };
  bookmarked: boolean;
  notes: string | null;
}
```

### PUT /api/v1/progress/:contentId

Update progress for content.

**Request:**
```typescript
interface UpdateProgressRequest {
  progress_percentage: number;
  metadata?: {
    watch_time_seconds?: number;
    last_position_seconds?: number;
    pages_viewed?: number[];
    scroll_position?: number;
  };
  notes?: string;
  bookmarked?: boolean;
}
```

**Response:**
```typescript
interface UpdateProgressResponse {
  progress: ProgressResponse;
  streak: {
    current: number;
    is_new_day: boolean;
    milestone?: string; // '7-day', '30-day', etc.
  };
  points_earned: number;
}
```

### GET /api/v1/progress/team/:teamId

Get team progress (manager/admin).

**Response:**
```typescript
interface TeamProgressResponse {
  team: {
    id: string;
    name: string;
    member_count: number;
  };
  stats: {
    avg_completion_rate: number;
    total_completions: number;
    active_users: number;
  };
  members: TeamMemberProgress[];
}

interface TeamMemberProgress {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  items_completed: number;
  items_in_progress: number;
  completion_rate: number;
  last_activity: string | null;
  current_streak: number;
}
```

---

## Gamification API

### GET /api/v1/gamification/streak

Get current user's streak.

**Response:**
```typescript
interface StreakResponse {
  daily: {
    current: number;
    longest: number;
    last_activity: string | null;
    streak_start: string | null;
    at_risk: boolean; // True if no activity today
  };
  weekly: {
    current: number;
    longest: number;
    activities_this_week: number;
  };
  milestones: {
    achieved: string[]; // ['7-day', '30-day']
    next: string | null; // '100-day'
    progress: number; // 45 (days toward next)
  };
}
```

### GET /api/v1/gamification/leaderboard

Get leaderboard.

**Query Parameters:**
- `scope` (string, required): 'team' | 'organization'
- `period` (string, default: 'weekly'): 'weekly' | 'monthly' | 'all_time'
- `team_id` (string, required if scope=team)

**Response:**
```typescript
interface LeaderboardResponse {
  period: {
    type: string;
    start: string;
    end: string;
  };
  entries: LeaderboardEntry[];
  current_user: {
    rank: number;
    points: number;
    rank_change: number; // +2, -1, 0
  };
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  points: number;
  videos_completed: number;
  current_streak: number;
  is_current_user: boolean;
}
```

### GET /api/v1/gamification/points

Get user's points history.

**Query Parameters:**
- `period` (string, optional): 'week' | 'month' | 'all'
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```typescript
interface PointsResponse {
  total_points: number;
  points_this_week: number;
  rank: {
    org: number;
    team: number | null;
  };
  history: PointsEntry[];
  meta: { page: number; limit: number; total: number };
}

interface PointsEntry {
  id: string;
  points: number;
  reason: string;
  description: string;
  earned_at: string;
  source: {
    type: 'content' | 'streak' | 'achievement';
    id: string;
    name: string;
  } | null;
}
```

---

## Audit API (Admin Only)

### GET /api/v1/audit

Get audit log.

**Query Parameters:**
- `organization_id` (string, required)
- `action` (string, optional)
- `actor_id` (string, optional)
- `target_type` (string, optional)
- `from` (ISO date, optional)
- `to` (ISO date, optional)
- `page` (number, default: 1)
- `limit` (number, default: 50)

**Response:**
```typescript
interface AuditLogResponse {
  entries: AuditEntry[];
  meta: { page: number; limit: number; total: number };
}

interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}
```

---

## Service Layer Types

### Core Types

```typescript
interface Tenant {
  id: string;
  tenant_key: string;
  display_name: string;
  theme: TenantTheme;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  branding: OrgBranding;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Team {
  id: string;
  tenant_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  organization_id: string;
  team_id: string | null;
  role: 'member' | 'manager' | 'admin' | 'owner';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  content_id: string;
  progress_type: 'video' | 'document' | 'quiz' | 'course' | 'custom';
  progress_percentage: number;
  completion_count: number;
  total_sessions: number;
  started_at: string;
  last_viewed_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  bookmarked: boolean;
  created_at: string;
  updated_at: string;
}
```

### Theme Types

```typescript
interface TenantTheme {
  logo_url: string | null;
  favicon_url: string | null;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text_primary: string;
  text_secondary: string;
  font_family: string;
  border_radius: string;
}

interface OrgBranding {
  logo_url: string | null;
  primary_color: string | null;
  display_name: string | null;
  use_tenant_theme: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  email_digest: 'daily' | 'weekly' | 'never';
}
```

---

## Rate Limiting

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Auth endpoints | 10/min |
| Read endpoints | 100/min |
| Write endpoints | 30/min |
| Progress updates | 60/min |

---

## Versioning

API versioning is done via URL path (`/api/v1/`). Breaking changes will increment the version number. Non-breaking additions are allowed within a version.

---

## Implementation Notes

### Service Layer Pattern

```typescript
// Example: Get content list
// Route: apps/web/app/api/v1/content/route.ts
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }
  
  // Delegate to service
  const result = await contentService.listContent({
    userId: session.user.id,
    ...parseQueryParams(request),
  });
  
  return NextResponse.json({ success: true, data: result });
}
```

### Error Handling

```typescript
// packages/services/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

// Usage
throw new ApiError('NOT_FOUND', 'Content not found', 404);
```

