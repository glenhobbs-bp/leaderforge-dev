# ADR-0022: Entitlement Management Architecture

**File:** docs/architecture/adr/0022-entitlement-management-architecture.md
**Purpose:** Architecture Decision Record for comprehensive entitlement management system
**Owner:** Senior Architect
**Tags:** ADR, architecture, entitlements, access-control, multi-tenancy

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2024-12-19 |
| **Status** | Accepted |
| **Decision Type** | Architecture |
| **Impact Level** | High |
| **Stakeholders** | Engineering Team, Product Team, Admin Users, End Users |
| **Supersedes** | Legacy entitlement patterns, ad-hoc access control |

## Context

**Background:** LeaderForge operates as a multi-tenant, multi-module platform (LeaderForge, Wealth With God, Brilliant School) requiring sophisticated access control across organizations, users, content, and features. The platform supports multiple provisioning models (org hierarchy, direct user, delegated admin) and needs to scale to handle complex business relationships.

**Problem Statement:** The platform requires a comprehensive, scalable entitlement management system that can:
- Support multiple tenant contexts with strict isolation
- Handle complex organizational hierarchies and user relationships
- Provide flexible provisioning models per module
- Enable fine-grained access control for features, content, and navigation
- Support future requirements like conditional access, A/B testing, and external integrations
- Maintain audit trails for compliance and debugging

**Goals:**
- Centralized, schema-driven entitlement system
- Service-layer enforcement with no business logic in UI/agents
- Support for seat-based licensing and organizational entitlements
- Extensible architecture for future access control patterns
- High performance with caching and optimized queries
- Complete audit trail and compliance support

**Constraints:**
- Must work within existing Supabase/PostgreSQL infrastructure
- Must integrate with existing agent-native architecture
- Must support existing CopilotKit and navigation patterns
- Must maintain backwards compatibility during migration
- Must enforce strict multi-tenant isolation

## Decision

**Summary:** Implement a comprehensive entitlement management architecture using a dual-table pattern (entitlements definition + user_entitlements assignment) with service-layer enforcement, organizational hierarchy support, and pluggable provisioning models.

**Details:** The architecture implements:

1. **Core Entitlement Tables:**
   - `core.entitlements`: Defines available entitlements with features, limits, and access rules
   - `core.user_entitlements`: Assigns entitlements to users with lifecycle tracking
   - `core.org_entitlements`: Organization-level entitlement purchases with seat management
   - `core.entitlement_audit_log`: Complete audit trail for compliance

2. **Service Layer Pattern:**
   - Centralized entitlement checking in service layer
   - No business logic in UI components or agents
   - All data pre-filtered by entitlements before reaching frontend
   - Caching layer for performance optimization

3. **Flexible Provisioning Models:**
   - `org_hierarchy`: Organization-owned seats allocated to users
   - `direct_user`: Direct user provisioning (no organization)
   - `delegated_admin`: Admin-managed user entitlements within orgs
   - Configurable per module/context

4. **Multi-Tenant Isolation:**
   - All entitlement operations are tenant/context-aware
   - Row Level Security (RLS) enforcement in PostgreSQL
   - No cross-tenant data leakage possible

## Options Considered

### Option 1: Simple Boolean/Array Approach
**Description:** Store entitlements as boolean fields or arrays directly on user/org records

**Pros:**
- Simple to implement initially
- Fast queries for basic checks
- No complex relationships

**Cons:**
- No audit trail or lifecycle tracking
- Cannot support expiration, revocation, or complex rules
- Not scalable for multiple modules and complex business rules
- No seat management or organizational licensing support

**Risk Level:** High (technical debt and scalability issues)

### Option 2: Role-Based Access Control (RBAC) Only
**Description:** Use traditional roles and permissions without entitlement concepts

**Pros:**
- Industry standard pattern
- Well-understood by developers
- Good tooling support

**Cons:**
- Doesn't match business model (seat-based licensing, organizational purchases)
- Cannot handle conditional access or content-specific entitlements
- Complex to map business entitlements to technical roles
- Limited flexibility for A/B testing and dynamic features

**Risk Level:** Medium (business model mismatch)

### Option 3: Comprehensive Entitlement Architecture (Selected)
**Description:** Full entitlement system with definition/assignment separation, organizational hierarchy, and service-layer enforcement

**Pros:**
- Matches business model perfectly
- Supports all current and planned features
- Provides complete audit trail
- Highly extensible and configurable
- Supports complex provisioning models
- Enables fine-grained access control

**Cons:**
- More complex to implement initially
- Requires careful performance optimization
- More moving parts to maintain

**Risk Level:** Low (proven pattern, well-designed)

## Decision Rationale

**Primary Factors:**
1. **Business Model Alignment:** The comprehensive approach directly maps to business concepts like seat-based licensing, organizational purchases, and module-specific entitlements
2. **Scalability Requirements:** The platform needs to support multiple modules, complex organizational structures, and future growth without architectural rewrites
3. **Compliance Needs:** B2B SaaS platforms require audit trails, user lifecycle tracking, and the ability to revoke access for compliance and legal reasons
4. **Extensibility:** The architecture must support future features like conditional access, A/B testing, external integrations, and new provisioning models

**Trade-offs Accepted:**
- **Complexity vs. Flexibility:** Accepting higher initial complexity for long-term flexibility and business model support
- **Performance vs. Features:** Using caching and optimization to maintain performance while supporting rich feature set
- **Development Time vs. Technical Debt:** Investing more time upfront to avoid technical debt and future rewrites

**Assumptions:**
- Business model will continue to emphasize organizational licensing and seat-based provisioning
- Compliance and audit requirements will increase over time
- Multiple modules and contexts will require independent yet integrated entitlement management
- Performance can be maintained through proper caching and query optimization

## Implementation Impact

### Technical Impact
- **Architecture Changes:** New service layer for entitlement management, updated API endpoints for entitlement-filtered data
- **Technology Stack:** No new external dependencies, leverages existing PostgreSQL and Supabase infrastructure
- **Data Migration:** Migration from existing access control patterns to new entitlement tables
- **Performance:** Caching layer required for entitlement queries, optimized database indexes for performance
- **Security Impact:** Enhanced security through centralized access control, RLS enforcement, and comprehensive audit trails

### Process Impact
- **Development Workflow:** All new features must integrate with entitlement checking, no access control logic in UI components
- **Testing Strategy:** Comprehensive unit tests for service layer, integration tests for entitlement scenarios
- **Deployment:** Gradual migration approach with backwards compatibility during transition
- **Monitoring:** New metrics for entitlement performance, access patterns, and usage analytics

### Team Impact
- **Learning Curve:** Developers need to understand entitlement patterns and service layer integration
- **Training Needs:** Documentation and training on entitlement system usage and best practices
- **Resource Requirements:** Initial development investment, ongoing maintenance of entitlement system

## Success Criteria

**Technical Metrics:**
- Entitlement checks complete in <100ms (99th percentile)
- Zero cross-tenant data leakage incidents
- 100% of access control goes through entitlement system
- Complete audit trail for all entitlement changes

**Business Metrics:**
- Support for all current provisioning models
- Successful migration of existing access patterns
- Enable new business models (seat-based licensing, organizational tiers)
- Reduced time to implement new access control features

**Timeline:**
- **Decision Implementation:** December 2024
- **Core System Implementation:** Q1 2025
- **Full Migration:** Q2 2025

## Risk Assessment

### High Risks
- **Risk:** Migration complexity causing service disruptions
  - **Mitigation:** Gradual migration with backwards compatibility, comprehensive testing
  - **Contingency:** Rollback plan to previous access control patterns

- **Risk:** Performance degradation from complex entitlement queries
  - **Mitigation:** Caching layer, query optimization, database indexing strategy
  - **Contingency:** Query simplification and progressive optimization

### Medium Risks
- **Risk:** Developer adoption and consistent usage of entitlement patterns
  - **Mitigation:** Clear documentation, code review enforcement, automated testing
  - **Contingency:** Additional training and architectural review processes

### Low Risks
- **Risk:** Future business model changes requiring entitlement system modifications
  - **Mitigation:** Flexible, extensible architecture design
  - **Contingency:** System supports multiple provisioning models and can be extended

## Follow-up Actions

- [ ] **Implementation Plan:** Create detailed implementation plan and migration strategy (Owner: Senior Architect, Deadline: 2024-12-31)
- [ ] **Service Layer Implementation:** Implement core entitlement services (Owner: Backend Team, Deadline: 2025-01-31)
- [ ] **Database Migration Scripts:** Create migration scripts for existing data (Owner: Database Team, Deadline: 2025-01-15)
- [ ] **Frontend Integration:** Update UI components to use entitlement-filtered data (Owner: Frontend Team, Deadline: 2025-02-28)
- [ ] **Documentation Updates:** Create comprehensive entitlement system documentation (Owner: Technical Writer, Deadline: 2025-01-31)
- [ ] **Testing Framework:** Implement testing framework for entitlement scenarios (Owner: QA Team, Deadline: 2025-02-15)

## References

- **Related ADRs:**
  - [ADR-0014: Agent-Native Mockup Composition System](./0014-agent-native-mockup-composition-system.md)
  - [ADR-0021: CopilotKit Admin Integration Pattern](./0021-copilotkit-admin-integration-pattern.md)
- **Documentation:**
  - [Current Database Schema](../../database/core-schema-current.sql)
  - Legacy entitlement documentation (to be superseded)
- **Implementation:**
  - [Entitlement Management Implementation Pattern](../patterns/entitlement-management-system.md)

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-12-19 | Senior Architect | Initial version consolidating legacy entitlement architecture decisions |

---

**Note:** This ADR represents the consolidation of extensive entitlement management work previously documented in legacy development notes. The decision formalizes the architectural approach that has been developed and tested across multiple implementations.