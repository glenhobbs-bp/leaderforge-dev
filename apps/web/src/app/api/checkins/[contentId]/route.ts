/**
 * File: src/app/api/checkins/[contentId]/route.ts
 * Purpose: API routes for check-in requests
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ contentId: string }>;
}

/**
 * GET /api/checkins/[contentId]
 * Get user's check-in request for a content item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { data: checkin, error } = await supabase
      .from('checkin_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching check-in:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch check-in request' },
        { status: 500 }
      );
    }

    // If we have a check-in, fetch the leader details separately
    let leader = null;
    if (checkin?.leader_id) {
      const { data: leaderData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', checkin.leader_id)
        .single();
      leader = leaderData;
    }

    return NextResponse.json({
      success: true,
      data: checkin ? { ...checkin, leader } : null,
    });
  } catch (error) {
    console.error('Check-in GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkins/[contentId]
 * Request a check-in with team leader
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

    // Get user's tenant and manager
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('tenant_id, organization_id, manager_id, coach_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: 'User membership not found' },
        { status: 400 }
      );
    }

    // Determine the leader: coach_id takes precedence, then manager_id
    const leaderId = membership.coach_id || membership.manager_id;

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'No team leader assigned. Please contact your organization admin.' },
        { status: 400 }
      );
    }

    // Get bold_action_id if exists
    const { data: boldAction } = await supabase
      .from('bold_actions')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    const body = await request.json().catch(() => ({}));
    const { notes } = body;

    // Create or update check-in request
    const { data: checkin, error: checkinError } = await supabase
      .from('checkin_requests')
      .upsert({
        tenant_id: membership.tenant_id,
        user_id: user.id,
        leader_id: leaderId,
        content_id: contentId,
        bold_action_id: boldAction?.id || null,
        status: 'pending',
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,content_id',
      })
      .select('*')
      .single();

    if (checkinError) {
      console.error('Error creating check-in:', checkinError);
      return NextResponse.json(
        { success: false, error: 'Failed to create check-in request' },
        { status: 500 }
      );
    }

    // Fetch leader details separately
    let leader = null;
    if (checkin?.leader_id) {
      const { data: leaderData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', checkin.leader_id)
        .single();
      leader = leaderData;
    }

    // Update user_progress metadata
    await supabase
      .from('user_progress')
      .update({
        metadata: {
          checkin_requested: true,
          checkin_request_id: checkin.id,
        },
      })
      .eq('user_id', user.id)
      .eq('content_id', contentId);

    return NextResponse.json({
      success: true,
      data: { ...checkin, leader },
    });
  } catch (error) {
    console.error('Check-in POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

