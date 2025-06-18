import { NextRequest, NextResponse } from 'next/server';
import { entitlementService } from '../../../lib/entitlementService';
import { createSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { Entitlement } from '../../../lib/types';

/**
 * GET /api/entitlements/[user_id]
 * Returns all entitlements for a user (context-aware).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const { user_id } = params;
  const supabase = await createSupabaseServerClient();
  console.log(`[API] GET /api/entitlements/${user_id}`);
  if (!user_id || typeof user_id !== 'string') {
    console.error('[API] Missing or invalid user_id');
    return NextResponse.json({ error: 'Missing or invalid user_id' }, { status: 400 });
  }
  try {
    const entitlements: Entitlement[] = await entitlementService.getUserEntitlements(supabase, user_id);
    console.log(`[API] Found ${entitlements.length} entitlements for user ${user_id}`);
    return NextResponse.json(entitlements, { status: 200 });
  } catch (error) {
    const err = error as Error;
    console.error('[API] Error fetching entitlements:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add test coverage for this route using integration tests.