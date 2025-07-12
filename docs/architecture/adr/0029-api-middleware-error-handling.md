# ADR-0029: API-Specific Middleware Error Handling

**Date:** 2024-10-18

**Status:** Accepted

## Context

Middleware was redirecting all protected routes (including APIs) to /login on auth failure, returning HTML. This broke client-side JSON fetches (e.g., in CopilotKitProvider), causing SyntaxErrors when parsing HTML as JSON. This violated API rules for thin endpoints and proper error handling.

## Decision

Update middleware to return JSON { error: 'Unauthorized' } with 401 status for paths starting with '/api/' instead of redirecting. Preserve redirects for non-API paths to maintain SSR security.

## Options Considered
1. API-specific handling in middleware (chosen).
2. Per-route auth handlers.
3. Global error middleware.

## Consequences
- APIs return proper JSON errors.
- Maintains security without breaking clients.
- Requires testing for all API routes.

## Implementation
Update `apps/web/middleware.ts` to check if pathname.startsWith('/api/') and return JSON 401 if unauthorized.

## Related Documents
- ADR-0028 (Hybrid Auth Fix)
- QA-0013 (Security Architecture Fix)