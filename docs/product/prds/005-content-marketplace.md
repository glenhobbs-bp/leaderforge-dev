# PRD-005: Content Marketplace & Licensing

## Overview

| Field | Value |
|-------|-------|
| **Feature** | Content Marketplace & Licensing |
| **Status** | Draft |
| **Priority** | P1 (Post-MVP) |
| **Owner** | Platform Team |
| **Dependencies** | PRD-001, PRD-002 |

## Executive Summary

LeaderForge content can come from three sources:
1. **LeaderForge Platform** - Base content provided by LeaderForge
2. **Tenant-Created** - Content created by tenants for their organizations
3. **Marketplace** - Content licensed from other tenants

This PRD defines the architecture to support all three sources while enabling phased implementation.

## Implementation Phases

| Phase | Scope | Timeline |
|-------|-------|----------|
| **MVP** | LeaderForge content only | Phase 3 Build |
| **Phase 2** | + Tenant-created content | Post-MVP |
| **Phase 3** | + Marketplace licensing | Future |

> **Architecture Note**: Database schema and services will be designed to support all phases from day 1 to avoid future refactoring.

---

## Phase 1: LeaderForge Content (MVP)

### Scope
- All content owned and managed by LeaderForge platform
- Tenants license content from LeaderForge
- Content entitled to organizations via entitlement system

### User Stories
- As a **Tenant Admin**, I want to see available LeaderForge content
- As a **Tenant Admin**, I want to assign LeaderForge content to my organizations
- As a **Learner**, I want to access content my organization is entitled to

### Data Model (MVP)
```sql
content.items
├── id (UUID, PK)
├── owner_type ('platform') -- Only 'platform' in MVP
├── owner_tenant_id (NULL) -- Always NULL in MVP
├── tenant_id (UUID, FK) -- For tenant-scoped visibility
├── title, description, type, etc.
├── is_active (BOOLEAN)
```

---

## Phase 2: Tenant-Created Content

### Scope
- Tenants can create their own content
- Tenant content only visible to that tenant's organizations
- No cross-tenant sharing yet

### User Stories
- As a **Tenant Admin**, I want to upload my own training content
- As a **Tenant Admin**, I want to manage my content library
- As a **Tenant Admin**, I want to mix LeaderForge and my own content
- As a **Learner**, I want to see all content I have access to (regardless of source)

### Data Model Additions
```sql
content.items
├── owner_type ('platform' | 'tenant')
├── owner_tenant_id (UUID, FK) -- Set when owner_type = 'tenant'
├── visibility ('private' | 'licensable') -- For Phase 3 readiness
```

### UI/UX
- Content library shows source indicator (LeaderForge logo vs tenant name)
- Tenant admin has "My Content" section for management
- Upload interface for videos/documents

---

## Phase 3: Marketplace (Future)

### Scope
- Tenants can license content to other tenants
- Content discovery and marketplace UI
- Revenue sharing model
- License management

### User Stories
- As a **Tenant Admin**, I want to browse marketplace content
- As a **Tenant Admin**, I want to license content from other tenants
- As a **Content Creator**, I want to list my content on the marketplace
- As a **Content Creator**, I want to earn revenue from my content
- As **LeaderForge**, I want to facilitate content licensing and take a platform fee

### Data Model Additions
```sql
content.items
├── visibility ('private' | 'licensable')
├── marketplace_listing_id (UUID, FK) -- If listed on marketplace

content.marketplace_listings
├── id (UUID, PK)
├── content_id (UUID, FK → items)
├── seller_tenant_id (UUID, FK)
├── title, description (marketplace-specific)
├── pricing_model ('free' | 'one_time' | 'subscription')
├── price_cents (INTEGER)
├── is_active (BOOLEAN)
├── created_at, updated_at

content.licenses
├── id (UUID, PK)
├── content_id (UUID, FK → items)
├── listing_id (UUID, FK → marketplace_listings)
├── licensor_tenant_id (UUID, FK) -- Who owns it
├── licensee_tenant_id (UUID, FK) -- Who's using it
├── license_type ('perpetual' | 'subscription')
├── price_paid_cents (INTEGER)
├── granted_at (TIMESTAMPTZ)
├── expires_at (TIMESTAMPTZ, nullable)
├── revoked_at (TIMESTAMPTZ, nullable)
├── status ('active' | 'expired' | 'revoked')

content.license_transactions
├── id (UUID, PK)
├── license_id (UUID, FK)
├── transaction_type ('purchase' | 'renewal' | 'refund')
├── amount_cents (INTEGER)
├── platform_fee_cents (INTEGER)
├── seller_payout_cents (INTEGER)
├── processed_at (TIMESTAMPTZ)
```

### Marketplace UI
- Browse/search marketplace content
- Content detail pages with licensing options
- "My Purchases" for licensee tenants
- "My Listings" for licensor tenants
- Sales dashboard for content creators

### Business Model
| Party | Revenue Share |
|-------|---------------|
| Content Creator (Tenant) | 70-80% |
| LeaderForge Platform | 20-30% |

---

## Complete Data Model (All Phases)

### content.items (Full Schema)
```sql
CREATE TABLE content.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (Phase 1+)
  owner_type TEXT NOT NULL DEFAULT 'platform'
    CHECK (owner_type IN ('platform', 'tenant')),
  owner_tenant_id UUID REFERENCES core.tenants(id),
  
  -- Tenant scope (for RLS)
  tenant_id UUID NOT NULL REFERENCES core.tenants(id),
  
  -- Content metadata
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'link', 'course')),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  
  -- Marketplace (Phase 3)
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'licensable')),
  marketplace_listing_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT owner_tenant_required 
    CHECK (owner_type = 'platform' OR owner_tenant_id IS NOT NULL)
);
```

### Content Access Resolution

```typescript
/**
 * Determines if a user can access content.
 * Supports all phases of content ownership.
 */
async function canAccessContent(
  userId: string,
  contentId: string,
  userTenantId: string,
  userOrgId: string
): Promise<boolean> {
  const content = await getContent(contentId);
  
  // Phase 1: Platform content - check entitlements
  if (content.owner_type === 'platform') {
    return await hasEntitlement(userOrgId, contentId);
  }
  
  // Phase 2: Tenant's own content - same tenant check
  if (content.owner_tenant_id === userTenantId) {
    return await hasEntitlement(userOrgId, contentId);
  }
  
  // Phase 3: Licensed content - check active license
  const license = await getActiveLicense(contentId, userTenantId);
  if (license) {
    return await hasEntitlement(userOrgId, contentId);
  }
  
  return false;
}
```

---

## RLS Policies

### Phase 1 (MVP)
```sql
-- Users see platform content entitled to their org
CREATE POLICY "platform_content_access" ON content.items
  FOR SELECT USING (
    owner_type = 'platform'
    AND EXISTS (
      SELECT 1 FROM content.entitlement_assignments ea
      JOIN core.memberships m ON m.organization_id = ea.organization_id
      WHERE m.user_id = auth.uid()
      AND ea.content_id = id
    )
  );
```

### Phase 2 Addition
```sql
-- Tenant admins see their own tenant's content
CREATE POLICY "tenant_content_owner_access" ON content.items
  FOR ALL USING (
    owner_type = 'tenant'
    AND owner_tenant_id IN (
      SELECT tenant_id FROM core.memberships
      WHERE user_id = auth.uid()
    )
  );
```

### Phase 3 Addition
```sql
-- Licensed content access
CREATE POLICY "licensed_content_access" ON content.items
  FOR SELECT USING (
    visibility = 'licensable'
    AND EXISTS (
      SELECT 1 FROM content.licenses l
      WHERE l.content_id = id
      AND l.licensee_tenant_id IN (
        SELECT tenant_id FROM core.memberships
        WHERE user_id = auth.uid()
      )
      AND l.status = 'active'
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
    )
  );
```

---

## Success Metrics

### Phase 1 (MVP)
| Metric | Target |
|--------|--------|
| Content delivery success | > 99% |
| Content load time | < 2s |

### Phase 2
| Metric | Target |
|--------|--------|
| Tenants creating content | 30% of tenants |
| Tenant content items | Avg 10+ per tenant |

### Phase 3
| Metric | Target |
|--------|--------|
| Marketplace listings | 100+ items |
| License transactions | Track GMV |
| Creator payout success | 100% |

---

## Open Questions

### Phase 2
1. What file formats supported for upload?
2. Video hosting: tenant uploads to our storage or external links?
3. Content versioning needed?

### Phase 3
1. Revenue share percentages?
2. Dispute resolution process?
3. Content quality/approval process for marketplace?
4. Geographic/compliance restrictions on content?

---

## Summary

**Key Architectural Decision**: Design the `content.items` table with `owner_type`, `owner_tenant_id`, and `visibility` fields from MVP. These fields enable Phase 2 and 3 without schema changes.

**MVP Implementation**:
- `owner_type` always 'platform'
- `owner_tenant_id` always NULL
- `visibility` always 'private'
- Standard entitlement-based access

**Future phases** simply:
1. Enable tenant content creation (Phase 2)
2. Enable marketplace features (Phase 3)

No database migrations required for the core content model.

