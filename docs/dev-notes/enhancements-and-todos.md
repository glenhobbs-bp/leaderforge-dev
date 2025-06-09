# Enhancements & To-Dos — LeaderForge Platform

## Agentic Architecture Master To-Do List (2024-04)

**This section tracks all known technical debt, workarounds, and next steps to restore and advance a pure agent-native, schema-driven architecture.**

### 1. ContentSyncAgent
- [ ] Finish and productionize ContentSyncAgent so it reliably syncs TribeSocial content into Supabase for all relevant contexts.
  - Ensure it runs on a schedule or via webhook.
  - Add a Supabase Edge Function to trigger sync asynchronously (e.g., on app load, via cron, or webhook).
  - Mark inactive content correctly.
  - Add logging and error handling.
  - Test with real TribeSocial data.
  - Plan for future webhook support from TribeSocial for real-time sync.

### 2. LangGraph Agent Orchestration
- [ ] Restore LangGraph-based ContentLibraryAgent (currently replaced with a plain function).
  - Upgrade to the latest LangGraph version.
  - Ensure state propagation between nodes works (no more state loss).
  - Add comprehensive tests for state flow.
  - Use pure node functions and correct channel definitions.
  - Remove any hardcoded defaults or workarounds.

### 3. Error Handling
- [ ] Fix periodic errors on load.
  - Add robust error boundaries in the frontend.
  - Ensure the agent always returns a valid schema (never null/undefined).
  - Log and surface backend errors in a user-friendly way.
  - Investigate and resolve periodic Next.js static asset error (Uncaught SyntaxError in _next/static/chunks/app/layout.js) that occurs on first load; currently resolved by a second reload but should be fixed for production reliability.

### 4. NavPanel and UI Schema Purity
- [ ] Remove hardcoded nav options from NavPanel.
  - Drive all navigation from agent- or config-driven schema.
  - Use a generic schema for nav (e.g., type: 'NavList', props: { items: [...] }).
  - Ensure all UI panels/components render based on schema, not hardcoded logic.

### 5. General Architectural Cleanup
- [ ] Remove all temporary workarounds and TODOs.
  - Search for TODO, FIXME, temporary, workaround, hack, patch, hardcoded, not pure, refactor in the codebase.
  - Address each one, restoring agent-native, schema-driven patterns.
- [ ] Migrate all code (agents, UI, tools) to use the new centralized API proxy route in apps/api.
- [ ] Remove legacy or duplicate proxy routes from apps/web or elsewhere.
- [ ] Ensure all business logic is in agents/tools, not UI or API.
- [ ] Ensure all UI is schema-driven and generic.
- [ ] Ensure all tools are stateless, composable, and context-driven.
- [ ] Ensure all API endpoints are thin and agent-native.
- [ ] Consider migrating API routes to the App Router in the future for consistency and modernization.

### 6. Agent/Navigation Registry
- [ ] Implement a central agent registry and agent lookup by navOptionId.
  - Remove any direct agent selection in API routes.
  - Use a config or DB-driven mapping from navOptionId to agent.

### 7. Testing and Observability
- [ ] Add end-to-end tests for all major flows (content, progress, sync, nav).
- [ ] Add logging and observability for all agent runs and tool calls.

### 8. Avatar Handling in NavPanel
- [ ] Refactor NavPanel to fetch user avatar via signed URL from API (private Supabase Storage).
  - Use fallback to default avatar if fetch fails or avatar is missing.
  - Remove hardcoded userId and wire to real user management/auth when available.
  - Ensure both header and footer avatars use the signed URL.

---

## Enhancement Backlog

### 1. Feature-level or Content-level Entitlement

- **Description:**
  - Implement fine-grained access control for specific features (e.g., analytics, chat) or individual content/media items (e.g., videos, courses) within a context.
- **Status:**
  - Not started. Tracked for future design and implementation.
- **Notes:**
  - Would require new tables (e.g., `context_feature_access_policies`, `content_access_policies`) and supporting functions.
  - Should be designed to work alongside context-level entitlement.

---

## To-Do / Deferred Items

- _(Add new items below as needed)_
