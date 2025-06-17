import { NextRequest, NextResponse } from 'next/server';
import { provisioningService } from '../../lib/provisioningService';
import { createSupabaseServerClient } from '../../lib/supabaseServerClient';
import { cookies as nextCookies } from 'next/headers';

/**
 * POST /api/provisioning
 * Handles user invites, entitlement grants, and (future) revokes.
 * Body: { action: 'inviteUser' | 'grantEntitlement' | 'revokeEntitlement', ...params }
 */
export async function POST(req: NextRequest) {
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error('[API] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !body.action) {
    console.error('[API] Missing or invalid action in body');
    return NextResponse.json({ error: 'Missing or invalid action' }, { status: 400 });
  }
  const { action } = body;
  try {
    switch (action) {
      case 'inviteUser': {
        const { userId, orgId, role } = body;
        if (!userId || !orgId || !role) {
          console.error('[API] Missing userId, orgId, or role for inviteUser');
          return NextResponse.json({ error: 'Missing userId, orgId, or role' }, { status: 400 });
        }
        const result = await provisioningService.provisionUserToOrg(userId, orgId, role);
        console.log(`[API] Invited user ${userId} to org ${orgId} as ${role}: ${result}`);
        return NextResponse.json({ success: result }, { status: 200 });
      }
      case 'grantEntitlement': {
        const { userId, entitlementId } = body;
        if (!userId || !entitlementId) {
          console.error('[API] Missing userId or entitlementId for grantEntitlement');
          return NextResponse.json({ error: 'Missing userId or entitlementId' }, { status: 400 });
        }
        const result = await provisioningService.provisionEntitlementToUser(userId, entitlementId);
        console.log(`[API] Granted entitlement ${entitlementId} to user ${userId}: ${result}`);
        return NextResponse.json({ success: result }, { status: 200 });
      }
      case 'revokeEntitlement': {
        // Not implemented yet
        console.warn('[API] revokeEntitlement not implemented');
        return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
      }
      default:
        console.error('[API] Unknown action:', action);
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[API] Error in provisioning:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.