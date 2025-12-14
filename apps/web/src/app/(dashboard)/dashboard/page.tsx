/**
 * File: src/app/(dashboard)/dashboard/page.tsx
 * Purpose: Main dashboard page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Trophy, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your learning dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's progress stats (using progress schema)
  const { data: progressStats } = await supabase
    .schema('progress')
    .from('user_progress')
    .select('progress_percentage, completed_at')
    .eq('user_id', user?.id);

  const totalItems = progressStats?.length || 0;
  const completedItems = progressStats?.filter(p => p.completed_at)?.length || 0;
  const inProgressItems = progressStats?.filter(p => !p.completed_at && p.progress_percentage > 0)?.length || 0;

  // Fetch streak (using progress schema)
  const { data: streak } = await supabase
    .schema('progress')
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', user?.id)
    .eq('streak_type', 'daily')
    .single();

  // Fetch total points (using progress schema)
  const { data: points } = await supabase
    .schema('progress')
    .from('points_ledger')
    .select('points')
    .eq('user_id', user?.id);

  const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-1">
          Continue your learning journey
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Content Items"
          value={totalItems}
          description={`${completedItems} completed`}
          icon={BookOpen}
        />
        <StatsCard
          title="In Progress"
          value={inProgressItems}
          description="Continue learning"
          icon={TrendingUp}
        />
        <StatsCard
          title="Current Streak"
          value={streak?.current_streak || 0}
          description="Days in a row"
          icon={Flame}
          iconClassName="text-streak"
        />
        <StatsCard
          title="Total Points"
          value={totalPoints}
          description="Keep earning!"
          icon={Trophy}
          iconClassName="text-gold"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {inProgressItems > 0
                ? `You have ${inProgressItems} item${inProgressItems > 1 ? 's' : ''} in progress.`
                : 'Start your learning journey by exploring the content library.'}
            </p>
            <a
              href="/content"
              className="mt-4 inline-flex items-center text-primary hover:underline text-sm"
            >
              Browse content →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              See how you rank against your teammates.
            </p>
            <a
              href="/leaderboard"
              className="mt-4 inline-flex items-center text-primary hover:underline text-sm"
            >
              View leaderboard →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
}

function StatsCard({ title, value, description, icon: Icon, iconClassName }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 bg-muted rounded-full ${iconClassName || ''}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

