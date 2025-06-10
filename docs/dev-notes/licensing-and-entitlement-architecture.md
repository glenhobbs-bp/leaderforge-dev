# LeaderForge Licensing & Entitlement Architecture

> **This is a living document. Update as the system evolves.**

---

## 1. Core Principles

- **Schema-driven:** All entitlements, licenses, and user/org relationships are defined in the DB/config, not code.
- **Service-layer enforcement:** All access checks and business logic live in the service layer. Agents and UI only see filtered, entitlement-checked data.
- **Modular, extensible:** Support for context/module, feature/content, and conditional entitlements. Provisioning models are pluggable.
- **Multi-tenancy:** All entitlements and content are strictly isolated by context/tenant.
- **Future-ready:** SSO, A/B testing, audit, and external system integration are anticipated in the schema and service interfaces.

---

## 2. Data Model (DB Schema)

### A. Core Tables

- **users**: User profile, preferences, avatar, localization, etc.
- **organizations**: Hierarchical orgs, with context/module association.
- **user_organizations**: Memberships, roles, status.
- **entitlements**: Master list (context, feature, content, conditional, etc.).
- **org_entitlements**: Which org has which entitlements (with seat count, expiry, etc.).
- **user_entitlements**: Which user has which entitlements (direct or via org).
- **content_access_policies**: (Future) Per-content/feature access rules, including conditional logic (e.g., "must complete X first").
- **ab_test_groups**: (Future) User-to-experiment group mapping for A/B testing.
- **email_validations**: For secure invites, magic links, etc.

### B. Key Columns/Patterns

- All tables have a `context_id` or `tenant_id` for strict isolation.
- Entitlements have a `type` (context, feature, content, conditional, ab_test, etc.).
- Conditional entitlements reference prerequisite entitlements or completion events.
- All relationships are auditable (created_by, granted_by, timestamps).

---

## 3. Service Layer (TypeScript)

### A. Service Responsibilities

- **entitlementService**: All logic for checking, granting, revoking, and listing entitlements (user/org/content/feature/conditional).
- **organizationService**: Org CRUD, membership, provisioning model logic.
- **userService**: User CRUD, preferences, SSO mapping, org membership.
- **provisioningService**: Handles all provisioning models, seat allocation, email validation.
- **abTestService**: (Future) Assigns users to A/B groups, integrates with PostHog.
- **contentAccessService**: (Future) Evaluates conditional access (e.g., module progression).
- **auditService**: (Future) Logs all changes for compliance.

### B. Service Layer Patterns

- All service functions require context (user, org, context_id).
- All entitlement checks are centralized—never in agent/UI.
- All data returned to agents/UI is already filtered by entitlement.

---

## 4. API Layer

- **/api/entitlements/:user_id**: Returns all entitlements for a user (context-aware).
- **/api/orgs/:org_id/entitlements**: Returns all entitlements for an org.
- **/api/context/:context_key**: Returns context config, including entitlement requirements.
- **/api/content?context_key=...**: Returns only content the user is entitled to.
- **/api/user/:user_id/preferences**: User preferences (localization, avatar, etc.).
- **/api/provisioning/**: Endpoints for inviting users, granting/revoking entitlements, etc.

---

## 5. Provisioning Models

- **org_hierarchy**: Org owns entitlements, allocates to users (seat-based).
- **direct_user**: Users are provisioned directly (no org).
- **delegated_admin**: Admins manage user entitlements within an org.
- **Configurable per context/module** (via DB/config).

---

## 6. Conditional & Feature/Content Entitlements

- **content_access_policies** table defines rules (e.g., "must complete Module 1").
- **contentAccessService** evaluates these rules at runtime.
- **EntitlementService** exposes a method to check if a user can access a given content/feature, considering both static and conditional entitlements.

---

## 7. A/B Testing & PostHog Integration

- **ab_test_groups** table maps users to experiment groups.
- **abTestService** assigns users and exposes group info to agents/UI.
- **EntitlementService** can check A/B group as part of entitlement logic.
- **PostHog** events are triggered in the service layer (not agent/UI).

---

## 8. External Identity & SSO (Future-Proofing)

- **userService** supports mapping external IDs (e.g., from Flight Commerce) to internal users.
- **SSO** handled via a pluggable auth provider pattern.
- **user_organizations** and **user_entitlements** can reference external IDs for cross-system linking.

---

## 9. User Preferences & Profile

- **users** table includes preferences (localization, avatar, etc.).
- **userService** exposes CRUD for preferences.
- **/api/user/:user_id/preferences** endpoint for UI/agent.

---

## 10. Multi-Tenancy & Isolation

- All queries and service functions are context/tenant-aware.
- RLS (Row Level Security) in Postgres enforces isolation.
- No cross-context data leakage.

---

## 11. Extensibility & Simplicity

- **Start with context/module-level entitlements and org_hierarchy provisioning.**
- **Add feature/content/conditional entitlements and other provisioning models as needed.**
- **Schema and service interfaces are designed for extension, not rewrite.**

---

## 12. Example: Module Progression (Conditional Access)

- **content_access_policies**:
  - `content_id: "module-2", rule: "completed:module-1"`
- **contentAccessService**:
  - Checks if user has completed "module-1" before granting access to "module-2".
- **EntitlementService**:
  - Exposes `canAccessContent(userId, contentId)` for agent/UI.

---

## 13. Agent & UI Integration

- **Agents/UI never see unfiltered data.**
- **All nav/content/feature schemas are filtered by entitlement before being sent.**
- **Agents can query "can user do X?" via the service layer, not by direct logic.**

---

## 14. Testing & Observability

- **Unit tests** for all service logic, especially entitlement checks and conditional access.
- **(Future) Audit logs** for all grants/revokes/changes.

---

## Appendix: Service Layer Implementation Summary

This appendix documents the current state of the LeaderForge service layer as implemented in `apps/web/app/lib/`.

### Core Services

- **entitlementService**
  - Responsibilities: Entitlement checks, grants, revokes, listing for users/orgs/content.
  - Methods: `getUserEntitlements`, `getOrgEntitlements`, `canUserAccessContent`, `getAccessibleContent`
  - Fully unit tested with robust logging.

- **organizationService**
  - Responsibilities: Organization CRUD, membership, provisioning model logic.
  - Methods: `getOrganization`, `getUserOrganizations`, `getOrgMembers`, `getProvisioningModel`
  - Fully unit tested with robust logging.

- **userService**
  - Responsibilities: User CRUD, preferences, SSO mapping, org membership.
  - Methods: `getUser`, `getUserByEmail`, `getUsersByIds`, `updateUserPreferences`
  - Fully unit tested with robust logging.

- **provisioningService**
  - Responsibilities: Handles provisioning models, seat allocation, audit log.
  - Methods: `provisionUserToOrg`, `provisionEntitlementToUser`, `provisionEntitlementToOrg`, `getProvisioningAuditLog`
  - Fully unit tested with robust logging.

- **contextService**
  - Responsibilities: Context config CRUD (theme, branding, i18n, etc.).
  - Methods: `getContextConfig`, `getAllContexts`, `updateContextConfig`
  - Fully unit tested with robust logging.

- **navService**
  - Responsibilities: Navigation options, entitlement-filtered.
  - Methods: `getNavOptions`, `getNavOption`
  - Fully unit tested with robust logging.

- **contentService**
  - Responsibilities: Content access, entitlement and prerequisite filtering.
  - Methods: `getContentForContext`, `getContentById`, `getAccessibleContent`
  - Fully unit tested with robust logging.

### Service Layer Patterns

- All services:
  - Accept user/org/context as input.
  - Return only data the user is entitled to (enforced by RLS + logic).
  - Never expose raw DB access to frontend/agents.
  - Are robustly logged for observability.
  - Are fully unit tested (Vitest) with mocks for Supabase and dependencies.

- New services should follow this pattern: strong typing, robust logging, full test coverage, and clear separation of concerns.

---

## Next Steps

1. Review and confirm this architecture.
2. Decide on initial scope:
   - Start with context/module-level entitlements, org_hierarchy provisioning, and user preferences.
   - Defer feature/content/conditional entitlements, A/B testing, SSO, and audit to future phases.
3. Draft:
   - DB schema (Postgres, with RLS patterns)
   - Service layer TypeScript interfaces and key functions
   - API endpoint contracts
   - Example test cases

## Frontend Integration: API Clients, Hooks, and Tests

The LeaderForge entitlement system includes a production-grade, schema-driven frontend integration layer. This layer is fully modular, robustly logged, and comprehensively tested. All business logic and entitlement filtering is enforced in the backend service layer; the frontend consumes only filtered, entitlement-checked data via typed API clients and React Query hooks.

### File Structure

```
apps/web/app/
  lib/
    apiClient/
      entitlements.ts                # User entitlements API client
      orgEntitlements.ts             # Org entitlements API client
      contextConfig.ts               # Context config API client
      content.ts                     # Content-for-context API client
      nav.ts                         # Nav-for-context API client
      userPreferences.ts             # User preferences API client
      provisioning.ts                # Provisioning API client
      *.test.tsx                     # Colocated tests for each client/hook
  hooks/
    useUserEntitlements.ts          # User entitlements React Query hook
    useOrgEntitlements.ts           # Org entitlements React Query hook
    useContextConfig.ts             # Context config React Query hook
    useContentForContext.ts         # Content-for-context React Query hook
    useNavForContext.ts             # Nav-for-context React Query hook
    useUserPreferences.ts           # User preferences hooks (get/update)
    useProvisioning.ts              # Provisioning mutation hook
```

- **All API clients**: Typed, robust error handling, logs all actions/errors, throws on error.
- **All hooks**: Use React Query, log all major actions/errors, return full query/mutation state.
- **All tests**: Colocated `.test.tsx` files, using Testing Library + React Query, cover loading, success, and error states.

### Usage Example

```tsx
import { useUserEntitlements } from '../hooks/useUserEntitlements';
import { useContextConfig } from '../hooks/useContextConfig';
import { useContentForContext } from '../hooks/useContentForContext';

export function EntitlementAwareContent({ userId, contextKey }: { userId: string, contextKey: string }) {
  const { data: entitlements, isLoading: entitlementsLoading } = useUserEntitlements(userId);
  const { data: contextConfig, isLoading: contextLoading } = useContextConfig(contextKey);
  const { data: content, isLoading: contentLoading } = useContentForContext(contextKey, userId);

  if (entitlementsLoading || contextLoading || contentLoading) return <div>Loading…</div>;
  if (!entitlements || !contextConfig || !content) return <div>No data</div>;

  return (
    <div>
      <h2>Context: {contextConfig.name}</h2>
      <ul>
        {content.map((item: any) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
      <div>Entitlements: {entitlements.map((e: any) => e.name).join(', ')}</div>
    </div>
  );
}
```

- All data is entitlement-filtered and context-aware.
- UI components are schema-driven and generic.
- All hooks and clients are fully tested and robust to backend/API changes.

---