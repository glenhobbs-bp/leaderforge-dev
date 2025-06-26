import { NextRequest, NextResponse } from 'next/server';
import { tenantService } from '../../../lib/tenantService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';
import { TenantConfig } from '../../../lib/types';

/**
 * GET /api/tenant/[tenant_key]
 * Returns tenant config, including entitlement requirements.
 * Optimized with caching headers and performance monitoring.
 */
export async function GET(req: NextRequest, context: { params: { tenant_key: string } }) {
  const startTime = Date.now();
  const { tenant_key } = await context.params;

  console.log(`[API] GET /api/tenant/${tenant_key} - optimized request`);

  const cookieStore = await nextCookies();
  const allCookies = cookieStore.getAll();

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  const supabase = createSupabaseServerClient(cookieStore);

  // Hydrate session manually (if tokens found)
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!tenant_key || typeof tenant_key !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid tenant_key' }, { status: 400 });
  }

  try {
    await supabase.auth.getUser(); // Call for side effect if needed
    const config: TenantConfig | null = await tenantService.getTenantConfig(supabase, tenant_key);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!config) {
      console.log(`[API] Tenant config not found for: ${tenant_key} (${duration}ms)`);
      return NextResponse.json({ error: 'Tenant config not found' }, { status: 404 });
    }

    console.log(`[API] Tenant config for ${tenant_key} returned in ${duration}ms`);

    // Return with aggressive caching headers for performance
    return NextResponse.json(config, {
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
  } catch (error) {
    const err = error as Error;
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(`[API] Error fetching tenant config for ${tenant_key} (${duration}ms):`, err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}