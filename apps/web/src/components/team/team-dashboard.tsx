/**
 * File: src/components/team/team-dashboard.tsx
 * Purpose: Team leader dashboard with check-ins, module progress, and team overview
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { 
  Users, CheckCircle, Clock, Video, FileText, 
  Handshake, Zap, ChevronRight, ChevronDown, Loader2, X,
  BookOpen, Lightbulb, Target, HelpCircle, MessageSquare, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { CheatSheetModal } from './cheat-sheet-modal';

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

interface ModuleProgressItem {
  moduleId: string;
  moduleTitle: string;
  videoCompleted: boolean;
  videoProgress: number;
  worksheetCompleted: boolean;
  worksheetResponses: {
    keyTakeaways?: string;
    boldAction?: string;
    questions?: string;
  } | null;
  checkinCompleted: boolean;
  checkinStatus: string;
  boldActionCompleted: boolean;
  boldActionStatus: string;
  boldActionText: string | null;
  completionFeedback: string | null;
  reflectionData: {
    completionStatus: 'fully' | 'partially' | 'blocked' | null;
    reflectionText: string | null;
    challengeLevel: number | null;
    wouldRepeat: 'yes' | 'maybe' | 'no' | null;
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
    totalModules: number;
  };
  moduleProgress: ModuleProgressItem[];
}

interface ModuleProgress {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  videos: { completed: number; total: number };
  worksheets: { completed: number; total: number };
  checkins: { completed: number; total: number };
  boldActions: { completed: number; total: number };
}

interface TeamDashboardProps {
  pendingCheckins: CheckinRequest[];
  teamMembers: TeamMember[];
  moduleProgress: ModuleProgress[];
  teamSize: number;
  currentUserId: string;
}

export function TeamDashboard({ 
  pendingCheckins, 
  teamMembers,
  moduleProgress,
  teamSize,
  currentUserId 
}: TeamDashboardProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [localCheckins, setLocalCheckins] = useState(pendingCheckins);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [cheatSheetCheckin, setCheatSheetCheckin] = useState<CheckinRequest | null>(null);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

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

  const getProgressColor = (completed: number, total: number) => {
    if (total === 0) return 'text-muted-foreground';
    const pct = (completed / total) * 100;
    if (pct === 100) return 'text-green-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Pending Check-ins (1/3 width) */}
      <div className="lg:col-span-1 space-y-4">
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

                    {checkin.bold_action && (
                      <div className="mb-3 p-3 bg-secondary/10 rounded-lg">
                        <p className="text-xs font-medium text-secondary mb-1 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Bold Action Commitment
                        </p>
                        <p className="text-sm">&quot;{checkin.bold_action.action_text}&quot;</p>
                      </div>
                    )}

                    {checkin.worksheet?.responses?.keyTakeaways && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Key Takeaways</p>
                        <p className="text-sm line-clamp-2">{checkin.worksheet.responses.keyTakeaways}</p>
                      </div>
                    )}

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

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCheatSheetCheckin(checkin)}
                        className="border-secondary text-secondary hover:bg-secondary/10"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Cheat Sheet
                      </Button>
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

      {/* Right Column - Team Members + Module Progress (2/3 width) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Team Members */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamMembers.map((member) => (
                  <button
                    key={member.user?.id}
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
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
                          📹 {member.stats.videosCompleted}/{member.stats.totalModules}
                        </span>
                        <span title="Worksheets completed">
                          📝 {member.stats.worksheetsCompleted}/{member.stats.totalModules}
                        </span>
                        <span title="Check-ins completed">
                          🤝 {member.stats.checkinsCompleted}/{member.stats.totalModules}
                        </span>
                        <span title="Bold actions completed">
                          ⚡ {member.stats.boldActionsCompleted}/{member.stats.totalModules}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Module Progress
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (Team of {teamSize})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moduleProgress.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No modules available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-1">Module</div>
                  <div className="text-center">📹 Video</div>
                  <div className="text-center">📝 Worksheet</div>
                  <div className="text-center">🤝 Check-in</div>
                  <div className="text-center">⚡ Bold Action</div>
                </div>
                
                {/* Module Rows */}
                {moduleProgress.map((module) => (
                  <div 
                    key={module.id}
                    className="grid grid-cols-5 gap-2 py-2 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="col-span-1 font-medium text-sm truncate pr-2" title={module.title}>
                      {module.title}
                    </div>
                    <div className={`text-center text-sm font-medium ${getProgressColor(module.videos.completed, module.videos.total)}`}>
                      {module.videos.completed}/{module.videos.total}
                    </div>
                    <div className={`text-center text-sm font-medium ${getProgressColor(module.worksheets.completed, module.worksheets.total)}`}>
                      {module.worksheets.completed}/{module.worksheets.total}
                    </div>
                    <div className={`text-center text-sm font-medium ${getProgressColor(module.checkins.completed, module.checkins.total)}`}>
                      {module.checkins.completed}/{module.checkins.total}
                    </div>
                    <div className={`text-center text-sm font-medium ${getProgressColor(module.boldActions.completed, module.boldActions.total)}`}>
                      {module.boldActions.completed}/{module.boldActions.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Member Drill-down Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMember?.user?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedMember?.user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedMember?.user?.full_name || 'Unknown'}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedMember?.user?.email}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4 mt-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-primary">
                    {selectedMember.stats.videosCompleted}/{selectedMember.stats.totalModules}
                  </p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-secondary">
                    {selectedMember.stats.worksheetsCompleted}/{selectedMember.stats.totalModules}
                  </p>
                  <p className="text-xs text-muted-foreground">Worksheets</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {selectedMember.stats.checkinsCompleted}/{selectedMember.stats.totalModules}
                  </p>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-amber-600">
                    {selectedMember.stats.boldActionsCompleted}/{selectedMember.stats.totalModules}
                  </p>
                  <p className="text-xs text-muted-foreground">Bold Actions</p>
                </div>
              </div>

              {/* Per-Module Progress */}
              <div>
                <h4 className="font-semibold mb-3">Module Progress</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Click a module to see worksheet details
                </p>
                <div className="space-y-2">
                  {selectedMember.moduleProgress.map((module) => {
                    const stepsCompleted = [
                      module.videoCompleted,
                      module.worksheetCompleted,
                      module.checkinCompleted,
                      module.boldActionCompleted,
                    ].filter(Boolean).length;
                    const isExpanded = expandedModules.has(module.moduleId);
                    const hasDetails = module.worksheetResponses || module.boldActionText || module.completionFeedback || module.reflectionData;

                    return (
                      <div 
                        key={module.moduleId}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* Module Header - Clickable */}
                        <button
                          onClick={() => hasDetails && toggleModule(module.moduleId)}
                          className={`w-full p-3 text-left ${hasDetails ? 'hover:bg-muted/30 cursor-pointer' : ''} transition-colors`}
                          disabled={!hasDetails}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {hasDetails && (
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                              )}
                              <p className="font-medium text-sm">{module.moduleTitle}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              stepsCompleted === 4 
                                ? 'bg-green-100 text-green-700'
                                : stepsCompleted > 0 
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {stepsCompleted}/4 steps
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Video */}
                            <div className={`flex items-center gap-1 text-xs ${
                              module.videoCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              {module.videoCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Video className="h-3 w-3" />
                              )}
                              Video
                            </div>
                            {/* Worksheet */}
                            <div className={`flex items-center gap-1 text-xs ${
                              module.worksheetCompleted ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              {module.worksheetCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              Worksheet
                            </div>
                            {/* Check-in */}
                            <div className={`flex items-center gap-1 text-xs ${
                              module.checkinCompleted 
                                ? 'text-green-600' 
                                : module.checkinStatus === 'pending' 
                                  ? 'text-amber-600' 
                                  : 'text-muted-foreground'
                            }`}>
                              {module.checkinCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Handshake className="h-3 w-3" />
                              )}
                              {module.checkinCompleted 
                                ? 'Met' 
                                : module.checkinStatus === 'pending' 
                                  ? 'Requested' 
                                  : 'Check-in'}
                            </div>
                            {/* Bold Action */}
                            <div className={`flex items-center gap-1 text-xs ${
                              module.boldActionCompleted 
                                ? 'text-green-600' 
                                : module.boldActionStatus === 'pending' 
                                  ? 'text-amber-600' 
                                  : 'text-muted-foreground'
                            }`}>
                              {module.boldActionCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Zap className="h-3 w-3" />
                              )}
                              {module.boldActionCompleted 
                                ? 'Done' 
                                : module.boldActionStatus === 'pending' 
                                  ? 'Active' 
                                  : 'Bold Action'}
                            </div>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && hasDetails && (
                          <div className="border-t bg-muted/20 p-3 space-y-3">
                            {/* Key Takeaways */}
                            {module.worksheetResponses?.keyTakeaways && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                  <Lightbulb className="h-3 w-3 text-yellow-500" />
                                  Key Takeaways
                                </p>
                                <p className="text-sm bg-white/50 p-2 rounded">
                                  {module.worksheetResponses.keyTakeaways}
                                </p>
                              </div>
                            )}

                            {/* Bold Action */}
                            {(module.worksheetResponses?.boldAction || module.boldActionText) && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                  <Target className="h-3 w-3 text-primary" />
                                  Bold Action Commitment
                                </p>
                                <p className="text-sm bg-primary/5 p-2 rounded border-l-2 border-primary">
                                  &quot;{module.boldActionText || module.worksheetResponses?.boldAction}&quot;
                                </p>
                              </div>
                            )}

                            {/* Questions */}
                            {module.worksheetResponses?.questions && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                  <HelpCircle className="h-3 w-3 text-blue-500" />
                                  Questions
                                </p>
                                <p className="text-sm bg-white/50 p-2 rounded">
                                  {module.worksheetResponses.questions}
                                </p>
                              </div>
                            )}

                            {/* Completion Feedback (Legacy) */}
                            {module.completionFeedback && !module.reflectionData?.reflectionText && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-green-500" />
                                  Completion Reflection
                                </p>
                                <p className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-500">
                                  {module.completionFeedback}
                                </p>
                              </div>
                            )}

                            {/* New Reflection Data */}
                            {module.reflectionData && (
                              <div className="space-y-2 pt-2 border-t border-dashed">
                                <p className="text-xs font-semibold text-green-600 uppercase">
                                  Completion Reflection
                                </p>
                                
                                {/* Completion Status */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">How it went:</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                    module.reflectionData.completionStatus === 'fully' 
                                      ? 'bg-green-100 text-green-700'
                                      : module.reflectionData.completionStatus === 'partially'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}>
                                    {module.reflectionData.completionStatus === 'fully' && '✅ Fully completed'}
                                    {module.reflectionData.completionStatus === 'partially' && '🔄 Partially completed'}
                                    {module.reflectionData.completionStatus === 'blocked' && '❌ Blocked'}
                                  </span>
                                </div>

                                {/* Reflection Text */}
                                {module.reflectionData.reflectionText && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Reflection:</p>
                                    <p className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-500">
                                      {module.reflectionData.reflectionText}
                                    </p>
                                  </div>
                                )}

                                {/* Challenge & Would Repeat */}
                                <div className="flex gap-4 text-xs">
                                  {module.reflectionData.challengeLevel && (
                                    <span className="text-muted-foreground">
                                      Challenge: {
                                        module.reflectionData.challengeLevel === 1 ? '😌 Easy' :
                                        module.reflectionData.challengeLevel === 2 ? '💪 Moderate' :
                                        module.reflectionData.challengeLevel === 3 ? '🔥 Hard' :
                                        '🌋 Very Hard'
                                      }
                                    </span>
                                  )}
                                  {module.reflectionData.wouldRepeat && (
                                    <span className="text-muted-foreground">
                                      Would repeat: {
                                        module.reflectionData.wouldRepeat === 'yes' ? '👍 Yes' :
                                        module.reflectionData.wouldRepeat === 'maybe' ? '🤷 Maybe' :
                                        '👎 No'
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Cheat Sheet Modal */}
      {cheatSheetCheckin && (
        <CheatSheetModal
          isOpen={!!cheatSheetCheckin}
          onClose={() => setCheatSheetCheckin(null)}
          checkinId={cheatSheetCheckin.id}
          userName={cheatSheetCheckin.requester?.full_name || 'Team Member'}
          moduleTitle={`Module ${cheatSheetCheckin.content_id}`}
        />
      )}
    </div>
  );
}
