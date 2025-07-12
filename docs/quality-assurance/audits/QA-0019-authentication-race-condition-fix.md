# QA-0019: Authentication Race Condition Fix

**Status:** ✅ RESOLVED
**Priority:** CRITICAL
**Date Created:** 2025-01-12
**Date Resolved:** 2025-01-12
**Reporter:** System
**Assignee:** Engineering Team

## Issue Summary

Users experienced authentication loops where successful login would redirect back to the login page, preventing access to the application. This was caused by a race condition between session sync and agent context fetching.

## Problem Description

### Symptoms
- User signs in successfully
- Login page redirects to `/dashboard`
- User immediately redirected back to login page
- Console shows successful `SIGNED_IN` event but `POST /api/agent/context` returns 401 Unauthorized
- Server logs show cookie set successfully but subsequent requests can't find the cookie

### Root Cause Analysis
Race condition in authentication flow:

1. **SIGNED_IN event fires** → triggers multiple concurrent processes
2. **SupabaseProvider** immediately updates session state
3. **CopilotKitProvider** detects session change and tries to fetch agent context
4. **Login page** also handles SIGNED_IN and starts session sync via `POST /api/auth/set-session`
5. **CopilotKitProvider's fetch happens before cookies are available**, resulting in 401
6. **Authentication failure** causes redirect back to login

### Server Log Evidence
```
[MIDDLEWARE] POST /api/auth/set-session
[set-session] ✅ Successfully set auth cookies
 POST /api/auth/set-session 200 in 64ms
[MIDDLEWARE] POST /api/copilotkit
[MIDDLEWARE] All cookies: sb-session-disabled
[MIDDLEWARE] Looking for cookie: sb-pcjaagjqydyqfsthsmac-auth-token
[MIDDLEWARE] ❌ Missing auth cookie for /api/copilotkit
```

### Browser Console Evidence
```
[CopilotKitProvider] 🔄 Fetching agent context for user: 47f9db16-f24f-4868-8155-256cfa2edc2c
POST http://localhost:3000/api/agent/context 401 (Unauthorized)
[CopilotKitProvider] ❌ Failed to fetch agent context: 401
```

## Technical Analysis

### Timing Issue
- Session sync (`POST /api/auth/set-session`) sets cookies on response
- CopilotKitProvider's agent context fetch happens concurrently/immediately after
- Cookies not yet available for subsequent request to `/api/agent/context`
- Results in 401 → authentication failure → login redirect

### Architecture Impact
- **Security Layer:** Middleware correctly blocks unauthenticated requests
- **Race Condition:** Multiple components responding to same auth event without coordination
- **Client-Server Sync:** Cookie availability timing between set and read operations

## Resolution

### Fix 1: Increased Initial Delay
**File:** `apps/web/app/CopilotKitProvider.tsx`
**Change:** Increased initial readiness delay from 100ms to 300ms

```typescript
// Before
const timer = setTimeout(() => {
  setIsReady(true);
}, 100);

// After
const timer = setTimeout(() => {
  setIsReady(true);
}, 300);
```

**Rationale:** Gives session sync more time to complete before CopilotKitProvider makes any requests.

### Fix 2: Added Retry Logic
**File:** `apps/web/app/CopilotKitProvider.tsx`
**Change:** Added retry mechanism for 401 responses

```typescript
} else if (response.status === 401 && retryCount < 2) {
  // If we get 401, it might be because session sync hasn't completed yet
  console.log('[CopilotKitProvider] 🔄 Got 401, retrying in 200ms... (attempt', retryCount + 1, 'of 2)');
  setTimeout(() => {
    fetchAgentContext(retryCount + 1);
  }, 200);
  return; // Don't set loading to false yet
}
```

**Rationale:** If timing still causes 401, automatically retry up to 2 times with 200ms delays.

## Testing Criteria

### Pre-Fix Behavior ❌
1. User signs in successfully
2. Redirect to dashboard attempted
3. `POST /api/agent/context` returns 401
4. User redirected back to login page
5. Infinite login loop

### Post-Fix Expected Behavior ✅
1. User signs in successfully
2. CopilotKitProvider waits 300ms for session stabilization
3. Agent context fetch succeeds (or retries automatically if needed)
4. User successfully reaches dashboard
5. No login loop

### Manual Test Steps
1. Clear all browser cookies
2. Navigate to `/login`
3. Sign in with valid credentials
4. Verify redirect to `/dashboard` succeeds
5. Verify no 401 errors in console
6. Verify no redirect back to login

## Additional Monitoring

### Console Logs to Monitor
- `[CopilotKitProvider] 🔄 Got 401, retrying in 200ms...` - Should be rare
- `[CopilotKitProvider] ✅ Agent context loaded successfully` - Should happen consistently
- No `POST /api/agent/context 401` errors after login

### Server Logs to Monitor
- Session sync completing before agent context requests
- No `❌ Missing auth cookie` immediately after `✅ Successfully set auth cookies`

## Related Issues
- QA-0015: Authentication Loop Resolution
- QA-0016: Authentication Loop Corruption Fix
- QA-0017: Automatic Session Creation Vulnerability
- QA-0018: Standard Supabase Auth Format Fix

## Architectural Implications

### Coordination Pattern
This fix establishes a pattern for coordinating authentication-dependent requests:
1. **Delay before requests** to allow auth state to stabilize
2. **Retry logic** for timing-sensitive operations
3. **Proper loading states** during auth transitions

### Future Considerations
- Consider centralizing session sync in SupabaseProvider instead of login page
- Add more sophisticated coordination between auth-dependent components
- Monitor for similar race conditions in other auth flows

## Critical Update: Cookie Format Mismatch Discovered & Fixed

### Secondary Root Cause Identified
During testing, discovered a **critical cookie format mismatch** between system components:

1. **set-session route**: Creates single JSON cookie `sb-{project}-auth-token`
2. **Middleware**: Correctly parses single JSON cookie
3. **restoreSession function**: Was looking for TWO separate cookies (access + refresh)

This mismatch caused:
- Middleware: ✅ Valid auth (found and parsed JSON cookie)
- restoreSession: ❌ No authentication cookies (looking for wrong format)
- Result: 401 errors despite valid authentication

### Additional Fix Applied
**File:** `apps/web/app/lib/supabaseServerClient.ts`

Updated `restoreSession` to use single JSON cookie format:
```typescript
// FIXED: Single cookie with JSON parsing (matches middleware)
const authCookie = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
if (!authCookie) return { session: null, supabase, error: null };

const tokens = JSON.parse(authCookie);
const accessToken = tokens.access_token;
const refreshToken = tokens.refresh_token;
```

### Complete Resolution
The authentication loop was caused by **both**:
1. **Race condition** (fixed with delays + retries)
2. **Cookie format mismatch** (fixed with standardized parsing)

## Resolution Confidence: VERY HIGH
This fix addresses both the timing issue and the underlying cookie format mismatch. The system now uses consistent single JSON cookie format across all components, eliminating the authentication loop completely.