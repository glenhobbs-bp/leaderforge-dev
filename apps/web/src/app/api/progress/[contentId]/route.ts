/**
 * File: src/app/api/progress/[contentId]/route.ts
 * Purpose: API routes for user progress on content
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ contentId: string }>;
}

/**
 * GET /api/progress/[contentId]
 * Get user's progress for a specific content item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // TEMPORARY DEBUG: Return immediately to test if API routes work at all
  console.log('[API Progress GET] Starting (debug mode)...');
  
  try {
    const { contentId } = await params;
    console.log('[API Progress GET] ContentId:', contentId);
    
    // TEMPORARY: Skip database entirely to test
    console.log('[API Progress GET] Returning mock response (debug)');
    return NextResponse.json({
      success: true,
      data: null,
      _debug: 'Bypassed database query for debugging'
    });
    
    /* COMMENTED OUT FOR DEBUGGING
    console.log('[API Progress GET] Creating Supabase client...');
    const supabase = await createClient();
    console.log('[API Progress GET] Supabase client created');
    
    // Get current user
    console.log('[API Progress GET] Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[API Progress GET] User:', user?.id, 'Auth error:', authError?.message);
    
    if (authError || !user) {
      console.log('[API Progress GET] Unauthorized');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get progress
    console.log('[API Progress GET] Querying progress...');
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();
    console.log('[API Progress GET] Query complete, error:', error?.code);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching progress:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    console.log('[API Progress GET] Returning success');
    return NextResponse.json({
      success: true,
      data: progress || null,
    });
    */
  } catch (error) {
    console.error('[API Progress GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/progress/[contentId]
 * Update user's progress for a content item
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'User not associated with a tenant' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { progressPercentage, completed } = body;

    // Validate
    if (typeof progressPercentage !== 'number' || progressPercentage < 0 || progressPercentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid progress percentage' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Check for existing progress
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id, completion_count, total_sessions, progress_percentage, completed_at')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    if (existing) {
      // Update existing progress
      const isNewCompletion = completed && progressPercentage >= 90 && existing.progress_percentage < 90;
      
      const { data: progress, error } = await supabase
        .from('user_progress')
        .update({
          progress_percentage: Math.max(existing.progress_percentage, progressPercentage),
          last_viewed_at: now,
          completed_at: completed ? (existing.completed_at || now) : existing.completed_at,
          completion_count: isNewCompletion ? (existing.completion_count || 0) + 1 : existing.completion_count,
          total_sessions: (existing.total_sessions || 0) + 1,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: progress,
      });
    } else {
      // Create new progress record
      const { data: progress, error } = await supabase
        .from('user_progress')
        .insert({
          tenant_id: userData.tenant_id,
          user_id: user.id,
          content_id: contentId,
          progress_type: 'video',
          progress_percentage: progressPercentage,
          completion_count: completed ? 1 : 0,
          total_sessions: 1,
          started_at: now,
          last_viewed_at: now,
          completed_at: completed ? now : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: progress,
      });
    }
  } catch (error) {
    console.error('Progress POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

