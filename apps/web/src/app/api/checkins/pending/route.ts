/**
 * File: src/app/api/checkins/pending/route.ts
 * Purpose: API route for leaders to get pending check-ins
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/checkins/pending
 * Get all pending check-ins assigned to the current user (as a leader)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pending check-ins where current user is the leader
    const { data: checkins, error } = await supabase
      .from('checkin_requests')
      .select(`
        *,
        requester:user_id(id, full_name, email, avatar_url),
        bold_action:bold_action_id(id, action_text, status)
      `)
      .eq('leader_id', user.id)
      .in('status', ['pending', 'scheduled'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending check-ins:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending check-ins' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: checkins || [],
    });
  } catch (error) {
    console.error('Pending check-ins GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

