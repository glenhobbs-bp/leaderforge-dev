import { NextRequest, NextResponse } from 'next/server';
import { entitlementService } from '../../../../lib/entitlementService';
import { createSupabaseServerClient } from '../../../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * GET /api/orgs/[org_id]/entitlements
 * Returns all entitlements for an organization.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ org_id: string }> }
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

  const { org_id } = await params;
  console.log(`[API] GET /api/orgs/${org_id}/entitlements`);
  if (!org_id || typeof org_id !== 'string') {
    console.error('[API] Missing or invalid org_id');
    return NextResponse.json({ error: 'Missing or invalid org_id' }, { status: 400 });
  }
  try {
    const entitlements = await entitlementService.getOrgEntitlements(org_id);
    console.log(`[API] Found ${entitlements.length} entitlements for org ${org_id}`);
    return NextResponse.json(entitlements, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching org entitlements:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.