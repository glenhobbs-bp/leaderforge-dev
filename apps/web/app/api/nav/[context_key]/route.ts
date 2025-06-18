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

  console.log(`[API] GET /api/nav/${context_key} - optimized request`);

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  if (!context_key || typeof context_key !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400 });
  }

  // Get session from Supabase cookie
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
    console.warn('[API/nav] Not authenticated after setSession');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const navOptions: NavOption[] = await navService.getNavOptions(supabase, context_key, userId);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[API/nav] Returning ${navOptions.length} nav options for user ${userId} in context ${context_key} (${duration}ms)`);

    // Return with aggressive caching headers for performance
    return NextResponse.json(navOptions, {
      status: 200,
      headers: {
        // Cache for 5 minutes in browser, 1 hour in CDN
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        'X-Response-Time': `${duration}ms`,
        'X-Cache-Status': 'optimized',
        // Enable compression
        'Content-Encoding': 'gzip',
        'Vary': 'Accept-Encoding',
      }
    });
  } catch (err) {
    const error = err as Error;
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`[API/nav] Error fetching nav options for ${context_key} (${duration}ms):`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch nav options' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.