// File: apps/web/app/api/context/list/route.ts
// Purpose: API route to return all available contexts (core.context_configs) for the authenticated user, filtered by entitlement. Used to drive the context selector in the UI. SSR/session safe, Next.js 15+ compatible.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';
import { ContextConfig } from '../../../lib/types';

export async function GET() {
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  // Hydrate session if tokens are present
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Get userId from session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
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
    if (!data) return NextResponse.json([] as ContextConfig[], { status: 200 });

    // Optionally filter by entitlement (if required_entitlements is set)
    // For now, just return all contexts (add entitlement filtering as needed)
    return NextResponse.json(data as ContextConfig[], { status: 200 });
  } catch (err) {
    const error = err as Error;
    const message = error.message || 'Failed to fetch contexts';
    console.error('[API/context/list] Error fetching contexts:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}