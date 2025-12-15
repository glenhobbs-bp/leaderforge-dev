/**
 * File: src/app/(dashboard)/admin/progress/page.tsx
 * Purpose: Organization Admin Progress Dashboard - View org-wide progress
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchContentCollection } from '@/lib/tribe-social';
import { OrgAdminDashboard } from '@/components/admin/org-admin-dashboard';

export const metadata: Metadata = {
  title: 'Organization Progress',
  description: 'View organization-wide learning progress',
};

export default async function OrgAdminProgressPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Get user's membership and check admin role
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership || !['admin', 'owner'].includes(membership.role)) {
    redirect('/dashboard');
  }

  const organizationId = membership.organization_id;

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single();

  // Get all members in the organization
  const { data: orgMembers } = await supabase
    .from('memberships')
    .select('user_id, role, manager_id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const memberIds = orgMembers?.map(m => m.user_id) || [];
  const totalMembers = memberIds.length;

  // Get user details for all members
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url')
    .in('id', memberIds.length > 0 ? memberIds : ['none']);

  // Fetch all content modules
  const contentModules = await fetchContentCollection();

  // Get all progress data for org members
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('user_id, content_id, progress_percentage, completed_at')
    .in('user_id', memberIds.length > 0 ? memberIds : ['none']);

  const { data: allWorksheets } = await supabase
    .from('worksheet_submissions')
    .select('user_id, content_id, responses, submitted_at')
    .in('user_id', memberIds.length > 0 ? memberIds : ['none']);

  const { data: allCheckins } = await supabase
    .from('checkin_requests')
    .select('user_id, content_id, status, leader_id, created_at')
    .in('user_id', memberIds.length > 0 ? memberIds : ['none']);

  const { data: allBoldActions } = await supabase
    .from('bold_actions')
    .select('user_id, content_id, status, action_description, completion_status, created_at')
    .in('user_id', memberIds.length > 0 ? memberIds : ['none']);

  // Calculate org-wide stats
  const orgStats = {
    totalMembers,
    videosCompleted: allProgress?.filter(p => p.progress_percentage >= 90).length || 0,
    worksheetsCompleted: allWorksheets?.length || 0,
    checkinsCompleted: allCheckins?.filter(c => c.status === 'completed').length || 0,
    boldActionsCompleted: allBoldActions?.filter(b => b.status === 'completed' || b.status === 'signed_off').length || 0,
    pendingCheckins: allCheckins?.filter(c => c.status === 'pending' || c.status === 'scheduled').length || 0,
  };

  // Calculate completion rates per module for the entire org
  const moduleProgress = contentModules.map(module => {
    const moduleId = module.id;
    
    const videosCompleted = allProgress?.filter(
      p => p.content_id === moduleId && p.progress_percentage >= 90
    ).length || 0;
    
    const worksheetsCompleted = allWorksheets?.filter(
      w => w.content_id === moduleId
    ).length || 0;
    
    const checkinsCompleted = allCheckins?.filter(
      c => c.content_id === moduleId && c.status === 'completed'
    ).length || 0;
    
    const boldActionsCompleted = allBoldActions?.filter(
      b => b.content_id === moduleId && (b.status === 'completed' || b.status === 'signed_off')
    ).length || 0;

    // Calculate overall module completion (all 4 steps)
    const fullyCompleted = memberIds.filter(userId => {
      const hasVideo = allProgress?.some(p => p.user_id === userId && p.content_id === moduleId && p.progress_percentage >= 90);
      const hasWorksheet = allWorksheets?.some(w => w.user_id === userId && w.content_id === moduleId);
      const hasCheckin = allCheckins?.some(c => c.user_id === userId && c.content_id === moduleId && c.status === 'completed');
      const hasBoldAction = allBoldActions?.some(b => b.user_id === userId && b.content_id === moduleId && (b.status === 'completed' || b.status === 'signed_off'));
      return hasVideo && hasWorksheet && hasCheckin && hasBoldAction;
    }).length;

    return {
      id: moduleId,
      title: module.title,
      thumbnailUrl: module.thumbnailUrl,
      videos: { completed: videosCompleted, total: totalMembers },
      worksheets: { completed: worksheetsCompleted, total: totalMembers },
      checkins: { completed: checkinsCompleted, total: totalMembers },
      boldActions: { completed: boldActionsCompleted, total: totalMembers },
      fullyCompleted: { completed: fullyCompleted, total: totalMembers },
    };
  });

  // Group members by their manager (team leaders)
  const teamLeaderIds = [...new Set(orgMembers?.filter(m => m.manager_id).map(m => m.manager_id) || [])];
  
  const teams = await Promise.all(
    teamLeaderIds.map(async (leaderId) => {
      const teamMemberRecords = orgMembers?.filter(m => m.manager_id === leaderId) || [];
      const teamMemberIds = teamMemberRecords.map(m => m.user_id);
      
      const leaderUser = allUsers?.find(u => u.id === leaderId);
      
      // Calculate team stats
      const teamVideosCompleted = allProgress?.filter(
        p => teamMemberIds.includes(p.user_id) && p.progress_percentage >= 90
      ).length || 0;
      
      const teamWorksheetsCompleted = allWorksheets?.filter(
        w => teamMemberIds.includes(w.user_id)
      ).length || 0;
      
      const teamCheckinsCompleted = allCheckins?.filter(
        c => teamMemberIds.includes(c.user_id) && c.status === 'completed'
      ).length || 0;
      
      const teamBoldActionsCompleted = allBoldActions?.filter(
        b => teamMemberIds.includes(b.user_id) && (b.status === 'completed' || b.status === 'signed_off')
      ).length || 0;

      // Get team member details
      const teamMembers = teamMemberIds.map(memberId => {
        const memberUser = allUsers?.find(u => u.id === memberId);
        const memberRecord = orgMembers?.find(m => m.user_id === memberId);
        
        // Calculate per-module progress for this member
        const memberModuleProgress = contentModules.map(module => {
          const hasVideo = allProgress?.some(p => p.user_id === memberId && p.content_id === module.id && p.progress_percentage >= 90);
          const hasWorksheet = allWorksheets?.some(w => w.user_id === memberId && w.content_id === module.id);
          const hasCheckin = allCheckins?.some(c => c.user_id === memberId && c.content_id === module.id && c.status === 'completed');
          const hasBoldAction = allBoldActions?.some(b => b.user_id === memberId && b.content_id === module.id && (b.status === 'completed' || b.status === 'signed_off'));
          
          return {
            moduleId: module.id,
            moduleTitle: module.title,
            videoCompleted: hasVideo || false,
            worksheetCompleted: hasWorksheet || false,
            checkinCompleted: hasCheckin || false,
            boldActionCompleted: hasBoldAction || false,
          };
        });

        const stats = {
          videosCompleted: memberModuleProgress.filter(m => m.videoCompleted).length,
          worksheetsCompleted: memberModuleProgress.filter(m => m.worksheetCompleted).length,
          checkinsCompleted: memberModuleProgress.filter(m => m.checkinCompleted).length,
          boldActionsCompleted: memberModuleProgress.filter(m => m.boldActionCompleted).length,
          totalModules: contentModules.length,
        };

        return {
          user: memberUser || { id: memberId, full_name: 'Unknown', email: '', avatar_url: null },
          role: memberRecord?.role || 'member',
          stats,
          moduleProgress: memberModuleProgress,
        };
      });

      return {
        leader: leaderUser || { id: leaderId || '', full_name: 'Unknown Leader', email: '', avatar_url: null },
        memberCount: teamMemberIds.length,
        stats: {
          videosCompleted: teamVideosCompleted,
          worksheetsCompleted: teamWorksheetsCompleted,
          checkinsCompleted: teamCheckinsCompleted,
          boldActionsCompleted: teamBoldActionsCompleted,
          pendingCheckins: allCheckins?.filter(
            c => teamMemberIds.includes(c.user_id) && (c.status === 'pending' || c.status === 'scheduled')
          ).length || 0,
        },
        members: teamMembers,
      };
    })
  );

  // Find members without a manager (orphan members)
  const orphanMemberIds = memberIds.filter(id => {
    const membership = orgMembers?.find(m => m.user_id === id);
    return !membership?.manager_id;
  });

  let unassignedTeam = null;
  if (orphanMemberIds.length > 0) {
    const orphanMembers = orphanMemberIds.map(memberId => {
      const memberUser = allUsers?.find(u => u.id === memberId);
      const memberRecord = orgMembers?.find(m => m.user_id === memberId);
      
      const memberModuleProgress = contentModules.map(module => {
        const hasVideo = allProgress?.some(p => p.user_id === memberId && p.content_id === module.id && p.progress_percentage >= 90);
        const hasWorksheet = allWorksheets?.some(w => w.user_id === memberId && w.content_id === module.id);
        const hasCheckin = allCheckins?.some(c => c.user_id === memberId && c.content_id === module.id && c.status === 'completed');
        const hasBoldAction = allBoldActions?.some(b => b.user_id === memberId && b.content_id === module.id && (b.status === 'completed' || b.status === 'signed_off'));
        
        return {
          moduleId: module.id,
          moduleTitle: module.title,
          videoCompleted: hasVideo || false,
          worksheetCompleted: hasWorksheet || false,
          checkinCompleted: hasCheckin || false,
          boldActionCompleted: hasBoldAction || false,
        };
      });

      const stats = {
        videosCompleted: memberModuleProgress.filter(m => m.videoCompleted).length,
        worksheetsCompleted: memberModuleProgress.filter(m => m.worksheetCompleted).length,
        checkinsCompleted: memberModuleProgress.filter(m => m.checkinCompleted).length,
        boldActionsCompleted: memberModuleProgress.filter(m => m.boldActionCompleted).length,
        totalModules: contentModules.length,
      };

      return {
        user: memberUser || { id: memberId, full_name: 'Unknown', email: '', avatar_url: null },
        role: memberRecord?.role || 'member',
        stats,
        moduleProgress: memberModuleProgress,
      };
    });

    unassignedTeam = {
      leader: null,
      memberCount: orphanMemberIds.length,
      stats: {
        videosCompleted: allProgress?.filter(
          p => orphanMemberIds.includes(p.user_id) && p.progress_percentage >= 90
        ).length || 0,
        worksheetsCompleted: allWorksheets?.filter(
          w => orphanMemberIds.includes(w.user_id)
        ).length || 0,
        checkinsCompleted: allCheckins?.filter(
          c => orphanMemberIds.includes(c.user_id) && c.status === 'completed'
        ).length || 0,
        boldActionsCompleted: allBoldActions?.filter(
          b => orphanMemberIds.includes(b.user_id) && (b.status === 'completed' || b.status === 'signed_off')
        ).length || 0,
        pendingCheckins: allCheckins?.filter(
          c => orphanMemberIds.includes(c.user_id) && (c.status === 'pending' || c.status === 'scheduled')
        ).length || 0,
      },
      members: orphanMembers,
    };
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Organization Progress</h1>
        <p className="text-muted-foreground mt-1">
          {organization?.name || 'Organization'} - Learning progress overview
        </p>
      </div>

      <OrgAdminDashboard 
        orgStats={orgStats}
        moduleProgress={moduleProgress}
        teams={teams}
        unassignedTeam={unassignedTeam}
        totalModules={contentModules.length}
      />
    </div>
  );
}

