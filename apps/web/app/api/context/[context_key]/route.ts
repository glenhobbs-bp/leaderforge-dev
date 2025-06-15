import { NextRequest, NextResponse } from 'next/server';
import { contextService } from '../../../lib/contextService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * GET /api/context/[context_key]
 * Returns context config, including entitlement requirements.
 */
export async function GET(req: NextRequest, context: { params: { context_key: string } }) {
 // console.log('[API/context] RAW HEADERS:', Object.fromEntries(req.headers.entries()));
  const { context_key } = await context.params;
  const user_id = req.nextUrl.searchParams.get('user_id');
  const res = new NextResponse(); // NOTE: Not using NextResponse.next()

  // Log all incoming cookies
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
 // console.log('[API/context] Incoming cookies:', allCookies);

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  console.log('[API/context] Extracted tokens:', { accessToken, refreshToken });

  const supabase = createSupabaseServerClient(cookieStore);

  // Hydrate session manually (if tokens found)
  if (accessToken && refreshToken) {
    const setSessionRes = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log('[API/context] setSession result:', setSessionRes);
  } else {
    console.warn('[API/context] Missing access or refresh token in cookies. SSR auth will likely fail.');
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
//  console.log('[API/context] SSR session:', session, 'error:', sessionError);

  if (!session?.user?.id) {
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      console.log('[API/context] HTML request without session - redirecting to /login');
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: res.headers });
  }

  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400, headers: res.headers });
  }

  try {
   // console.log('[API] Creating Supabase SSR server client for context route');
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
   // console.log('[API] Supabase user:', user, 'Session error:', sessionError);

    const config = await contextService.getContextConfig(supabase, context_key, user_id);
    if (!config) {
      console.error(`[API] Context config not found: ${context_key}`);
      return NextResponse.json({ error: 'Context config not found' }, { status: 404, headers: res.headers });
    }

  //  console.log(`[API] Found context config: ${context_key}`);
    return NextResponse.json(config, { status: 200, headers: res.headers });
  } catch (error: any) {
    console.error('[API] Error fetching context config:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: res.headers });
  }
}