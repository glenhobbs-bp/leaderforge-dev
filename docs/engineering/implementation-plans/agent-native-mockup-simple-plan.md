# Agent-Native Mockup System - Simplified Implementation Plan

**File:** docs/engineering/implementation-plans/agent-native-mockup-simple-plan.md
**Purpose:** Simplified implementation plan for ADR-0014 Agent-Native Mockup System (JSX approach)
**Owner:** Engineering Team
**Tags:** implementation, mockups, agents, jsx, pragmatic

## Overview

This plan implements the simplified version of ADR-0014: mockups as agent-native JSX components with entitlement-based access control. Goal is rapid implementation while maintaining architectural integrity.

**Timeline:** 1 week total
**Effort:** ~2-3 days of engineering work

## Phase 1: Core Infrastructure (Days 1-2)

### Task 1.1: Database Schema Extension
**Owner:** Engineering Team
**Timeline:** 2 hours
**Deliverable:** Mockup agent type support

**Steps:**
1. **Add mockup type to agents table**
   ```sql
   -- Check current agent types
   SELECT DISTINCT type FROM core.agents WHERE type IS NOT NULL;

   -- Add mockup type constraint if needed
   ALTER TABLE core.agents DROP CONSTRAINT IF EXISTS valid_agent_types;
   ALTER TABLE core.agents
   ADD CONSTRAINT valid_agent_types
   CHECK (type IN ('langgraph', 'claude', 'mockup'));
   ```

2. **Create Marcus dashboard mockup agent**
   ```sql
   INSERT INTO core.agents (id, name, type, tenant_key, description, config)
   VALUES (
     'marcus-dashboard-mockup',
     'Marcus Dashboard Mockup',
     'mockup',
     'platform',
     'User dashboard mockup for UX validation',
     '{"component": "MarcusDashboardMockup"}'
   );
   ```

3. **Verify entitlement exists** (from previous work)
   ```sql
   SELECT * FROM core.entitlements WHERE name = 'user-dashboard-mockup';
   ```

### Task 1.2: Agent Dispatcher Extension
**Owner:** Engineering Team
**Timeline:** 4 hours
**Deliverable:** Agent service handles mockup agents

**Steps:**
1. **Extend agentService.ts to handle mockup type**
   ```typescript
   // apps/web/app/lib/agentService.ts

   async function invokeAgent(agentId: string, context: AgentContext) {
     const agent = await getAgent(agentId);

     switch (agent.type) {
       case 'langgraph':
         return invokeLangGraphAgent(agent, context);
       case 'claude':
         return invokeClaudeAgent(agent, context);
       case 'mockup':
         return invokeMockupAgent(agent, context); // NEW
       default:
         throw new Error(`Unknown agent type: ${agent.type}`);
     }
   }

   async function invokeMockupAgent(agent: Agent, context: AgentContext) {
     // Return schema for rendering JSX component
     return {
       type: 'mockup_component',
       data: {
         component: agent.config.component,
         agentId: agent.id,
         context
       },
       schema: {
         type: 'mockup',
         component: agent.config.component,
         title: agent.name,
         description: agent.description
       }
     };
   }
   ```

2. **Update ContentPanel to handle mockup responses**
   ```typescript
   // apps/web/components/ui/ContentPanel.tsx

   function renderContent(agentResponse: AgentResponse) {
     if (agentResponse.type === 'mockup_component') {
       return <MockupRenderer data={agentResponse.data} />;
     }

     // Existing rendering logic...
     return <UniversalSchemaRenderer schema={agentResponse.schema} />;
   }
   ```

### Task 1.3: Mockup Renderer Component
**Owner:** Engineering Team
**Timeline:** 2 hours
**Deliverable:** Generic mockup rendering system

**Steps:**
1. **Create MockupRenderer component**
   ```typescript
   // apps/web/components/mockups/MockupRenderer.tsx

   import dynamic from 'next/dynamic';

   const mockupComponents = {
     MarcusDashboardMockup: dynamic(() => import('./MarcusDashboardMockup')),
     // Future mockups will be registered here
   };

   interface MockupRendererProps {
     data: {
       component: string;
       agentId: string;
       context: any;
     };
   }

   export default function MockupRenderer({ data }: MockupRendererProps) {
     const MockupComponent = mockupComponents[data.component as keyof typeof mockupComponents];

     if (!MockupComponent) {
       return <div>Mockup component '{data.component}' not found</div>;
     }

     return (
       <div className="mockup-container">
         {process.env.NODE_ENV === 'development' && (
           <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm">
             🎭 Mockup: {data.component}
           </div>
         )}
         <MockupComponent />
       </div>
     );
   }
   ```

## Phase 2: Marcus Dashboard Implementation (Days 2-3)

### Task 2.1: Create Marcus Dashboard Mockup Component
**Owner:** Engineering Team
**Timeline:** 4 hours
**Deliverable:** Functional Marcus dashboard JSX component

**Steps:**
1. **Create mockup component directory structure**
   ```
   apps/web/components/mockups/
   ├── MockupRenderer.tsx
   ├── MarcusDashboardMockup.tsx
   └── index.ts
   ```

2. **Implement MarcusDashboardMockup component**
   ```typescript
   // apps/web/components/mockups/MarcusDashboardMockup.tsx

   import { StatCard } from '../widgets/StatCard';
   import { Leaderboard } from '../widgets/Leaderboard';
   // Import other needed components

   export default function MarcusDashboardMockup() {
     // Hardcoded mock data for now
     const mockData = {
       userProgress: {
         videosCompleted: 12,
         totalVideos: 24,
         weeklyGoal: 3,
         streak: 7
       },
       leaderboard: [
         { name: "Marcus Chen", score: 85, rank: 3 },
         { name: "Sarah Kim", score: 92, rank: 1 },
         { name: "Alex Johnson", score: 88, rank: 2 },
         // ... more entries
       ],
       activities: [
         { type: "video", title: "Leadership Basics", timestamp: "2 hours ago" },
         { type: "journal", title: "Daily Reflection", timestamp: "1 day ago" },
         // ... more activities
       ]
     };

     return (
       <div className="space-y-6">
         {/* My Progress Section */}
         <div className="space-y-4">
           <h2 className="text-2xl font-bold text-slate-900">My Progress</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatCard
               title="Video Progress"
               value={`${mockData.userProgress.videosCompleted} of ${mockData.userProgress.totalVideos}`}
               subtitle={`${mockData.userProgress.streak} day streak`}
               icon="Video"
             />
             <StatCard
               title="Next Standup"
               value="Today 2:00 PM"
               subtitle="Add to calendar"
               icon="Users"
               hasButton={true}
               buttonText="Schedule"
             />
             <StatCard
               title="QuickJournal"
               value="2 days ago"
               subtitle="Last entry"
               icon="BookOpen"
               hasButton={true}
               buttonText="Write"
             />
           </div>
         </div>

         {/* Content Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Next Up Card */}
           <div className="bg-white rounded-xl border border-slate-200 p-6 h-[508px]">
             <h3 className="text-lg font-semibold mb-4">Next Up</h3>
             <div className="space-y-4">
               <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                 <Video className="w-12 h-12 text-slate-400" />
               </div>
               <div>
                 <h4 className="font-medium">Leadership Foundations</h4>
                 <p className="text-sm text-slate-600">75% complete • 12 min remaining</p>
               </div>
               <button className="w-full bg-blue-600 text-white rounded-full py-2 px-4 text-sm font-medium hover:bg-blue-700">
                 Continue
               </button>
             </div>
           </div>

           {/* My Activity */}
           <div className="bg-white rounded-xl border border-slate-200 p-6 h-[508px]">
             <h3 className="text-lg font-semibold mb-4">My Activity</h3>
             <div className="text-xs text-slate-500 mb-4">6 this week</div>
             <div className="space-y-3 overflow-y-auto max-h-[400px]">
               {mockData.activities.map((activity, index) => (
                 <div key={index} className="flex items-center space-x-3 py-2">
                   <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                     {activity.type === 'video' ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                   </div>
                   <div className="flex-1">
                     <div className="text-sm font-medium">{activity.title}</div>
                     <div className="text-xs text-slate-500">{activity.timestamp}</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Leaderboard */}
           <div className="bg-white rounded-xl border border-slate-200 p-6 h-[508px]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">Leaderboard</h3>
               <div className="text-xs text-slate-500">#3 of 8</div>
             </div>
             <div className="space-y-3 overflow-y-auto max-h-[400px]">
               {mockData.leaderboard.map((entry, index) => (
                 <div
                   key={index}
                   className={`flex items-center space-x-3 py-2 ${
                     entry.name === 'Marcus Chen' ? 'bg-blue-50 rounded-lg px-3' : ''
                   }`}
                 >
                   <div className="text-sm font-medium text-slate-500">#{entry.rank}</div>
                   <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                   <div className="flex-1">
                     <div className="text-sm font-medium">{entry.name}</div>
                   </div>
                   <div className="text-sm font-medium">{entry.score}</div>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>
     );
   }
   ```

### Task 2.2: Update Navigation to Use Mockup Agent
**Owner:** Engineering Team
**Timeline:** 1 hour
**Deliverable:** Navigation routes to mockup agent

**Steps:**
1. **Update nav_options table**
   ```sql
   UPDATE core.nav_options
   SET agent_id = 'marcus-dashboard-mockup'
   WHERE id = 'e51a7dde-e349-41c4-b3ed-4a8a75155f94'; -- Marcus "My Dashboard" nav option
   ```

2. **Verify entitlement access**
   ```sql
   -- Check that Marcus user has the entitlement
   SELECT * FROM core.user_entitlements ue
   JOIN core.entitlements e ON e.id = ue.entitlement_id
   WHERE ue.user_id = 'bb893b34-8a5e-4f4e-a55e-cd8c2e0f1f3b' -- Marcus user ID
     AND e.name = 'user-dashboard-mockup';
   ```

## Phase 3: Testing and Documentation (Day 3)

### Task 3.1: End-to-End Testing
**Owner:** Engineering Team
**Timeline:** 2 hours
**Deliverable:** Verified mockup flow

**Test Scenarios:**
1. **Navigation Flow**
   - User with entitlement clicks "My Dashboard"
   - Agent dispatcher routes to mockup agent
   - MockupRenderer loads MarcusDashboardMockup
   - Dashboard renders correctly

2. **Entitlement Enforcement**
   - User without entitlement gets standard agent content
   - User with entitlement sees mockup

3. **Design System Compliance**
   - All styling uses established design system
   - Mobile responsiveness works
   - Glassmorphism effects on modals

### Task 3.2: Documentation
**Owner:** Product Team
**Timeline:** 2 hours
**Deliverable:** Mockup development guide

**Create documentation:**
1. **Mockup Development Guide**
   ```markdown
   # Creating Agent-Native Mockups

   ## Step 1: Create JSX Component
   ## Step 2: Register in MockupRenderer
   ## Step 3: Create Agent in Database
   ## Step 4: Create/Assign Entitlement
   ## Step 5: Update Navigation
   ## Step 6: Test End-to-End
   ```

2. **Architecture Decision Summary**
3. **Future Evolution Path**

## Success Criteria

### Technical Validation
- [ ] Marcus dashboard loads via agent navigation
- [ ] Entitlement system controls access
- [ ] Component renders in ContentPanel
- [ ] Performance matches existing agents
- [ ] Design system compliance maintained

### Process Validation
- [ ] New mockup can be created in < 1 day
- [ ] No bypass systems created
- [ ] Admin can control access via entitlements
- [ ] Development workflow documented

## Future Evolution

### Phase 4: Additional Mockups (Future)
- Team Leader Dashboard mockup
- Admin Panel mockup
- Mobile-specific layouts

### Phase 5: Widget Composition Evolution (Future)
- Extract reusable components into widget registry
- Implement MockupCompositionTool
- Create standardized mock data fixtures
- Build toward agentic UI composition

## Risk Mitigation

**Development Risks:**
- **Component complexity** → Start simple, iterate based on feedback
- **Design system drift** → Regular design reviews
- **Performance issues** → Monitor rendering performance

**Process Risks:**
- **Team adoption** → Provide clear documentation and examples
- **Maintenance overhead** → Keep mockups simple until widget evolution

---

**Note:** This simplified approach gets us 80% of the value with 20% of the complexity, while maintaining proper architectural foundation for future evolution.