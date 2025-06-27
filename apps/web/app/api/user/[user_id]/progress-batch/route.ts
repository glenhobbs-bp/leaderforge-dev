/**
 * Batch Video Progress API Route
 *
 * Purpose: Fetch progress for multiple content items in a single optimized query
 * Owner: Engineering Team
 * Tags: #performance #database #optimization #batch-api
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface BatchProgressRequest {
  contentIds: string[];
  contextKey: string;
}

interface BatchProgressResponse {
  progress: Record<string, {
    progress_percentage: number;
    last_watch_time: number;
    total_watch_time: number;
    completed: boolean;
    updated_at: string;
  }>;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { user_id: string } }
): Promise<NextResponse<BatchProgressResponse>> {
  try {
    const { contentIds, contextKey }: BatchProgressRequest = await request.json();

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

    const supabase = createRouteHandlerClient({ cookies });

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { progress: {}, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate user_id matches authenticated user
    if (user.id !== params.user_id) {
      return NextResponse.json(
        { progress: {}, error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // Single optimized query with IN clause
    const { data: progressData, error: queryError } = await supabase
      .from('user_video_progress')
      .select(`
        content_id,
        progress_percentage,
        last_watch_time,
        total_watch_time,
        completed,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('context_key', contextKey)
      .in('content_id', contentIds);

    if (queryError) {
      console.error('[BatchProgress] Database query error:', queryError);
      return NextResponse.json(
        { progress: {}, error: 'Database query failed' },
        { status: 500 }
      );
    }

    // Transform array to object map for fast lookup
    const progressMap: Record<string, any> = {};
    progressData?.forEach(item => {
      progressMap[item.content_id] = {
        progress_percentage: item.progress_percentage || 0,
        last_watch_time: item.last_watch_time || 0,
        total_watch_time: item.total_watch_time || 0,
        completed: item.completed || false,
        updated_at: item.updated_at
      };
    });

    // Fill in missing content with zero progress
    contentIds.forEach(contentId => {
      if (!progressMap[contentId]) {
        progressMap[contentId] = {
          progress_percentage: 0,
          last_watch_time: 0,
          total_watch_time: 0,
          completed: false,
          updated_at: null
        };
      }
    });

    console.log(`[BatchProgress] Fetched progress for ${contentIds.length} items, ${progressData?.length || 0} found in DB`);

    return NextResponse.json({
      progress: progressMap
    });

  } catch (error) {
    console.error('[BatchProgress] API error:', error);
    return NextResponse.json(
      { progress: {}, error: 'Internal server error' },
      { status: 500 }
    );
  }
}