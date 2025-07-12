# ADR-0027: Standardize to Supabase Default SSR Authentication Format

## Status
Accepted

## Context
The current authentication implementation uses separate cookies for access and refresh tokens, which mismatches Supabase's expected JSON-formatted single cookie. This causes `supabase.auth.getSession()` to fail in restoring sessions despite tokens being present, leading to 401 errors, authentication loops, and console errors. No issues appear in Supabase logs as the problem is local to cookie handling. This violates our SSR-first authentication principle and creates security risks from failed auth checks.

## Decision
Standardize authentication cookie handling to Supabase's default format:
- Use a single cookie named `sb-{projectRef}-auth-token` with value as JSON.stringify([access_token, null, refresh_token, null, null])
- Update `set-session` route to set this single cookie on login
- Update `clear-session` route to clear this single cookie on logout
- Simplify `restoreSession` to rely on Supabase's built-in session restoration without custom token checks
- Maintain service role usage for storage bucket access (e.g., avatars) as an exception

This aligns with "Use established Supabase SSR + session management" and resolves the bug with minimal changes.

## Consequences
- Positive: Fixes session restoration failures, eliminates auth loops, ensures consistent SSR auth across routes
- Negative: Requires updates to auth routes and restoreSession; existing sessions will need to be cleared and re-authenticated
- Risks: Minimal - Standard format reduces custom logic; test thoroughly for edge cases like token expiration
- Follow-up: Update all API routes to use the simplified restoreSession; monitor for any remaining auth issues; document in QA audit

Date: 2024-07-11
Deciders: AI Architect, User