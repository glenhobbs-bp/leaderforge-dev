/**
 * File: src/app/api/gamification/points/route.ts
 * Purpose: API routes for user points data
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/gamification/points
 * Get user's points summary and recent history
 */
export async function GET(request: NextRequest) {
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

    // Get points config (for display)
    const { data: pointsConfig } = await supabase
      .from('points_config')
      .select('reason, points, description')
      .eq('is_active', true);

    // Get all points for user
    const { data: allPoints, error: pointsError } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch points' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalPoints = allPoints?.reduce((sum, p) => sum + p.points, 0) || 0;
    
    // This week's points
    const weekStart = getWeekStart();
    const weekPoints = allPoints
      ?.filter(p => new Date(p.earned_at) >= weekStart)
      .reduce((sum, p) => sum + p.points, 0) || 0;

    // This month's points
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthPoints = allPoints
      ?.filter(p => new Date(p.earned_at) >= monthStart)
      .reduce((sum, p) => sum + p.points, 0) || 0;

    // Points breakdown by reason
    const breakdown: Record<string, number> = {};
    allPoints?.forEach(p => {
      breakdown[p.reason] = (breakdown[p.reason] || 0) + p.points;
    });

    // Recent points (last 10)
    const recentPoints = allPoints?.slice(0, 10) || [];

    return NextResponse.json({
      success: true,
      data: {
        totalPoints,
        weekPoints,
        monthPoints,
        breakdown,
        recentPoints,
        pointsConfig,
      },
    });
  } catch (error) {
    console.error('Points GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gamification/points
 * Award points to user (internal use)
 */
export async function POST(request: NextRequest) {
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

    // Get user's tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'User not associated with tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { points, reason, sourceType, sourceId } = body;

    if (!points || !reason) {
      return NextResponse.json(
        { success: false, error: 'Points and reason are required' },
        { status: 400 }
      );
    }

    // Call the award_points function
    const { data: entryId, error } = await supabase.rpc('award_points', {
      p_tenant_id: userData.tenant_id,
      p_user_id: user.id,
      p_points: points,
      p_reason: reason,
      p_source_type: sourceType || null,
      p_source_id: sourceId || null,
    });

    if (error) {
      console.error('Error awarding points:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to award points' },
        { status: 500 }
      );
    }

    // Also update streak
    await supabase.rpc('update_streak', {
      p_tenant_id: userData.tenant_id,
      p_user_id: user.id,
      p_streak_type: 'daily'
    });

    return NextResponse.json({
      success: true,
      data: { entryId, points, reason },
    });
  } catch (error) {
    console.error('Points POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
