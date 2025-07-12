# QA-0018: Standard Supabase SSR Authentication Format Fix

## Status
Resolved

## Issue Description
Session restoration was failing due to non-standard cookie format (separate access/refresh cookies instead of single JSON cookie), causing 401 errors, auth loops, and console warnings despite valid tokens. This led to authentication failures in API routes while bucket access worked via service role fallback.

## Root Cause
- Custom cookie handling mismatched Supabase's expected JSON format for auth-token cookie
- restoreSession attempted to validate separate tokens but getSession() returned null
- No Supabase log errors as issue was client-side cookie mismatch

## Resolution
- Standardized to single `sb-{project}-auth-token` cookie with JSON [access, null, refresh, null, null]
- Updated set-session to set proper JSON cookie
- Updated clear-session to clear single cookie
- Simplified restoreSession to rely on Supabase's getSession() with error handling
- Maintained service role for storage buckets (avatars) as exception

## Verification
- Login now sets single JSON cookie
- API routes restore sessions successfully without 401s
- No more "No session found despite valid tokens" logs
- Auth loops eliminated
- Bucket access unchanged

## Impact
All API routes now use consistent SSR auth. Resolves multiple related QA issues (0013-0017).

Date: 2024-07-11
Auditor: AI Engineer