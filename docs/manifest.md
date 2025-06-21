# LeaderForge Codebase Manifest

*Generated on 6/21/2025, 8:23:56 AM*

## Overview

- **Total Files**: 173
- **Total Size**: 1.40 MB
- **Generator Version**: 1.0.0

## File Types

- **.ts**: 89 files
- **.md**: 37 files
- **.tsx**: 31 files
- **.json**: 13 files
- **.js**: 2 files
- **.sql**: 1 files

## Most Common Tags

- **TypeScript**: 120 files
- **security**: 60 files
- **AI agent**: 49 files
- **utility**: 39 files
- **documentation**: 39 files
- **API**: 31 files
- **React**: 31 files
- **test**: 24 files
- **Next.js API**: 22 files
- **React hooks**: 17 files

## File Inventory

### `apps/api/next-env.d.ts`

/ <reference types="next" />

**Complexity**: low • **Size**: 0.2KB
**Tags**: `TypeScript`, `API`
**Modified**: 6/1/2025


### `apps/api/package.json`

—

**Size**: 0.2KB
**Tags**: `API`
**Modified**: 6/1/2025


### `apps/api/pages/api/tribe/content/[id].ts`

edge.tribesocial.io';

**Complexity**: low • **Size**: 1.3KB
**Tags**: `TypeScript`, `API`
**Modified**: 6/8/2025


### `apps/api/tsconfig.json`

—

**Size**: 0.5KB
**Tags**: `API`
**Modified**: 6/1/2025


### `apps/web/agent/langgraph.json`

—

**Size**: 0.2KB
**Tags**: `AI agent`
**Modified**: 5/31/2025


### `apps/web/agent/package.json`

—

**Size**: 0.7KB
**Tags**: `AI agent`
**Modified**: 5/31/2025


### `apps/web/agent/src/agent.ts`

This is the main entry point for the agent.

**Complexity**: medium • **Size**: 3.9KB
**Tags**: `TypeScript`, `AI agent`
**Modified**: 6/1/2025


### `apps/web/agent/src/index.ts`

—

**Complexity**: low • **Size**: 0.0KB
**Tags**: `TypeScript`
**Modified**: 5/31/2025


### `apps/web/agent/tsconfig.json`

aka.ms/tsconfig to read more about this file */

**Size**: 12.1KB
**Tags**: None
**Modified**: 5/31/2025


### `apps/web/app/api/agent/content/route.ts`

POST /api/agent/content

**Complexity**: medium • **Size**: 5.9KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `AI agent`
**Modified**: 6/20/2025


### `apps/web/app/api/agent/context/route.ts`

POST /api/agent/context

**Complexity**: high • **Size**: 21.1KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `AI agent`, `security`
**Modified**: 6/21/2025


### `apps/web/app/api/auth/callback/route.ts`

Handles Supabase auth redirect and sets cookies for SSR session access.

**Complexity**: low • **Size**: 1.1KB
**Tags**: `TypeScript`, `API`, `Next.js API`
**Modified**: 6/15/2025


### `apps/web/app/api/auth/set-session/route.ts`

File: apps/web/app/api/auth/set-session/route.ts

**Complexity**: low • **Size**: 1.7KB
**Tags**: `TypeScript`, `API`, `Next.js API`
**Modified**: 6/13/2025


### `apps/web/app/api/content/[context_key]/route.test.ts`

To run these tests:

**Complexity**: low • **Size**: 2.5KB
**Tags**: `TypeScript`, `API`, `test`
**Modified**: 6/9/2025


### `apps/web/app/api/content/[context_key]/route.ts`

✅ Get session from Supabase cookie

**Complexity**: low • **Size**: 1.7KB
**Tags**: `TypeScript`, `API`, `Next.js API`
**Modified**: 6/20/2025


### `apps/web/app/api/context/[context_key]/bundle/route.ts`

GET /api/context/[context_key]/bundle

**Complexity**: low • **Size**: 2.7KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/context/[context_key]/route.test.ts`

To run these tests:

**Complexity**: low • **Size**: 2.1KB
**Tags**: `TypeScript`, `API`, `test`
**Modified**: 6/9/2025


### `apps/web/app/api/context/[context_key]/route.ts`

GET /api/context/[context_key]

**Complexity**: low • **Size**: 3.1KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/context/list/route.ts`

API route to return all available contexts (core.context_configs) for the authenticated user, filtered by entitlement. Used to drive the context selector in the UI. SSR/session safe, Next.js 15+ compatible.

**Complexity**: low • **Size**: 2.2KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/copilotkit/route.ts`

localhost:8000", // Local LangGraph dev server

**Complexity**: low • **Size**: 0.8KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `AI agent`
**Modified**: 6/18/2025


### `apps/web/app/api/dev/apply-entitlements/route.ts`

Use service role for admin operations

**Complexity**: medium • **Size**: 5.2KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/dev/grant-basic-entitlements/route.ts`

Use service role for admin operations

**Complexity**: low • **Size**: 3.2KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/dev/simple-entitlements/route.ts`

Use service role for admin operations

**Complexity**: low • **Size**: 2.6KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/entitlements/[user_id]/route.test.ts`

To run these tests:

**Complexity**: low • **Size**: 1.9KB
**Tags**: `TypeScript`, `API`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/api/entitlements/[user_id]/route.ts`

GET /api/entitlements/[user_id]

**Complexity**: low • **Size**: 1.4KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/20/2025


### `apps/web/app/api/entitlements/clear-cache/route.ts`

POST /api/entitlements/clear-cache

**Complexity**: low • **Size**: 0.9KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/nav/[context_key]/route.test.ts`

To run these tests:

**Complexity**: low • **Size**: 2.5KB
**Tags**: `TypeScript`, `API`, `test`
**Modified**: 6/9/2025


### `apps/web/app/api/nav/[context_key]/route.ts`

API route to return entitlement-filtered nav options for a given context. SSR/session safe, Next.js 15+ compatible.

**Complexity**: low • **Size**: 3.0KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/21/2025


### `apps/web/app/api/orgs/[org_id]/entitlements/route.test.ts`

To run these tests:

**Complexity**: low • **Size**: 1.8KB
**Tags**: `TypeScript`, `API`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/api/orgs/[org_id]/entitlements/route.ts`

GET /api/orgs/[org_id]/entitlements

**Complexity**: low • **Size**: 2.0KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/20/2025


### `apps/web/app/api/provisioning/route.test.ts`

To run these tests:

**Complexity**: low • **Size**: 3.2KB
**Tags**: `TypeScript`, `API`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/api/provisioning/route.ts`

POST /api/provisioning

**Complexity**: low • **Size**: 3.6KB
**Tags**: `TypeScript`, `API`, `Next.js API`, `security`
**Modified**: 6/18/2025


### `apps/web/app/api/tribe/content/[id]/route.ts`

edge.tribesocial.io';

**Complexity**: low • **Size**: 1.6KB
**Tags**: `TypeScript`, `API`, `Next.js API`
**Modified**: 6/20/2025


### `apps/web/app/api/user/[user_id]/preferences/route.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 4.5KB
**Tags**: `TypeScript`, `API`, `test`
**Modified**: 6/9/2025


### `apps/web/app/api/user/[user_id]/preferences/route.ts`

User preferences API with performance optimizations and caching

**Owner**: Backend team • **Complexity**: medium • **Size**: 3.9KB
**Tags**: `API`, `user management`, `preferences`, `caching`, `performance`, `TypeScript`, `Next.js API`
**Modified**: 6/21/2025


### `apps/web/app/api/user/avatar/route.ts`

SSR Auth setup with proper session hydration

**Complexity**: medium • **Size**: 7.4KB
**Tags**: `TypeScript`, `API`, `Next.js API`
**Modified**: 6/21/2025


### `apps/web/app/copilotkit/page.tsx`

🪁 Frontend Actions: https://docs.copilotkit.ai/guides/frontend-actions

**Complexity**: medium • **Size**: 5.7KB
**Tags**: `React`, `TypeScript`, `React hooks`, `AI agent`
**Modified**: 6/1/2025


### `apps/web/app/CopilotKitProvider.tsx`

—

**Complexity**: low • **Size**: 0.3KB
**Tags**: `React`, `TypeScript`, `AI agent`
**Modified**: 6/19/2025


### `apps/web/app/dashboard/DashboardClient.tsx`

—

**Complexity**: low • **Size**: 0.8KB
**Tags**: `React`, `TypeScript`
**Modified**: 6/19/2025


### `apps/web/app/dashboard/page.tsx`

Server-side dashboard page with SSR optimization and entitlement filtering

**Owner**: Frontend team • **Complexity**: medium • **Size**: 3.7KB
**Tags**: `Next.js page`, `SSR`, `entitlements`, `context management`, `performance`, `React`, `TypeScript`, `security`
**Modified**: 6/21/2025


### `apps/web/app/hooks/useContentForContext.ts`

React Query hook for fetching content for a context.

**Complexity**: low • **Size**: 0.8KB
**Tags**: `TypeScript`, `hooks`, `React Query`, `security`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useContextConfig.ts`

React Query hook for fetching context config.

**Complexity**: low • **Size**: 0.7KB
**Tags**: `TypeScript`, `hooks`, `React Query`, `security`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useNavForContext.ts`

React Query hook for fetching nav for a context.

**Complexity**: low • **Size**: 0.7KB
**Tags**: `TypeScript`, `hooks`, `React Query`, `security`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useOrgEntitlements.ts`

React Query hook for fetching org entitlements.

**Complexity**: low • **Size**: 0.6KB
**Tags**: `TypeScript`, `hooks`, `React Query`, `security`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useProvisioning.ts`

React Query mutation hook for provisioning actions.

**Complexity**: low • **Size**: 0.6KB
**Tags**: `TypeScript`, `hooks`, `React Query`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useUserEntitlements.test.ts`

To run these tests:

**Complexity**: low • **Size**: 1.8KB
**Tags**: `TypeScript`, `hooks`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useUserEntitlements.ts`

React Query hook for fetching user entitlements.

**Complexity**: low • **Size**: 0.6KB
**Tags**: `TypeScript`, `hooks`, `React Query`, `security`
**Modified**: 6/9/2025


### `apps/web/app/hooks/useUserPreferences.ts`

React Query hooks for user preferences with optimized caching

**Owner**: Frontend team • **Complexity**: low • **Size**: 1.9KB
**Tags**: `React hooks`, `React Query`, `user preferences`, `caching`, `cross-invalidation`, `TypeScript`, `hooks`
**Modified**: 6/21/2025


### `apps/web/app/layout.tsx`

TODO: See enhancements-and-todos.md — move metadata export to a server component or separate file for App Router compliance.

**Complexity**: low • **Size**: 1.2KB
**Tags**: `React`, `TypeScript`
**Modified**: 6/20/2025


### `apps/web/app/lib/agentService.ts`

AgentService - Central service for invoking agents based on type

**Complexity**: medium • **Size**: 7.2KB
**Tags**: `TypeScript`, `utility`, `AI agent`
**Modified**: 6/20/2025


### `apps/web/app/lib/apiClient/batch.ts`

Complete context data bundle returned by the optimized batch API

**Complexity**: low • **Size**: 2.8KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/apiClient/content.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 1.9KB
**Tags**: `React`, `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/apiClient/content.ts`

Fetches content for a context and user from the API.

**Complexity**: low • **Size**: 1.0KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/apiClient/contextConfig.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 1.7KB
**Tags**: `React`, `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/apiClient/contextConfig.ts`

Fetches context config from the API.

**Complexity**: low • **Size**: 1.0KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/18/2025


### `apps/web/app/lib/apiClient/entitlements.ts`

Fetches all entitlements for a user from the API.

**Complexity**: low • **Size**: 0.8KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/apiClient/nav.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 1.8KB
**Tags**: `React`, `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/apiClient/nav.ts`

Fetches nav options for a context and user from the API.

**Complexity**: low • **Size**: 1.0KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/apiClient/orgEntitlements.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 1.9KB
**Tags**: `React`, `TypeScript`, `utility`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/lib/apiClient/orgEntitlements.ts`

Fetches all entitlements for an organization from the API.

**Complexity**: low • **Size**: 0.8KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/11/2025


### `apps/web/app/lib/apiClient/provisioning.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 1.7KB
**Tags**: `React`, `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/apiClient/provisioning.ts`

Performs a provisioning action via the API.

**Complexity**: low • **Size**: 1.0KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/11/2025


### `apps/web/app/lib/apiClient/userPreferences.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 2.8KB
**Tags**: `React`, `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/apiClient/userPreferences.ts`

API client for user preferences with caching and error handling

**Owner**: Frontend team • **Complexity**: low • **Size**: 2.1KB
**Tags**: `API client`, `user preferences`, `caching`, `error handling`, `TypeScript`, `utility`
**Modified**: 6/21/2025


### `apps/web/app/lib/apiClient/useUserEntitlements.test.tsx`

To run these tests:

**Complexity**: low • **Size**: 1.9KB
**Tags**: `React`, `TypeScript`, `utility`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/lib/authService.ts`

Authentication service layer - extracted from UI components

**Owner**: Backend team • **Complexity**: low • **Size**: 1.5KB
**Tags**: `authentication`, `Supabase`, `service layer`, `session management`, `TypeScript`, `utility`
**Modified**: 6/21/2025


### `apps/web/app/lib/batchService.ts`

Batch service for optimized data fetching with shared entitlements

**Complexity**: medium • **Size**: 4.6KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/contentService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 5.8KB
**Tags**: `TypeScript`, `utility`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/lib/contentService.ts`

Service for content logic. All business rules and data access for content live here.

**Complexity**: medium • **Size**: 4.4KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/contextService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 3.9KB
**Tags**: `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/contextService.ts`

Service for context configuration logic. Optimized for performance with minimal logging.

**Complexity**: low • **Size**: 2.2KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/21/2025


### `apps/web/app/lib/entitlementService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 4.4KB
**Tags**: `TypeScript`, `utility`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/lib/entitlementService.ts`

Service for entitlement logic. All business rules for user permissions live here.

**Complexity**: medium • **Size**: 4.8KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/21/2025


### `apps/web/app/lib/index.ts`

New optimized batch service for performance

**Complexity**: low • **Size**: 0.4KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/navService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 6.4KB
**Tags**: `TypeScript`, `utility`, `test`, `security`
**Modified**: 6/9/2025


### `apps/web/app/lib/navService.ts`

Service for navigation options logic. All business rules and data access for nav options live here.

**Complexity**: medium • **Size**: 5.1KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/21/2025


### `apps/web/app/lib/organizationService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 5.1KB
**Tags**: `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/organizationService.ts`

Service for organization and membership logic. All business rules and data access for organizations live here.

**Complexity**: low • **Size**: 2.9KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/18/2025


### `apps/web/app/lib/provisioningService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 4.1KB
**Tags**: `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/provisioningService.ts`

Service for provisioning users, orgs, and entitlements. All business rules and data access for provisioning live here.

**Complexity**: low • **Size**: 3.2KB
**Tags**: `TypeScript`, `utility`, `security`
**Modified**: 6/18/2025


### `apps/web/app/lib/requestDeduplication.ts`

Request deduplication system to prevent multiple identical API calls.

**Complexity**: medium • **Size**: 3.8KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/18/2025


### `apps/web/app/lib/supabaseClient.ts`

Client-side Supabase client for auth and real-time APIs

**Complexity**: low • **Size**: 0.5KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/13/2025


### `apps/web/app/lib/supabaseServerClient.ts`

Returns a Supabase SSR client with cookie adapter

**Complexity**: low • **Size**: 0.8KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/15/2025


### `apps/web/app/lib/types.ts`

apps/web/app/lib/types.ts

**Complexity**: medium • **Size**: 3.3KB
**Tags**: `TypeScript`, `utility`, `AI agent`, `security`
**Modified**: 6/21/2025


### `apps/web/app/lib/userService.test.ts`

To run these tests:

**Complexity**: medium • **Size**: 4.5KB
**Tags**: `TypeScript`, `utility`, `test`
**Modified**: 6/9/2025


### `apps/web/app/lib/userService.ts`

User service layer with optimized database operations and caching

**Owner**: Backend team • **Complexity**: medium • **Size**: 6.3KB
**Tags**: `service layer`, `user management`, `Supabase`, `performance optimization`, `TypeScript`, `utility`
**Modified**: 6/21/2025


### `apps/web/app/lib/utils.ts`

—

**Complexity**: low • **Size**: 0.2KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/1/2025


### `apps/web/app/login/page.tsx`

Public login page with styled Supabase Auth UI and token synchronization

**Owner**: Frontend team • **Complexity**: low • **Size**: 2.7KB
**Tags**: `authentication`, `Supabase Auth UI`, `login`, `client component`, `React`, `TypeScript`, `React hooks`
**Modified**: 6/21/2025


### `apps/web/app/page.tsx`

SSR Root page that redirects based on session status

**Complexity**: low • **Size**: 0.5KB
**Tags**: `React`, `TypeScript`
**Modified**: 6/13/2025


### `apps/web/app/QueryClientProvider.tsx`

1 minute

**Complexity**: low • **Size**: 1.2KB
**Tags**: `React`, `TypeScript`, `React hooks`
**Modified**: 6/20/2025


### `apps/web/components.json`

ui.shadcn.com/schema.json",

**Size**: 0.4KB
**Tags**: None
**Modified**: 5/31/2025


### `apps/web/components/ai/AIExperience.tsx`

Only render CopilotKit on client side to avoid hydration mismatch

**Complexity**: low • **Size**: 0.7KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`
**Modified**: 6/18/2025


### `apps/web/components/ai/ClientRoot.tsx`

—

**Complexity**: low • **Size**: 0.5KB
**Tags**: `React`, `TypeScript`, `UI`
**Modified**: 6/1/2025


### `apps/web/components/ai/ComponentSchemaRenderer.tsx`

File: apps/web/components/ai/ComponentSchemaRenderer.tsx

**Complexity**: high • **Size**: 23.0KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`, `AI agent`
**Modified**: 6/18/2025


### `apps/web/components/DynamicContextPage.tsx`

Agent-native 3-panel layout. Pure renderer - displays only what agents return.

**Complexity**: high • **Size**: 12.7KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`, `AI agent`
**Modified**: 6/21/2025


### `apps/web/components/SupabaseProvider.tsx`

Start with initialSession to prevent auth flash

**Complexity**: medium • **Size**: 3.3KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`
**Modified**: 6/19/2025


### `apps/web/components/ui/ContentPanel.tsx`

—

**Complexity**: low • **Size**: 0.3KB
**Tags**: `React`, `TypeScript`, `UI`
**Modified**: 6/2/2025


### `apps/web/components/ui/ContextSelector.tsx`

Get icon image path

**Complexity**: medium • **Size**: 4.1KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`
**Modified**: 6/10/2025


### `apps/web/components/ui/dialog.tsx`

—

**Complexity**: low • **Size**: 1.3KB
**Tags**: `React`, `TypeScript`, `UI`
**Modified**: 6/21/2025


### `apps/web/components/ui/legacy_course_modal.tsx`

Fetch content from Tribe API

**Complexity**: medium • **Size**: 4.9KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`
**Modified**: 6/6/2025


### `apps/web/components/ui/legacy_training_library.tsx`

Transform content into our Training format

**Complexity**: high • **Size**: 18.1KB
**Tags**: `React`, `TypeScript`, `UI`, `React hooks`, `security`
**Modified**: 6/6/2025


### `apps/web/components/ui/NavPanel.test.tsx`

Test component to validate database-driven navigation

**Complexity**: low • **Size**: 0.6KB
**Tags**: `React`, `TypeScript`, `UI`, `test`
**Modified**: 6/20/2025


### `apps/web/components/ui/NavPanel.tsx`

Navigation panel for agent-native app, themed via contextConfig

**Owner**: Frontend team • **Complexity**: high • **Size**: 16.1KB
**Tags**: `UI`, `navigation`, `context-based`, `React`, `TypeScript`, `React hooks`, `AI agent`
**Modified**: 6/21/2025


### `apps/web/components/ui/ThemeContext.tsx`

Accepts the theme object (from contextConfig.json)

**Complexity**: low • **Size**: 0.4KB
**Tags**: `React`, `TypeScript`, `UI`
**Modified**: 6/1/2025


### `apps/web/components/ui/ThreePanelLayout.tsx`

Three-panel layout component with theme context and collapsible navigation

**Owner**: Frontend team • **Complexity**: low • **Size**: 2.3KB
**Tags**: `UI`, `layout`, `theme`, `React`, `client component`, `TypeScript`, `React hooks`
**Modified**: 6/21/2025


### `apps/web/components/ui/UserProfileModal.tsx`

Fetch user data from API

**Complexity**: high • **Size**: 15.9KB
**Tags**: `React`, `TypeScript`, `UI`, `React Query`, `React hooks`
**Modified**: 6/21/2025


### `apps/web/components/ui/xxxChatPanel.tsx`

—

**Complexity**: low • **Size**: 0.3KB
**Tags**: `React`, `TypeScript`, `UI`
**Modified**: 6/1/2025


### `apps/web/hooks/useAvatar.ts`

React Query hook for optimized avatar fetching with caching

**Owner**: Frontend team • **Complexity**: low • **Size**: 2.1KB
**Tags**: `React hooks`, `React Query`, `avatar`, `performance`, `caching`, `TypeScript`, `hooks`
**Modified**: 6/21/2025


### `apps/web/hooks/useContextConfig.ts`

Don't revalidate immediately if we have initial data

**Complexity**: low • **Size**: 0.5KB
**Tags**: `TypeScript`, `hooks`
**Modified**: 6/18/2025


### `apps/web/hooks/useContextList.ts`

—

**Complexity**: low • **Size**: 0.9KB
**Tags**: `TypeScript`, `hooks`, `React hooks`
**Modified**: 6/17/2025


### `apps/web/hooks/useNavigation.ts`

Database-driven navigation hook that transforms NavOption[] to NavPanelSchema

**Owner**: Frontend team • **Complexity**: medium • **Size**: 4.8KB
**Tags**: `React hooks`, `navigation`, `database-driven`, `entitlements`, `React Query`, `TypeScript`, `hooks`, `AI agent`, `security`
**Modified**: 6/21/2025


### `apps/web/hooks/useNavOptions.ts`

Custom hook to fetch entitlement-filtered nav options for a given context from the API, using SWR. Used to drive schema-driven NavPanel.

**Complexity**: low • **Size**: 1.3KB
**Tags**: `TypeScript`, `hooks`, `security`
**Modified**: 6/18/2025


### `apps/web/lib/server/loadContextConfig.ts`

—

**Complexity**: low • **Size**: 0.3KB
**Tags**: `TypeScript`, `utility`
**Modified**: 6/1/2025


### `apps/web/next-env.d.ts`

/ <reference types="next" />

**Complexity**: low • **Size**: 0.2KB
**Tags**: `TypeScript`
**Modified**: 5/27/2025


### `apps/web/next.config.js`

Root of apps/web

**Complexity**: low • **Size**: 0.9KB
**Tags**: None
**Modified**: 6/20/2025


### `apps/web/package-lock.json`

registry.npmjs.org/@0no-co/graphql.web/-/graphql.web-1.1.2.tgz",

**Size**: 485.8KB
**Tags**: `AI agent`
**Modified**: 5/31/2025


### `apps/web/package.json`

—

**Size**: 1.0KB
**Tags**: `AI agent`
**Modified**: 6/20/2025


### `apps/web/postcss.config.js`

—

**Complexity**: low • **Size**: 0.1KB
**Tags**: None
**Modified**: 5/27/2025


### `apps/web/tailwind.config.ts`

tailwind.config.ts

**Complexity**: low • **Size**: 2.1KB
**Tags**: `TypeScript`
**Modified**: 6/1/2025


### `apps/web/tsconfig.eslint.json`

—

**Size**: 0.2KB
**Tags**: None
**Modified**: 6/18/2025


### `apps/web/tsconfig.json`

—

**Size**: 0.7KB
**Tags**: None
**Modified**: 5/27/2025


### `docs/agent-native-cursor-project-rules.md`

—

**Size**: 4.4KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/20/2025


### `docs/agent-native-leader-brief-presentation.md`

—

**Size**: 2.0KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/6/2025


### `docs/agent-native-leader-brief.md`

—

**Size**: 4.6KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/7/2025


### `docs/dev-notes/abstraction_layer.md`

apps/web/app/lib/contextService.ts

**Size**: 5.0KB
**Tags**: `documentation`, `Next.js API`, `AI agent`, `security`
**Modified**: 6/9/2025


### `docs/dev-notes/agent-architecture.md`

Grid, Card, Panel, etc.

**Size**: 10.5KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/20/2025


### `docs/dev-notes/agent-configuration-guide.md`

—

**Size**: 6.7KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/3/2025


### `docs/dev-notes/agent-prompt-engineering_UPDATED.md`

Pattern: Reframing Problems as Opportunities

**Size**: 18.8KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/1/2025


### `docs/dev-notes/architecture-foundations_UPDATED.md`

Each module is self-contained with clear interfaces

**Size**: 18.4KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/20/2025


### `docs/dev-notes/business-rules-documentation_UPDATED.md`

Business Rule: Auto-upgrade legacy subscribers

**Size**: 24.1KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/20/2025


### `docs/dev-notes/code_hygiene_checklist.md`

pnpm.io/)

**Size**: 2.4KB
**Tags**: `documentation`
**Modified**: 6/1/2025


### `docs/dev-notes/component-styling-guidelines.md`

...etc

**Size**: 4.4KB
**Tags**: `documentation`
**Modified**: 6/15/2025


### `docs/dev-notes/copilotkit_usage.md`

apps/web/components/ai/AIExperience.tsx

**Size**: 2.8KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/1/2025


### `docs/dev-notes/database_setup_addendum_UPDATED.md`

orm.drizzle.team/)

**Size**: 41.8KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/2/2025


### `docs/dev-notes/deployment-devops-guide_UPDATED.md`

raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

**Size**: 8.1KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/1/2025


### `docs/dev-notes/development-setup_UPDATED.md`

github.com/your-org/leaderforge.git

**Size**: 14.2KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/1/2025


### `docs/dev-notes/enhancements-and-todos.md`

—

**Size**: 5.4KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/16/2025


### `docs/dev-notes/env-config-addendum_UPDATED.md`

localhost:3000

**Size**: 28.3KB
**Tags**: `documentation`
**Modified**: 6/1/2025


### `docs/dev-notes/feature_flags.md`

posthog.com) as our feature flag and analytics provider. All flag checks are abstracted through a single TypeScript service, ensuring flexibility and vendor independence.

**Size**: 2.7KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/1/2025


### `docs/dev-notes/langgraph_usage.md`

packages/agent-core/agents/conversationAgent.ts

**Size**: 2.9KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/1/2025


### `docs/dev-notes/licensing-and-entitlement-architecture.md`

—

**Size**: 17.2KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/10/2025


### `docs/dev-notes/module_configuration_addendum_UPDATED.md`

Module theme application

**Size**: 25.1KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/1/2025


### `docs/dev-notes/navpanel-refactoring-plan.md`

Transform database nav_options to NavPanelSchema

**Size**: 13.3KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/21/2025


### `docs/dev-notes/performance-requirements_UPDATED.md`

Time to first token streaming

**Size**: 9.9KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/1/2025


### `docs/dev-notes/rls-policies.sql`

—

**Size**: 4.0KB
**Tags**: `documentation`, `security`
**Modified**: 6/9/2025


### `docs/dev-notes/simplified-entitlement-system.md`

Navigation click handler

**Size**: 9.8KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/20/2025


### `docs/dev-notes/supabase_core_grants.sql.md`

—

**Size**: 8.2KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/9/2025


### `docs/dev-notes/supabase-ssr-auth-debug.md`

jwt.io)), the following issue occurred:

**Size**: 2.3KB
**Tags**: `documentation`
**Modified**: 6/13/2025


### `docs/dev-notes/tribe-social-docs.md`

api.tribesocial.io/api/view-data" \

**Size**: 112.0KB
**Tags**: `documentation`, `security`
**Modified**: 6/1/2025


### `docs/dev-notes/ui-glossary-and-styling.md`

en.json

**Size**: 4.5KB
**Tags**: `documentation`
**Modified**: 6/1/2025


### `docs/file-header-template.md`

Brief description of what this file does and why it exists

**Owner**: Team or individual responsible (e.g., "Frontend team", "Backend team", "AI team") • **Size**: 2.9KB
**Tags**: `comma`, `separated`, `tags (e.g.`, `"UI`, `navigation`, `context-based")`, `documentation`, `Next.js API`, `AI agent`, `security`
**Modified**: 6/21/2025


### `docs/how-to-add-or-change-agents.md`

—

**Size**: 2.0KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/3/2025


### `docs/how-to-add-or-change-components.md`

—

**Size**: 2.8KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/6/2025


### `docs/how-to-add-or-change-contexts.md`

—

**Size**: 2.0KB
**Tags**: `documentation`
**Modified**: 6/3/2025


### `docs/how-to-add-or-change-langgraph-agent-orchestration.md`

—

**Size**: 2.2KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/3/2025


### `docs/how-to-add-or-change-styles.md`

—

**Size**: 1.3KB
**Tags**: `documentation`
**Modified**: 6/3/2025


### `docs/how-to-add-or-change-themes.md`

—

**Size**: 1.5KB
**Tags**: `documentation`
**Modified**: 6/3/2025


### `docs/how-to-add-or-change-tools.md`

—

**Size**: 2.2KB
**Tags**: `documentation`, `AI agent`
**Modified**: 6/6/2025


### `docs/manifest.json`

Local LangGraph dev server",

**Size**: 90.7KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/21/2025


### `docs/manifest.md`

Local LangGraph dev server

**Size**: 33.2KB
**Tags**: `documentation`, `AI agent`, `security`
**Modified**: 6/21/2025


### `packages/agent-core/agents/ContentLibraryAgent.ts`

NOTE: You may need to install 'langsmith' with `pnpm add langsmith` if not present.

**Complexity**: low • **Size**: 1.8KB
**Tags**: `TypeScript`
**Modified**: 6/8/2025


### `packages/agent-core/agents/ContentSyncAgent.test.ts`

—

**Complexity**: low • **Size**: 0.4KB
**Tags**: `TypeScript`, `test`
**Modified**: 6/7/2025


### `packages/agent-core/agents/ContentSyncAgent.ts`

ContentSyncAgent: Syncs TribeSocial content into modules.content for a given context.

**Complexity**: low • **Size**: 3.1KB
**Tags**: `TypeScript`
**Modified**: 6/8/2025


### `packages/agent-core/featureFlags.ts`

app.posthog.com";

**Complexity**: low • **Size**: 0.9KB
**Tags**: `TypeScript`
**Modified**: 6/7/2025


### `packages/agent-core/index.ts`

—

**Complexity**: low • **Size**: 0.1KB
**Tags**: `TypeScript`, `AI agent`
**Modified**: 6/7/2025


### `packages/agent-core/package.json`

—

**Size**: 0.1KB
**Tags**: `AI agent`
**Modified**: 5/30/2025


### `packages/agent-core/tools/ToolRegistry.ts`

—

**Complexity**: low • **Size**: 2.5KB
**Tags**: `TypeScript`, `security`
**Modified**: 6/6/2025


### `packages/agent-core/tools/TribeSocialContentTool.ts`

TribeSocialContentTool

**Complexity**: medium • **Size**: 7.0KB
**Tags**: `TypeScript`
**Modified**: 6/18/2025


### `packages/agent-core/tools/UserProgressTool.ts`

Agent-native, production-ready user progress tool for modular agent orchestration.

**Complexity**: medium • **Size**: 3.6KB
**Tags**: `TypeScript`, `AI agent`
**Modified**: 6/7/2025


### `packages/agent-core/types/ComponentSchema.ts`

ComponentSchema.ts

**Complexity**: low • **Size**: 2.0KB
**Tags**: `TypeScript`, `AI agent`
**Modified**: 6/6/2025


### `packages/agent-core/types/contentSchema.ts`

All schema types are props-wrapped. Do not use flat schemas.

**Complexity**: low • **Size**: 1.2KB
**Tags**: `TypeScript`
**Modified**: 6/3/2025


### `packages/env/index.ts`

—

**Complexity**: low • **Size**: 0.3KB
**Tags**: `TypeScript`
**Modified**: 5/27/2025


### `packages/env/package.json`

—

**Size**: 0.1KB
**Tags**: None
**Modified**: 5/27/2025



---

*This manifest is automatically generated. To update file documentation, modify the comment headers in individual files.*
