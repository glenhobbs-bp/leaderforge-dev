/**
 * File: src/lib/gamification.ts
 * Purpose: Shared gamification utilities for awarding points and updating streaks
 * Owner: Core Team
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Points configuration (matches database defaults)
export const POINTS_CONFIG = {
  video_complete: 10,
  worksheet_complete: 5,
  checkin_complete: 10,
  bold_action_complete: 15,
  streak_daily: 2,
  streak_weekly: 5,
} as const;

export type PointsReason = keyof typeof POINTS_CONFIG;

/**
 * Award points and update streak for a user activity
 * This is a fire-and-forget operation - it won't fail the main request
 */
export async function awardGamification(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  reason: PointsReason,
  sourceId?: string
): Promise<void> {
  try {
    // Award points
    await supabase.rpc('award_points', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_points: POINTS_CONFIG[reason],
      p_reason: reason,
      p_source_type: 'content',
      p_source_id: sourceId || null,
    });

    // Update daily streak
    await supabase.rpc('update_streak', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_streak_type: 'daily'
    });

    console.log(`[Gamification] Awarded ${POINTS_CONFIG[reason]} points for ${reason} to user ${userId}`);
  } catch (error) {
    // Don't fail the main operation if gamification fails
    console.error('[Gamification] Error:', error);
  }
}
