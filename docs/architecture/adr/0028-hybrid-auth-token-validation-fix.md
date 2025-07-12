# ADR-0028: Hybrid Authentication Token Validation Fix

**Date:** 2024-10-18

**Status:** Accepted

## Context

In fresh incognito sessions, the Supabase client was triggering premature session recovery, leading to partial tokens (access without refresh) being sent to /api/auth/set-session, which set invalid cookies causing refresh failures and login loops. This violated SSR-first auth principles by allowing client-side artifacts to create invalid server states.

## Decision

Implement a hybrid fix:
- Enhance server-side validation in set-session/route.ts to require both valid access and refresh tokens.
- Add client-side safeguards in login/page.tsx to only call set-session if both tokens are present and valid.
- Disable client-side auto-recovery by setting detectSessionInUrl: false in Supabase client creation.

This reinforces SSR-first auth, prevents invalid states, and maintains separation of concerns.

## Considered Options

1. Server-side validation only.
2. Disable client-side recovery only.
3. Hybrid approach (chosen).

## Consequences

- Positive: Eliminates auth loops, standardizes token handling, reduces technical debt.
- Negative: Minimal additional checks; requires testing for legitimate logins.
- Neutral: No changes to core architecture.

## Implementation Notes

- Files modified: set-session/route.ts, login/page.tsx, supabaseClient.ts, SupabaseProvider.tsx.
- Success Criteria: No invalid cookies in incognito; successful logins without errors.
- Risks: Potential over-validation blocking valid sessions - mitigated by JWT checks.
- Follow-up: Monitor auth logs; update if new edge cases found.

**Approved by:** User (via conversation confirmation)