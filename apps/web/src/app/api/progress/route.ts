/**
 * File: src/app/api/progress/route.ts
 * Purpose: Get all progress for current user
 * Owner: Core Team
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/progress
 * Get all progress records for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all progress for user
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('content_id, progress_percentage, completed_at, last_viewed_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching progress:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Convert to a map for easy lookup
    const progressMap: Record<string, { progress: number; completed: boolean }> = {};
    for (const item of progress || []) {
      progressMap[item.content_id] = {
        progress: item.progress_percentage || 0,
        completed: !!item.completed_at,
      };
    }

    return NextResponse.json({
      success: true,
      data: progressMap,
    });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

