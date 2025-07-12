// File: apps/web/app/api/nav/[tenant_key]/route.ts
// Purpose: API route to return entitlement-filtered nav options for a given tenant. SSR/session safe, Next.js 15+ compatible.

import { NextRequest, NextResponse } from 'next/server';
import { navService } from '../../../lib/navService';
import { restoreSession } from '../../../lib/supabaseServerClient';
import { cookies } from 'next/headers';
import type { NavOption } from '../../../lib/types';

// Simple in-memory cache for navigation options
const navCache = new Map<string, { data: NavOption[]; timestamp: number; userId: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/nav/[tenant_key]
 * Returns navigation options for a tenant, filtered by user entitlement.
 * Optimized with caching headers and performance monitoring.
 */
export async function GET(req: NextRequest, context: { params: { tenant_key: string } }) {
  const startTime = Date.now();
  const { tenant_key } = await context.params;

  if (!tenant_key || typeof tenant_key !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid tenant_key' }, { status: 400 });
  }

  try {
    // ✅ Use ADR-0031 standard session restoration
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check cache first
    const cacheKey = `${tenant_key}:${userId}`;
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

    // Get nav options from database with timeout protection
    const navOptions: NavOption[] = await Promise.race([
      navService.getNavOptions(supabase, tenant_key, userId),
      new Promise<NavOption[]>((_, reject) =>
        setTimeout(() => reject(new Error('Navigation query timeout')), 10000)
      )
    ]).catch(error => {
      console.warn(`[API] Navigation query failed for ${tenant_key}:`, error.message);
      // Return empty array as fallback to prevent complete failure
      return [];
    });

    // Cache the result
    navCache.set(cacheKey, { data: navOptions, timestamp: Date.now(), userId });

    const endTime = Date.now();
    const duration = endTime - startTime;

    return NextResponse.json(navOptions, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
        'X-Response-Time': `${duration}ms`,
      }
    });
  } catch (error) {
    const err = error as Error;
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`[API] Error in GET /api/nav/${tenant_key} (${duration}ms):`, err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.