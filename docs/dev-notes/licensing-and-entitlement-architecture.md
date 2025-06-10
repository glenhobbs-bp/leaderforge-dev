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

### Why Both `entitlements` and `user_entitlements`?

#### 1. `entitlements` (Definition Table)
- **Purpose:**
  This table defines the types of entitlements (features, licenses, permissions) that exist in your system.
- **What it contains:**
  - The name, description, module, and metadata for each entitlement type.
  - Example: `"content_creator"`, `"admin_dashboard_access"`, `"premium_video"`, etc.
- **Analogy:**
  Think of this as the "catalog" of all possible features or licenses your platform can grant.

#### 2. `user_entitlements` (Assignment Table)
- **Purpose:**
  This table records which users have been granted which entitlements, and tracks their status (active, revoked, expires, etc).
- **What it contains:**
  - A row for each user's active entitlement, with references to the user and the entitlement type.
  - Validity dates, who granted it, metadata, etc.
- **Analogy:**
  This is the "ledger" or "assignment log"—it says "User X has Entitlement Y, granted on Z, expires on W."

#### Why Not Just a Boolean or Array on the User?
- **Scalability:**
  As your system grows, you'll want to:
  - Track when/why/how an entitlement was granted or revoked.
  - Support expiration, revocation, and audit trails.
  - Support multiple entitlements per user, possibly from different sources (org, purchase, admin grant, etc).
- **Multi-Tenancy:**
  You may want to assign entitlements at the org level, then allocate to users, or have different entitlements per module/context.
- **Audit & Compliance:**
  You need to know who gave what to whom, and when, for compliance and debugging.

#### How They Work Together
- **`entitlements`:**
  - Defines what is possible.
- **`user_entitlements`:**
  - Records who has what, and the lifecycle of that assignment.

**This is the same pattern used in:**
- Role-based access control (RBAC): `roles` and `user_roles`
- Licensing: `products` and `user_licenses`
- Feature flags: `features` and `user_features`

#### Is It Too Complex?
- If you only ever have a handful of static features, and never need to track assignment, expiration, or audit, you could get away with a boolean or array.
- But for a modular, multi-tenant, SaaS platform with compliance needs, this is the right level of complexity.

#### Summary Table
| Table               | Purpose                        | Example Row                                      |
|---------------------|-------------------------------|--------------------------------------------------|
| `entitlements`      | Defines available entitlements | `{ id: 1, name: "premium_video", ... }`          |
| `user_entitlements` | Assigns entitlements to users  | `{ id: 42, user_id: 7, entitlement_id: 1, ... }` |

**Bottom Line:**
- Keep both tables.
- This is the correct, scalable, auditable pattern for entitlements in a modern SaaS platform.

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

## Supabase Auth Integration Plan

To enable secure, production-grade authentication and user management, follow this step-by-step plan:

### 1. Supabase Project Setup
- [ ] Ensure Supabase Auth is enabled in your Supabase project.
- [ ] Configure allowed OAuth providers (Google, Microsoft, etc.) and email/password as needed.
- [ ] Set up email templates, domain whitelisting, and redirect URLs for production.

### 2. Install Supabase Client & Auth Helpers
- [ ] Install `@supabase/supabase-js` (already present) and `@supabase/auth-helpers-nextjs` in your web app.
- [ ] Add any missing types (`@types/node`, etc.) if needed.

### 3. Configure Supabase Client for Auth
- [ ] Update your Supabase client to use the public anon key for frontend usage.
- [ ] Store keys in `.env.local` (never commit secrets).

### 4. Add Auth Context/Provider
- [ ] Create a `SupabaseProvider` (or use the helper's built-in provider) at the top level of your app (e.g., in `layout.tsx`).
- [ ] Ensure the provider is available to all pages/components.

### 5. Implement Auth UI
- [ ] Add a login/signup page using Supabase Auth UI or a custom form.
- [ ] Support OAuth and email/password flows.
- [ ] Handle errors, loading, and redirect after login.

### 6. Protect Routes and Fetch User
- [ ] Use Supabase Auth helpers to get the current user (client and server).
- [ ] Protect sensitive pages/routes (e.g., dashboard, settings) by redirecting unauthenticated users to login.
- [ ] Expose user info (id, email, etc.) via React context or hooks.

### 7. Wire User ID to API/Service Layer
- [ ] Pass the authenticated user's ID to all API calls, hooks, and agent requests.
- [ ] Remove all hardcoded or stubbed user IDs.

### 8. Logout and Session Handling
- [ ] Add a logout button that calls `supabase.auth.signOut()`.
- [ ] Handle session expiration and auto-redirect to login.

### 9. Profile & Avatar
- [ ] Fetch and display user profile info and avatar in the NavPanel and header.
- [ ] Store avatars in Supabase Storage (private bucket) and serve via signed URLs.

### 10. Security & Production Hardening
- [ ] Enforce HTTPS and secure cookies.
- [ ] Set up CORS, domain whitelisting, and email verification.
- [ ] Test all flows (login, logout, session restore, error handling).
- [ ] Add monitoring/logging for auth events.

### 11. Testing
- [ ] Add Vitest/React Testing Library tests for auth flows and protected routes.
- [ ] Add end-to-end tests (Cypress/Playwright) for login/logout and user flows.

---

**Summary Checklist**
- [ ] Supabase Auth enabled and configured
- [ ] Auth helpers and provider set up in Next.js
- [ ] Login/signup UI (OAuth + email)
- [ ] Route protection and user context
- [ ] User ID wired to all API/service calls
- [ ] Logout/session handling
- [ ] Profile/avatar integration
- [ ] Security hardening
- [ ] Automated tests