/**
 * File: src/components/admin/org-admin-dashboard.tsx
 * Purpose: Organization Admin dashboard with org-wide stats, team breakdown, and progress
 * Owner: Core Team
 */

'use client';

import { useState } from 'react';
import { 
  Users, CheckCircle, Video, FileText, Handshake, Zap, 
  ChevronRight, ChevronDown, Building2, UserCircle, 
  TrendingUp, Clock, Target, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MemberModuleProgress {
  moduleId: string;
  moduleTitle: string;
  videoCompleted: boolean;
  worksheetCompleted: boolean;
  checkinCompleted: boolean;
  boldActionCompleted: boolean;
}

interface TeamMember {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  role: string;
  stats: {
    videosCompleted: number;
    worksheetsCompleted: number;
    checkinsCompleted: number;
    boldActionsCompleted: number;
    totalModules: number;
  };
  moduleProgress: MemberModuleProgress[];
}

interface Team {
  leader: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  memberCount: number;
  stats: {
    videosCompleted: number;
    worksheetsCompleted: number;
    checkinsCompleted: number;
    boldActionsCompleted: number;
    pendingCheckins: number;
  };
  members: TeamMember[];
}

interface ModuleProgress {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  videos: { completed: number; total: number };
  worksheets: { completed: number; total: number };
  checkins: { completed: number; total: number };
  boldActions: { completed: number; total: number };
  fullyCompleted: { completed: number; total: number };
}

interface OrgStats {
  totalMembers: number;
  videosCompleted: number;
  worksheetsCompleted: number;
  checkinsCompleted: number;
  boldActionsCompleted: number;
  pendingCheckins: number;
}

interface OrgAdminDashboardProps {
  orgStats: OrgStats;
  moduleProgress: ModuleProgress[];
  teams: Team[];
  unassignedTeam: Team | null;
  totalModules: number;
}

export function OrgAdminDashboard({
  orgStats,
  moduleProgress,
  teams,
  unassignedTeam,
  totalModules,
}: OrgAdminDashboardProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Calculate overall completion rate
  const totalPossibleSteps = orgStats.totalMembers * totalModules * 4; // 4 steps per module
  const totalCompletedSteps = orgStats.videosCompleted + orgStats.worksheetsCompleted + 
    orgStats.checkinsCompleted + orgStats.boldActionsCompleted;
  const overallCompletionRate = totalPossibleSteps > 0 
    ? Math.round((totalCompletedSteps / totalPossibleSteps) * 100) 
    : 0;

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCompletionColor = (completed: number, total: number) => {
    if (total === 0) return 'text-muted-foreground';
    const rate = completed / total;
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Org-Wide Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orgStats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orgStats.videosCompleted}</p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orgStats.worksheetsCompleted}</p>
                <p className="text-xs text-muted-foreground">Worksheets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Handshake className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orgStats.checkinsCompleted}</p>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orgStats.boldActionsCompleted}</p>
                <p className="text-xs text-muted-foreground">Bold Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orgStats.pendingCheckins}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Overall Completion
          </CardTitle>
          <CardDescription>
            Organization-wide progress across all modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={overallCompletionRate} className="flex-1 h-3" />
            <span className="text-2xl font-bold text-primary">{overallCompletionRate}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {totalCompletedSteps} of {totalPossibleSteps} steps completed
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" />
              Teams
            </CardTitle>
            <CardDescription>Progress by team leader</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.length === 0 && !unassignedTeam && (
              <p className="text-muted-foreground text-center py-4">
                No teams configured yet
              </p>
            )}
            
            {teams.map((team) => (
              <div key={team.leader?.id || 'unknown'} className="border rounded-lg">
                <button
                  onClick={() => setExpandedTeam(
                    expandedTeam === team.leader?.id ? null : (team.leader?.id || null)
                  )}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={team.leader?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary/20 text-secondary text-xs">
                        {getInitials(team.leader?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium text-sm">{team.leader?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs">
                      <span className="text-blue-600">{team.stats.videosCompleted} 📺</span>
                      <span className="text-purple-600">{team.stats.worksheetsCompleted} 📝</span>
                      <span className="text-amber-600">{team.stats.checkinsCompleted} 🤝</span>
                      <span className="text-green-600">{team.stats.boldActionsCompleted} ⚡</span>
                    </div>
                    {expandedTeam === team.leader?.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedTeam === team.leader?.id && (
                  <div className="border-t px-3 py-2 space-y-1 bg-muted/20">
                    {team.members.map((member) => (
                      <button
                        key={member.user.id}
                        onClick={() => setSelectedMember(member)}
                        className="w-full p-2 flex items-center justify-between hover:bg-muted rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.user.full_name}</span>
                          {member.role === 'admin' && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{member.stats.videosCompleted}/{member.stats.totalModules}</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Unassigned Members */}
            {unassignedTeam && unassignedTeam.memberCount > 0 && (
              <div className="border rounded-lg border-dashed">
                <button
                  onClick={() => setExpandedTeam(
                    expandedTeam === 'unassigned' ? null : 'unassigned'
                  )}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm text-muted-foreground">Unassigned</p>
                      <p className="text-xs text-muted-foreground">
                        {unassignedTeam.memberCount} member{unassignedTeam.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs">
                      <span className="text-blue-600">{unassignedTeam.stats.videosCompleted} 📺</span>
                      <span className="text-purple-600">{unassignedTeam.stats.worksheetsCompleted} 📝</span>
                      <span className="text-amber-600">{unassignedTeam.stats.checkinsCompleted} 🤝</span>
                      <span className="text-green-600">{unassignedTeam.stats.boldActionsCompleted} ⚡</span>
                    </div>
                    {expandedTeam === 'unassigned' ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedTeam === 'unassigned' && (
                  <div className="border-t px-3 py-2 space-y-1 bg-muted/20">
                    {unassignedTeam.members.map((member) => (
                      <button
                        key={member.user.id}
                        onClick={() => setSelectedMember(member)}
                        className="w-full p-2 flex items-center justify-between hover:bg-muted rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.user.full_name}</span>
                          {member.role === 'admin' && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{member.stats.videosCompleted}/{member.stats.totalModules}</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Module Progress
            </CardTitle>
            <CardDescription>Completion rates by module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moduleProgress.map((module) => {
                const completionRate = module.fullyCompleted.total > 0
                  ? Math.round((module.fullyCompleted.completed / module.fullyCompleted.total) * 100)
                  : 0;
                
                return (
                  <div key={module.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {module.title}
                      </span>
                      <span className={`text-sm font-bold ${getCompletionColor(module.fullyCompleted.completed, module.fullyCompleted.total)}`}>
                        {completionRate}%
                      </span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                    <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3 text-blue-500" />
                        <span>{module.videos.completed}/{module.videos.total}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-purple-500" />
                        <span>{module.worksheets.completed}/{module.worksheets.total}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Handshake className="h-3 w-3 text-amber-500" />
                        <span>{module.checkins.completed}/{module.checkins.total}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-green-500" />
                        <span>{module.boldActions.completed}/{module.boldActions.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {moduleProgress.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No modules available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Detail Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMember?.user.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(selectedMember?.user.full_name || null)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedMember?.user.full_name}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedMember?.user.email}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <Video className="h-4 w-4 mx-auto text-blue-600" />
                  <p className="text-lg font-bold">{selectedMember.stats.videosCompleted}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <FileText className="h-4 w-4 mx-auto text-purple-600" />
                  <p className="text-lg font-bold">{selectedMember.stats.worksheetsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Worksheets</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <Handshake className="h-4 w-4 mx-auto text-amber-600" />
                  <p className="text-lg font-bold">{selectedMember.stats.checkinsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <Zap className="h-4 w-4 mx-auto text-green-600" />
                  <p className="text-lg font-bold">{selectedMember.stats.boldActionsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Bold Actions</p>
                </div>
              </div>

              {/* Per-Module Progress */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Module Progress</h4>
                {selectedMember.moduleProgress.map((module) => {
                  const stepsCompleted = [
                    module.videoCompleted,
                    module.worksheetCompleted,
                    module.checkinCompleted,
                    module.boldActionCompleted,
                  ].filter(Boolean).length;
                  
                  return (
                    <div 
                      key={module.moduleId} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm truncate flex-1 mr-2">{module.moduleTitle}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full ${module.videoCompleted ? 'bg-blue-500' : 'bg-gray-200'}`} title="Video" />
                          <div className={`w-2 h-2 rounded-full ${module.worksheetCompleted ? 'bg-purple-500' : 'bg-gray-200'}`} title="Worksheet" />
                          <div className={`w-2 h-2 rounded-full ${module.checkinCompleted ? 'bg-amber-500' : 'bg-gray-200'}`} title="Check-in" />
                          <div className={`w-2 h-2 rounded-full ${module.boldActionCompleted ? 'bg-green-500' : 'bg-gray-200'}`} title="Bold Action" />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {stepsCompleted}/4
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

