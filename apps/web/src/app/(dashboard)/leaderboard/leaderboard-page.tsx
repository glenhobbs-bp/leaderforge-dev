/**
 * File: src/app/(dashboard)/leaderboard/leaderboard-page.tsx
 * Purpose: Client component for full leaderboard with filters
 * Owner: Core Team
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Medal, Award, Flame, Users, Calendar,
  Building2, UsersRound, TrendingUp
} from 'lucide-react';
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

interface Props {
  organizationName: string;
  teamName?: string;
  hasTeam: boolean;
}

/**
 * Get rank display with medal/trophy
 */
function getRankDisplay(rank: number): { icon: React.ReactNode; bgClass: string } {
  switch (rank) {
    case 1:
      return { 
        icon: <span className="text-2xl">🥇</span>, 
        bgClass: 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200' 
      };
    case 2:
      return { 
        icon: <span className="text-2xl">🥈</span>, 
        bgClass: 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200' 
      };
    case 3:
      return { 
        icon: <span className="text-2xl">🥉</span>, 
        bgClass: 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200' 
      };
    default:
      return { 
        icon: <span className="text-lg font-semibold text-muted-foreground">{rank}</span>, 
        bgClass: '' 
      };
  }
}

export function LeaderboardPage({ organizationName, teamName, hasTeam }: Props) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly');
  const [scope, setScope] = useState<'organization' | 'team'>('organization');

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const response = await fetch(`/api/gamification/leaderboard?period=${period}&scope=${scope}`);
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
  }, [period, scope]);

  const currentUserEntry = data?.entries.find(e => e.isCurrentUser);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          See how you rank against your colleagues
        </p>
      </div>

      {/* Your Stats */}
      {currentUserEntry && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold">#{currentUserEntry.rank}</span>
                  <div>
                    <p className="font-semibold">{currentUserEntry.points} points</p>
                    {currentUserEntry.currentStreak > 0 && (
                      <p className="text-sm text-orange-500 flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        {currentUserEntry.currentStreak} day streak
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  out of {data?.totalParticipants} participants
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {period === 'weekly' ? 'This week' : 'All time'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Period Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 inline mr-1" />
            Period:
          </span>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={period === 'weekly' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('weekly')}
            >
              This Week
            </Button>
            <Button
              variant={period === 'all_time' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('all_time')}
            >
              All Time
            </Button>
          </div>
        </div>

        {/* Scope Toggle */}
        {hasTeam && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              Scope:
            </span>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={scope === 'organization' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setScope('organization')}
              >
                <Building2 className="h-3 w-3 mr-1" />
                Organization
              </Button>
              <Button
                variant={scope === 'team' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setScope('team')}
              >
                <UsersRound className="h-3 w-3 mr-1" />
                Team
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {scope === 'team' ? (
              <>
                <UsersRound className="h-5 w-5" />
                {teamName || 'Team'} Leaderboard
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5" />
                {organizationName} Leaderboard
              </>
            )}
          </CardTitle>
          <CardDescription>
            {period === 'weekly' 
              ? 'Rankings based on points earned this week' 
              : 'All-time rankings based on total points earned'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
            </div>
          ) : data?.entries.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold">No activity yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Be the first to earn points and claim the top spot!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.entries.map((entry, index) => {
                const { icon, bgClass } = getRankDisplay(entry.rank);
                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      entry.isCurrentUser 
                        ? "bg-primary/5 border-primary/30" 
                        : bgClass || "hover:bg-muted/50"
                    )}
                  >
                    {/* Rank and Name */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium",
                            entry.isCurrentUser && "text-primary"
                          )}>
                            {entry.isCurrentUser ? 'You' : entry.displayName}
                          </span>
                          {entry.isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        {entry.currentStreak > 0 && (
                          <div className="flex items-center gap-1 text-sm text-orange-500">
                            <Flame className="h-3 w-3" />
                            {entry.currentStreak} day streak
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-lg">
                          {entry.points.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">points</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Guide */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">10 pts</Badge>
              <span className="text-muted-foreground">Complete a video</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">5 pts</Badge>
              <span className="text-muted-foreground">Complete worksheet</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">10 pts</Badge>
              <span className="text-muted-foreground">Complete check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">15 pts</Badge>
              <span className="text-muted-foreground">Complete bold action</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 md:col-span-4">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">2 pts/day</Badge>
              <span className="text-muted-foreground">Maintain daily streak</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
