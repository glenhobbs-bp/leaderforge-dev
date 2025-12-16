/**
 * File: src/app/api/gamification/leaderboard/route.ts
 * Purpose: API route for leaderboard data
 * Owner: Core Team
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
  currentStreak: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  period: 'weekly' | 'all_time';
  scope: 'team' | 'organization';
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserPoints: number;
  totalParticipants: number;
}

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard data for user's organization/team
 * Query params:
 *   - scope: 'team' | 'organization' (default: 'organization')
 *   - period: 'weekly' | 'all_time' (default: 'weekly')
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get('scope') || 'organization') as 'team' | 'organization';
    const period = (searchParams.get('period') || 'weekly') as 'weekly' | 'all_time';

    // Get user's membership for org/team context
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id, team_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 400 }
      );
    }

    // Calculate period start for weekly
    const weekStart = period === 'weekly' 
      ? getWeekStart(new Date()).toISOString().split('T')[0]
      : null;

    // Get points data for leaderboard
    // Sum points from points_ledger for the period
    let query = supabase
      .from('points_ledger')
      .select('user_id, points');

    // Apply period filter
    if (period === 'weekly' && weekStart) {
      query = query.eq('period_week', weekStart);
    }

    const { data: pointsData, error: pointsError } = await query;

    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    // Get all members in the org/team
    let membersQuery = supabase
      .from('memberships')
      .select('user_id')
      .eq('organization_id', membership.organization_id)
      .eq('is_active', true);

    // Filter by team if requested and user has a team
    if (scope === 'team' && membership.team_id) {
      membersQuery = membersQuery.eq('team_id', membership.team_id);
    }

    const { data: membersData, error: membersError } = await membersQuery;

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    // Get user details separately to avoid join ambiguity
    const memberUserIds = membersData?.map(m => m.user_id) || [];
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', memberUserIds.length > 0 ? memberUserIds : ['none']);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard data' },
        { status: 500 }
      );
    }

    // Create a map for quick user lookup
    const usersMap = new Map<string, { id: string; full_name: string | null }>();
    for (const u of usersData || []) {
      usersMap.set(u.id, u);
    }

    // Combine members with user data
    const members = membersData?.map(m => ({
      user_id: m.user_id,
      users: usersMap.get(m.user_id) || { id: m.user_id, full_name: null },
    })) || [];

    // Aggregate points per user
    const userPointsMap = new Map<string, number>();
    for (const entry of pointsData || []) {
      const current = userPointsMap.get(entry.user_id) || 0;
      userPointsMap.set(entry.user_id, current + entry.points);
    }

    // Get streak data for each user
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('user_id, current_streak')
      .in('user_id', memberUserIds.length > 0 ? memberUserIds : ['none'])
      .eq('streak_type', 'daily');

    const streakMap = new Map<string, number>();
    for (const streak of streakData || []) {
      streakMap.set(streak.user_id, streak.current_streak || 0);
    }

    // Build leaderboard entries
    const entries: LeaderboardEntry[] = members.map(member => {
      return {
        rank: 0, // Will be set after sorting
        userId: member.user_id,
        displayName: formatDisplayName(member.users?.full_name || 'Unknown'),
        points: userPointsMap.get(member.user_id) || 0,
        currentStreak: streakMap.get(member.user_id) || 0,
        isCurrentUser: member.user_id === user.id,
      };
    });

    // Sort by points descending
    entries.sort((a, b) => b.points - a.points);

    // Assign ranks (handle ties)
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].points < entries[i - 1].points) {
        currentRank = i + 1;
      }
      entries[i].rank = currentRank;
    }

    // Find current user's position
    const currentUserEntry = entries.find(e => e.isCurrentUser);

    const leaderboardData: LeaderboardData = {
      period,
      scope: scope === 'team' && membership.team_id ? 'team' : 'organization',
      entries: entries.slice(0, 10), // Top 10
      currentUserRank: currentUserEntry?.rank || null,
      currentUserPoints: currentUserEntry?.points || 0,
      totalParticipants: entries.length,
    };

    // If current user is not in top 10, add them at the end
    if (currentUserEntry && !leaderboardData.entries.includes(currentUserEntry)) {
      leaderboardData.entries.push(currentUserEntry);
    }

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get the start of the week (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format display name for privacy (First name + Last initial)
 */
function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 0) return 'Unknown';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
