import { NextRequest, NextResponse } from 'next/server';
import { batchService } from '../../../../lib/batchService';
import { createSupabaseServerClient } from '../../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * GET /api/context/[context_key]/bundle
 * Returns complete context data bundle (config, nav, content) in a single optimized request.
 * Uses shared entitlements and parallelized operations for maximum performance.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { context_key: string } }
) {
  // SSR Auth: get cookies and hydrate session
  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;
  const supabase = createSupabaseServerClient(cookieStore);

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const context_key = await params.context_key;
  console.log(`[API] GET /api/context/${context_key}/bundle - optimized batch request`);

  if (!context_key || typeof context_key !== 'string') {
    console.error('[API] Missing or invalid context_key');
    return NextResponse.json({ error: 'Missing or invalid context_key' }, { status: 400 });
  }

  try {
    const startTime = Date.now();

    // Use optimized batch service for maximum performance
    const bundle = await batchService.getContextDataBundle(
      supabase,
      context_key,
      session.user.id
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[API] Context bundle for ${context_key} completed in ${duration}ms`);
    console.log(`[API] Bundle contents - config: ${!!bundle.contextConfig}, nav: ${bundle.navOptions.length}, content: ${bundle.content.length}, entitlements: ${bundle.userEntitlements.length}`);

    return NextResponse.json(bundle, {
      status: 200,
      headers: {
        'X-Response-Time': `${duration}ms`,
        'X-Cache-Status': 'optimized-batch'
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('[API] Error fetching context bundle:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}