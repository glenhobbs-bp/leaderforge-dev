# 🎭 How-To Guide: Creating and Implementing Mockups

## Overview

This guide walks you through creating and implementing mockups using LeaderForge's **Generalized Mockup Routing System**. This system allows you to show mockups to select users in production context for rapid user experience validation.

## 🚀 Quick Start (5 Minutes)

### **Step 1: Create Your Mockup Component**
```typescript
// apps/web/app/team-leader-mockup/page.tsx
export default function TeamLeaderMockup() {
  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Team Dashboard</h1>
        <p className="text-sm text-gray-500">Lead your team to success</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your mockup content here */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Team Performance</h2>
          <p>Performance metrics...</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <p>Activity feed...</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">Action Items</h2>
          <p>Tasks and reminders...</p>
        </div>
      </div>
    </div>
  );
}
```

### **Step 2: Register Your Mockup**
```typescript
// apps/web/lib/mockups/MockupRegistry.ts

// 1. Import your component
import TeamLeaderMockup from '../../app/team-leader-mockup/page';

// 2. Add to MOCKUP_REGISTRY
export const MOCKUP_REGISTRY: Record<string, MockupConfig> = {
  // Existing mockups...

  // New Team Leader mockup
  'your-nav-uuid-here': {
    component: TeamLeaderMockup,
    name: 'Team Leader Dashboard',
    description: 'Team management and performance tracking mockup',
    featureFlag: 'ENABLE_TEAM_LEADER_MOCKUP',
    enabledUsers: [
      '47f9db16-f24f-4868-8155-256cfa2edc2c', // Your user ID
      // Add other test users
    ],
    enabledForAll: false, // Production safety
  },
};
```

### **Step 3: Find Navigation UUID**
```typescript
// Check browser dev tools console or use debug API
// GET /api/debug/mockups

// Or query database:
SELECT id, label, href, context_key
FROM core.nav_options
WHERE label ILIKE '%team%' OR href ILIKE '%team%';
```

### **Step 4: Test & Deploy**
```bash
# Commit and push
git add .
git commit -m "feat: Add Team Leader mockup"
git push origin main

# Mockup is live immediately for enabled users!
```

## 📋 Detailed Implementation Guide

### **Finding Navigation UUIDs**

#### **Method 1: Database Query**
```sql
-- Find navigation options to mock
SELECT
  id,
  label,
  href,
  description,
  context_key,
  section
FROM core.nav_options
WHERE context_key = 'leaderforge'
ORDER BY section, "order";
```

#### **Method 2: Debug API**
```bash
# Get all navigation options for context
GET /api/nav/leaderforge

# Get mockup status
GET /api/debug/mockups?user_id=YOUR_UUID
```

#### **Method 3: Browser Console**
Navigate to the page and check console logs:
```javascript
// Look for navigation selection logs
[DynamicTenantPage] Selected nav option: {navOptionId: "uuid-here"}
```

### **Component Development Guidelines**

#### **Design System Compliance**
```typescript
// Use established patterns from existing components
export default function YourMockup() {
  return (
    <div className="p-6">
      {/* Header matching dashboard pattern */}
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Your Title</h1>
        <p className="text-sm text-gray-500">Your subtitle</p>
      </header>

      {/* Use existing component patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards matching StatCard pattern */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Card Title</h2>
            <ActivityIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">Card content...</p>
        </div>
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

#### **User-Specific Access**
```typescript
// Individual users (safest for production)
enabledUsers: [
  '47f9db16-f24f-4868-8155-256cfa2edc2c', // Glen
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