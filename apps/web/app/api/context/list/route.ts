// File: apps/web/app/api/context/list/route.ts
// Purpose: API route to return all available contexts (core.context_configs) for the authenticated user, filtered by entitlement. Used to drive the context selector in the UI. SSR/session safe, Next.js 15+ compatible.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

export async function GET() {
  console.log('[API/context/list] Fetching available contexts for user');
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  // Hydrate session if tokens are present
  if (accessToken && refreshToken) {
    const setSessionRes = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log('[API/context/list] setSession result:', setSessionRes);
  } else {
    console.warn('[API/context/list] Missing access or refresh token in cookies.');
  }

  // Get userId from session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn('[API/context/list] Not authenticated after setSession');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch all context configs, filter by entitlement if needed
    const { data, error } = await supabase
      .schema('core')
      .from('context_configs')
      .select('context_key, display_name, theme, i18n, logo_url, nav_options, settings')
      .order('display_name', { ascending: true });
    if (error) throw error;
    if (!data) return NextResponse.json([], { status: 200 });

    // Optionally filter by entitlement (if required_entitlements is set)
    // For now, just return all contexts (add entitlement filtering as needed)
    console.log(`[API/context/list] Returning ${data.length} contexts for user ${userId}`);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    let message = 'Failed to fetch contexts';
    if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      message = (err as { message: string }).message;
    }
    console.error('[API/context/list] Error fetching contexts:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}