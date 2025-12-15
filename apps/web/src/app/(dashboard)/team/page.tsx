/**
 * File: src/app/(dashboard)/team/page.tsx
 * Purpose: Team Leader Dashboard - View team progress and pending check-ins
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchContentCollection } from '@/lib/tribe-social';
import { TeamDashboard } from '@/components/team/team-dashboard';

export const metadata: Metadata = {
  title: 'Team Dashboard',
  description: 'View your team\'s progress and pending check-ins',
};

export default async function TeamPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Get pending check-ins where current user is the leader
  const { data: pendingCheckins, error: checkinsError } = await supabase
    .from('checkin_requests')
    .select('*')
    .eq('leader_id', user.id)
    .in('status', ['pending', 'scheduled'])
    .order('created_at', { ascending: true });

  if (checkinsError) {
    console.error('Error fetching check-ins:', checkinsError);
  }

  // Get team members (users where current user is their manager)
  const { data: teamMembersForApproval } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('manager_id', user.id)
    .eq('is_active', true);

  const teamMemberIdsForApproval = teamMembersForApproval?.map(m => m.user_id) || [];

  // Get pending bold action approvals for team members
  const { data: pendingApprovals } = await supabase
    .from('bold_actions')
    .select('*')
    .in('user_id', teamMemberIdsForApproval.length > 0 ? teamMemberIdsForApproval : ['none'])
    .eq('status', 'pending_approval')
    .order('updated_at', { ascending: true });

  // Enrich pending approvals with user details
  const enrichedApprovals = await Promise.all(
    (pendingApprovals || []).map(async (approval) => {
      const { data: requester } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .eq('id', approval.user_id)
        .single();

      return {
        ...approval,
        requester,
      };
    })
  );

  // Fetch all content modules early so we can use titles for check-ins
  const contentModules = await fetchContentCollection();
  
  // Create a lookup map for content titles
  const contentTitleMap = new Map(contentModules.map(m => [m.id, m.title]));

  // Enrich check-ins with user details and content title
  const enrichedCheckins = await Promise.all(
    (pendingCheckins || []).map(async (checkin) => {
      const { data: requester } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .eq('id', checkin.user_id)
        .single();

      let boldAction = null;
      if (checkin.bold_action_id) {
        const { data } = await supabase
          .from('bold_actions')
          .select('id, action_text, status')
          .eq('id', checkin.bold_action_id)
          .single();
        boldAction = data;
      }

      const { data: progress } = await supabase
        .from('user_progress')
        .select('progress_percentage, completed_at')
        .eq('user_id', checkin.user_id)
        .eq('content_id', checkin.content_id)
        .single();

      const { data: worksheet } = await supabase
        .from('worksheet_submissions')
        .select('responses')
        .eq('user_id', checkin.user_id)
        .eq('content_id', checkin.content_id)
        .single();

      // Get the content title from the lookup map
      const contentTitle = contentTitleMap.get(checkin.content_id) || `Module ${checkin.content_id}`;

      return {
        ...checkin,
        requester,
        bold_action: boldAction,
        progress,
        worksheet,
        content_title: contentTitle,
      };
    })
  );

  // Get team members (users where current user is their manager)
  const { data: teamMembers } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('manager_id', user.id)
    .eq('is_active', true);

  const teamMemberIds = teamMembers?.map(m => m.user_id) || [];
  const teamSize = teamMemberIds.length;

  // Get all progress data for team members
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('user_id, content_id, progress_percentage')
    .in('user_id', teamMemberIds.length > 0 ? teamMemberIds : ['none']);

  const { data: allWorksheets } = await supabase
    .from('worksheet_submissions')
    .select('user_id, content_id, responses')
    .in('user_id', teamMemberIds.length > 0 ? teamMemberIds : ['none']);

  const { data: allCheckins } = await supabase
    .from('checkin_requests')
    .select('user_id, content_id, status')
    .in('user_id', teamMemberIds.length > 0 ? teamMemberIds : ['none']);

  const { data: allBoldActions } = await supabase
    .from('bold_actions')
    .select('user_id, content_id, status, action_description, completion_notes, completion_status, reflection_text, challenge_level, would_repeat')
    .in('user_id', teamMemberIds.length > 0 ? teamMemberIds : ['none']);

  // Build module progress data
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

    return {
      id: moduleId,
      title: module.title,
      thumbnailUrl: module.thumbnailUrl,
      videos: { completed: videosCompleted, total: teamSize },
      worksheets: { completed: worksheetsCompleted, total: teamSize },
      checkins: { completed: checkinsCompleted, total: teamSize },
      boldActions: { completed: boldActionsCompleted, total: teamSize },
    };
  });

  // Get team member details with their per-module progress
  const teamMemberDetails = await Promise.all(
    teamMemberIds.map(async (memberId) => {
      const { data: memberUser } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .eq('id', memberId)
        .single();

      // Build per-module progress for this user
      const memberModuleProgress = contentModules.map(module => {
        const moduleId = module.id;
        
        const videoProgress = allProgress?.find(
          p => p.user_id === memberId && p.content_id === moduleId
        );
        const worksheetRecord = allWorksheets?.find(
          w => w.user_id === memberId && w.content_id === moduleId
        );
        const checkinRecord = allCheckins?.find(
          c => c.user_id === memberId && c.content_id === moduleId
        );
        const boldActionRecord = allBoldActions?.find(
          b => b.user_id === memberId && b.content_id === moduleId
        );

        return {
          moduleId,
          moduleTitle: module.title,
          videoCompleted: (videoProgress?.progress_percentage || 0) >= 90,
          videoProgress: videoProgress?.progress_percentage || 0,
          worksheetCompleted: !!worksheetRecord,
          worksheetResponses: worksheetRecord?.responses as {
            keyTakeaways?: string;
            boldAction?: string;
            questions?: string;
          } | null,
          checkinCompleted: checkinRecord?.status === 'completed',
          checkinStatus: checkinRecord?.status || 'none',
          boldActionCompleted: boldActionRecord?.status === 'completed' || boldActionRecord?.status === 'signed_off',
          boldActionStatus: boldActionRecord?.status || 'none',
          boldActionText: boldActionRecord?.action_description || null,
          completionFeedback: boldActionRecord?.completion_notes || null,
          // Reflection data
          reflectionData: boldActionRecord ? {
            completionStatus: boldActionRecord.completion_status as 'fully' | 'partially' | 'blocked' | null,
            reflectionText: boldActionRecord.reflection_text,
            challengeLevel: boldActionRecord.challenge_level,
            wouldRepeat: boldActionRecord.would_repeat as 'yes' | 'maybe' | 'no' | null,
          } : null,
        };
      });

      // Calculate totals
      const stats = {
        videosCompleted: memberModuleProgress.filter(m => m.videoCompleted).length,
        worksheetsCompleted: memberModuleProgress.filter(m => m.worksheetCompleted).length,
        checkinsCompleted: memberModuleProgress.filter(m => m.checkinCompleted).length,
        boldActionsCompleted: memberModuleProgress.filter(m => m.boldActionCompleted).length,
        totalModules: contentModules.length,
      };

      return {
        user: memberUser,
        stats,
        moduleProgress: memberModuleProgress,
      };
    })
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your team&apos;s progress and manage check-in requests
        </p>
      </div>

      <TeamDashboard 
        pendingCheckins={enrichedCheckins}
        pendingApprovals={enrichedApprovals}
        teamMembers={teamMemberDetails}
        moduleProgress={moduleProgress}
        teamSize={teamSize}
        currentUserId={user.id}
      />
    </div>
  );
}
