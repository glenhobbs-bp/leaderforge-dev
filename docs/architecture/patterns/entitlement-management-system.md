# Entitlement Management System - Implementation Pattern

**File:** docs/architecture/patterns/entitlement-management-system.md
**Purpose:** Comprehensive implementation guide for the entitlement management architecture
**Owner:** Senior Architect
**Tags:** patterns, entitlements, access-control, implementation, multi-tenancy

## Overview

This document provides a comprehensive implementation guide for LeaderForge's entitlement management system. It consolidates architectural decisions, database schemas, service patterns, and integration approaches that have been developed and refined across multiple implementations.

**Related Documentation:**
- [ADR-0022: Entitlement Management Architecture](../adr/0022-entitlement-management-architecture.md)
- [Current Database Schema](../../database/core-schema-current.sql)

## Core Principles

### 1. Schema-Driven Architecture
- **All entitlements, licenses, and relationships defined in database configuration, not code**
- Entitlement features stored as JSONB for flexibility
- Business rules enforced through database constraints and service layer logic
- No hardcoded access control logic in UI components or agents

### 2. Service-Layer Enforcement
- **All access checks and business logic live in the service layer**
- Agents and UI only see filtered, entitlement-checked data
- Centralized entitlement validation prevents bypass opportunities
- No direct database access from frontend components

### 3. Multi-Tenant Isolation
- **All entitlements and content strictly isolated by context/tenant**
- Row Level Security (RLS) enforcement in PostgreSQL
- Context-aware service functions prevent cross-tenant data leakage
- Tenant isolation verified at every access point

### 4. Modular Extensibility
- **Support for multiple provisioning models and entitlement types**
- Pluggable provisioning strategies (org_hierarchy, direct_user, delegated_admin)
- Extensible entitlement features without schema changes
- Future-ready for SSO, A/B testing, and external integrations

### 5. Audit and Compliance
- **Complete lifecycle tracking for all entitlement changes**
- Comprehensive audit logs for compliance requirements
- Granular tracking of grants, revocations, and usage patterns
- Immutable audit trail with proper retention policies

## Database Schema Design

### Core Entitlement Tables

#### 1. Entitlements Definition Table
```sql
CREATE TABLE core.entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE, -- e.g., "leaderforge-premium", "mockup-access"
    display_name text NOT NULL,
    description text,
    features jsonb DEFAULT '{}', -- Flexible feature configuration
    limits jsonb DEFAULT '{}',   -- Usage limits and constraints
    access_rules jsonb DEFAULT '{}', -- Complex access rule definitions
    price_monthly numeric(10,2),
    price_annual numeric(10,2),
    currency text DEFAULT 'USD',
    active boolean DEFAULT true,
    tenant_key text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

**Key Design Decisions:**
- **JSONB Features**: Flexible feature flags without schema changes
- **Tenant Isolation**: Every entitlement tied to specific tenant
- **Pricing Integration**: Built-in support for subscription billing
- **Lifecycle Management**: Active flag for entitlement deprecation

#### 2. User Entitlements Assignment Table
```sql
CREATE TABLE core.user_entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.users(id),
    entitlement_id uuid NOT NULL REFERENCES core.entitlements(id),
    org_entitlement_id uuid REFERENCES core.org_entitlements(id),
    granted_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    revoked_at timestamptz,
    granted_by uuid REFERENCES core.users(id),
    grant_reason text,
    revoke_reason text,
    first_used_at timestamptz,
    last_used_at timestamptz,
    usage_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}',
    CONSTRAINT unique_active_entitlement UNIQUE (user_id, entitlement_id)
      WHERE (revoked_at IS NULL)
);
```

**Key Design Decisions:**
- **Lifecycle Tracking**: Complete grant/revoke/expiration lifecycle
- **Usage Analytics**: Track when and how often entitlements are used
- **Audit Trail**: Comprehensive tracking of who granted/revoked and why
- **Soft Deletion**: Revocation preserves history rather than deleting records

#### 3. Organization Entitlements (Seat Management)
```sql
CREATE TABLE core.org_entitlements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid NOT NULL REFERENCES core.organizations(id),
    entitlement_id uuid NOT NULL REFERENCES core.entitlements(id),
    quantity integer DEFAULT 1,     -- Total seats purchased
    allocated integer DEFAULT 0,    -- Seats assigned to users
    granted_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    auto_renew boolean DEFAULT false,
    granted_by uuid REFERENCES core.users(id),
    purchase_order text,
    billing_reference text,
    status text DEFAULT 'active',
    CONSTRAINT check_allocation CHECK (allocated <= quantity)
);
```

### Entitlement Features Configuration

The `features` JSONB field supports flexible configuration patterns:

```json
{
  "nav_options": ["leadership-library", "assessments", "training-videos"],
  "business_features": {
    "canPromote": true,
    "commissionAccess": true,
    "referralTracking": true,
    "videoDownloads": true,
    "offlineAccess": true
  },
  "content_access": {
    "modules": ["leaderforge", "wealth"],
    "categories": ["premium-content"],
    "maxVideosPerDay": 10
  },
  "ui_features": {
    "customBranding": false,
    "advancedAnalytics": true,
    "bulkActions": false
  },
  "admin_capabilities": {
    "userManagement": true,
    "entitlementGrants": false,
    "systemConfiguration": false
  }
}
```

**Feature Categories:**
- **nav_options**: Controls navigation menu visibility
- **business_features**: Core business functionality access
- **content_access**: Content library and module permissions
- **ui_features**: Interface enhancements and tools
- **admin_capabilities**: Administrative function access

## Service Layer Implementation

### Core Service Architecture

The entitlement system implements a centralized service layer that enforces all access control decisions. This ensures consistent behavior across the application and prevents access control bypass.

#### EntitlementService Interface

```typescript
interface EntitlementService {
  // User entitlement checking
  getUserEntitlements(userId: string, tenantKey: string): Promise<UserEntitlement[]>;
  hasEntitlement(userId: string, entitlementName: string, tenantKey: string): Promise<boolean>;
  hasFeature(userId: string, feature: string, tenantKey: string): Promise<boolean>;

  // Content and navigation filtering
  getAccessibleNavigation(userId: string, tenantKey: string): Promise<NavOption[]>;
  getAccessibleContent(userId: string, tenantKey: string): Promise<ContentItem[]>;
  canAccessContent(userId: string, contentId: string, tenantKey: string): Promise<boolean>;

  // Organizational entitlements
  getOrgEntitlements(orgId: string): Promise<OrgEntitlement[]>;
  getAvailableSeats(orgId: string, entitlementId: string): Promise<number>;

  // Entitlement management
  grantEntitlement(request: GrantEntitlementRequest): Promise<UserEntitlement>;
  revokeEntitlement(request: RevokeEntitlementRequest): Promise<void>;

  // Usage tracking
  trackUsage(userId: string, entitlementId: string, action: string): Promise<void>;
}
```

#### Service Implementation Patterns

**1. Context-Aware Operations**
```typescript
// All service methods require tenant context
async getUserEntitlements(userId: string, tenantKey: string): Promise<UserEntitlement[]> {
  // Validate tenant context
  await this.validateTenantAccess(userId, tenantKey);

  // Execute tenant-scoped query with RLS
  return await this.supabase
    .from('user_entitlements')
    .select(`
      *,
      entitlement:entitlements(*)
    `)
    .eq('user_id', userId)
    .eq('entitlements.tenant_key', tenantKey)
    .is('revoked_at', null);
}
```

**2. Performance Optimization with Caching**
```typescript
class EntitlementCache {
  private cache = new Map<string, CachedEntitlements>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  async getEntitlements(userId: string, tenantKey: string): Promise<UserEntitlement[]> {
    const cacheKey = `${userId}:${tenantKey}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.entitlements;
    }

    const entitlements = await this.fetchEntitlements(userId, tenantKey);
    this.cache.set(cacheKey, {
      entitlements,
      timestamp: Date.now()
    });

    return entitlements;
  }

  invalidateUser(userId: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Provisioning Models

### Supported Provisioning Strategies

LeaderForge supports multiple provisioning models to accommodate different business relationships and organizational structures.

#### 1. Organization Hierarchy Model
**Use Case:** Enterprise customers with clear organizational structure (LeaderForge primary model)

**Flow:** Company → Team → User
**Characteristics:** Seat-based licensing, admin-managed provisioning, organizational ownership

```typescript
async provisionOrgHierarchy(request: OrgProvisioningRequest): Promise<ProvisioningResult> {
  // 1. Validate org admin permissions
  await this.validateOrgAdmin(request.adminUserId, request.orgId);

  // 2. Check available seats
  const availableSeats = await this.getAvailableSeats(request.orgId, request.entitlementId);
  if (availableSeats < request.userIds.length) {
    throw new InsufficientSeatsError();
  }

  // 3. Grant entitlements to users with org linkage
  const results = await Promise.all(
    request.userIds.map(userId =>
      this.grantUserEntitlement({
        userId,
        entitlementId: request.entitlementId,
        orgEntitlementId: request.orgEntitlementId,
        grantedBy: request.adminUserId
      })
    )
  );

  return { success: true, grantedEntitlements: results };
}
```

#### 2. Direct User Model
**Use Case:** Individual consumers, B2C scenarios (Brilliant School model)

**Flow:** User → Entitlement (direct)
**Characteristics:** Self-service, individual licensing, no seat management

#### 3. Delegated Admin Model
**Use Case:** Consultant/franchise models (Wealth With God model)

**Flow:** Admin → Client Users
**Characteristics:** Consultant manages client access, revenue sharing, client isolation

## Integration Patterns

### Agent-Native Integration

The entitlement system integrates seamlessly with LeaderForge's agent-native architecture:

```typescript
// Navigation filtering in agent context
async getAgentNavigation(userId: string, tenantKey: string): Promise<NavSchema> {
  const accessibleNav = await this.entitlementService.getAccessibleNavigation(userId, tenantKey);

  return {
    navigation: accessibleNav.map(nav => ({
      id: nav.id,
      label: nav.label,
      href: nav.href,
      icon: nav.icon,
      agentId: nav.agent_id
    }))
  };
}

// Content filtering for agents
async getAgentContent(userId: string, tenantKey: string, contentCategory?: string): Promise<ContentSchema> {
  const accessibleContent = await this.entitlementService.getAccessibleContent(userId, tenantKey);

  if (contentCategory) {
    return accessibleContent.filter(content => content.category === contentCategory);
  }

  return accessibleContent;
}
```

### API Integration Pattern

All API endpoints integrate entitlement checking:

```typescript
// API middleware for entitlement checking
export async function withEntitlementCheck(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredEntitlement: string
) {
  const { userId, tenantKey } = await validateSession(req);

  const hasAccess = await entitlementService.hasEntitlement(userId, requiredEntitlement, tenantKey);

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Insufficient privileges',
      requiredEntitlement,
      upgradeUrl: `/upgrade?feature=${requiredEntitlement}`
    });
  }

  // Continue with request processing
}
```

## Migration and Best Practices

### Migration Strategy

**Phase 1: Infrastructure Setup**
1. Deploy entitlement tables and RLS policies
2. Implement core entitlement service
3. Set up caching infrastructure

**Phase 2: Gradual Integration**
1. Start with navigation entitlement filtering
2. Migrate content access checks
3. Implement organizational provisioning

**Phase 3: Full Migration**
1. Remove legacy access control code
2. Implement advanced features (conditional access, A/B testing)
3. Full audit trail activation

### Performance Best Practices

**1. Query Optimization**
```sql
-- Optimized entitlement check query
WITH user_features AS (
  SELECT DISTINCT jsonb_object_keys(e.features) as feature
  FROM core.user_entitlements ue
  JOIN core.entitlements e ON e.id = ue.entitlement_id
  WHERE ue.user_id = $1
    AND ue.revoked_at IS NULL
    AND e.tenant_key = $2
)
SELECT EXISTS(SELECT 1 FROM user_features WHERE feature = $3) as has_feature;
```

**2. Caching Strategy**
- Cache user entitlements for 5 minutes
- Invalidate on entitlement changes
- Use Redis for distributed caching
- Cache navigation and content lists

**3. Database Indexing**
```sql
-- Critical indexes for performance
CREATE INDEX idx_user_entitlements_user_tenant
  ON core.user_entitlements(user_id, tenant_key) WHERE revoked_at IS NULL;
CREATE INDEX idx_entitlements_tenant_active
  ON core.entitlements(tenant_key) WHERE active = true;
CREATE INDEX idx_org_entitlements_org_status
  ON core.org_entitlements(org_id, status);
```

### Security Considerations

**1. Row Level Security (RLS)**
- All entitlement tables enforce RLS
- Users can only see their own entitlements
- Org admins can see org-scoped entitlements

**2. Audit Trail Security**
- Immutable audit logs
- Separate audit database for compliance
- Encrypted sensitive audit data

**3. Access Pattern Monitoring**
- Monitor unusual entitlement access patterns
- Alert on bulk entitlement changes
- Track cross-tenant access attempts

---

**Implementation Status:** ✅ **Complete**
**Related Documentation:** [ADR-0022](../adr/0022-entitlement-management-architecture.md)
**Next Steps:** Implement migration plan and performance monitoring