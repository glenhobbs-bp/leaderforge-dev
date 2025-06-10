import { NextRequest } from 'next/server';
import { provisioningService } from '../../lib/provisioningService';

/**
 * POST /api/provisioning
 * Handles user invites, entitlement grants, and (future) revokes.
 * Body: { action: 'inviteUser' | 'grantEntitlement' | 'revokeEntitlement', ...params }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error('[API] Invalid JSON body');
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  if (!body || typeof body !== 'object' || !body.action) {
    console.error('[API] Missing or invalid action in body');
    return new Response(JSON.stringify({ error: 'Missing or invalid action' }), { status: 400 });
  }
  const { action } = body;
  try {
    switch (action) {
      case 'inviteUser': {
        const { userId, orgId, role } = body;
        if (!userId || !orgId || !role) {
          console.error('[API] Missing userId, orgId, or role for inviteUser');
          return new Response(JSON.stringify({ error: 'Missing userId, orgId, or role' }), { status: 400 });
        }
        const result = await provisioningService.provisionUserToOrg(userId, orgId, role);
        console.log(`[API] Invited user ${userId} to org ${orgId} as ${role}: ${result}`);
        return new Response(JSON.stringify({ success: result }), { status: 200 });
      }
      case 'grantEntitlement': {
        const { userId, entitlementId } = body;
        if (!userId || !entitlementId) {
          console.error('[API] Missing userId or entitlementId for grantEntitlement');
          return new Response(JSON.stringify({ error: 'Missing userId or entitlementId' }), { status: 400 });
        }
        const result = await provisioningService.provisionEntitlementToUser(userId, entitlementId);
        console.log(`[API] Granted entitlement ${entitlementId} to user ${userId}: ${result}`);
        return new Response(JSON.stringify({ success: result }), { status: 200 });
      }
      case 'revokeEntitlement': {
        // Not implemented yet
        console.warn('[API] revokeEntitlement not implemented');
        return new Response(JSON.stringify({ error: 'Not implemented' }), { status: 501 });
      }
      default:
        console.error('[API] Unknown action:', action);
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }
  } catch (error: any) {
    console.error('[API] Error in provisioning:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.