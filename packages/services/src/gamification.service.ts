/**
 * File: packages/services/src/gamification.service.ts
 * Purpose: Gamification service (streaks, leaderboards, points)
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserStreak, LeaderboardCache } from '@leaderforge/database';
import type { ServiceResult, UserContext } from './types';

export interface StreakResponse {
  daily: {
    current: number;
    longest: number;
    lastActivity: string | null;
    streakStart: string | null;
    atRisk: boolean;
  };
  milestones: {
    achieved: string[];
    next: string | null;
    progress: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  points: number;
  videosCompleted: number;
  currentStreak: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  period: {
    type: string;
    start: string;
    end: string;
  };
  entries: LeaderboardEntry[];
  currentUser: {
    rank: number;
    points: number;
    rankChange: number;
  };
}

export interface GetLeaderboardParams {
  scope: 'team' | 'organization';
  period: 'weekly' | 'monthly' | 'all_time';
  teamId?: string;
}

export class GamificationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user's streak
   */
  async getStreak(context: UserContext): Promise<ServiceResult<StreakResponse>> {
    const { data: streak, error } = await this.supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', context.userId)
      .eq('streak_type', 'daily')
      .single();

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      };
    }

    const currentStreak = streak?.current_streak || 0;
    const longestStreak = streak?.longest_streak || 0;

    // Check if at risk (no activity today)
    const lastActivity = streak?.last_activity_date;
    const today = new Date().toISOString().split('T')[0];
    const atRisk = lastActivity !== today;

    // Calculate milestones
    const milestoneValues = [7, 14, 30, 60, 90, 100, 365];
    const achieved = milestoneValues.filter((m) => currentStreak >= m).map((m) => `${m}-day`);
    const nextMilestone = milestoneValues.find((m) => m > currentStreak);

    return {
      success: true,
      data: {
        daily: {
          current: currentStreak,
          longest: longestStreak,
          lastActivity,
          streakStart: streak?.streak_start || null,
          atRisk,
        },
        milestones: {
          achieved,
          next: nextMilestone ? `${nextMilestone}-day` : null,
          progress: currentStreak,
        },
      },
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    context: UserContext,
    params: GetLeaderboardParams
  ): Promise<ServiceResult<LeaderboardResponse>> {
    const { scope, period, teamId } = params;

    let query = this.supabase
      .from('leaderboard_cache')
      .select(`
        *,
        users:user_id (full_name, avatar_url)
      `)
      .eq('tenant_id', context.tenantId)
      .eq('period_type', period)
      .order('rank', { ascending: true })
      .limit(50);

    if (scope === 'team' && teamId) {
      query = query.eq('team_id', teamId);
    } else if (scope === 'organization' && context.organizationId) {
      query = query.eq('organization_id', context.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      };
    }

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd = now;

    if (period === 'weekly') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay()); // Start of week
    } else if (period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      periodStart = new Date(0); // All time
    }

    // Map entries
    const entries: LeaderboardEntry[] = (data || []).map((entry: LeaderboardCache & { users: { full_name: string; avatar_url: string | null } }) => ({
      rank: entry.rank,
      userId: entry.user_id,
      userName: entry.users?.full_name || 'Unknown',
      avatarUrl: entry.users?.avatar_url || null,
      points: entry.total_points,
      videosCompleted: entry.videos_completed,
      currentStreak: entry.current_streak,
      isCurrentUser: entry.user_id === context.userId,
    }));

    // Find current user
    const currentUserEntry = entries.find((e) => e.isCurrentUser);

    return {
      success: true,
      data: {
        period: {
          type: period,
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
        },
        entries,
        currentUser: {
          rank: currentUserEntry?.rank || 0,
          points: currentUserEntry?.points || 0,
          rankChange: 0, // Would need historical data
        },
      },
    };
  }

  /**
   * Get user's points history
   */
  async getPointsHistory(
    context: UserContext,
    limit = 20
  ): Promise<ServiceResult<{ totalPoints: number; history: Array<{ id: string; points: number; reason: string; createdAt: string }> }>> {
    // Get total points
    const { data: totalData, error: totalError } = await this.supabase
      .from('points_ledger')
      .select('points')
      .eq('user_id', context.userId);

    if (totalError) {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: totalError.message,
        },
      };
    }

    const totalPoints = totalData?.reduce((sum, entry) => sum + entry.points, 0) || 0;

    // Get history
    const { data: history, error: historyError } = await this.supabase
      .from('points_ledger')
      .select('id, points, reason, created_at')
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (historyError) {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: historyError.message,
        },
      };
    }

    return {
      success: true,
      data: {
        totalPoints,
        history: (history || []).map((entry) => ({
          id: entry.id,
          points: entry.points,
          reason: entry.reason,
          createdAt: entry.created_at,
        })),
      },
    };
  }
}

