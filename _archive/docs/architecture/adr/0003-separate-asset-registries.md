# ADR-0003: Separate Widget and Tool Registries with Unified Discovery

**File:** docs/architecture/adr/0003-separate-asset-registries.md
**Purpose:** Architecture Decision Record for separate widget and tool registries approach
**Owner:** Senior Architect
**Tags:** ADR, architecture, registries, widgets, tools, discovery

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2024-01-15 |
| **Status** | Accepted |
| **Decision Type** | Architecture |
| **Impact Level** | Medium |
| **Stakeholders** | Frontend Team, Backend Team, Agent Developers |
| **Supersedes** | N/A |

## Context

**Background:** Agent-native composition requires discoverability of both UI widgets (cards, grids, forms) and backend tools (content fetching, progress tracking, analytics). The question is whether these should be managed in a single registry or separate specialized registries.

**Problem Statement:** Agent discovery architecture needs to handle:
- UI widgets with rendering schemas and component references
- Backend tools with API interfaces and capability descriptions
- Different development lifecycles (UI vs backend changes)
- Different consumer patterns (agents vs frontend renderer)

**Goals:**
- Optimize agent discovery performance for specific asset types
- Maintain type safety and clear interfaces
- Support independent development of widgets vs tools
- Enable unified discovery when agents need both types

**Constraints:**
- Must support TypeScript type safety for all asset types
- Discovery performance <50ms for agent queries
- Development teams should work independently on widgets vs tools
- Future extensibility for new asset types (compositions, templates, etc.)

## Decision

**Summary:** Implement separate WidgetRegistry and ToolRegistry with a unified AssetDiscovery service that provides cross-registry search capabilities.

**Details:**
- **WidgetRegistry**: Manages UI widgets with React component references and rendering schemas
- **ToolRegistry**: Manages backend tools with API interfaces and capability metadata
- **AssetDiscovery**: Unified service that searches across all registries based on agent queries
- **Type Safety**: Each registry maintains its own TypeScript interfaces
- **Cross-References**: Tools can reference compatible widgets and vice versa

## Options Considered

### Option 1: Separate Registries with Unified Discovery (Selected)
**Description:** Dedicated registries per asset type with unified discovery layer

**Pros:**
- **Type safety**: Strong TypeScript types for each asset category
- **Performance**: Optimized queries per asset type, smaller result sets
- **Development independence**: Teams can work on widgets/tools separately
- **Focused interfaces**: Registry APIs tailored to specific asset needs
- **Extensibility**: Easy to add new asset types (CompositionRegistry, etc.)

**Cons:**
- **Additional complexity**: More interfaces to maintain
- **Discovery overhead**: Unified discovery needs to coordinate multiple registries
- **Potential duplication**: Some discovery logic may be repeated

**Risk Level:** Low

### Option 2: Single Unified Registry
**Description:** One registry managing all asset types with union types

**Pros:**
- **Simplicity**: Single interface for all asset management
- **Unified caching**: One cache strategy for all assets
- **Single discovery**: Agents make one call to get everything

**Cons:**
- **Type complexity**: Union types (Widget | Tool | Composition) harder to manage
- **Performance**: Large registry even when agent only needs widgets
- **Development coupling**: Widget and tool changes affect same system
- **Schema complexity**: One schema must handle all asset types

**Risk Level:** Medium

### Option 3: Registry per Module
**Description:** Each module (content, progress, auth) has own registry

**Pros:**
- **Module alignment**: Registries align with module boundaries
- **Independent deployment**: Modules can update their registries independently

**Cons:**
- **Agent complexity**: Agents need to know which modules have which assets
- **Cross-module discovery**: Difficult to find assets across modules
- **Duplication**: Similar widgets might exist in multiple modules

**Risk Level:** High

## Decision Rationale

**Primary Factors:**
1. **Type safety optimization**: Separate registries enable precise TypeScript interfaces
2. **Performance requirements**: Asset-specific queries faster than generic searches
3. **Development workflow**: Widget and tool development have different lifecycles
4. **Agent simplicity**: Unified discovery hides registry complexity from agents

**Trade-offs Accepted:**
- **Additional interfaces** for better type safety and performance
- **Discovery coordination complexity** for optimized individual registry performance

**Assumptions:**
- Agents will typically need either widgets OR tools, not always both
- Performance gains from specialized registries outweigh discovery coordination overhead
- Development teams will benefit from independent widget/tool development

## Implementation Impact

### Technical Impact
- **Architecture Changes**: Three services (WidgetRegistry, ToolRegistry, AssetDiscovery)
- **Technology Stack**: TypeScript interfaces, in-memory caching, Redis for shared cache
- **Data Migration**: N/A (new system)
- **Performance**: <50ms discovery, <20ms individual registry queries
- **Security Impact**: Registry access controls, asset validation, safe discovery filtering

### Process Impact
- **Development Workflow**: Separate development paths for widgets vs tools
- **Testing Strategy**: Unit tests per registry, integration tests for unified discovery
- **Deployment**: Registries can be updated independently within monolith
- **Monitoring**: Separate metrics for widget/tool registration and discovery performance

### Team Impact
- **Learning Curve**: Low - familiar registry patterns with clear interfaces
- **Training Needs**: Registry development guidelines, asset schema design
- **Resource Requirements**: Backend developer for registry implementation

## Success Criteria

**Technical Metrics:**
- Discovery performance <50ms (95th percentile)
- Registry query performance <20ms (95th percentile)
- 100% type safety coverage for all asset types
- Support for 50+ widgets, 20+ tools within 6 months

**Business Metrics:**
- Zero agent discovery failures due to registry issues
- 25% faster widget development with dedicated registry
- 30% faster tool development with focused interfaces
- 90% developer satisfaction with registry developer experience

**Timeline:**
- **Decision Implementation:** January 2024
- **Registry Core Implementation:** February 2024
- **Unified Discovery Service:** March 2024
- **First Assets Registered:** March 2024

## Risk Assessment

### High Risks
- **Risk:** Discovery coordination becomes performance bottleneck
  - **Mitigation:** Aggressive caching, parallel registry queries, performance monitoring
  - **Contingency:** Optimize discovery algorithm or consolidate high-usage registries

### Medium Risks
- **Risk:** Registry interface proliferation as asset types grow
  - **Mitigation:** Common base interfaces, code generation for boilerplate
  - **Contingency:** Consolidate similar registries or create registry-of-registries pattern

### Low Risks
- **Risk:** Type complexity management overhead
  - **Mitigation:** Clear TypeScript patterns, automated type generation
  - **Contingency:** Simplify type hierarchies or use runtime validation

## Follow-up Actions

- [ ] **Design registry base interfaces** (Senior Architect, Jan 20)
- [ ] **Implement WidgetRegistry core** (Frontend Lead, Feb 5)
- [ ] **Implement ToolRegistry core** (Backend Lead, Feb 5)
- [ ] **Build AssetDiscovery service** (Senior Engineer, Feb 15)
- [ ] **Create registry developer guides** (Tech Writer, Mar 1)
- [ ] **Documentation Updates**: Asset development guidelines, discovery API reference
- [ ] **Implementation Plan**: Reference asset-registry-implementation-plan.md

## References

- **Related ADRs:** ADR-0001 (Agent-Native Composition), ADR-0002 (Modular Monolith)
- **Documentation:** [Agent-Native Composition Architecture](../overview/agent-native-composition-architecture.md)
- **Research:** Registry pattern analysis, type system design patterns
- **Discussion:** Architecture team review meeting, Jan 13, 2024

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-01-15 | Senior Architect | Initial version |

---

**Note:** This registry architecture balances type safety, performance, and development workflow optimization for agent-native composition.