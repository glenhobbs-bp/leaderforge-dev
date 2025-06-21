// File: apps/web/app/api/user/[user_id]/video-progress/route.ts
// Purpose: API endpoint for updating user video progress
// Owner: Backend team
// Tags: API endpoint, video progress, user preferences

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '../../../../lib/userService';
import type { VideoProgress } from '../../../../lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const { contentId, progress } = await request.json();
    const userId = params.user_id;

    if (!userId || !contentId || !progress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await userService.updateVideoProgress(userId, contentId, progress as Partial<VideoProgress>);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error updating video progress:', error);
    return NextResponse.json(
      { error: 'Failed to update video progress' },
      { status: 500 }
    );
  }
}