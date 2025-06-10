import { NextRequest } from 'next/server';
import { entitlementService } from '../../../../lib/entitlementService';

/**
 * GET /api/orgs/[org_id]/entitlements
 * Returns all entitlements for an organization.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { org_id: string } }
) {
  const { org_id } = params;
  console.log(`[API] GET /api/orgs/${org_id}/entitlements`);
  if (!org_id || typeof org_id !== 'string') {
    console.error('[API] Missing or invalid org_id');
    return new Response(JSON.stringify({ error: 'Missing or invalid org_id' }), { status: 400 });
  }
  try {
    const entitlements = await entitlementService.getOrgEntitlements(org_id);
    console.log(`[API] Found ${entitlements.length} entitlements for org ${org_id}`);
    return new Response(JSON.stringify(entitlements), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching org entitlements:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.