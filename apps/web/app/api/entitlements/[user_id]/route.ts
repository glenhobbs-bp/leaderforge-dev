import { NextRequest, NextResponse } from 'next/server';
import { entitlementService } from '../../../lib/entitlementService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';

/**
 * GET /api/entitlements/[user_id]
 * Returns all entitlements for a user (context-aware).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const { user_id } = params;
  const res = NextResponse.next();
  const supabase = await createSupabaseServerClient(res);
  console.log(`[API] GET /api/entitlements/${user_id}`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return NextResponse.json({ error: 'Missing or invalid user_id' }, { status: 400 });
  }
  try {
    const entitlements = await entitlementService.getUserEntitlements(supabase, user_id);
    console.log(`[API] Found ${entitlements.length} entitlements for user ${user_id}`);
    return NextResponse.json(entitlements, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error fetching entitlements:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.