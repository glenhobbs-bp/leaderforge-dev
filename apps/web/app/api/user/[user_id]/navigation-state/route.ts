// File: apps/web/app/api/user/[user_id]/navigation-state/route.ts
// Purpose: API endpoint for updating user navigation state
// Owner: Backend team
// Tags: API endpoint, navigation state, user preferences

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '../../../../lib/userService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { contextKey, navOptionId } = await request.json();
    const resolvedParams = await params;
    const userId = resolvedParams.user_id;

    if (!userId || !contextKey || !navOptionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await userService.updateNavigationState(userId, contextKey, navOptionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error updating navigation state:', error);
    return NextResponse.json(
      { error: 'Failed to update navigation state' },
      { status: 500 }
    );
  }
}