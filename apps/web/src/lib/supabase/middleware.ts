/**
 * File: src/lib/supabase/middleware.ts
 * Purpose: Supabase client for middleware (session refresh)
 * Owner: Core Team
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api');
  
  // For API routes, skip middleware auth check entirely for better performance
  if (isApiRoute) {
    console.log('[Middleware] Skipping auth for API route:', pathname);
    return NextResponse.next({ request });
  }
  
  console.log('[Middleware] Processing:', pathname);
  
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT use auth.getSession() in Server Components
  // Only use it here in middleware for session refresh
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  console.log('[Middleware] Getting user...');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log('[Middleware] User:', user?.id || 'none');

  // Define protected and auth routes
  const isAuthRoute = pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/content') ||
    pathname.startsWith('/progress') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/admin');

  // Redirect unauthenticated users from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

