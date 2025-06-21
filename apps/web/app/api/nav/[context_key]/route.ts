// File: apps/web/app/api/nav/[context_key]/route.ts
// Purpose: API route to return entitlement-filtered nav options for a given context. SSR/session safe, Next.js 15+ compatible.

import { NextRequest, NextResponse } from 'next/server';
import { navService } from '../../../lib/navService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';
import type { NavOption } from '../../../lib/types';

/**
 * GET /api/nav/[context_key]
 * Returns navigation options for a context, filtered by user entitlement.
 * Optimized with caching headers and performance monitoring.
 */
export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
  const startTime = Date.now();
  const { context_key } = await context.params;

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  if (!context_key || typeof context_key !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400 });
  }

  // SSR Auth: get cookies and hydrate session (same pattern as avatar API)
  const allCookies = cookieStore.getAll();

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  // Hydrate session manually (if tokens found)
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Get session from Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('[API/nav] Supabase session error:', error.message);
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }

  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const navOptions: NavOption[] = await navService.getNavOptions(supabase, context_key, userId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Return with aggressive caching headers for performance
    return NextResponse.json(navOptions, {
      status: 200,
      headers: {
        // Cache for 5 minutes in browser, 1 hour in CDN
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'X-Response-Time': `${duration}ms`,
        'X-Cache-Status': 'optimized',
        // Remove manual Content-Encoding - Next.js handles compression automatically
        'Vary': 'Accept-Encoding',
      }
    });
  } catch (err) {
    const error = err as Error;
    console.error(`[API/nav] Error fetching nav options:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch nav options' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.