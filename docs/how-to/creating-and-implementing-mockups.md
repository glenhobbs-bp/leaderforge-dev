# 🎭 How-To Guide: Creating and Implementing Agent-Native Mockups

## Overview

This guide walks you through creating and implementing mockups using LeaderForge's **Agent-Native Mockup Composition System** (ADR-0014). This system enables rapid prototyping of UI mockups through the existing agent architecture, using JSX components with entitlement-based access control.

## 🚀 Quick Start (5 Minutes)

### **Step 1: Create Your Mockup Component**
```typescript
// apps/web/components/mockups/TeamLeaderMockup.tsx
/**
 * Purpose: Team Leader Dashboard Mockup - Agent-native mockup component for UX validation
 * Owner: Mockup System
 * Tags: [mockup, dashboard, team-leader, agent-native]
 */

"use client";

import React, { useState } from 'react';
import StatCard from '../widgets/StatCard';
import { LeaderForgeCard } from '../widgets/LeaderForgeCard';

export default function TeamLeaderMockup() {
  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Team Dashboard</h1>
        <p className="text-sm text-gray-500">Lead your team to success</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Use existing widget components for consistency */}
        <StatCard
          title="Team Members"
          value="12"
          change="+2 this month"
          trend="up"
          icon="Users"
        />

        <StatCard
          title="Active Projects"
          value="8"
          change="+1 this week"
          trend="up"
          icon="Target"
        />

        <StatCard
          title="Completion Rate"
          value="94%"
          change="+3% this week"
          trend="up"
          icon="CheckCircle"
        />
      </div>
    </div>
  );
}
```

### **Step 2: Create Mockup Agent in Database**
```sql
-- Create a new mockup agent
INSERT INTO core.agents (id, name, type, config, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'team-leader-mockup',
  'mockup',
  '{"component": "TeamLeaderMockup"}',
  NOW(),
  NOW()
);

-- Get the agent ID that was created
SELECT id, name, type, config
FROM core.agents
WHERE name = 'team-leader-mockup';
```

### **Step 3: Connect Navigation to Agent**
```sql
-- Find the navigation option you want to mock
SELECT id, label, tenant_key, agent_id
FROM core.nav_options
WHERE label ILIKE '%team%' OR label ILIKE '%leader%';

-- Assign your mockup agent to the navigation option
UPDATE core.nav_options
SET agent_id = 'YOUR_AGENT_ID_FROM_STEP_2'
WHERE id = 'YOUR_NAV_OPTION_ID';

-- Verify the connection
SELECT n.id, n.label, a.name as agent_name, a.type as agent_type
FROM core.nav_options n
JOIN core.agents a ON n.agent_id = a.id
WHERE n.label ILIKE '%team%';
```

### **Step 4: Setup Entitlement-Based Access Control**
```sql
-- Create an entitlement for your mockup (if it doesn't exist)
INSERT INTO core.entitlements (id, name, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'team-leader-mockup',
  'Platform feature - team leader mockup access for UX testing',
  NOW(),
  NOW()
);

-- Grant the entitlement to specific users for testing
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_at)
VALUES (
  '47f9db16-f24f-4868-8155-256cfa2edc2c', -- Your user ID
  (SELECT id FROM core.entitlements WHERE name = 'team-leader-mockup'),
  NOW()
);

-- Update navigation option to require the entitlement
UPDATE core.nav_options
SET entitlements = '["team-leader-mockup"]'
WHERE id = 'YOUR_NAV_OPTION_ID';
```

### **Step 5: Deploy & Test**
```bash
# Commit and push
git add apps/web/components/mockups/TeamLeaderMockup.tsx
git commit -m "feat: Add Team Leader mockup component"
git push origin main

# Mockup is live immediately via agent-native system!
# No registry updates or backend changes needed
```

## 📋 Detailed Implementation Guide

### **Architecture Overview**

The agent-native mockup system follows these principles:
- **Agent-Native Orchestration**: Mockups are agents, not special cases
- **Schema-Driven UI**: Frontend renders based on agent response schemas
- **Entitlement-Based Access**: Admin-manageable access control via database
- **Dynamic Imports**: Code splitting with error handling and Suspense
- **Production-Ready**: Works consistently across all environments

### **Finding Navigation Options**

#### **Method 1: Database Query**
```sql
-- Find navigation options to assign mockup agents
SELECT
  id,
  label,
  tenant_key,
  agent_id,
  entitlements,
  created_at
FROM core.nav_options
WHERE tenant_key = 'leaderforge'
ORDER BY label;
```

#### **Method 2: Navigation API**
```bash
# Get all navigation options for tenant
GET /api/nav/leaderforge

# Check current agent assignments
GET /api/debug/nav-check
```

#### **Method 3: Browser Console**
Navigate to the page and check console logs:
```javascript
// Look for navigation selection logs
[DynamicTenantPage] Found navigation option: {label: "...", agentId: "..."}
```

### **Component Development Guidelines**

#### **🎨 CRITICAL: Design System Adherence**

**ALL mockups MUST adhere to the established design system**. This is not optional - mockups that don't follow design system patterns create inconsistent user experiences and misleading feedback.

**Required Design System Elements:**
- **Typography**: Use established heading sizes (`text-2xl`, `text-xl`, etc.)
- **Colors**: Follow the approved color palette (primary, secondary, success, warning, error)
- **Spacing**: Use consistent padding/margin classes (`p-6`, `mb-8`, `space-y-4`, etc.)
- **Components**: Use existing widget components (`StatCard`, `LeaderForgeCard`, `List`)
- **Layouts**: Follow established grid patterns (`grid-cols-1 lg:grid-cols-3`)
- **Interactive States**: Proper hover/focus/disabled states
- **Responsive Design**: Mobile-first, consistent breakpoints

**✅ DO:**
```typescript
// Good: Uses design system components and patterns
<div className="p-6">
  <header className="mb-8">
    <h1 className="text-2xl font-medium text-gray-900 mb-1">Dashboard Title</h1>
    <p className="text-sm text-gray-500">Consistent subtitle</p>
  </header>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <StatCard
      title="Metric Name"
      value="42"
      change="+5 this week"
      trend="up"
      icon="Activity"
    />
    <LeaderForgeCard
      title="Feature Preview"
      subtitle="Interactive demonstration"
      actions={[
        { label: 'View Details', action: 'openModal' },
        { label: 'Learn More', action: 'openGuide' }
      ]}
    />
  </div>
</div>
```

**❌ DON'T:**
```typescript
// Bad: Custom styles, inconsistent patterns, random colors
<div style={{padding: '24px'}}>
  <h1 style={{fontSize: '28px', color: '#123456'}}>Random Title</h1>
  <div style={{display: 'flex', gap: '10px'}}>
    <div style={{background: '#abcdef', padding: '20px'}}>
      Custom styled card that doesn't match anything
    </div>
  </div>
</div>
```

**📝 Design System Checklist:**
- [ ] Uses existing widget components (`StatCard`, `LeaderForgeCard`, `List`)
- [ ] Follows established layout patterns
- [ ] Uses consistent typography classes
- [ ] Implements proper responsive design
- [ ] Includes interactive states (hover, focus, disabled)
- [ ] Matches existing color scheme
- [ ] Uses standard spacing/padding classes
- [ ] Integrates seamlessly with existing dashboard look

#### **File Structure & Standards**
```typescript
// apps/web/components/mockups/YourMockup.tsx
/**
 * Purpose: Your Mockup - Agent-native mockup component for UX validation
 * Owner: Mockup System
 * Tags: [mockup, feature-name, agent-native]
 */

"use client";

import React, { useState } from 'react';
import StatCard from '../widgets/StatCard';
import { LeaderForgeCard } from '../widgets/LeaderForgeCard';
import List from '../widgets/List';

export default function YourMockup() {
  return (
    <div className="p-6">
      {/* Header matching dashboard pattern */}
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Your Title</h1>
        <p className="text-sm text-gray-500">Your subtitle</p>
      </header>

      {/* Use existing widget components for consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="Metric Title"
          value="42"
          change="+5 this week"
          trend="up"
          icon="Activity"
        />

        <LeaderForgeCard
          title="Feature Preview"
          subtitle="Interactive demonstration"
          actions={[
            { label: 'View Details', action: 'openModal' },
            { label: 'Learn More', action: 'openGuide' }
          ]}
          data={{
            imageUrl: '/thumb1.png',
            description: 'Preview of new functionality...'
          }}
        />
      </div>
    </div>
  );
}
```

#### **Interactive Elements**
```typescript
// Add realistic interactions
import { useState } from 'react';

export default function InteractiveMockup() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="p-6">
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'team', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${selectedTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {selectedTab === 'overview' && <OverviewContent />}
        {selectedTab === 'team' && <TeamContent />}
        {selectedTab === 'reports' && <ReportsContent />}
      </div>
    </div>
  );
}
```

### **Access Control Strategies**

#### **Entitlement-Based Access Control**
The new system uses database-driven entitlements for fine-grained access control:

```sql
-- Strategy 1: Individual User Access (Safest for Production)
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_at)
VALUES
  ('47f9db16-f24f-4868-8155-256cfa2edc2c', -- Glen
   (SELECT id FROM core.entitlements WHERE name = 'your-mockup-name'),
   NOW()),
  ('other-user-id-here',
   (SELECT id FROM core.entitlements WHERE name = 'your-mockup-name'),
   NOW());
  'bb893b34-8a5e-4f4e-a55e-cd8c2e0f1f3b', // Marcus
  '123e4567-e89b-12d3-a456-426614174000', // Team member
],
```

#### **Environment-Based Access**
```typescript
// Environment variable control
enabledForAll: process.env.ENABLE_TEAM_MOCKUPS === 'true',

// Set in Vercel:
// ENABLE_TEAM_MOCKUPS=true
```

#### **Feature Flag Integration**
```typescript
// Future: integrate with feature flag service
featureFlag: 'ENABLE_TEAM_LEADER_MOCKUP',

// Check in isMockupEnabled function
if (mockupConfig.featureFlag && featureFlags[mockupConfig.featureFlag]) {
  return true;
}
```

### **Production Deployment**

#### **Safe Rollout Process**
1. **Development Testing**
   ```bash
   # Local development (shows for all users)
   NODE_ENV=development npm run dev
   ```

2. **Staging Validation**
   ```typescript
   // Add staging user IDs
   enabledUsers: [
     'staging-user-1',
     'staging-user-2'
   ]
   ```

3. **Production Rollout**
   ```typescript
   // Add production user IDs incrementally
   enabledUsers: [
     '47f9db16-f24f-4868-8155-256cfa2edc2c', // Glen
     'next-user-uuid', // Add one by one
   ]
   ```

4. **Full Release**
   ```bash
   # Set environment variable for broader access
   ENABLE_MOCKUPS_FOR_ALL=true
   ```

#### **Vercel Environment Variables**
```bash
# Add in Vercel dashboard:
ENABLE_MOCKUPS_FOR_ALL=false  # Default: controlled access
ENABLE_TEAM_MOCKUPS=true      # Specific mockup control
ENABLE_DASHBOARD_MOCKUP=true  # Feature-specific flags
```

## 🔧 Advanced Patterns

### **Multi-Component Mockups**
```typescript
// Break large mockups into components
// components/mockups/TeamLeader/
//   ├── TeamOverview.tsx
//   ├── TeamMembers.tsx
//   ├── PerformanceCharts.tsx
//   └── index.tsx

// apps/web/app/team-leader-mockup/page.tsx
import TeamOverview from '../../components/mockups/TeamLeader/TeamOverview';
import TeamMembers from '../../components/mockups/TeamLeader/TeamMembers';

export default function TeamLeaderMockup() {
  return (
    <div className="p-6 space-y-8">
      <TeamOverview />
      <TeamMembers />
    </div>
  );
}
```

### **Responsive Design Testing**
```typescript
// Test different screen sizes
export default function ResponsiveMockup() {
  return (
    <div className="p-6">
      {/* Mobile-first responsive grid */}
      <div className="grid grid-cols-1 gap-6
                      sm:grid-cols-2
                      lg:grid-cols-3
                      xl:grid-cols-4">
        {/* Content adapts to screen size */}
      </div>

      {/* Hide/show elements by screen size */}
      <div className="hidden lg:block">
        <DetailedCharts />
      </div>

      <div className="lg:hidden">
        <SimplifiedView />
      </div>
    </div>
  );
}
```

### **Data Mockup Patterns**
```typescript
// Realistic mock data
const mockTeamData = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Senior Developer',
    completionRate: 85,
    lastActive: '2 hours ago',
    status: 'on-track'
  },
  // ... more realistic data
];

export default function DataDrivenMockup() {
  return (
    <div className="p-6">
      <div className="grid gap-4">
        {mockTeamData.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{member.completionRate}%</div>
                <div className="text-xs text-gray-500">{member.lastActive}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 📊 Testing & Validation

### **User Testing Checklist**
- [ ] **Navigation**: User can find and select the mockup option
- [ ] **Loading**: Mockup appears within 2 seconds
- [ ] **Responsive**: Works on mobile, tablet, desktop
- [ ] **Interactions**: All buttons and links respond appropriately
- [ ] **Data**: Realistic content shows expected information
- [ ] **Context**: Feels integrated with platform, not like a separate page

### **Debug Tools Usage**
```bash
# Check mockup status
curl "https://your-domain.vercel.app/api/debug/mockups"

# Check specific user
curl "https://your-domain.vercel.app/api/debug/mockups?user_id=YOUR_UUID"

# Browser console logs
# Navigate to mockup and check for:
[MockupRegistry] Status check: { isEnabled: true, ... }
[DynamicTenantPage] Mockup routing active for: uuid
```

### **Feedback Collection**
```typescript
// Add feedback collection to mockups
export default function MockupWithFeedback() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="p-6">
      {/* Mockup content */}

      {/* Feedback button */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowFeedback(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          💬 Feedback
        </button>
      </div>

      {/* Feedback modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
```

## 🧹 Cleanup & Migration

### **Removing Mockups**
```typescript
// 1. Remove from MockupRegistry
// Delete the registry entry completely

// 2. Remove component files
// Delete apps/web/app/your-mockup-folder/

// 3. Commit changes
git add .
git commit -m "cleanup: Remove Team Leader mockup (implemented in production)"
git push origin main
```

### **Migration to Production Features**
```typescript
// 1. Implement real feature using mockup as specification
// 2. Update navigation to point to real feature
// 3. Remove mockup registry entry
// 4. Keep mockup components for future reference

// Example navigation update:
UPDATE core.nav_options
SET agent_id = 'real-team-leader-agent-id'
WHERE id = 'your-nav-uuid';
```

## 🎯 Best Practices

### **DO:**
- ✅ Use realistic data and content
- ✅ Match existing design system patterns
- ✅ Test on multiple screen sizes
- ✅ Add meaningful interactions
- ✅ Include loading and error states
- ✅ Collect user feedback
- ✅ Document the mockup purpose
- ✅ Remove mockups after implementation

### **DON'T:**
- ❌ Hardcode real user data
- ❌ Create complex business logic
- ❌ Use external API calls
- ❌ Make it look unfinished
- ❌ Skip responsive design
- ❌ Leave mockups in production indefinitely
- ❌ Forget to update access control

## 🚀 Next Steps

1. **Create your first mockup** using this guide
2. **Test with select users** to gather feedback
3. **Iterate quickly** based on user input
4. **Document requirements** from user testing
5. **Implement real feature** using mockup as specification
6. **Clean up mockup** after production implementation

---

**The mockup system enables rapid user experience validation without architectural investment - perfect for iterating toward requirements and eventual implementation!**

## 🎯 Agent-Native Best Practices

### **Complete Workflow Example**

Here's a complete example of creating a Sales Dashboard mockup:

```typescript
// apps/web/components/mockups/SalesDashboardMockup.tsx
/**
 * Purpose: Sales Dashboard Mockup - Agent-native mockup component for UX validation
 * Owner: Mockup System
 * Tags: [mockup, sales, dashboard, agent-native]
 */

"use client";

import React, { useState } from 'react';
import StatCard from '../widgets/StatCard';
import List from '../widgets/List';
import { LeaderForgeCard } from '../widgets/LeaderForgeCard';

export default function SalesDashboardMockup() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock data for realistic demo
  const salesData = [
    { period: 'week', revenue: '$24.5K', deals: 8, conversion: '34%' },
    { period: 'month', revenue: '$187K', deals: 45, conversion: '28%' },
    { period: 'quarter', revenue: '$520K', deals: 134, conversion: '31%' }
  ];

  const currentData = salesData.find(d => d.period === selectedPeriod);

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Sales Dashboard</h1>
        <p className="text-sm text-gray-500">Track performance and close more deals</p>

        {/* Period selector */}
        <div className="mt-4 flex space-x-2">
          {['week', 'month', 'quarter'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-lg capitalize ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Revenue"
          value={currentData?.revenue || '$24.5K'}
          change="+12% vs last period"
          trend="up"
          icon="DollarSign"
        />

        <StatCard
          title="Deals Closed"
          value={currentData?.deals.toString() || '8'}
          change="+3 this week"
          trend="up"
          icon="CheckCircle"
        />

        <StatCard
          title="Conversion Rate"
          value={currentData?.conversion || '34%'}
          change="+2.1% vs last period"
          trend="up"
          icon="TrendingUp"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderForgeCard
          title="Pipeline Review"
          subtitle="High-value opportunities"
          actions={[
            { label: 'View Details', action: 'openPipelineModal' },
            { label: 'Update Status', action: 'openUpdateModal' }
          ]}
          data={{
            imageUrl: '/thumb2.png',
            description: 'Review and manage your sales pipeline...',
            progress: 67
          }}
        />

        <List
          title="Recent Activities"
          listType="activity"
          entries={[
            { activity: 'Deal Closed', description: 'Acme Corp - $25K', timestamp: '2 hours ago' },
            { activity: 'Call Scheduled', description: 'Follow-up with TechStart Inc', timestamp: '4 hours ago' },
            { activity: 'Proposal Sent', description: 'Global Solutions - $50K', timestamp: '1 day ago' }
          ]}
        />
      </div>
    </div>
  );
}
```

### **Database Setup Commands**

```sql
-- 1. Create the mockup agent
INSERT INTO core.agents (id, name, type, config, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'sales-dashboard-mockup',
  'mockup',
  '{"component": "SalesDashboardMockup"}',
  NOW(),
  NOW()
);

-- 2. Get the agent ID
SELECT id, name FROM core.agents WHERE name = 'sales-dashboard-mockup';

-- 3. Create entitlement for access control
INSERT INTO core.entitlements (id, name, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'sales-dashboard-mockup',
  'Platform feature - sales dashboard mockup access for UX testing',
  NOW(),
  NOW()
);

-- 4. Grant access to test users
INSERT INTO core.user_entitlements (user_id, entitlement_id, granted_at)
VALUES
  ('47f9db16-f24f-4868-8155-256cfa2edc2c',
   (SELECT id FROM core.entitlements WHERE name = 'sales-dashboard-mockup'),
   NOW());

-- 5. Assign agent to navigation option
UPDATE core.nav_options
SET agent_id = (SELECT id FROM core.agents WHERE name = 'sales-dashboard-mockup'),
    entitlements = '["sales-dashboard-mockup"]'
WHERE label = 'Sales Dashboard' AND tenant_key = 'leaderforge';
```

### **Debugging Agent-Native Mockups**

#### **Check Agent Response Flow**
```javascript
// Browser console debugging - look for these logs:

// 1. Agent invocation
[AgentService] Invoking mockup agent: sales-dashboard-mockup

// 2. Agent response structure
[API/agent/content] Agent response: {
  type: 'mockup',
  content: {
    component: 'SalesDashboardMockup',
    title: 'Mockup: sales-dashboard-mockup',
    // ...
  }
}

// 3. Frontend processing
[DynamicTenantPage] Setting mockup agent schema: {...}
[DynamicTenantPage] Rendering mockup agent response: {...}

// 4. Component loading
[MockupRenderer] Loading SalesDashboardMockup...
```

#### **Common Issues & Solutions**

**Issue: "Feature Coming Soon" instead of mockup**
```sql
-- Check if navigation has agent assigned
SELECT n.label, n.agent_id, a.name as agent_name, a.type
FROM core.nav_options n
LEFT JOIN core.agents a ON n.agent_id = a.id
WHERE n.label = 'Your Navigation Label';

-- If agent_id is null, assign it:
UPDATE core.nav_options
SET agent_id = 'YOUR_AGENT_ID'
WHERE label = 'Your Navigation Label';
```

**Issue: "Content loaded successfully" but no mockup renders**
```javascript
// Check browser console for import errors:
[MockupRenderer] Failed to load mockup component: YourMockupName

// Verify file exists at correct path:
// apps/web/components/mockups/YourMockupName.tsx
```

**Issue: Permission denied / entitlement errors**
```sql
-- Check user entitlements
SELECT u.email, e.name as entitlement_name
FROM core.user_entitlements ue
JOIN core.users u ON ue.user_id = u.id
JOIN core.entitlements e ON ue.entitlement_id = e.id
WHERE u.id = 'YOUR_USER_ID';

-- Check navigation entitlement requirements
SELECT label, entitlements
FROM core.nav_options
WHERE label = 'Your Navigation Label';
```

### **Production Deployment Checklist**

- [ ] **Component Created**: File in `/components/mockups/YourMockup.tsx`
- [ ] **Agent Created**: Database entry with `type: 'mockup'`
- [ ] **Entitlement Created**: Access control entitlement in database
- [ ] **User Access Granted**: Test users have required entitlements
- [ ] **Navigation Connected**: Nav option has `agent_id` assigned
- [ ] **Code Deployed**: Component pushed to production
- [ ] **Testing Complete**: Mockup loads and functions correctly
- [ ] **Documentation Updated**: Update this guide with new patterns

### **Performance Considerations**

#### **Dynamic Import Optimization**
The MockupRenderer uses React.lazy() with dynamic imports:
```typescript
// This creates automatic code splitting
const MockupComponent = lazy(() =>
  import(`../mockups/${componentName}`)
);

// Each mockup becomes a separate bundle
// Only loaded when the user navigates to that feature
```

#### **Error Boundaries**
Built-in error handling prevents mockup issues from crashing the app:
```typescript
// If mockup component has errors, user sees:
// "Mockup Not Available" with refresh option
// Main app continues to function normally
```

### **Extending the System**

#### **Adding New Mockup Types**
```sql
-- Create different agent types for various mockup patterns
INSERT INTO core.agents (name, type, config)
VALUES
  ('interactive-demo', 'mockup', '{"component": "InteractiveDemo", "type": "tutorial"}'),
  ('feature-preview', 'mockup', '{"component": "FeaturePreview", "type": "preview"}'),
  ('workflow-mockup', 'mockup', '{"component": "WorkflowDemo", "type": "workflow"}');
```

#### **Conditional Mockup Logic**
```typescript
// In your mockup component, adapt based on user/context
export default function AdaptiveMockup() {
  const { user, tenant } = useContext();

  if (tenant === 'enterprise') {
    return <EnterpriseMockup />;
  }

  return <StandardMockup />;
}
```

## 🔄 Migration from Legacy System

If you have existing mockups in the old MockupRegistry system:

1. **Move Components**: `app/mockup-name/page.tsx` → `components/mockups/MockupName.tsx`
2. **Create Agents**: Add database entries for each mockup
3. **Setup Entitlements**: Convert `enabledUsers` arrays to database entitlements
4. **Update Navigation**: Assign agent IDs to navigation options
5. **Remove Registry**: Delete MockupRegistry entries (no longer needed)
6. **Test Flow**: Verify complete agent-native flow works

The new system provides better scalability, easier access management, and consistent architecture with the rest of the platform.

---

**The mockup system enables rapid user experience validation without architectural investment - perfect for iterating toward requirements and eventual implementation!**

# Feedback Collection System

### **Built-in Feedback Collection**

The agent-native mockup system includes **built-in feedback collection** through the mockup banner. Every mockup automatically displays:

- **Mockup Banner**: Always visible at the top, showing mockup name and agent info
- **Feedback Button**: Blue "Feedback" button in the top-right corner of the banner
- **Feedback Modal**: Complete rating and comment system

**How Users Access Feedback:**
1. **Navigate to any mockup** (e.g., My Dashboard)
2. **Look for the blue banner** at the top: "🎭 Mockup: [ComponentName]"
3. **Click the "Feedback" button** on the right side of the banner
4. **Complete the feedback form** with rating (1-5) and comments
5. **Submit feedback** - currently logged to console, ready for API integration

**Feedback Data Structure:**
```javascript
{
  mockupName: "MarcusDashboardMockup",
  agentId: "d8cc993a-e1e3-4fdd-92b5-d99bf0e5c390",
  rating: 4,
  feedback: "Really like the layout, but the colors could be brighter",
  timestamp: "2025-06-29T19:16:48.394Z",
  userAgent: "Mozilla/5.0..."
}
```

**Current Implementation:**
- ✅ **Modal Interface**: Complete rating + comment form
- ✅ **Always Available**: Button in every mockup banner
- ✅ **Data Logging**: Console logging with full context
- ✅ **Production Ready**: Works in both development and production
- 🔄 **Future Enhancement**: API endpoint for feedback storage

**Finding Feedback Data:**
```javascript
// Browser console - look for:
[MockupFeedback] {
  mockupName: "...",
  rating: 4,
  feedback: "User comments here...",
  // ... full context
}
```

**API Integration (Future):**
```typescript
// Ready for enhancement to:
await fetch('/api/feedback/mockup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(feedbackData)
});
```