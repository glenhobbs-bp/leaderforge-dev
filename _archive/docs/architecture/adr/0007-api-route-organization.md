# ADR-0007: API Route Organization Pattern

**File:** docs/architecture/adr/0007-api-route-organization.md
**Purpose:** Architecture Decision Record for organizing API routes by purpose and integration type
**Owner:** Senior Architect
**Tags:** ADR, pattern, api-routes, organization, integrations

## Decision Metadata

| Field | Value |
|-------|-------|
| **Date** | 2024-01-15 |
| **Status** | Accepted |
| **Decision Type** | Pattern |
| **Impact Level** | Low |
| **Stakeholders** | Backend Team, Frontend Team |
| **Supersedes** | N/A |

## Context

**Background:** As LeaderForge grows, API routes need clear organization to support tools calling APIs, agent orchestration, database operations, and external integrations. The route structure should be intuitive for developers and maintainable as the system scales.

**Problem Statement:** API route organization needs to handle:
- Tools calling API routes for data access
- Direct database operations for internal services
- External service integrations (Tribe Social, FlightCommerce, etc.)
- Agent proxy routes for LangGraph communication
- CopilotKit integration endpoints
- Clear separation between public and internal APIs

**Goals:**
- Intuitive route structure that reflects system architecture
- Clear separation between different API purposes
- Scalable organization as integrations grow
- Consistent patterns for developers to follow
- Support for both internal tools and external integrations

**Constraints:**
- Must work with Next.js App Router structure
- Route changes should not break existing integrations
- Organization should support future microservices migration
- Must maintain security boundaries between different API types

## Decision

**Summary:** Organize API routes by purpose (copilotkit, agent, db, integrations, internal) with consistent sub-organization patterns within each category.

**Details:**
```
apps/web/app/api/
├── copilotkit/                # CopilotKit integration endpoints
├── agent/                     # Proxy routes to LangGraph agents
│   ├── content/
│   ├── context/
│   └── discovery/
├── db/                        # Direct database operations
│   ├── users/
│   ├── content/
│   ├── progress/
│   └── compositions/
├── integrations/              # External service integrations
│   ├── tribe-social/
│   ├── flight-commerce/
│   ├── supabase/
│   └── posthog/
└── internal/                  # Internal service communication
    ├── health/
    ├── metrics/
    └── admin/
```

## Options Considered

### Option 1: Purpose-Based Organization (Selected)
**Description:** Organize routes by their primary purpose and consumer type

**Pros:**
- **Intuitive Structure**: Developers can quickly find relevant endpoints
- **Clear Boundaries**: Security and access control naturally organized
- **Scalable**: Easy to add new integrations or database operations
- **Tool Integration**: Tools can easily call appropriate db/ or integrations/ routes
- **Separation of Concerns**: Different route types have different requirements

**Cons:**
- **Some Duplication**: Similar operations might exist in different categories
- **Migration Effort**: Need to restructure existing routes

**Risk Level:** Low

### Option 2: Module-Based Organization
**Description:** Organize routes by business module (content, auth, progress, etc.)

**Pros:**
- **Module Alignment**: Routes align with code module boundaries
- **Business Logic Focus**: Grouped by business functionality

**Cons:**
- **Mixed Purposes**: Database, integration, and agent routes mixed together
- **Tool Confusion**: Tools need to know which module has which operations
- **Security Complexity**: Different access controls mixed in same module

**Risk Level:** Medium

### Option 3: Flat Organization
**Description:** All routes at same level with descriptive naming

**Pros:**
- **Simplicity**: No nested organization to understand
- **No Categorization**: No decisions about where routes belong

**Cons:**
- **Scale Problems**: Becomes unwieldy as routes grow
- **No Organization**: Hard to find related routes
- **No Security Boundaries**: All routes at same access level

**Risk Level:** High

## Decision Rationale

**Primary Factors:**
1. **Tool Integration**: Tools need clear patterns for accessing data vs external services
2. **Security Boundaries**: Different route types need different access controls
3. **Developer Experience**: Intuitive organization reduces cognitive load
4. **Future Scalability**: Structure supports adding new integrations and services

**Trade-offs Accepted:**
- **Migration effort** for existing routes to achieve better long-term organization
- **Some route duplication** for clearer purpose-based separation

**Assumptions:**
- Route organization will remain stable as system grows
- Developers will prefer purpose-based over module-based organization
- Tool developers will benefit from clear db/ vs integrations/ separation

## Implementation Impact

### Technical Impact
- **Architecture Changes**: Restructure existing API routes into new organization
- **Technology Stack**: No technology changes, just route organization
- **Data Migration**: N/A (route reorganization only)
- **Performance**: No performance impact
- **Security Impact**: Clearer security boundaries, route-level access controls

### Process Impact
- **Development Workflow**: Clear patterns for where to place new API routes
- **Testing Strategy**: Organize API tests by route category
- **Deployment**: Route migration during deployment
- **Monitoring**: Organize API monitoring by route purpose

### Team Impact
- **Learning Curve**: Minimal - intuitive organization patterns
- **Training Needs**: Route organization guidelines, where to place new routes
- **Resource Requirements**: No additional resources needed

## Success Criteria

**Technical Metrics:**
- All existing routes migrated to new structure
- Zero broken integrations during migration
- Route discovery time <30 seconds for developers
- Consistent response times across all route categories

**Business Metrics:**
- 90% developer satisfaction with route organization
- 50% reduction in "where should this route go?" questions
- Zero security incidents due to route miscategorization
- Faster integration development with clear patterns

**Timeline:**
- **Decision Implementation:** January 2024
- **Route Migration Plan:** February 2024
- **Migration Execution:** March 2024
- **Documentation Update:** March 2024

## Route Category Details

### `/api/copilotkit/`
**Purpose:** CopilotKit integration endpoints
**Security:** User session required
**Examples:**
- `/api/copilotkit/route.ts` - Main CopilotKit handler

### `/api/agent/`
**Purpose:** Proxy routes to LangGraph agents
**Security:** User session + agent authorization
**Examples:**
- `/api/agent/content/route.ts` - Content discovery agent
- `/api/agent/context/route.ts` - Context configuration agent

### `/api/db/`
**Purpose:** Direct database operations for internal services
**Security:** Service-level authentication
**Examples:**
- `/api/db/users/[id]/route.ts` - User CRUD operations
- `/api/db/progress/route.ts` - Progress tracking operations

### `/api/integrations/`
**Purpose:** External service integrations
**Security:** Integration-specific auth + service keys
**Examples:**
- `/api/integrations/tribe-social/content/[id]/route.ts`
- `/api/integrations/flight-commerce/downlines/route.ts`

### `/api/internal/`
**Purpose:** Internal system operations
**Security:** Admin/system-level access
**Examples:**
- `/api/internal/health/route.ts` - Health checks
- `/api/internal/metrics/route.ts` - System metrics

## Risk Assessment

### High Risks
- **Risk:** Route migration breaks existing integrations
  - **Mitigation:** Phased migration, redirect rules, comprehensive testing
  - **Contingency:** Rollback plan, maintain old routes temporarily

### Medium Risks
- **Risk:** Developers confused about route categorization
  - **Mitigation:** Clear documentation, examples, code review guidelines
  - **Contingency:** Additional training, clarification of guidelines

### Low Risks
- **Risk:** Some routes don't fit cleanly into categories
  - **Mitigation:** Document edge cases, create guidance for ambiguous routes
  - **Contingency:** Create additional categories if needed

## Follow-up Actions

- [ ] **Create route migration plan** (Senior Architect, Jan 25)
- [ ] **Update existing routes gradually** (Backend Team, Feb-Mar 2024)
- [ ] **Create route organization guidelines** (Tech Writer, Feb 15)
- [ ] **Update API documentation** (Backend Team, Mar 1)
- [ ] **Set up redirect rules for old routes** (DevOps, Mar 1)
- [ ] **Documentation Updates**: API development guide, route categorization guide
- [ ] **Implementation Plan**: Reference api-route-migration-plan.md

## References

- **Related ADRs:** ADR-0002 (Modular Monolith), ADR-0003 (Asset Registries)
- **Documentation:** [API Development Guidelines](../../engineering/how-to/api-development-guide.md)
- **Research:** REST API organization patterns, Next.js route structure best practices
- **Discussion:** Backend team planning meeting, Jan 15, 2024

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2024-01-15 | Senior Architect | Initial version |

---

**Note:** This route organization supports clear tool integration patterns while maintaining security boundaries and developer productivity.