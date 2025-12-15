/**
 * File: src/app/(dashboard)/dashboard/page.tsx
 * Purpose: Main dashboard page
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Trophy, Flame, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { StreakWidget, LeaderboardWidget } from '@/components/gamification';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your learning dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's progress stats (using public views)
  const { data: progressStats } = await supabase
    .from('user_progress')
    .select('progress_percentage, completed_at')
    .eq('user_id', user?.id);

  const totalItems = progressStats?.length || 0;
  const completedItems = progressStats?.filter(p => p.completed_at)?.length || 0;
  const inProgressItems = progressStats?.filter(p => !p.completed_at && p.progress_percentage > 0)?.length || 0;

  // Fetch streak (using public views)
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', user?.id)
    .eq('streak_type', 'daily')
    .single();

  // Fetch total points (using public views)
  const { data: points } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('user_id', user?.id);

  const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
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
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="In Progress"
          value={inProgressItems}
          description="Continue learning"
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Current Streak"
          value={streak?.current_streak || 0}
          description="Days in a row"
          icon={Flame}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatsCard
          title="Total Points"
          value={totalPoints}
          description="Keep earning!"
          icon={Trophy}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
      </div>

      {/* Gamification Widgets + Continue Learning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Widget */}
        <StreakWidget />
        
        {/* Leaderboard Widget */}
        <LeaderboardWidget />
        
        {/* Continue Learning Card */}
        <Card className="border border-border bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Continue Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {inProgressItems > 0
                ? `You have ${inProgressItems} item${inProgressItems > 1 ? 's' : ''} in progress.`
                : 'Start your learning journey by exploring the content library.'}
            </p>
            <Link
              href="/content"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
            >
              Browse content
              <ArrowRight className="h-4 w-4" />
            </Link>
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
  iconBg: string;
  iconColor: string;
}

function StatsCard({ title, value, description, icon: Icon, iconBg, iconColor }: StatsCardProps) {
  return (
    <Card className="border border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
