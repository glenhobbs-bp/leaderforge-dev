/**
 * File: src/components/gamification/streak-widget.tsx
 * Purpose: Dashboard widget showing user's current streak
 * Owner: Core Team
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakStartDate: string | null;
  totalActiveDays: number;
  totalActivities: number;
  isAtRisk: boolean;
}

/**
 * Get streak milestone info
 */
function getStreakMilestone(streak: number): { emoji: string; label: string } | null {
  if (streak >= 100) return { emoji: '🏆', label: 'Century Club!' };
  if (streak >= 30) return { emoji: '⭐', label: 'Monthly Master!' };
  if (streak >= 14) return { emoji: '🔥🔥🔥', label: 'Two Weeks!' };
  if (streak >= 7) return { emoji: '🔥🔥', label: 'One Week Strong!' };
  if (streak >= 3) return { emoji: '🔥', label: 'Getting Started!' };
  return null;
}

export function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const response = await fetch('/api/gamification/streak');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreak();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Your Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const streak = data?.currentStreak || 0;
  const milestone = getStreakMilestone(streak);

  return (
    <Card className={cn(
      data?.isAtRisk && streak > 0 && 'border-amber-200 bg-amber-50/30'
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className={cn(
            "h-4 w-4",
            streak > 0 ? "text-orange-500" : "text-muted-foreground"
          )} />
          Your Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main streak display */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "text-4xl font-bold",
            streak > 0 ? "text-orange-500" : "text-muted-foreground"
          )}>
            {streak}
          </div>
          <div className="text-sm text-muted-foreground">
            {streak === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Streak progress bar */}
        {streak > 0 && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>30 days</span>
            </div>
          </div>
        )}

        {/* Milestone badge */}
        {milestone && (
          <div className="flex items-center gap-2 text-sm">
            <span>{milestone.emoji}</span>
            <span className="font-medium text-orange-600">{milestone.label}</span>
          </div>
        )}

        {/* At risk warning */}
        {data?.isAtRisk && streak > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded">
            <AlertTriangle className="h-3 w-3" />
            <span>Learn today to keep your streak!</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm">
            <Trophy className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Best:</span>
            <span className="font-medium">{data?.longestStreak || 0} days</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{data?.totalActiveDays || 0} days</span>
          </div>
        </div>

        {/* Start streak message */}
        {streak === 0 && (
          <p className="text-sm text-muted-foreground">
            Complete any learning activity to start your streak!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
