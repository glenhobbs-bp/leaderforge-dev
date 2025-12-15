/**
 * File: src/components/gamification/leaderboard-widget.tsx
 * Purpose: Dashboard widget showing leaderboard summary
 * Owner: Core Team
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, ChevronRight, Users, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
  currentStreak: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  period: 'weekly' | 'all_time';
  scope: 'team' | 'organization';
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserPoints: number;
  totalParticipants: number;
}

/**
 * Get rank icon/medal
 */
function getRankDisplay(rank: number): { icon: React.ReactNode; className: string } {
  switch (rank) {
    case 1:
      return { 
        icon: <span className="text-lg">🥇</span>, 
        className: 'text-amber-500 font-bold' 
      };
    case 2:
      return { 
        icon: <span className="text-lg">🥈</span>, 
        className: 'text-slate-400 font-bold' 
      };
    case 3:
      return { 
        icon: <span className="text-lg">🥉</span>, 
        className: 'text-amber-600 font-bold' 
      };
    default:
      return { 
        icon: <span className="text-sm text-muted-foreground">{rank}</span>, 
        className: 'text-muted-foreground' 
      };
  }
}

export function LeaderboardWidget() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/gamification/leaderboard?period=weekly&scope=organization');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const entries = data?.entries.slice(0, 5) || []; // Show top 5 in widget
  const currentUserEntry = data?.entries.find(e => e.isCurrentUser);
  const showCurrentUserSeparately = currentUserEntry && (currentUserEntry.rank || 0) > 5;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {data?.scope === 'team' ? 'Team' : 'Organization'} Leaderboard
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            This Week
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <div className="py-6 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No activity this week yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Be the first to earn points!
            </p>
          </div>
        ) : (
          <>
            {/* Top entries */}
            <div className="space-y-1">
              {entries.map((entry) => {
                const { icon, className } = getRankDisplay(entry.rank);
                return (
                  <div 
                    key={entry.userId}
                    className={cn(
                      "flex items-center justify-between py-1.5 px-2 rounded-md",
                      entry.isCurrentUser && "bg-primary/5 border border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 flex justify-center">{icon}</div>
                      <span className={cn(
                        "text-sm",
                        entry.isCurrentUser && "font-medium"
                      )}>
                        {entry.isCurrentUser ? 'You' : entry.displayName}
                      </span>
                      {entry.currentStreak > 0 && (
                        <span className="text-xs text-orange-500 flex items-center gap-0.5">
                          <Flame className="h-3 w-3" />
                          {entry.currentStreak}
                        </span>
                      )}
                    </div>
                    <span className={cn("text-sm font-medium", className)}>
                      {entry.points} pts
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Show current user if not in top 5 */}
            {showCurrentUserSeparately && currentUserEntry && (
              <>
                <div className="border-t border-dashed my-2" />
                <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 text-center text-sm text-muted-foreground">
                      {currentUserEntry.rank}
                    </div>
                    <span className="text-sm font-medium">You</span>
                    {currentUserEntry.currentStreak > 0 && (
                      <span className="text-xs text-orange-500 flex items-center gap-0.5">
                        <Flame className="h-3 w-3" />
                        {currentUserEntry.currentStreak}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {currentUserEntry.points} pts
                  </span>
                </div>
              </>
            )}

            {/* Participants count */}
            <div className="text-xs text-muted-foreground text-center pt-2">
              {data?.totalParticipants} participants this week
            </div>

            {/* View full leaderboard link */}
            <Link href="/leaderboard" className="block">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View Full Leaderboard
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
