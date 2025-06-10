// Supabase Auth Middleware for Next.js App Router
// ------------------------------------------------
// This middleware ensures that the Supabase session is available as a cookie for all server-side API routes and RLS.
// Supabase Auth UI stores the session in localStorage by default, but server-side code (API, RLS) requires it in a cookie.
// This middleware syncs the session from the request to a cookie, so your API routes and RLS work as expected.
//
// See: https://supabase.com/docs/guides/auth/server-side/nextjs

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('[middleware] Running Supabase Auth middleware');
  const res = NextResponse.next();
  try {
    const supabase = createMiddlewareClient({ req, res });
    console.log('[middleware] Supabase middleware client created');
    // Optionally, you can check the session here if needed
    // const { data: { session } } = await supabase.auth.getSession();
    // console.log('[middleware] Session:', session);
  } catch (err) {
    console.error('[middleware] Error in Supabase Auth middleware:', err);
  }
  return res;
}

// Apply to all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};