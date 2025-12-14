/**
 * File: src/app/api/checkins/[contentId]/complete/route.ts
 * Purpose: API route for completing check-ins (for leaders or self-certification)
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ contentId: string }>;
}

/**
 * POST /api/checkins/[contentId]/complete
 * Mark a check-in as completed
 * Can be called by: leader (for their team members) or user (self-certification if enabled)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { contentId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId, notes, selfCertify } = body;

    // Determine which check-in to complete
    let targetUserId = userId || user.id;
    
    // If completing for someone else, verify current user is the assigned leader
    if (userId && userId !== user.id) {
      const { data: checkin, error: checkinError } = await supabase
        .from('checkin_requests')
        .select('leader_id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .single();

      if (checkinError || !checkin) {
        return NextResponse.json(
          { success: false, error: 'Check-in request not found' },
          { status: 404 }
        );
      }

      if (checkin.leader_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Not authorized to complete this check-in' },
          { status: 403 }
        );
      }
    } else if (selfCertify) {
      // Self-certification - check if org allows it
      // For now, we allow self-certification by default
      // TODO: Check organization settings for self_certification_enabled
      targetUserId = user.id;
    }

    // Update check-in status
    const { data: updatedCheckin, error: updateError } = await supabase
      .from('checkin_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || null,
        metadata: {
          completed_by: user.id,
          self_certified: selfCertify || false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUserId)
      .eq('content_id', contentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing check-in:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to complete check-in' },
        { status: 500 }
      );
    }

    // Update user_progress metadata
    await supabase
      .from('user_progress')
      .update({
        metadata: {
          checkin_completed: true,
          checkin_completed_at: new Date().toISOString(),
        },
      })
      .eq('user_id', targetUserId)
      .eq('content_id', contentId);

    return NextResponse.json({
      success: true,
      data: updatedCheckin,
    });
  } catch (error) {
    console.error('Check-in complete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

