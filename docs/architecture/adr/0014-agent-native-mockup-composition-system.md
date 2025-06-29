# ADR-0014: Agent-Native Mockup Composition System

**File:** docs/architecture/adr/0014-agent-native-mockup-composition-system.md
**Purpose:** Architecture Decision Record for implementing mockups as agent-native widget compositions
**Owner:** Senior Architect
**Tags:** ADR, architecture, mockups, widgets, composition, agents

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2024-12-29 |
| **Status** | Accepted |
| **Decision Type** | Architecture |
| **Impact Level** | High |
| **Stakeholders** | Product Team, Engineering Team, UX Team |
| **Supersedes** | N/A |

## Context

**Background:** We need a system for creating UI mockups to validate user experience and gather feedback before full implementation. Initially considered a simple "mockup router" that would bypass the agent system, but this conflicts with our agent-native architecture principles.

**Problem Statement:** How do we create mockups that serve both immediate UX validation needs and advance our long-term vision of agent-driven UI composition, without creating parallel systems that bypass our established architectural patterns?

**Goals:**
- Enable rapid UX validation through mockups
- Advance toward agent-native UI composition
- Build reusable infrastructure instead of throwaway prototypes
- Maintain architectural consistency with established ADRs
- Identify gaps in widget registry and composition capabilities

**Constraints:**
- Must align with agent-native composition system (ADR-0001)
- Must leverage existing widget registry and schema patterns
- Must work within entitlement-based access control
- Should build toward conversational UI generation capability

## Decision

**Summary:** Implement mockups as agent-native JSX components integrated as a new agent type in the core.agents table, with entitlement-based access control and evolution path to widget composition.

**Details:** Mockups will be treated as first-class agents in our system with type="mockup", implemented as single JSX components that render in the ContentPanel through the standard agent dispatcher. Access is controlled via entitlements (admin-driven), and the architecture provides a foundation for future evolution to widget composition when infrastructure matures.

## Options Considered

### Option 1: Static UI Mockups (Monolithic JSX)
**Description:** Create monolithic JSX pages for visual validation with hardcoded components and data

**Pros:**
- Fast to create (~4-6 hours)
- Immediate visual validation
- Design system alignment
- No dependency complexity

**Cons:**
- Throwaway code with zero reusability
- Doesn't advance real architecture
- No learning about widget gaps or data patterns
- Creates parallel system outside agent architecture

**Risk Level:** Low

### Option 2: Agent-Native JSX Components with Evolution Path
**Description:** Implement mockups as single JSX components through agent system, with architecture for future widget composition evolution

**Pros:**
- Maintains agent-native architecture consistency
- Fast implementation (~2-3 days vs weeks)
- Entitlement-based access control (admin-driven)
- Standard ContentPanel rendering path
- Evolution path to widget composition when ready
- Immediate UX validation capability
- No complex data binding during mockup phase
- Proper architectural foundation

**Cons:**
- Some throwaway JSX code initially
- Requires code deploys for new mockups
- Doesn't immediately advance widget registry
- Limited reusability until widget evolution

**Risk Level:** Low

### Option 3: Fully Agentic Conversational UI
**Description:** Implement immediate conversational UI generation where users describe needs and agents build interfaces dynamically

**Pros:**
- Ultimate vision alignment
- No pre-built layouts needed
- True agent-driven composition

**Cons:**
- Too advanced for current technical capability
- User behavior not ready
- Requires complete infrastructure first
- High implementation risk

**Risk Level:** High

## Decision Rationale

**Primary Factors:**
1. **Architectural Consistency:** Option 2 maintains agent-native architecture (ADR-0001) while avoiding premature complexity
2. **Pragmatic Implementation:** Option 2 delivers immediate value (~2-3 days) vs weeks of infrastructure building
3. **Evolution Foundation:** Option 2 creates proper architectural foundation for future widget composition advancement
4. **Risk Management:** Option 2 minimizes implementation risk while preserving strategic direction

**Trade-offs Accepted:**
- Some initial throwaway JSX code in exchange for fast delivery and architectural purity
- Code deploys for new mockups in exchange for admin-controlled entitlement access
- Delayed widget registry advancement in exchange for immediate UX validation capability

**Assumptions:**
- JSX components can be created rapidly while maintaining design system compliance
- Agent infrastructure can handle mockup type with minimal extensions
- Entitlement system provides sufficient access control granularity
- Widget composition evolution can be implemented when infrastructure matures

## Implementation Impact

### Technical Impact
- **Architecture Changes:**
  - Add `type = 'mockup'` to core.agents table
  - Extend agent dispatcher to handle mockup agents
  - Create simple JSX component rendering for mockup agents
- **Technology Stack:** No new external dependencies
- **Data Migration:** Add mockup agent types to existing core.agents table
- **Performance:** Minimal impact - same rendering path as other agents
- **Security Impact:** Leverages existing entitlement system for access control

### Process Impact
- **Development Workflow:** Mockups created as JSX components with design system compliance
- **Testing Strategy:** Standard component testing, entitlement access validation
- **Deployment:** Mockups deploy as code through existing pipeline, access controlled via entitlements
- **Monitoring:** Mockup usage tracked through existing agent observability

### Team Impact
- **Learning Curve:** Minimal - JSX component development with existing patterns
- **Training Needs:** Documentation on agent registration and entitlement setup
- **Resource Requirements:** Fast development cycles (~2-3 days per mockup)

## Success Criteria

**Technical Metrics:**
- 100% of mockups registered as agents in core.agents table
- All mockups render through standard ContentPanel path
- Entitlement system controls all mockup access
- Mockup rendering performance matches standard agent performance
- Design system compliance maintained across all mockups

**Business Metrics:**
- UX validation feedback quality maintains current levels
- Time-to-mockup under 2-3 work days
- Zero bypass systems created outside agent architecture
- Admin-controlled access without code deployments

**Timeline:**
- **Decision Implementation:** Immediate - start all new mockups using this approach
- **Full Migration:** January 2025 - convert existing Marcus dashboard mockup

## Risk Assessment

### High Risks
- **Risk:** Widget registry may not be mature enough for complex compositions
  - **Mitigation:** Audit existing widgets, prioritize missing critical widgets
  - **Contingency:** Hybrid approach - new widgets for key gaps, simple components for edge cases

### Medium Risks
- **Risk:** Mock data maintenance overhead as mockups grow
  - **Mitigation:** Create standardized mock data schemas and generation tools
  - **Contingency:** Generate mock data from real data samples

- **Risk:** Team productivity impact during transition period
  - **Mitigation:** Provide comprehensive documentation and examples
  - **Contingency:** Pair programming for first few mockup implementations

### Low Risks
- **Risk:** Performance impact from agent dispatch overhead
  - **Mitigation:** Monitor agent performance metrics
  - **Contingency:** Optimize agent dispatcher if needed

## Follow-up Actions

- [ ] **Agent Type Extension:** Add mockup type to core.agents table and agent dispatcher (Owner: Engineering Team, Deadline: 2025-01-03)
- [ ] **Mockup Rendering Logic:** Implement JSX component rendering for mockup agents (Owner: Engineering Team, Deadline: 2025-01-06)
- [ ] **Documentation:** Create mockup development guide with agent registration process (Owner: Product Team, Deadline: 2025-01-06)
- [ ] **Marcus Dashboard Migration:** Convert existing mockup to agent-native approach (Owner: Engineering Team, Deadline: 2025-01-10)
- [ ] **Future Evolution Plan:** Design widget composition migration path for later implementation (Owner: Product Team, Deadline: 2025-01-15)

## Implementation Example

### Agent Registration
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

### Entitlement Setup
```sql
INSERT INTO core.entitlements (name, display_name, description, tenant_key, features)
VALUES (
  'marcus-dashboard-mockup',
  'Marcus Dashboard Mockup',
  'Access to Marcus dashboard mockup for UX validation',
  'platform',
  '{"mockup": true, "dashboard": true}'
);
```

### JSX Component Implementation
```tsx
// apps/web/components/mockups/MarcusDashboardMockup.tsx
export default function MarcusDashboardMockup() {
  return (
    <div className="space-y-6">
      {/* My Progress Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">My Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Video Progress" value="12 of 24" />
          <StatCard title="5-Minute Standup" value="Today 2:00 PM" />
          <StatCard title="QuickJournal" value="2 days ago" />
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LeaderForgeCard title="Leadership Foundations" progress={0.75} />
        <ActivityList activities={mockActivities} />
        <Leaderboard entries={mockLeaderboard} currentUser="Marcus Chen" />
      </div>
    </div>
  );
}
```

## References

- **Related ADRs:**
  - ADR-0001: Agent-Native Composition System
  - ADR-0008: Pure Schema-Driven Widgets
  - ADR-0003: Separate Asset Registries
- **Documentation:**
  - Widget Registry Documentation
  - Agent Development Guide
- **Research:**
  - Widget composition patterns analysis
  - Mock data fixture best practices

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-12-29 | Senior Architect | Initial version |
| 2024-12-29 | Senior Architect | Updated to pragmatic JSX approach - simplified implementation while maintaining agent-native architecture |

---

**Note:** This ADR should be reviewed quarterly to ensure it remains current and effective as we progress toward fully agentic UI composition.