/**
 * Purpose: Next.js Middleware - Request-level authentication and routing protection
 * Owner: Security Team
 * Tags: [middleware, authentication, security, request-intercept]
 *
 * CRITICAL: This middleware runs on ALL requests BEFORE any page components render.
 * It provides the foundational security layer that prevents content from being served
 * to unauthenticated users at the edge/server level.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/', // Root page needs authentication to redirect properly
  '/dashboard',
  '/copilotkit',
  '/context',
  '/test-forms', // In case any test routes are added back
  '/api/agent',
  '/api/content',
  '/api/user',
  '/api/context',
  '/api/nav',
  '/api/entitlements',
  '/api/files',
  '/api/tenant',
  '/api/tribe',
  '/api/universal-progress'
];

// Public routes that should always be accessible
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth',
  '/api/copilotkit', // CopilotKit handles its own auth
  '/api/debug'
];

// Extract project reference from Supabase URL
function getProjectRef(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

// Removed expensive validateTokenWithSupabase - middleware should be fast
// Individual API endpoints will handle detailed token validation when needed

export function createAuthFailureResponse(
  request: NextRequest,
  error: string,
  status: number = 401
) {
  const { pathname } = request.nextUrl;

  // Remove debug logs
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Special handling for login page - redirect authenticated users
  if (pathname.startsWith('/login')) {
    const projectRef = getProjectRef();
    if (projectRef) {
      const authCookie = cookies().get(`sb-${projectRef}-auth-token`);

      if (authCookie) {
        try {
          const tokens = JSON.parse(authCookie.value);
          const accessToken = Array.isArray(tokens) ? tokens[0] : tokens.access_token;

          if (accessToken) {
            // Basic JWT validation
            const accessTokenParts = accessToken.split('.');
            if (accessTokenParts.length === 3) {
              try {
                const payload = JSON.parse(Buffer.from(accessTokenParts[1], 'base64').toString('utf-8'));
                const isNotExpired = !payload.exp || payload.exp > Date.now() / 1000;

                if (isNotExpired) {
                  console.log('[MIDDLEWARE] 🔄 Authenticated user accessing /login - redirecting to /dashboard');
                  return NextResponse.redirect(new URL('/dashboard', request.url));
                }
                             } catch (error) {
                 console.log('[MIDDLEWARE] JWT payload parsing failed for login redirect check:', (error as Error).message);
               }
            }
          }
                 } catch (error) {
           console.log('[MIDDLEWARE] Auth cookie parsing failed for login redirect check:', (error as Error).message);
         }
      }
    }

    // Allow unauthenticated users to access login page
    console.log('[MIDDLEWARE] 👤 Unauthenticated user accessing /login - allowing access');
    return NextResponse.next();
  }

  // Allow other public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.startsWith('/_next/') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/logos/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // Authentication required - check for valid tokens
  const projectRef = getProjectRef();
  if (!projectRef) {
    console.error('[MIDDLEWARE] Failed to get project reference');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const authCookie = cookies().get(`sb-${projectRef}-auth-token`);

  // Reduced debug logging for performance

  if (!authCookie) {
    console.log('[MIDDLEWARE] ❌ Missing auth cookie for', pathname);
    // Don't add error parameters for normal redirects from root page
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return createAuthFailureResponse(request, 'missing_auth');
  }
  let tokens;
  try {
    tokens = JSON.parse(authCookie.value);
  } catch {
    console.log('[MIDDLEWARE] ❌ Invalid auth cookie format for', pathname, ':', 'invalid_auth_format');
    // Don't delete cookies immediately - could be temporary parsing issue
    return createAuthFailureResponse(request, 'invalid_auth_format');
  }

  // Parse ADR-0031 standard format: [access_token, null, refresh_token, null, null]
  const accessToken = Array.isArray(tokens) ? tokens[0] : tokens.access_token;

  // CRITICAL: Only require access token - refresh tokens can be short strings or missing in some flows
  if (!accessToken) {
    console.log('[MIDDLEWARE] ❌ Missing access token in auth cookie for', pathname);
    // Don't delete cookies during potential race conditions - let natural expiry handle it
    return createAuthFailureResponse(request, 'missing_access_token');
  }

  // Token validation (reduced logging for performance)

  // Basic JWT structure validation
  const accessTokenParts = accessToken.split('.');
  if (accessTokenParts.length !== 3) {
    console.log(`[MIDDLEWARE] ❌ Malformed access token for ${pathname}`);
    // Don't delete cookies immediately - could be temporary corruption during upload
    return createAuthFailureResponse(request, 'malformed_token');
  }

  // Payload validation
  try {
    const payload = JSON.parse(Buffer.from(accessTokenParts[1], 'base64').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log(`[MIDDLEWARE] ❌ Expired access token for ${pathname}`);
      // Only clear truly expired tokens, not during race conditions
      const response = createAuthFailureResponse(request, 'expired_token');
      response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
      return response;
    }
  } catch (error) {
    console.log(`[MIDDLEWARE] ❌ Invalid JWT payload for ${pathname}:`, error);
    // Don't delete cookies for payload parsing errors - could be temporary
    return createAuthFailureResponse(request, 'invalid_payload');
  }

  // Skip expensive server validation in middleware - API endpoints will validate when needed
  // This prevents race conditions and improves performance

  console.log(`[MIDDLEWARE] ✅ Valid auth for ${pathname} - proceeding`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};