// File: apps/web/app/api/user/[user_id]/video-progress/route.ts
// Purpose: SSR-compliant API endpoint for updating user video progress
// Owner: Backend team
// Tags: API endpoint, video progress, SSR auth

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { contentId, progress } = await request.json();
    const resolvedParams = await params;
    const userId = resolvedParams.user_id;

    if (!userId || !contentId || !progress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

        // SSR-first authentication with robust session restoration
    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update video progress with authenticated context (respects RLS)
    const { error: updateError } = await supabase
      .schema('core')
      .from('user_progress')
      .upsert({
        user_id: userId,
        content_id: contentId,
        progress_data: progress,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('[API] Error updating video progress:', updateError);
      return NextResponse.json(
        { error: 'Failed to update video progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error updating video progress:', error);
    return NextResponse.json(
      { error: 'Failed to update video progress' },
      { status: 500 }
    );
  }
}