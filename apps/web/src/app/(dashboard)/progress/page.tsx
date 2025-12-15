/**
 * File: src/app/(dashboard)/progress/page.tsx
 * Purpose: My Progress page - Learning journey overview
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchContentCollection } from '@/lib/tribe-social';
import { createClient } from '@/lib/supabase/server';
import { 
  TrendingUp, CheckCircle2, Circle, Clock, 
  PlayCircle, FileText, MessageSquare, Target,
  Trophy, Flame, Award, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Progress',
  description: 'Track your learning journey',
};

interface ModuleProgress {
  contentId: string;
  title: string;
  thumbnailUrl: string | null;
  sequenceOrder: number;
  videoProgress: number;
  videoCompleted: boolean;
  worksheetCompleted: boolean;
  checkinCompleted: boolean;
  boldActionCompleted: boolean;
  stepsCompleted: number;
  isFullyComplete: boolean;
}

interface PointsEntry {
  id: string;
  points: number;
  reason: string;
  earned_at: string;
}

export default async function ProgressPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Fetch content
  const content = await fetchContentCollection();

  // Fetch all progress data in parallel
  const [
    { data: videoProgress },
    { data: worksheetSubmissions },
    { data: checkinRequests },
    { data: boldActions },
    { data: streak },
    { data: points },
  ] = await Promise.all([
    supabase.from('user_progress').select('content_id, progress_percentage, completed_at').eq('user_id', user.id),
    supabase.from('worksheet_submissions').select('content_id').eq('user_id', user.id),
    supabase.from('checkin_requests').select('content_id, status').eq('user_id', user.id),
    supabase.from('bold_actions').select('content_id, status').eq('user_id', user.id),
    supabase.from('user_streaks').select('current_streak, longest_streak, total_active_days').eq('user_id', user.id).eq('streak_type', 'daily').single(),
    supabase.from('points_ledger').select('id, points, reason, earned_at').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(10),
  ]);

  // Build lookup maps
  const videoMap = new Map(videoProgress?.map(v => [v.content_id, { progress: v.progress_percentage, completed: !!v.completed_at }]) || []);
  const worksheetSet = new Set(worksheetSubmissions?.map(w => w.content_id) || []);
  const checkinMap = new Map(checkinRequests?.map(c => [c.content_id, c.status]) || []);
  const boldActionMap = new Map(boldActions?.map(b => [b.content_id, b.status]) || []);

  // Build module progress list
  const moduleProgress: ModuleProgress[] = content.map((item, index) => {
    const video = videoMap.get(item.id) || { progress: 0, completed: false };
    const worksheetDone = worksheetSet.has(item.id);
    const checkinStatus = checkinMap.get(item.id);
    const boldActionStatus = boldActionMap.get(item.id);
    
    const checkinDone = checkinStatus === 'completed';
    const boldActionDone = boldActionStatus === 'completed' || boldActionStatus === 'signed_off';
    
    const stepsCompleted = [video.completed, worksheetDone, checkinDone, boldActionDone].filter(Boolean).length;
    
    return {
      contentId: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      sequenceOrder: index + 1,
      videoProgress: video.progress,
      videoCompleted: video.completed,
      worksheetCompleted: worksheetDone,
      checkinCompleted: checkinDone,
      boldActionCompleted: boldActionDone,
      stepsCompleted,
      isFullyComplete: stepsCompleted === 4,
    };
  });

  // Calculate overall stats
  const totalModules = moduleProgress.length;
  const modulesCompleted = moduleProgress.filter(m => m.isFullyComplete).length;
  const totalSteps = totalModules * 4;
  const stepsCompleted = moduleProgress.reduce((sum, m) => sum + m.stepsCompleted, 0);
  const overallProgress = totalSteps > 0 ? Math.round((stepsCompleted / totalSteps) * 100) : 0;
  const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

  // Milestones
  const milestones = [
    { name: 'First Video', achieved: moduleProgress.some(m => m.videoCompleted), icon: PlayCircle },
    { name: 'First Module Complete', achieved: modulesCompleted >= 1, icon: CheckCircle2 },
    { name: '3-Day Streak', achieved: (streak?.current_streak || 0) >= 3, icon: Flame },
    { name: '50% Complete', achieved: overallProgress >= 50, icon: TrendingUp },
    { name: 'All Modules Complete', achieved: modulesCompleted === totalModules && totalModules > 0, icon: Trophy },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          My Progress
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-bold text-primary">{overallProgress}%</span>
                <span className="text-muted-foreground pb-2">complete</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {stepsCompleted} of {totalSteps} steps completed
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modulesCompleted}/{totalModules}</p>
                  <p className="text-xs text-muted-foreground">Modules Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak?.current_streak || 0}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak?.total_active_days || 0}</p>
                  <p className="text-xs text-muted-foreground">Days Active</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {milestones.map((milestone) => {
              const Icon = milestone.icon;
              return (
                <div
                  key={milestone.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    milestone.achieved 
                      ? 'bg-primary/10 border-primary/30 text-primary' 
                      : 'bg-muted/30 border-transparent text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{milestone.name}</span>
                  {milestone.achieved && <CheckCircle2 className="h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Module Progress Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning Path Progress</CardTitle>
          <CardDescription>
            Your progress through the 4-step completion model for each module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground pb-3 border-b">
              <div className="flex items-center gap-1">
                <PlayCircle className="h-4 w-4" /> Video
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Worksheet
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> Check-in
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" /> Bold Action
              </div>
            </div>

            {/* Module rows */}
            {moduleProgress.map((module) => (
              <Link
                key={module.contentId}
                href={`/content/${module.contentId}`}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                {/* Module number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  module.isFullyComplete 
                    ? 'bg-green-100 text-green-700' 
                    : module.stepsCompleted > 0 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {module.sequenceOrder}
                </div>

                {/* Module title */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {module.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {module.stepsCompleted}/4 steps complete
                  </p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2">
                  <StepIndicator 
                    completed={module.videoCompleted} 
                    inProgress={module.videoProgress > 0 && !module.videoCompleted}
                    icon={PlayCircle}
                    label="Video"
                  />
                  <StepIndicator 
                    completed={module.worksheetCompleted} 
                    icon={FileText}
                    label="Worksheet"
                  />
                  <StepIndicator 
                    completed={module.checkinCompleted} 
                    icon={MessageSquare}
                    label="Check-in"
                  />
                  <StepIndicator 
                    completed={module.boldActionCompleted} 
                    icon={Target}
                    label="Bold Action"
                  />
                </div>

                {/* Status badge */}
                <Badge 
                  variant={module.isFullyComplete ? 'default' : 'outline'}
                  className={module.isFullyComplete ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                >
                  {module.isFullyComplete ? 'Complete' : `${module.stepsCompleted}/4`}
                </Badge>
              </Link>
            ))}

            {moduleProgress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No content available yet.</p>
                <Link href="/content" className="text-primary hover:underline">
                  Browse content library →
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>
            Your latest points earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {points && points.length > 0 ? (
            <div className="space-y-2">
              {points.map((entry: PointsEntry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-100 rounded">
                      <Trophy className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatReason(entry.reason)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.earned_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-amber-700 bg-amber-50">
                    +{entry.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity yet. Complete learning modules to earn points!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({ 
  completed, 
  inProgress, 
  icon: Icon,
  label 
}: { 
  completed: boolean; 
  inProgress?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div 
      className={`p-1.5 rounded transition-colors ${
        completed 
          ? 'bg-green-100 text-green-600' 
          : inProgress 
            ? 'bg-blue-100 text-blue-600'
            : 'bg-muted text-muted-foreground'
      }`}
      title={label}
    >
      {completed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : inProgress ? (
        <Clock className="h-4 w-4" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </div>
  );
}

function formatReason(reason: string): string {
  const map: Record<string, string> = {
    video_complete: 'Completed video',
    worksheet_complete: 'Completed worksheet',
    checkin_complete: 'Completed check-in',
    bold_action_complete: 'Completed bold action',
    streak_daily: 'Daily streak bonus',
    streak_weekly: 'Weekly streak bonus',
  };
  return map[reason] || reason.replace(/_/g, ' ');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
