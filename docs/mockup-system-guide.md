# 🎭 Generalized Mockup Routing System

**Zero-complexity mockup system for rapid prototyping in production context**

## Overview

The Mockup Routing System allows you to show mockups to select users while iterating on features, then implement and turn on for all entitled users. Mockups are rendered in the full production platform context with navigation, theming, and all production features.

## Key Features

### ✅ **Production Context Integration**
- Mockups render within the actual platform (NavPanel + ContentPanel)
- Full theming and design system compliance
- Real navigation and user sessions
- Authentic production experience

### ✅ **Granular Feature Switching**
- Enable/disable mockups per user ID
- Environment-based controls (dev vs production)
- Feature flag support for team-wide control
- Safe production rollout capabilities

### ✅ **Zero Complexity**
- Add mockup: map UUID → component in registry
- Route to mockup: automatic based on nav selection
- Extensible: ready for Team Leader, Coach, etc.

## System Architecture

```
NavPanel Selection → MockupRouter → [Mockup OR Agent Content]
                         ↓
              Feature Flag Check + User Access
                         ↓
                 [Dashboard/Team Leader/etc.]
```

## Implementation

### 1. **MockupRegistry** (`apps/web/lib/mockups/MockupRegistry.ts`)

Maps nav_option UUIDs to mockup components with access control:

```typescript
export const MOCKUP_REGISTRY: Record<string, MockupConfig> = {
  // Marcus Dashboard - My Learning nav option
  '162193ce-0bcd-4a41-bf54-7a96bae97e67': {
    component: MarcusDashboard,
    name: 'Marcus Dashboard',
    description: 'Mockup dashboard for user experience validation',
    featureFlag: 'ENABLE_DASHBOARD_MOCKUP',
    enabledUsers: [
      'bb893b34-8a5e-4f4e-a55e-cd8c2e0f1f3b', // Marcus test user
    ],
    enabledForAll: process.env.NODE_ENV === 'development',
  },
};
```

### 2. **MockupRouter** (`apps/web/lib/mockups/MockupRouter.tsx`)

Intercepts navigation and renders mockups when enabled:

```typescript
<MockupRouter
  navOptionId={selectedNavOptionId}
  userId={session.user.id}
>
  {/* Fallback to agent content */}
</MockupRouter>
```

### 3. **DynamicTenantPage Integration**

Modified `loadContentForNavOption()` to check for mockups before calling agent API:

```typescript
// Check for mockup routing first
const { isMockupEnabled } = await import('../lib/mockups/MockupRegistry');
const mockupEnabled = isMockupEnabled(navId, session.user.id);

if (mockupEnabled) {
  // Set mockup content type to trigger MockupRouter
  setAgentSchema({
    type: 'content_schema',
    content: { type: 'mockup', navOptionId: navId, userId: session.user.id }
  });
  return;
}

// Otherwise continue with agent content...
```

## Usage

### **Current Mockup: Marcus Dashboard**

**Navigation:** `leaderforge` tenant → `My Dashboard` (UUID: `e51a7dde-e349-41c4-b3ed-4a8a75155f94`)

**Access Control:**
- ✅ **Development:** Enabled for all users
- ✅ **Production:** Only user `bb893b34-8a5e-4f4e-a55e-cd8c2e0f1f3b` (Marcus)
- ✅ **Feature Flag:** `ENABLE_DASHBOARD_MOCKUP`

**To Test:**
1. Login to platform
2. Select `leaderforge` tenant
3. Click `My Dashboard` in navigation
4. 🎭 Dashboard mockup renders in production context

### **Adding New Mockups**

#### 1. Create Your Mockup Component
```typescript
// apps/web/app/team-leader-mockup/page.tsx
export default function TeamLeaderMockup() {
  return (
    <div className="p-6">
      <h1>Team Leader Dashboard</h1>
      {/* Your mockup content */}
    </div>
  );
}
```

#### 2. Register in MockupRegistry
```typescript
// Add to MOCKUP_REGISTRY
'another-nav-uuid': {
  component: TeamLeaderMockup,
  name: 'Team Leader Dashboard',
  description: 'Team leader experience mockup',
  featureFlag: 'ENABLE_TEAM_LEADER_MOCKUP',
  enabledUsers: ['user-id-1', 'user-id-2'],
  enabledForAll: false, // Production safety
},
```

#### 3. Test & Iterate
- Users see mockup immediately upon navigation
- Full production context maintained
- Safe rollout with user-specific access

## Debug Tools

### **Mockup Status API**
```bash
GET /api/debug/mockups?user_id=optional

# Returns:
{
  "userId": "bb893b34-8a5e-4f4e-a55e-cd8c2e0f1f3b",
  "environment": "development",
  "totalMockups": 1,
  "enabledMockups": 1,
  "mockups": [
    {
      "navOptionId": "162193ce-0bcd-4a41-bf54-7a96bae97e67",
      "name": "Marcus Dashboard",
      "isEnabled": true,
      "isCurrentUser": true
    }
  ]
}
```

### **Development Indicators**
- 🎭 **Mockup Active** badge shows in development
- Console logging for mockup routing decisions
- Debug status in browser dev tools

## Production Safety

### **Access Control Layers**
1. **User Whitelist:** Specific user IDs only
2. **Feature Flags:** Team-wide enable/disable
3. **Environment Gates:** `enabledForAll` only in development
4. **Fallback Handling:** Always falls back to agent content

### **Safe Rollout Process**
1. **Development:** Test with `enabledForAll: true`
2. **Staging:** Test with specific `enabledUsers`
3. **Production:** Add users incrementally to `enabledUsers`
4. **Implementation:** Replace mockup with real feature
5. **Cleanup:** Remove from registry

## Future Extensions

### **Planned Mockups**
- **Team Leader Dashboard:** Coach perspective and team management
- **Admin Console:** Organization-level controls
- **Mobile Experience:** Responsive design validation
- **Onboarding Flow:** New user experience

### **Enhanced Features**
- **A/B Testing:** Route users to different mockup variants
- **Analytics:** Track mockup usage and user interactions
- **Feedback Collection:** Capture user feedback within mockups
- **Version Control:** Support multiple mockup versions

## Benefits

### **For Product Teams**
- ✅ **Rapid Iteration:** Show mockups to users immediately
- ✅ **Real Context:** Test in actual production environment
- ✅ **Safe Testing:** Controlled access prevents user confusion
- ✅ **Fast Feedback:** Get user input before building features

### **For Engineering Teams**
- ✅ **Zero Complexity:** Simple UUID → component mapping
- ✅ **Production Safe:** Multiple safety layers prevent accidents
- ✅ **Clean Integration:** No disruption to existing architecture
- ✅ **Easy Cleanup:** Remove mockups without affecting production

### **For Users**
- ✅ **Authentic Experience:** Full platform context maintained
- ✅ **Seamless Testing:** No special environments or accounts
- ✅ **Real Navigation:** Uses actual navigation and theming
- ✅ **Production Performance:** No development environment slowdowns

---

**The mockup system enables rapid user experience validation without architectural investment - exactly what we need for iterating toward requirements gathering and eventual CopilotKit-driven layout creation.**