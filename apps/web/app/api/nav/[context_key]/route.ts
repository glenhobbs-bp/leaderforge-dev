// File: apps/web/app/api/nav/[context_key]/route.ts
// Purpose: API route to return entitlement-filtered nav options for a given context. SSR/session safe, Next.js 15+ compatible.

import { NextRequest, NextResponse } from 'next/server';
import { navService } from '../../../lib/navService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';
import type { NavOption } from '../../../lib/types';

// Simple in-memory cache for navigation options
const navCache = new Map<string, { data: NavOption[]; timestamp: number; userId: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/nav/[context_key]
 * Returns navigation options for a context, filtered by user entitlement.
 * Optimized with caching headers and performance monitoring.
 */
export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
  const startTime = Date.now();
  const { context_key } = await context.params;

  if (!context_key || typeof context_key !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Simplified auth: try to get session directly first
    const { data: { session } } = await supabase.auth.getSession();

    // If no session, try manual hydration once
    if (!session?.user?.id) {
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
      const accessToken = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;
      const refreshToken = cookieStore.get(`sb-${projectRef}-refresh-token`)?.value;

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }

    // Final session check
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    const userId = finalSession?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `${context_key}:${userId}`;
    const cached = navCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.userId === userId) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
          'X-Cache': 'HIT',
          'X-Response-Time': '0ms',
        }
      });
    }

    // Get nav options from database
    const navOptions: NavOption[] = await navService.getNavOptions(supabase, context_key, userId);

    // Cache the result
    navCache.set(cacheKey, { data: navOptions, timestamp: Date.now(), userId });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Return with aggressive caching headers for performance
    return NextResponse.json(navOptions, {
      status: 200,
      headers: {
        // Cache for 10 minutes in browser, 1 hour in CDN
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
        'X-Response-Time': `${duration}ms`,
      }
    });
  } catch (err) {
    const error = err as Error;
    console.error(`[API/nav] Error:`, error.message);
    return NextResponse.json({ error: 'Failed to fetch nav options' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.