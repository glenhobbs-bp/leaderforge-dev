# Agent-Native Mockup System Implementation Plan

**File:** docs/engineering/implementation-plans/agent-native-mockup-system-plan.md
**Purpose:** Detailed implementation plan for ADR-0014 Agent-Native Mockup Composition System
**Owner:** Engineering Team
**Tags:** implementation, mockups, widgets, agents, composition

## Overview

This plan implements ADR-0014 decision to build mockups as agent-native widget compositions with mock data fixtures. The goal is to build real infrastructure while serving UX validation needs.

## Phase 1: Foundation Assessment (Week 1)

### Task 1.1: Widget Registry Audit
**Owner:** Product Team
**Timeline:** 2 days
**Deliverable:** Widget gap analysis document

**Steps:**
1. **Inventory existing widgets**
   ```bash
   # Find all existing widgets
   find apps/web/components/widgets -name "*.tsx" | grep -v __tests__
   ```

2. **Analyze Marcus dashboard requirements**
   - StatCard widgets (3 variations needed)
   - LeaderForgeCard (video content display)
   - List widget (leaderboard, activity feed)
   - Modal components (StandupModal, JournalModal)

3. **Document widget gaps**
   ```markdown
   ## Widget Audit Results

   ### Existing Widgets (Ready to Use)
   - ✅ StatCard - `apps/web/components/widgets/StatCard.tsx`
   - ✅ Grid - `apps/web/components/widgets/Grid.tsx`
   - ✅ Leaderboard - `apps/web/components/widgets/Leaderboard.tsx`

   ### Missing Widgets (Need to Build)
   - ❌ LeaderForgeCard - Video content display with progress
   - ❌ ActivityFeed - List of user activities with timestamps
   - ❌ ModalContainer - Reusable modal wrapper

   ### Widget Enhancements Needed
   - 🔄 StatCard - Needs button support for interactive actions
   - 🔄 List - Needs scrolling behavior and height constraints
   ```

### Task 1.2: Mock Data Schema Design
**Owner:** Engineering Team
**Timeline:** 2 days
**Deliverable:** Mock data schema specification

**Steps:**
1. **Analyze data patterns from existing code**
   ```bash
   # Find data patterns in current implementation
   grep -r "mockData\|testData" apps/web/app/test-dashboard/
   ```

2. **Design standardized mock data schema**
   ```typescript
   // Mock data schema patterns
   interface MockDataFixture {
     id: string;
     name: string;
     description: string;
     data: Record<string, unknown>;
     widgets: string[]; // Widget types that use this data
   }

   interface UserProgressData {
     videosCompleted: number;
     totalVideos: number;
     weeklyGoal: number;
     streak: number;
     lastActivity: string;
   }

   interface LeaderboardData {
     entries: Array<{
       userId: string;
       name: string;
       score: number;
       rank: number;
       avatar?: string;
     }>;
     currentUser: string;
     totalParticipants: number;
   }
   ```

3. **Create mock data fixtures directory structure**
   ```
   apps/web/lib/mockups/fixtures/
   ├── user-progress.json
   ├── leaderboard.json
   ├── content.json
   ├── activity-feed.json
   └── schemas/
       ├── MockDataFixture.ts
       └── index.ts
   ```

## Phase 2: Core Infrastructure (Week 2)

### Task 2.1: Database Schema Extension
**Owner:** Engineering Team
**Timeline:** 1 day
**Deliverable:** Migration script for agent types

**Steps:**
1. **Check current core.agents table structure**
   ```sql
   -- Audit current agents table
   \d core.agents
   SELECT DISTINCT type FROM core.agents WHERE type IS NOT NULL;
   ```

2. **Add mockup agent type constraint**
   ```sql
   -- Add mockup type to agents table
   ALTER TABLE core.agents
   ADD CONSTRAINT valid_agent_types
   CHECK (type IN ('langgraph', 'claude', 'mockup', 'composition'));
   ```

3. **Create mockup agent registration**
   ```sql
   INSERT INTO core.agents (id, name, type, tenant_key, description, config)
   VALUES (
     'marcus-dashboard-mockup',
     'Marcus Dashboard Mockup',
     'mockup',
     'platform',
     'User dashboard mockup for UX validation',
     '{"widgets": ["StatCard", "LeaderForgeCard", "List"], "layout": "dashboard", "mockDataFixture": "user-dashboard-data"}'
   );
   ```

### Task 2.2: MockupCompositionTool Implementation
**Owner:** Engineering Team
**Timeline:** 3 days
**Deliverable:** Functional MockupCompositionTool

**Steps:**
1. **Create tool structure**
   ```typescript
   // apps/web/lib/tools/MockupCompositionTool.ts
   export class MockupCompositionTool {
     async composeWidgets(
       agentConfig: MockupAgentConfig,
       mockDataFixture: string
     ): Promise<ReactElement> {
       // Load mock data
       // Validate widget registry
       // Compose widgets according to layout
       // Return composed JSX
     }
   }
   ```

2. **Implement mock data loader**
   ```typescript
   // apps/web/lib/mockups/MockDataLoader.ts
   export class MockDataLoader {
     async loadFixture(fixtureName: string): Promise<MockDataFixture> {
       const fixture = await import(`../fixtures/${fixtureName}.json`);
       return this.validateFixture(fixture);
     }
   }
   ```

3. **Create widget composition logic**
   ```typescript
   // apps/web/lib/mockups/WidgetComposer.ts
   export class WidgetComposer {
     composeLayout(
       widgets: WidgetConfig[],
       layout: LayoutType,
       mockData: Record<string, unknown>
     ): ReactElement {
       // Compose widgets according to layout specification
     }
   }
   ```

### Task 2.3: Agent Dispatcher Extension
**Owner:** Engineering Team
**Timeline:** 2 days
**Deliverable:** Agent dispatcher handles mockup agents

**Steps:**
1. **Extend agent service to handle mockup type**
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
   ```

2. **Implement mockup agent invocation**
   ```typescript
   async function invokeMockupAgent(agent: Agent, context: AgentContext) {
     const compositionTool = new MockupCompositionTool();
     const result = await compositionTool.composeWidgets(
       agent.config,
       agent.config.mockDataFixture
     );

     return {
       type: 'mockup_composition',
       data: result,
       schema: generateMockupSchema(agent.config)
     };
   }
   ```

## Phase 3: Widget Development (Week 3)

### Task 3.1: Missing Widget Implementation
**Owner:** Engineering Team
**Timeline:** 4 days
**Deliverable:** Required widgets built and registered

**Priority Widgets to Build:**

1. **LeaderForgeCard Widget**
   ```typescript
   // apps/web/components/widgets/LeaderForgeCard.tsx
   interface LeaderForgeCardProps {
     title: string;
     subtitle?: string;
     progress?: number;
     estimatedTime?: string;
     buttonText?: string;
     onButtonClick?: () => void;
     schema: WidgetSchema;
   }
   ```

2. **ActivityFeed Widget**
   ```typescript
   // apps/web/components/widgets/ActivityFeed.tsx
   interface ActivityFeedProps {
     activities: Activity[];
     maxHeight?: string;
     showTimestamps?: boolean;
     schema: WidgetSchema;
   }
   ```

3. **ModalContainer Widget**
   ```typescript
   // apps/web/components/widgets/ModalContainer.tsx
   interface ModalContainerProps {
     isOpen: boolean;
     onClose: () => void;
     title: string;
     children: ReactNode;
     schema: WidgetSchema;
   }
   ```

### Task 3.2: Widget Registry Updates
**Owner:** Engineering Team
**Timeline:** 1 day
**Deliverable:** All new widgets registered

**Steps:**
1. **Update widget registry**
   ```typescript
   // apps/web/components/widgets/index.ts
   export { LeaderForgeCard } from './LeaderForgeCard';
   export { ActivityFeed } from './ActivityFeed';
   export { ModalContainer } from './ModalContainer';
   ```

2. **Create widget schemas**
   ```typescript
   // packages/asset-core/src/types/WidgetSchema.ts
   export const LeaderForgeCardSchema: WidgetSchema = {
     type: 'LeaderForgeCard',
     properties: {
       title: { type: 'string', required: true },
       progress: { type: 'number', min: 0, max: 1 },
       // ... other properties
     }
   };
   ```

## Phase 4: Integration and Testing (Week 4)

### Task 4.1: Marcus Dashboard Migration
**Owner:** Engineering Team
**Timeline:** 3 days
**Deliverable:** Marcus dashboard running on new system

**Steps:**
1. **Create mock data fixtures**
   ```json
   // apps/web/lib/mockups/fixtures/marcus-dashboard.json
   {
     "id": "marcus-dashboard-data",
     "name": "Marcus Dashboard Mock Data",
     "data": {
       "userProgress": {
         "videosCompleted": 12,
         "totalVideos": 24,
         "weeklyGoal": 3,
         "streak": 7
       },
       "leaderboard": [
         {"name": "Marcus Chen", "score": 85, "rank": 3},
         {"name": "Sarah Kim", "score": 92, "rank": 1}
       ],
       "upcomingContent": {
         "title": "Leadership Foundations",
         "progress": 0.75,
         "estimatedTime": "12 min"
       }
     }
   }
   ```

2. **Update nav_options to point to mockup agent**
   ```sql
   UPDATE core.nav_options
   SET agent_id = 'marcus-dashboard-mockup'
   WHERE id = 'e51a7dde-e349-41c4-b3ed-4a8a75155f94';
   ```

3. **Test end-to-end flow**
   - User clicks "My Dashboard" nav item
   - Agent dispatcher routes to mockup agent
   - MockupCompositionTool loads mock data
   - Widgets compose into dashboard layout
   - User sees functional dashboard

### Task 4.2: Documentation and Examples
**Owner:** Product Team
**Timeline:** 2 days
**Deliverable:** Comprehensive mockup system documentation

**Deliverables:**
1. **Widget Composition Guide**
   ```markdown
   # Creating Mockups with Widget Composition

   ## Step 1: Define Your Layout
   ## Step 2: Identify Required Widgets
   ## Step 3: Create Mock Data Fixtures
   ## Step 4: Register Mockup Agent
   ## Step 5: Test and Iterate
   ```

2. **Mock Data Best Practices**
3. **Widget Development Guidelines**
4. **Troubleshooting Guide**

## Success Metrics

### Technical Validation
- [ ] All widgets load from registry (zero hardcoded components)
- [ ] Mock data fixtures validate against schemas
- [ ] Mockup agent registers successfully in core.agents
- [ ] End-to-end navigation works (nav → agent → mockup → render)
- [ ] Performance matches existing agent performance

### User Experience Validation
- [ ] Marcus dashboard visual quality matches original
- [ ] Interactive elements work (buttons, modals, scrolling)
- [ ] Design system compliance maintained
- [ ] Mobile responsiveness preserved

### Process Validation
- [ ] New mockup creation takes < 2 days
- [ ] Widget gaps clearly identified during mockup creation
- [ ] Mock data maintenance overhead is manageable
- [ ] Team can create mockups independently

## Risk Mitigation

### Technical Risks
- **Widget registry gaps** → Prioritize core widgets first, build incrementally
- **Mock data complexity** → Start simple, add complexity as needed
- **Performance issues** → Monitor metrics, optimize if needed

### Process Risks
- **Team adoption** → Provide hands-on training and documentation
- **Time overruns** → Break tasks into smaller chunks, adjust timeline if needed
- **Quality concerns** → Implement review process for widget development

## Next Steps After Implementation

1. **Create 2-3 additional mockups** using the new system
2. **Measure widget reuse rates** across mockups
3. **Identify patterns** for common mockup layouts
4. **Begin planning** agentic UI composition capabilities
5. **Evaluate progress** toward ADR success criteria

---

**Note:** This plan should be reviewed weekly during implementation to adjust for any discovered complexities or changed requirements.