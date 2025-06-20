# Simplified Entitlement & Navigation System

## Overview

This document outlines the simplified, deterministic approach to user entitlements and navigation that replaces the complex agent-driven system. The core principle is that **entitlements and navigation should be fully deterministic based on database configuration**, not agent-driven.

## Core Principles

### 1. Navigation Reference Consistency
- Always use `nav_options.id` (UUID) as primary key for system operations
- Include human-readable fields (`href`, `title`) for debugging and admin interfaces
- System operations use UUIDs for consistency and performance
- Human debugging uses readable identifiers
- Admin screens translate UUIDs to readable names

### 2. Last Position Tracking
- Generalized approach: navigation tracks last nav selection in `users.last_nav_selection`
- Component-specific state (video progress, etc.) handled by individual components
- Optional: Keep both `current_module` and `last_nav_selection` for transition period

### 3. Entitlement-Navigation Decoupling
- Entitlements and navigation are NOT agent-driven
- Fully deterministic system based on database configuration
- Agents launched only when clicking nav options that have `agent_id` field
- Single query resolves all entitled navigation options

### 4. UUID Best Practices
- System operations use UUIDs for consistency and performance
- Human debugging uses readable identifiers
- Admin interfaces translate UUIDs for display
- Logs include both UUID and readable context when possible

## Simple Login Flow

The simplified login process follows these 5 clear steps:

1. **User Authentication** via Supabase
2. **Check Entitlements** from database tables:
   - `core.users` for user accounts
   - `core.user_entitlements` maps users to entitlement groups
   - `core.entitlements` lists entitlement groups with features
3. **Restore Last Position** from `core.users.last_nav_selection`
4. **Query Entitled Navigation** in single database call
5. **Render Navigation** based on entitled features

## Database Schema

### Core Tables

```sql
-- Navigation options (the source of truth)
CREATE TABLE core.nav_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    href VARCHAR(255) NOT NULL, -- Human debugging ("leadership-library")
    title VARCHAR(255) NOT NULL, -- Human debugging ("Leadership Library")
    context_key VARCHAR(50) NOT NULL, -- Human debugging ("leaderforge")
    agent_id UUID REFERENCES core.agents(id), -- Only if agent needed
    icon VARCHAR(50),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entitlement groups
CREATE TABLE core.entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- "leaderforge-basic", "wealth-premium"
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    features JSONB NOT NULL, -- See features structure below
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User entitlement mapping
CREATE TABLE core.user_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id),
    entitlement_id UUID NOT NULL REFERENCES core.entitlements(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES core.users(id),
    expires_at TIMESTAMPTZ, -- NULL = never expires
    active BOOLEAN DEFAULT true,
    UNIQUE(user_id, entitlement_id)
);

-- Users table enhancement
ALTER TABLE core.users ADD COLUMN last_nav_selection UUID REFERENCES core.nav_options(id);
```

### Entitlement Features Structure

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
  }
}
```

## Implementation Details

### Single Query Entitlement Resolution

```sql
-- Get all entitled navigation options for a user
WITH user_entitlements AS (
    SELECT e.features
    FROM core.user_entitlements ue
    JOIN core.entitlements e ON e.id = ue.entitlement_id
    WHERE ue.user_id = $1
      AND ue.active = true
      AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
),
entitled_nav_hrefs AS (
    SELECT DISTINCT jsonb_array_elements_text(features->'nav_options') as href
    FROM user_entitlements
)
SELECT no.id, no.href, no.title, no.context_key, no.agent_id, no.icon, no.sort_order
FROM core.nav_options no
JOIN entitled_nav_hrefs enh ON enh.href = no.href
WHERE no.active = true
ORDER BY no.sort_order, no.title;
```

### Navigation Click Handling Flow

```typescript
// Navigation click handler
async function handleNavigationClick(navOptionId: string, userId: string) {
  // 1. Verify user has access to this nav option
  const hasAccess = await verifyNavAccess(userId, navOptionId);
  if (!hasAccess) {
    throw new UnauthorizedError('No access to this navigation option');
  }

  // 2. Update last position
  await updateUserLastNavSelection(userId, navOptionId);

  // 3. Get nav option details
  const navOption = await getNavOption(navOptionId);

  // 4. If nav option has agent_id, launch agent
  if (navOption.agent_id) {
    return await launchAgent(navOption.agent_id, {
      userId,
      context: navOption.context_key,
      navOption: navOption.href
    });
  }

  // 5. Otherwise, return static content
  return await getStaticContent(navOption.href);
}
```

### Performance Optimizations

```typescript
// Cache entitled navigation per user
class EntitlementCache {
  private cache = new Map<string, CachedEntitlements>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  async getEntitledNavigation(userId: string): Promise<NavOption[]> {
    const cached = this.cache.get(userId);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.navOptions;
    }

    const navOptions = await this.queryEntitledNavigation(userId);

    this.cache.set(userId, {
      navOptions,
      timestamp: Date.now()
    });

    return navOptions;
  }

  // Invalidate cache when entitlements change
  invalidateUser(userId: string) {
    this.cache.delete(userId);
  }
}
```

## Error Handling & Graceful Degradation

### Access Denied Scenarios

```typescript
enum AccessDeniedReason {
  NO_ENTITLEMENT = 'no_entitlement',
  EXPIRED_ENTITLEMENT = 'expired_entitlement',
  INACTIVE_NAV_OPTION = 'inactive_nav_option',
  SYSTEM_ERROR = 'system_error'
}

interface AccessDeniedResponse {
  success: false;
  reason: AccessDeniedReason;
  message: string;
  suggestedActions: ActionSuggestion[];
}

// Graceful degradation for navigation
function handleAccessDenied(reason: AccessDeniedReason): AccessDeniedResponse {
  switch (reason) {
    case AccessDeniedReason.NO_ENTITLEMENT:
      return {
        success: false,
        reason,
        message: "This feature requires an upgrade to access.",
        suggestedActions: [
          { type: 'upgrade', label: 'Upgrade Now', href: '/upgrade' },
          { type: 'contact', label: 'Contact Support', href: '/support' }
        ]
      };

    case AccessDeniedReason.EXPIRED_ENTITLEMENT:
      return {
        success: false,
        reason,
        message: "Your access has expired. Please renew to continue.",
        suggestedActions: [
          { type: 'renew', label: 'Renew Subscription', href: '/renew' },
          { type: 'contact', label: 'Contact Admin', href: '/contact-admin' }
        ]
      };

    default:
      return {
        success: false,
        reason: AccessDeniedReason.SYSTEM_ERROR,
        message: "Unable to load this section. Please try again.",
        suggestedActions: [
          { type: 'retry', label: 'Try Again', action: 'retry' },
          { type: 'home', label: 'Go Home', href: '/' }
        ]
      };
  }
}
```

## Migration Strategy

### Phase 1: Database Setup
1. Create new tables (`nav_options`, enhanced `entitlements`)
2. Migrate existing navigation data to UUID-based system
3. Populate entitlement features with current access patterns

### Phase 2: API Updates
1. Update navigation APIs to use new entitlement queries
2. Add caching layer for performance
3. Implement access verification middleware

### Phase 3: Frontend Updates
1. Update navigation components to use UUIDs
2. Remove agent-driven navigation loading
3. Implement error handling for access denied scenarios

### Phase 4: Agent Integration
1. Update agents to receive navigation context
2. Remove navigation logic from agent responsibilities
3. Implement agent launching only for nav options with `agent_id`

### Phase 5: Cleanup
1. Remove old navigation tables and code
2. Update documentation and team training
3. Monitor performance and user experience

## Anti-Patterns to Avoid

❌ **DON'T**: Make navigation dependent on agent responses
❌ **DON'T**: Put business logic in navigation components
❌ **DON'T**: Cache entitlements for longer than 5 minutes
❌ **DON'T**: Use hardcoded navigation lists
❌ **DON'T**: Skip access verification on navigation clicks

✅ **DO**: Use database as single source of truth
✅ **DO**: Keep navigation logic purely deterministic
✅ **DO**: Cache appropriately with invalidation
✅ **DO**: Use UUIDs for system operations
✅ **DO**: Verify access on every navigation action

## Testing Strategy

### Unit Tests
- Entitlement query logic
- Access verification functions
- Cache invalidation logic
- Error handling scenarios

### Integration Tests
- End-to-end navigation flows
- Entitlement changes affecting navigation
- Agent launching from navigation
- Performance under load

### User Acceptance Tests
- Navigation speed and responsiveness
- Proper error messages for access denied
- Smooth module switching experience
- Persistent navigation state across sessions