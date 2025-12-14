/**
 * File: src/components/team/team-dashboard.tsx
 * Purpose: Team leader dashboard with check-ins and team progress
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { 
  Users, CheckCircle, Clock, Video, FileText, 
  Handshake, Zap, ChevronRight, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';

interface CheckinRequest {
  id: string;
  content_id: string;
  status: string;
  created_at: string;
  requester: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  bold_action: {
    id: string;
    action_text: string;
    status: string;
  } | null;
  progress: {
    progress_percentage: number;
    completed_at: string | null;
  } | null;
  worksheet: {
    responses: {
      keyTakeaways?: string;
      boldAction?: string;
      questions?: string;
    };
  } | null;
}

interface TeamMember {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  stats: {
    videosCompleted: number;
    worksheetsCompleted: number;
    checkinsCompleted: number;
    boldActionsCompleted: number;
  };
}

interface TeamDashboardProps {
  pendingCheckins: CheckinRequest[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

export function TeamDashboard({ 
  pendingCheckins, 
  teamMembers,
  currentUserId 
}: TeamDashboardProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [localCheckins, setLocalCheckins] = useState(pendingCheckins);

  const handleCompleteCheckin = async (checkin: CheckinRequest) => {
    setCompletingId(checkin.id);
    
    try {
      const response = await fetch(`/api/checkins/${checkin.content_id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: checkin.requester?.id,
          notes: 'Completed via team dashboard'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove from local list
        setLocalCheckins(prev => prev.filter(c => c.id !== checkin.id));
        toast({
          title: 'Check-in Completed',
          description: `Check-in with ${checkin.requester?.full_name} marked as complete.`,
        });
      } else {
        throw new Error(result.error || 'Failed to complete check-in');
      }
    } catch (error: any) {
      console.error('Failed to complete check-in:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete check-in',
        variant: 'destructive',
      });
    } finally {
      setCompletingId(null);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Pending Check-ins */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              Pending Check-ins
              {localCheckins.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
                  {localCheckins.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {localCheckins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending check-in requests from your team.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {localCheckins.map((checkin) => (
                  <div 
                    key={checkin.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={checkin.requester?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(checkin.requester?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{checkin.requester?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested {formatDate(checkin.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        checkin.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {checkin.status === 'scheduled' ? 'Scheduled' : 'Pending'}
                      </span>
                    </div>

                    {/* Bold Action */}
                    {checkin.bold_action && (
                      <div className="mb-3 p-3 bg-secondary/10 rounded-lg">
                        <p className="text-xs font-medium text-secondary mb-1 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Bold Action Commitment
                        </p>
                        <p className="text-sm">&quot;{checkin.bold_action.action_text}&quot;</p>
                      </div>
                    )}

                    {/* Key Takeaways */}
                    {checkin.worksheet?.responses?.keyTakeaways && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Key Takeaways
                        </p>
                        <p className="text-sm line-clamp-2">
                          {checkin.worksheet.responses.keyTakeaways}
                        </p>
                      </div>
                    )}

                    {/* Progress indicators */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className={`flex items-center gap-1 ${
                        checkin.progress?.progress_percentage && checkin.progress.progress_percentage >= 90
                          ? 'text-green-600' 
                          : 'text-muted-foreground'
                      }`}>
                        <Video className="h-4 w-4" />
                        {checkin.progress?.progress_percentage || 0}% watched
                      </span>
                      <span className={`flex items-center gap-1 ${
                        checkin.worksheet ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        <FileText className="h-4 w-4" />
                        {checkin.worksheet ? 'Worksheet done' : 'Worksheet pending'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleCompleteCheckin(checkin)}
                        disabled={completingId === checkin.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {completingId === checkin.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Complete Check-in
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Team Overview */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({teamMembers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team members assigned yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div 
                    key={member.user?.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(member.user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.user?.full_name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span title="Videos completed">
                          📹 {member.stats.videosCompleted}
                        </span>
                        <span title="Worksheets completed">
                          📝 {member.stats.worksheetsCompleted}
                        </span>
                        <span title="Check-ins completed">
                          🤝 {member.stats.checkinsCompleted}
                        </span>
                        <span title="Bold actions completed">
                          ⚡ {member.stats.boldActionsCompleted}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {teamMembers.reduce((sum, m) => sum + m.stats.videosCompleted, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Videos Watched</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-secondary">
                  {teamMembers.reduce((sum, m) => sum + m.stats.worksheetsCompleted, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Worksheets Done</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {teamMembers.reduce((sum, m) => sum + m.stats.checkinsCompleted, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Check-ins Done</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {teamMembers.reduce((sum, m) => sum + m.stats.boldActionsCompleted, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Bold Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

