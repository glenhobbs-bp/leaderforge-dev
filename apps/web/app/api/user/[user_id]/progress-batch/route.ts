/**
 * Batch Video Progress API Route
 *
 * Purpose: Fetch progress for multiple content items in a single optimized query
 * Owner: Engineering Team
 * Tags: #performance #database #optimization #batch-api
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { restoreSession } from '../../../../lib/supabaseServerClient';

interface BatchProgressRequest {
  contentIds: string[];
  contextKey?: string; // Optional since we're not using it yet
}

interface BatchProgressResponse {
  progress: Record<string, unknown>;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
): Promise<NextResponse<BatchProgressResponse>> {
  try {
    const resolvedParams = await params;
    const { user_id } = resolvedParams;
    const { contentIds }: BatchProgressRequest = await request.json();

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { progress: {}, error: 'Invalid contentIds array' },
        { status: 400 }
      );
    }

    if (contentIds.length > 50) {
      return NextResponse.json(
        { progress: {}, error: 'Too many content items (max 50)' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const { session, supabase, error: sessionError } = await restoreSession(cookieStore);

    if (sessionError || !session) {
      console.log('[BatchProgress] Session error:', sessionError);
      return NextResponse.json(
        { progress: {}, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Validate user_id matches authenticated user
    if (session.user.id !== user_id) {
      return NextResponse.json(
        { progress: {}, error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // Batch query for user progress - using correct column names
    const { data: progressData, error: queryError } = await supabase
      .schema('core')
      .from('user_progress')
      .select('content_id, progress_percentage, metadata, last_viewed_at, completed_at, started_at')
      .eq('user_id', user_id)
      .in('content_id', contentIds);

    if (queryError) {
      console.log('[BatchProgress] Database query error:', queryError);
      return NextResponse.json(
        { progress: {}, error: 'Database query failed' },
        { status: 500 }
      );
    }

    // Transform to expected format
    const progressMap: Record<string, unknown> = {};
    progressData?.forEach((item) => {
      progressMap[item.content_id] = {
        progress_percentage: item.progress_percentage,
        metadata: item.metadata,
        last_viewed_at: item.last_viewed_at,
        completed_at: item.completed_at,
        started_at: item.started_at,
        lastUpdated: item.last_viewed_at
      };
    });

    console.log(`[BatchProgress] Fetched progress for ${progressData?.length || 0} items out of ${contentIds.length} requested`);

    return NextResponse.json({
      progress: progressMap
    });

  } catch (error) {
    console.error('[BatchProgress] Unexpected error:', error);
    return NextResponse.json(
      { progress: {}, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
