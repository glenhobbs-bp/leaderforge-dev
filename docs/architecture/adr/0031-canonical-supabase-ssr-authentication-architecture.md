# ADR-0031: Canonical Supabase SSR Authentication Architecture

**Date:** 2025-01-12
**Status:** Accepted
**Supersedes:** ADR-0027, ADR-0028, ADR-0030 (consolidates and extends)
**Deciders:** Senior Architect, Engineering Team

## Context

Our application requires a **standard, secure, and fast authentication system** that follows Supabase best practices for Server-Side Rendering (SSR). Previous implementations had inconsistencies, security vulnerabilities, and complex workarounds that created technical debt and maintenance burden.

We need a single, authoritative architectural document that:
- Defines our SSR-first authentication patterns
- Provides clear guidelines for route and page auditing
- Specifies when and how to use service tokens
- Eliminates custom authentication logic in favor of Supabase standards
- Ensures consistent security across all application components

## Decision

We adopt a **Supabase-native SSR authentication architecture** with the following core principles:

### Core Architecture Principles

#### 1. **SSR-First Authentication**
- **Server-side authentication is authoritative** - all authentication decisions made server-side
- **Client-side authentication follows server decisions** - no client-side authentication bypass
- **Middleware-first protection** - all protected routes intercepted at middleware level
- **No mixed authentication patterns** - consistent SSR approach across entire application

#### 2. **Standard Supabase Cookie Format**
- **Single JSON cookie**: `sb-{projectRef}-auth-token` containing complete session data
- **No custom cookie handling** - rely on Supabase's built-in session management
- **Automatic token refresh** - handled by Supabase client, not custom logic

#### 3. **Defense in Depth Security**
- **Middleware protection** - request-level authentication before any content served
- **Page-level validation** - server components validate sessions before rendering
- **API route authentication** - all API endpoints require valid sessions
- **No client-side security** - client-side guards are UX enhancement only

## Implementation Standards

### 1. **Middleware Authentication** (Universal Protection)

**File:** `apps/web/middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Define protected routes
  const PROTECTED_ROUTES = ['/dashboard', '/context', '/copilotkit', '/user'];
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const cookieStore = request.cookies;
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|public).*)']
};
```

### 2. **Server Component Authentication** (Page-Level)

**Pattern for all protected pages:**

```typescript
// apps/web/app/protected-page/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../lib/supabaseServerClient';

export default async function ProtectedPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div>
      {/* Protected content - only rendered with valid session */}
    </div>
  );
}
```

### 3. **API Route Authentication** (Endpoint Protection)

**Pattern for all API routes:**

```typescript
// apps/web/app/api/protected-endpoint/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { restoreSession } from '../../lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  // Authenticate using standardized restoreSession
  const cookieStore = await cookies();
  const { session, error } = await restoreSession(cookieStore);

  if (error || !session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Process authenticated request
  const userId = session.user.id;
  // ... business logic
}
```

### 4. **Session Management** (Login/Logout)

**Login Flow:**
```typescript
// apps/web/app/api/auth/set-session/route.ts
export async function POST(request: NextRequest) {
  const { access_token, refresh_token } = await request.json();

  // Validate tokens (JWT format for access, string for refresh)
  if (!isValidJWT(access_token) || !refresh_token) {
    return NextResponse.json({ error: 'Invalid tokens' }, { status: 400 });
  }

  // Set standard Supabase cookie format
  const response = NextResponse.json({ success: true });
  const authCookie = JSON.stringify([access_token, null, refresh_token, null, null]);

  response.cookies.set(`sb-${projectRef}-auth-token`, authCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return response;
}
```

**Logout Flow:**
```typescript
// apps/web/app/api/auth/clear-session/route.ts
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete(`sb-${projectRef}-auth-token`);
  response.cookies.delete('sb-session-disabled');

  return response;
}
```

## Service Token Usage

### When to Use Service Tokens

**Service Role tokens** are used ONLY for operations that require elevated privileges beyond user authentication:

#### ✅ **Approved Service Token Use Cases:**
1. **Storage bucket operations** - Avatar uploads, file management
2. **Administrative operations** - System-level data access
3. **Background jobs** - Scheduled tasks, cleanup operations
4. **Inter-service communication** - API-to-API authentication

#### ❌ **Prohibited Service Token Use Cases:**
1. **User-facing authentication** - Always use user sessions
2. **Client-side operations** - Service tokens NEVER exposed to client
3. **Bypassing user permissions** - Service tokens don't bypass entitlements
4. **Convenience shortcuts** - Use proper user authentication

### Service Token Implementation

```typescript
// Service token usage pattern
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Example: Avatar file operations
export async function uploadAvatar(userId: string, file: File) {
  // Use service role for storage bucket access
  const { data, error } = await supabaseAdmin.storage
    .from('avatars')
    .upload(`${userId}_${Date.now()}.png`, file);

  if (error) throw error;
  return data;
}
```

## Route and Page Audit Guidelines

### Authentication Audit Checklist

Use this checklist to audit ALL routes and pages for proper authentication:

#### **1. Middleware Coverage**
- [ ] All protected routes defined in `PROTECTED_ROUTES` array
- [ ] Middleware configuration covers all necessary paths
- [ ] Public routes (login, landing pages) explicitly excluded
- [ ] No authentication bypass possible via HTTP methods or edge cases

#### **2. Server Component Security**
- [ ] All protected pages use server components (no `'use client'`)
- [ ] Session validation before any content rendering
- [ ] Proper redirect to `/login` for unauthenticated users
- [ ] No sensitive data exposed in components before auth check

#### **3. API Route Protection**
- [ ] All API routes use `restoreSession()` for authentication
- [ ] Proper 401 responses for unauthenticated requests
- [ ] User ID extracted from session, not request parameters
- [ ] No business logic exposed without authentication

#### **4. Client Component Guidelines**
- [ ] Client components never perform authentication checks for security
- [ ] `AuthenticationGuard` used only for UX enhancement
- [ ] No sensitive operations in client-side code
- [ ] Loading states handle authentication gracefully

#### **5. Security Patterns**
- [ ] No custom authentication logic outside established patterns
- [ ] Service tokens used only for approved use cases
- [ ] No client-side storage of sensitive authentication data
- [ ] Session management follows Supabase standards

### Route Classification

#### **Public Routes** (No Authentication)
- `/login` - Authentication page
- `/` - Landing page (redirects to dashboard if authenticated)
- `/public/*` - Public assets and documentation

#### **Protected Routes** (Require Authentication)
- `/dashboard/*` - Main application interface
- `/context/*` - Context management
- `/copilotkit/*` - AI interaction interface
- `/user/*` - User profile and settings
- `/api/*` - All API endpoints (except auth endpoints)

#### **Administrative Routes** (Require Admin Entitlements)
- `/admin/*` - Administrative interface
- `/api/admin/*` - Administrative API endpoints

## Security Best Practices

### 1. **Token Handling**
- Access tokens are JWTs with standard validation
- Refresh tokens are opaque strings (no JWT validation)
- Tokens never exposed to client-side JavaScript
- Automatic token refresh handled by Supabase client

### 2. **Session Security**
- Sessions validated on every request (middleware + page level)
- No session fixation or hijacking vulnerabilities
- Proper session cleanup on logout
- Session data never trusted without server-side validation

### 3. **Cookie Security**
- `httpOnly: true` - No client-side access
- `secure: true` in production - HTTPS only
- `sameSite: 'strict'` - CSRF protection
- Proper expiration and cleanup

## Testing and Validation

### Authentication Testing Checklist

#### **Security Testing**
- [ ] Incognito browser cannot access protected routes
- [ ] Direct URL access requires authentication
- [ ] Cookie manipulation doesn't bypass authentication
- [ ] Session expiration properly handled

#### **Functional Testing**
- [ ] Login flow works correctly
- [ ] Logout clears all authentication state
- [ ] Page navigation maintains authentication
- [ ] API calls include proper authentication headers

#### **Performance Testing**
- [ ] Authentication checks are fast (<100ms)
- [ ] No unnecessary authentication calls
- [ ] Proper caching of authentication state

## Consequences

### Positive Outcomes
- **Security**: Consistent, vulnerability-free authentication across entire application
- **Maintainability**: Single source of truth for authentication patterns
- **Performance**: Fast, optimized authentication with minimal overhead
- **Developer Experience**: Clear patterns and guidelines for all authentication scenarios
- **Compliance**: Meets security standards and best practices

### Potential Risks
- **Migration Effort**: Existing non-compliant routes require updates
- **Testing Requirements**: Comprehensive testing needed for security validation
- **Documentation Maintenance**: Guidelines must be kept current with Supabase updates

### Migration Path
1. **Audit Phase**: Use checklist to identify non-compliant routes
2. **Update Phase**: Convert routes to standard patterns
3. **Testing Phase**: Comprehensive security and functional testing
4. **Documentation Phase**: Update all authentication-related documentation

## Related Documentation

- **Implementation**: See `apps/web/lib/supabaseServerClient.ts` for utilities
- **Middleware**: See `apps/web/middleware.ts` for universal protection
- **QA Audits**: See `docs/quality-assurance/audits/QA-0011` through `QA-0019` for resolved issues
- **Entitlements**: See ADR-0022 for authorization layer above authentication

## Approval

**Approved by:** Senior Architect, Engineering Team
**Implementation Date:** Immediate
**Review Date:** Quarterly (or as Supabase updates require)

---

**Note**: This ADR supersedes all previous authentication-related decisions and serves as the canonical reference for authentication architecture in this application.