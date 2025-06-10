import { NextRequest } from 'next/server';
import { entitlementService } from '../../../lib/entitlementService';

/**
 * GET /api/entitlements/[user_id]
 * Returns all entitlements for a user (context-aware).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const { user_id } = params;
  console.log(`[API] GET /api/entitlements/${user_id}`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return new Response(JSON.stringify({ error: 'Missing or invalid user_id' }), { status: 400 });
  }
  try {
    const entitlements = await entitlementService.getUserEntitlements(user_id);
    console.log(`[API] Found ${entitlements.length} entitlements for user ${user_id}`);
    return new Response(JSON.stringify(entitlements), { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching entitlements:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.