# ADR-0026: HTTP Method Conventions for API Endpoints

**Status:** Accepted
**Date:** 2025-01-17
**Context:** Agent-Native Architecture, API Consistency
**Supersedes:** None

## Context

Analysis of 50+ API endpoints revealed significant inconsistencies in HTTP method usage across the application. The user reported an earlier error caused by using GET instead of POST, highlighting the need for clear, documented conventions. Current inconsistencies include:

- Context preferences API uses POST for single updates (should be PATCH)
- Mixed patterns: some endpoints use POST for updates, others use PUT
- Some endpoints use POST for data retrieval with complex queries
- No clear conventions for when to use each HTTP method

This inconsistency creates confusion, increases error likelihood, and violates REST principles while not aligning with our agent-native architecture.

## Decision

We will implement **Hybrid Agent-Native HTTP Method Conventions** that balance RESTful principles with our agent-native architecture:

### HTTP Method Conventions

```typescript
// GET: Simple data retrieval (no business logic, idempotent)
export async function GET() {
  // Return data directly from database/cache
  // No agent orchestration required
}

// POST: Agent invocations, complex queries, resource creation
export async function POST(req: NextRequest) {
  // Agent orchestration and business logic
  // Complex queries requiring processing
  // Resource creation
}

// PUT: Bulk/batch operations, resource replacement
export async function PUT(req: NextRequest) {
  // Bulk updates of multiple resources
  // Complete resource replacement
}

// PATCH: Partial updates to existing resources
export async function PATCH(req: NextRequest) {
  // Single resource partial updates
  // Toggle operations (enable/disable)
}

// DELETE: Resource removal
export async function DELETE(req: NextRequest) {
  // Resource deletion
}
```

### Specific Use Cases

1. **GET**: Simple data retrieval
   - `/api/user/[id]/profile` - Get user profile
   - `/api/context/preferences` - Get user preferences
   - `/api/tenant/[key]` - Get tenant configuration

2. **POST**: Agent invocations and complex operations
   - `/api/agent/context` - Agent-driven context resolution
   - `/api/agent/content` - Agent-driven content generation
   - `/api/admin/entitlements/list` - Complex entitlement queries

3. **PUT**: Bulk operations
   - `/api/context/preferences` - Bulk preference updates
   - `/api/user/[id]/entitlements` - Replace all user entitlements

4. **PATCH**: Single resource updates
   - `/api/context/preferences/[id]` - Toggle single preference
   - `/api/user/[id]/profile` - Update profile fields

5. **DELETE**: Resource removal
   - `/api/context/preferences/[id]` - Remove preference
   - `/api/user/[id]/entitlements/[id]` - Remove entitlement

### TypeScript Types and Validation

```typescript
// HTTP Method validation types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface APIEndpointConfig {
  method: HTTPMethod;
  requiresAuth: boolean;
  requiresBody: boolean;
  agentInvocation: boolean;
  description: string;
}

// Validation schema for API endpoints
export const validateHTTPMethod = (method: string, hasBody: boolean, isAgentInvocation: boolean): boolean => {
  switch (method) {
    case 'GET':
      return !hasBody && !isAgentInvocation;
    case 'POST':
      return hasBody; // Can be agent invocation or resource creation
    case 'PUT':
    case 'PATCH':
      return hasBody && !isAgentInvocation;
    case 'DELETE':
      return true; // Body optional
    default:
      return false;
  }
};
```

## Rationale

### Why Hybrid Agent-Native Approach?

1. **Agent-Native Alignment**: POST for agent invocations matches our successful patterns
2. **RESTful Clarity**: GET/PUT/PATCH/DELETE provide semantic meaning
3. **Consistency**: Clear rules prevent confusion and errors
4. **Architectural Purity**: Maintains separation between data retrieval and business logic

### Why Not Pure REST?

- Our agent-native architecture requires POST for complex orchestration
- Many operations involve agent decision-making, not simple CRUD
- Hybrid approach provides clarity while supporting our architecture

### Why Not Simplified CRUD?

- Loses semantic meaning of different operations
- Harder to understand API behavior from method alone
- Doesn't leverage HTTP protocol capabilities

## Implementation Plan

### Phase 1: Foundation (Immediate)
- [x] Create this ADR
- [ ] Update context preferences API to use PATCH for single updates
- [ ] Add TypeScript types and validation utilities
- [ ] Update development documentation

### Phase 2: Systematic Audit (Next Sprint)
- [ ] Audit all existing API endpoints for compliance
- [ ] Create migration plan for non-compliant endpoints
- [ ] Add automated validation in development

### Phase 3: Gradual Migration (Ongoing)
- [ ] Migrate endpoints during normal development cycles
- [ ] Add HTTP method validation to API route templates
- [ ] Update client-side code to use correct methods

## Examples

### Before (Inconsistent)
```typescript
// Context preferences - mixed methods
GET /api/context/preferences     // ✅ Correct
POST /api/context/preferences    // ❌ Should be PATCH
PUT /api/context/preferences     // ✅ Correct for bulk
```

### After (Consistent)
```typescript
// Context preferences - proper methods
GET /api/context/preferences           // Simple retrieval
PATCH /api/context/preferences/[id]    // Single preference toggle
PUT /api/context/preferences           // Bulk preference update
```

## Consequences

### Positive
- **Consistency**: Clear rules prevent confusion
- **Predictability**: Developers can predict method from operation
- **Error Reduction**: Eliminates GET/POST confusion
- **Architectural Alignment**: Supports agent-native patterns

### Negative
- **Migration Effort**: Some endpoints need refactoring
- **Learning Curve**: Team needs to adopt new conventions
- **Temporary Inconsistency**: During migration period

### Risks and Mitigations

**Risk**: Breaking changes during migration
- **Mitigation**: Gradual migration during normal development

**Risk**: Team adoption challenges
- **Mitigation**: Clear documentation and validation tools

**Risk**: Client-side code breakage
- **Mitigation**: Maintain backward compatibility during transition

## Compliance Checklist

For each new API endpoint:
- [ ] Method follows conventions (GET/POST/PUT/PATCH/DELETE)
- [ ] GET endpoints have no request body
- [ ] POST endpoints either invoke agents or create resources
- [ ] PUT endpoints handle bulk operations
- [ ] PATCH endpoints handle partial updates
- [ ] DELETE endpoints remove resources
- [ ] TypeScript types validate method usage
- [ ] Documentation describes method choice rationale

## Related ADRs

- [ADR-0001: Agent-Native Composition System](./0001-agent-native-composition-system.md)
- [ADR-0007: API Route Organization](./0007-api-route-organization.md)

## References

- [REST API Design Guidelines](https://restfulapi.net/http-methods/)
- [HTTP Method Definitions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [Agent-Native Architecture Documentation](../overview/agent-native-composition-architecture.md)

---

**Last Updated:** 2025-01-17
**Next Review:** 2025-02-17
**Version:** 1.0