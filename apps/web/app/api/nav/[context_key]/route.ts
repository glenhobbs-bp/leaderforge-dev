// File: apps/web/app/api/nav/[context_key]/route.ts
// Purpose: API route to return entitlement-filtered nav options for a given context. SSR/session safe, Next.js 15+ compatible.

import { NextRequest, NextResponse } from 'next/server';
import { navService } from '../../../lib/navService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * GET /api/nav/[context_key]
 * Returns nav options for the context, entitlement-filtered.
 */
export async function GET(req) {
  // Extract context_key from the URL
  const context_key = req.nextUrl.pathname.split('/').pop();
  console.log('[API/nav] context_key:', context_key);

  // Await cookies (Next.js 15+)
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  console.log('[API/nav] Cookies:', { accessToken: !!accessToken, refreshToken: !!refreshToken });

  const supabase = createSupabaseServerClient(cookieStore);

  // Manually hydrate session if tokens are present
  if (accessToken && refreshToken) {
    const setSessionRes = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log('[API/nav] setSession result:', setSessionRes);
  } else {
    console.warn('[API/nav] Missing access or refresh token in cookies.');
  }

  // Get userId from session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn('[API/nav] Not authenticated after setSession');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const navOptions = await navService.getNavOptions(supabase, context_key, userId);
    console.log(`[API/nav] Returning ${navOptions.length} nav options for user ${userId} in context ${context_key}`);
    return NextResponse.json(navOptions);
  } catch (err) {
    console.error('[API/nav] Error fetching nav options:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch nav options' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.