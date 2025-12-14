# LeaderForge Database Schema

## Overview

LeaderForge uses Supabase (PostgreSQL) with a multi-schema organization:

| Schema | Purpose |
|--------|---------|
| `core` | Platform fundamentals: tenants, orgs, teams, users |
| `content` | Learning content: items, entitlements, licenses |
| `progress` | User tracking: progress, completions |

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CORE SCHEMA                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                       │
│  │   tenants    │                                                       │
│  ├──────────────┤                                                       │
│  │ id           │◄─────────────────────────────────────────────┐       │
│  │ tenant_key   │                                               │       │
│  │ display_name │                                               │       │
│  │ theme        │                                               │       │
│  └──────────────┘                                               │       │
│         │                                                        │       │
│         │ 1:N                                                    │       │
│         ▼                                                        │       │
│  ┌──────────────┐         ┌──────────────┐                     │       │
│  │ organizations│         │    users     │                     │       │
│  ├──────────────┤         ├──────────────┤                     │       │
│  │ id           │◄───┐    │ id           │◄──────────┐        │       │
│  │ tenant_id    │────┘    │ tenant_id    │───────────┼────────┘       │
│  │ name         │         │ email        │           │                 │
│  │ branding     │         │ full_name    │           │                 │
│  └──────────────┘         │ avatar_url   │           │                 │
│         │                 └──────────────┘           │                 │
│         │ 1:N                    │                   │                 │
│         ▼                        │                   │                 │
│  ┌──────────────┐                │                   │                 │
│  │    teams     │                │                   │                 │
│  ├──────────────┤                │                   │                 │
│  │ id           │◄───────────────┼───────────────────┤                 │
│  │ tenant_id    │                │                   │                 │
│  │ org_id       │                │                   │                 │
│  │ name         │                │                   │                 │
│  └──────────────┘                │                   │                 │
│         │                        │                   │                 │
│         └────────────────────────┼───────────────────┘                 │
│                                  │                                      │
│                                  ▼                                      │
│                          ┌──────────────┐                              │
│                          │ memberships  │                              │
│                          ├──────────────┤                              │
│                          │ id           │                              │
│                          │ tenant_id    │                              │
│                          │ user_id      │                              │
│                          │ org_id       │                              │
│                          │ team_id      │                              │
│                          │ role         │                              │
│                          └──────────────┘                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            CONTENT SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐   │
│  │    items     │         │ entitlements │         │   licenses   │   │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤   │
│  │ id           │◄───────►│ id           │◄───────►│ id           │   │
│  │ tenant_id    │         │ tenant_id    │         │ content_id   │   │
│  │ owner_type   │         │ name         │         │ licensor_id  │   │
│  │ owner_tenant │         │ description  │         │ licensee_id  │   │
│  │ type         │         └──────────────┘         │ status       │   │
│  │ title        │                │                 └──────────────┘   │
│  │ content_url  │                │                                     │
│  │ visibility   │                ▼                                     │
│  └──────────────┘         ┌──────────────┐                            │
│                           │ assignments  │                            │
│                           ├──────────────┤                            │
│                           │ entitlement  │                            │
│                           │ org_id       │                            │
│                           └──────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            PROGRESS SCHEMA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐                                               │
│  │    user_progress     │                                               │
│  ├──────────────────────┤                                               │
│  │ id                   │                                               │
│  │ tenant_id            │                                               │
│  │ user_id              │                                               │
│  │ content_id           │                                               │
│  │ progress_type        │                                               │
│  │ progress_percentage  │                                               │
│  │ metadata             │                                               │
│  │ completed_at         │                                               │
│  └──────────────────────┘                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Schema

### core.tenants

Platform tenants (training providers like i49 Group).

```sql
CREATE TABLE core.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT UNIQUE NOT NULL,  -- URL-safe slug (e.g., 'i49-group')
  display_name TEXT NOT NULL,
  
  -- Theming (full control)
  theme JSONB DEFAULT '{}'::jsonb,
  /*
    theme: {
      logo_url, favicon_url,
      primary, secondary, accent,
      background, surface,
      text_primary, text_secondary,
      font_family, border_radius
    }
  */
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_key ON core.tenants(tenant_key);
```

### core.organizations

Customer companies within a tenant.

```sql
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  
  -- Branding overrides (partial)
  branding JSONB DEFAULT '{}'::jsonb,
  /*
    branding: {
      logo_url,
      primary_color,
      display_name,
      use_tenant_theme: true/false
    }
  */
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_tenant ON core.organizations(tenant_id);
```

### core.teams

Groups within organizations.

```sql
CREATE TABLE core.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_org ON core.teams(organization_id);
CREATE INDEX idx_teams_tenant ON core.teams(tenant_id);
```

### core.users

Platform users (extends Supabase auth.users).

```sql
CREATE TABLE core.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  
  -- Profile
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON core.users(tenant_id);
CREATE INDEX idx_users_email ON core.users(email);
```

### core.memberships

User membership in organizations and teams with roles.

```sql
CREATE TABLE core.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL,
  
  -- Role
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'manager', 'admin', 'owner')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User can only have one membership per org
  UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_memberships_user ON core.memberships(user_id);
CREATE INDEX idx_memberships_org ON core.memberships(organization_id);
CREATE INDEX idx_memberships_team ON core.memberships(team_id);
CREATE INDEX idx_memberships_tenant ON core.memberships(tenant_id);
```

### core.invitations

User invitations to organizations.

```sql
CREATE TABLE core.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'manager', 'admin')),
  team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL,
  
  -- Invitation details
  invited_by UUID NOT NULL REFERENCES core.users(id),
  token TEXT UNIQUE NOT NULL,  -- Secure random token
  
  -- Status
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON core.invitations(token);
CREATE INDEX idx_invitations_email ON core.invitations(email);
CREATE INDEX idx_invitations_org ON core.invitations(organization_id);
```

### core.audit_log

Admin action audit trail.

```sql
CREATE TABLE core.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  organization_id UUID REFERENCES core.organizations(id),
  
  -- Actor
  actor_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Action
  action TEXT NOT NULL,  -- e.g., 'user.invited', 'team.created'
  target_type TEXT NOT NULL,  -- e.g., 'user', 'team', 'organization'
  target_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON core.audit_log(tenant_id);
CREATE INDEX idx_audit_org ON core.audit_log(organization_id);
CREATE INDEX idx_audit_actor ON core.audit_log(actor_id);
CREATE INDEX idx_audit_created ON core.audit_log(created_at DESC);
```

---

## Content Schema

### content.items

Learning content (videos, documents, etc.).

```sql
CREATE TABLE content.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  
  -- Ownership (for marketplace - Phase 2/3)
  owner_type TEXT NOT NULL DEFAULT 'platform'
    CHECK (owner_type IN ('platform', 'tenant')),
  owner_tenant_id UUID REFERENCES core.tenants(id),
  
  -- Content metadata
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'link', 'course')),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  duration_seconds INTEGER,  -- For videos
  
  -- Extended metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Marketplace (Phase 3)
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'licensable')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT owner_tenant_required 
    CHECK (owner_type = 'platform' OR owner_tenant_id IS NOT NULL)
);

CREATE INDEX idx_content_tenant ON content.items(tenant_id);
CREATE INDEX idx_content_type ON content.items(type);
CREATE INDEX idx_content_owner ON content.items(owner_type, owner_tenant_id);
CREATE INDEX idx_content_tags ON content.items USING GIN(tags);
```

### content.entitlements

Named access packages for content.

```sql
CREATE TABLE content.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entitlements_tenant ON content.entitlements(tenant_id);
```

### content.content_entitlements

Links content to entitlements.

```sql
CREATE TABLE content.content_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES content.entitlements(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (content_id, entitlement_id)
);

CREATE INDEX idx_content_ent_content ON content.content_entitlements(content_id);
CREATE INDEX idx_content_ent_ent ON content.content_entitlements(entitlement_id);
```

### content.entitlement_assignments

Assigns entitlements to organizations.

```sql
CREATE TABLE content.entitlement_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  entitlement_id UUID NOT NULL REFERENCES content.entitlements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Status
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  UNIQUE (entitlement_id, organization_id)
);

CREATE INDEX idx_ent_assign_org ON content.entitlement_assignments(organization_id);
CREATE INDEX idx_ent_assign_ent ON content.entitlement_assignments(entitlement_id);
```

### content.licenses (Phase 3 - Marketplace)

Content licensing between tenants.

```sql
CREATE TABLE content.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  
  -- Parties
  licensor_tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  licensee_tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  
  -- License terms
  license_type TEXT NOT NULL DEFAULT 'perpetual'
    CHECK (license_type IN ('perpetual', 'subscription')),
  price_paid_cents INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_licenses_content ON content.licenses(content_id);
CREATE INDEX idx_licenses_licensor ON content.licenses(licensor_tenant_id);
CREATE INDEX idx_licenses_licensee ON content.licenses(licensee_tenant_id);
```

---

## Progress Schema

### progress.user_progress

Universal progress tracking for all content types.

```sql
CREATE TABLE progress.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content.items(id) ON DELETE CASCADE,
  
  -- Progress type
  progress_type TEXT NOT NULL DEFAULT 'video'
    CHECK (progress_type IN ('video', 'document', 'quiz', 'course', 'custom')),
  
  -- Progress data
  progress_percentage INTEGER DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_count INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Type-specific metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  /*
    video: { watch_time_seconds, last_position_seconds }
    document: { pages_viewed, scroll_position }
    quiz: { score, answers }
  */
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One progress record per user/content
  UNIQUE (user_id, content_id, tenant_id)
);

CREATE INDEX idx_progress_user ON progress.user_progress(user_id);
CREATE INDEX idx_progress_content ON progress.user_progress(content_id);
CREATE INDEX idx_progress_tenant ON progress.user_progress(tenant_id);
CREATE INDEX idx_progress_completed ON progress.user_progress(completed_at) 
  WHERE completed_at IS NOT NULL;
CREATE INDEX idx_progress_metadata ON progress.user_progress USING GIN(metadata);
```

---

## Row Level Security Policies

### Core Schema RLS

```sql
-- Enable RLS on all tables
ALTER TABLE core.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant's data
CREATE POLICY "tenant_isolation" ON core.organizations
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_isolation" ON core.teams
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

-- Users can see other users in their org
CREATE POLICY "org_users_visible" ON core.users
  FOR SELECT USING (
    id IN (
      SELECT m2.user_id FROM core.memberships m1
      JOIN core.memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.user_id = auth.uid()
    )
    OR id = auth.uid()
  );

-- Users can update their own profile
CREATE POLICY "own_profile_update" ON core.users
  FOR UPDATE USING (id = auth.uid());

-- Memberships visible within org
CREATE POLICY "org_memberships_visible" ON core.memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM core.memberships WHERE user_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "service_role_all" ON core.tenants
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON core.organizations
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON core.teams
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON core.users
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON core.memberships
  FOR ALL TO service_role USING (true);
```

### Content Schema RLS

```sql
ALTER TABLE content.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.content_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.entitlement_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.licenses ENABLE ROW LEVEL SECURITY;

-- Users can see content they're entitled to
CREATE POLICY "entitled_content_access" ON content.items
  FOR SELECT USING (
    -- Platform content with entitlement
    (owner_type = 'platform' AND EXISTS (
      SELECT 1 FROM content.content_entitlements ce
      JOIN content.entitlement_assignments ea ON ce.entitlement_id = ea.entitlement_id
      JOIN core.memberships m ON ea.organization_id = m.organization_id
      WHERE ce.content_id = content.items.id
      AND m.user_id = auth.uid()
      AND ea.revoked_at IS NULL
    ))
    OR
    -- Tenant's own content
    (owner_type = 'tenant' AND owner_tenant_id IN (
      SELECT tenant_id FROM core.memberships WHERE user_id = auth.uid()
    ))
    OR
    -- Licensed content (Phase 3)
    (visibility = 'licensable' AND EXISTS (
      SELECT 1 FROM content.licenses l
      JOIN core.memberships m ON l.licensee_tenant_id = m.tenant_id
      WHERE l.content_id = content.items.id
      AND m.user_id = auth.uid()
      AND l.status = 'active'
    ))
  );

-- Service role bypass
CREATE POLICY "service_role_all" ON content.items
  FOR ALL TO service_role USING (true);
```

### Progress Schema RLS

```sql
ALTER TABLE progress.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own progress
CREATE POLICY "own_progress" ON progress.user_progress
  FOR ALL USING (user_id = auth.uid());

-- Managers can view team progress
CREATE POLICY "team_progress_view" ON progress.user_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM core.memberships m1
      JOIN core.memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.user_id = auth.uid()
      AND m1.role IN ('manager', 'admin', 'owner')
      AND m2.user_id = progress.user_progress.user_id
    )
  );

-- Service role bypass
CREATE POLICY "service_role_all" ON progress.user_progress
  FOR ALL TO service_role USING (true);
```

---

## Triggers & Functions

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON core.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON content.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON content.entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timestamp BEFORE UPDATE ON progress.user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Create user record on auth signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: tenant_id must be provided during signup or set later
  INSERT INTO core.users (id, email, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'tenant_id')::uuid,
      (SELECT id FROM core.tenants LIMIT 1)  -- Fallback for dev
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Migration Order

Execute migrations in this order:

1. `001_create_schemas.sql` - Create schemas
2. `002_core_tenants.sql` - Tenants table
3. `003_core_organizations.sql` - Organizations table
4. `004_core_teams.sql` - Teams table
5. `005_core_users.sql` - Users table
6. `006_core_memberships.sql` - Memberships table
7. `007_core_invitations.sql` - Invitations table
8. `008_core_audit_log.sql` - Audit log table
9. `009_content_items.sql` - Content items table
10. `010_content_entitlements.sql` - Entitlements tables
11. `011_content_licenses.sql` - Licenses table (Phase 3 ready)
12. `012_progress.sql` - Progress table
13. `013_rls_policies.sql` - All RLS policies
14. `014_triggers.sql` - Triggers and functions
15. `015_seed_data.sql` - Initial seed data

---

## Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| tenants | tenant_key | Lookup by slug |
| organizations | tenant_id | Tenant filtering |
| teams | organization_id | Org filtering |
| users | tenant_id, email | Tenant filtering, email lookup |
| memberships | user_id, organization_id, team_id | Relationship queries |
| content.items | tenant_id, type, owner, tags | Content queries |
| progress | user_id, content_id, completed_at | Progress queries |

---

## 4-Step Module Completion Schema (PRD-008)

The following tables support the 4-step module completion workflow:
Video → Worksheet → Check-in → Bold Action Signoff

### core.memberships (Updated)

Add manager/coach relationships for check-in workflow:

```sql
ALTER TABLE core.memberships ADD COLUMN manager_id UUID REFERENCES core.users(id);
ALTER TABLE core.memberships ADD COLUMN coach_id UUID REFERENCES core.users(id);

-- manager_id: User's direct manager (default team leader)
-- coach_id: Optional explicit coach override

CREATE INDEX idx_memberships_manager ON core.memberships(manager_id);
```

### core.organizations (Settings Extension)

```sql
-- Add to organizations.settings JSONB:
{
  "bold_action_signoff": "self",  -- 'self' (default) or 'leader'
  "checkin_duration_minutes": 5    -- Default check-in duration
}
```

### progress.worksheet_submissions

Worksheet responses including Bold Action commitments.

```sql
CREATE TABLE progress.worksheet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  
  -- Worksheet responses
  responses JSONB NOT NULL DEFAULT '{}',
  /*
    responses: {
      key_takeaways: "...",
      bold_action: "...",
      questions: "..."
    }
  */
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_worksheet UNIQUE (user_id, content_id)
);

CREATE INDEX idx_worksheet_user_content ON progress.worksheet_submissions(user_id, content_id);
```

### progress.bold_actions

Bold Action commitments and completion tracking.

```sql
CREATE TABLE progress.bold_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  
  -- The committed action (copied from worksheet for tracking)
  action_description TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Timestamps
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Signoff tracking
  signoff_type TEXT CHECK (signoff_type IN ('self', 'leader')),
  signed_off_by UUID REFERENCES auth.users(id),
  signed_off_at TIMESTAMPTZ,
  
  -- Optional notes
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_bold_action UNIQUE (user_id, content_id)
);

CREATE INDEX idx_bold_actions_user ON progress.bold_actions(user_id);
CREATE INDEX idx_bold_actions_status ON progress.bold_actions(status);
CREATE INDEX idx_bold_actions_leader ON progress.bold_actions(signed_off_by);
```

### progress.checkin_requests

Team leader check-in requests with calendar integration.

```sql
CREATE TABLE progress.checkin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES auth.users(id),
  content_id TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled')),
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Calendar integration (Phase 2)
  calendar_event_id TEXT,
  calendar_provider TEXT CHECK (calendar_provider IN ('google', 'outlook')),
  
  -- Notes
  leader_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_checkin UNIQUE (user_id, content_id)
);

CREATE INDEX idx_checkins_user ON progress.checkin_requests(user_id);
CREATE INDEX idx_checkins_leader ON progress.checkin_requests(leader_id);
CREATE INDEX idx_checkins_status ON progress.checkin_requests(status);
```

### RLS Policies for 4-Step Workflow

```sql
-- Worksheet submissions
ALTER TABLE progress.worksheet_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own worksheets" ON progress.worksheet_submissions
  FOR ALL USING (user_id = auth.uid());

-- Bold actions - users can view, managers can also view their reports
ALTER TABLE progress.bold_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bold actions" ON progress.bold_actions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Leaders can view team bold actions" ON progress.bold_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM core.memberships m
      WHERE m.manager_id = auth.uid()
      AND m.user_id = progress.bold_actions.user_id
    )
  );

-- Check-in requests
ALTER TABLE progress.checkin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checkin requests" ON progress.checkin_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Leaders can manage checkins as leader" ON progress.checkin_requests
  FOR ALL USING (leader_id = auth.uid());
```

---

## Notes

### MVP Scope
- All tables created but some features deferred
- `content.licenses` table exists but unused until Phase 3
- `owner_type` always 'platform' in MVP
- `visibility` always 'private' in MVP
- **4-Step Workflow MVP**: Video, Worksheet, Check-in (manual), Self-Signoff
- **4-Step Workflow Phase 2**: Leader dashboards, calendar integration

### Cherry-Picked from Archive
- Progress schema based on `_archive/sql/create_universal_progress_table.sql`
- RLS patterns from `_archive/sql/*.sql`

