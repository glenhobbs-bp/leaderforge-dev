/**
 * File: src/app/api/gamification/streak/route.ts
 * Purpose: API route for user streak data
 * Owner: Core Team
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
  totalActiveDays: number;
  totalActivities: number;
  isAtRisk: boolean; // True if no activity today
}

/**
 * GET /api/gamification/streak
 * Get current user's streak data
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get daily streak data
    const { data: streak, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_type', 'daily')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch streak data' },
        { status: 500 }
      );
    }

    // Calculate if streak is at risk
    const today = new Date().toISOString().split('T')[0];
    const isAtRisk = !streak || streak.last_activity_date !== today;

    const streakData: StreakData = streak ? {
      currentStreak: streak.current_streak || 0,
      longestStreak: streak.longest_streak || 0,
      lastActivityDate: streak.last_activity_date,
      streakStartDate: streak.streak_start_date,
      totalActiveDays: streak.total_active_days || 0,
      totalActivities: streak.total_activities || 0,
      isAtRisk,
    } : {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakStartDate: null,
      totalActiveDays: 0,
      totalActivities: 0,
      isAtRisk: true,
    };

    return NextResponse.json({
      success: true,
      data: streakData,
    });
  } catch (error) {
    console.error('Streak GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
