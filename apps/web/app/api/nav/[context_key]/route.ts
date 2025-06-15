import { NextRequest, NextResponse } from 'next/server';
import { navService } from '../../../lib/navService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * GET /api/nav/[context_key]?user_id=...
 * Returns nav options for the context, entitlement-filtered.
 */
export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
  const { context_key } = await context.params;
  const user_id = req.nextUrl.searchParams.get('user_id');
  const res = NextResponse.next();
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  // Hydrate session manually (if tokens found)
  if (accessToken && refreshToken) {
    const setSessionRes = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log('[API/nav] setSession result:', setSessionRes);
  } else {
    console.warn('[API/nav] Missing access or refresh token in cookies. SSR auth will likely fail.');
  }

  const { data: { user }, error: sessionError } = await supabase.auth.getUser();
  console.log('[API/nav] Supabase user:', user, 'Session error:', sessionError);

  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400 });
  }
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return NextResponse.json({ error: 'Missing or invalid user_id' }, { status: 400 });
  }
  try {
    console.log('[API] Creating Supabase SSR server client for nav route');
    console.log('[API] Supabase SSR server client created. Fetching nav options...');
    const navOptions = await navService.getNavOptions(supabase, context_key, user_id);
    console.log(`[API] Found ${navOptions.length} nav options for user ${user_id} in context ${context_key}`);
    return NextResponse.json(navOptions, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching nav options:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.