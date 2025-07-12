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

// Quick validation with Supabase server to catch 403 tokens
async function validateTokenWithSupabase(accessToken: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    });

    // If we get 403, the token is invalid despite passing JWT checks
    return response.status !== 403;
  } catch (error) {
    console.log('[MIDDLEWARE] Token validation error:', (error as Error).message);
    return false;
  }
}

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

  console.log(`[MIDDLEWARE] ${request.method} ${pathname}`);

  // Allow public routes
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

  // Debug: List all cookies with detailed info
  const allCookies = cookies().getAll();
  console.log('[MIDDLEWARE] All cookies:', allCookies.map(c => c.name).join(', '));
  console.log('[MIDDLEWARE] Looking for cookie:', `sb-${projectRef}-auth-token`);
  console.log('[MIDDLEWARE] Cookie details:', allCookies.map(c => ({
    name: c.name,
    valueLength: c.value?.length || 0,
    hasValue: !!c.value
  })));

  if (!authCookie) {
    console.log('[MIDDLEWARE] ❌ Missing auth cookie for', pathname);
    return createAuthFailureResponse(request, 'missing_auth');
  }
  let tokens;
  try {
    tokens = JSON.parse(authCookie.value);
  } catch {
    console.log('[MIDDLEWARE] ❌ Invalid auth cookie format for', pathname, ':', 'invalid_auth_format');
    const response = createAuthFailureResponse(request, 'invalid_auth_format');
    response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
    return response;
  }

  // Parse ADR-0031 standard format: [access_token, null, refresh_token, null, null]
  const accessToken = Array.isArray(tokens) ? tokens[0] : tokens.access_token;
  const refreshToken = Array.isArray(tokens) ? tokens[2] : tokens.refresh_token;
  if (!accessToken || !refreshToken) {
    console.log('[MIDDLEWARE] ❌ Missing tokens in auth cookie for', pathname);
    const response = createAuthFailureResponse(request, 'invalid_auth_format');
    response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
    return response;
  }

  console.log('[MIDDLEWARE] Token check for', pathname, ':', {
    project: projectRef,
    access: accessToken ? `${accessToken.length} chars` : 'missing',
    refresh: refreshToken ? `${refreshToken.length} chars` : 'missing'
  });

  // Basic JWT structure validation
  const accessTokenParts = accessToken.split('.');
  if (accessTokenParts.length !== 3) {
    console.log(`[MIDDLEWARE] ❌ Malformed access token for ${pathname}`);
    const response = createAuthFailureResponse(request, 'malformed_token');
    response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
    return response;
  }

  // Payload validation
  try {
    const payload = JSON.parse(Buffer.from(accessTokenParts[1], 'base64').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log(`[MIDDLEWARE] ❌ Expired access token for ${pathname}`);
      const response = createAuthFailureResponse(request, 'expired_token');
      response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
      return response;
    }
  } catch (error) {
    console.log(`[MIDDLEWARE] ❌ Invalid JWT payload for ${pathname}:`, error);
    const response = createAuthFailureResponse(request, 'invalid_payload');
    response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
    return response;
  }

  // Server-side validation
  const isValidWithSupabase = await validateTokenWithSupabase(accessToken);
  if (!isValidWithSupabase) {
    console.log(`[MIDDLEWARE] ❌ Token rejected by Supabase for ${pathname}`);
    const response = createAuthFailureResponse(request, 'invalid_token');
    response.cookies.set(`sb-${projectRef}-auth-token`, '', { maxAge: 0, path: '/' });
    return response;
  }

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