import { NextRequest, NextResponse } from 'next/server';
import { entitlementService } from '../../../lib/entitlementService';

/**
 * POST /api/entitlements/clear-cache
 * Clears the entitlement cache for a user or all users
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (userId) {
      entitlementService.clearUserCache(userId);
      console.log(`[API] Cleared entitlement cache for user: ${userId}`);
      return NextResponse.json({ message: `Cache cleared for user ${userId}` });
    } else {
      entitlementService.clearAllCache();
      console.log(`[API] Cleared all entitlement cache`);
      return NextResponse.json({ message: 'All entitlement cache cleared' });
    }
  } catch (error) {
    console.error('[API] Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}