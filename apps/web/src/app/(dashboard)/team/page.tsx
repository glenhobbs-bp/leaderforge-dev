/**
 * File: src/app/(dashboard)/team/page.tsx
 * Purpose: Team Leader Dashboard - View team progress and pending check-ins
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  // Enrich check-ins with user details
  const enrichedCheckins = await Promise.all(
    (pendingCheckins || []).map(async (checkin) => {
      // Get requester info
      const { data: requester } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .eq('id', checkin.user_id)
        .single();

      // Get bold action if exists
      let boldAction = null;
      if (checkin.bold_action_id) {
        const { data } = await supabase
          .from('bold_actions')
          .select('id, action_text, status')
          .eq('id', checkin.bold_action_id)
          .single();
        boldAction = data;
      }

      // Get user's progress for this content
      const { data: progress } = await supabase
        .from('user_progress')
        .select('progress_percentage, completed_at')
        .eq('user_id', checkin.user_id)
        .eq('content_id', checkin.content_id)
        .single();

      // Get worksheet
      const { data: worksheet } = await supabase
        .from('worksheet_submissions')
        .select('responses')
        .eq('user_id', checkin.user_id)
        .eq('content_id', checkin.content_id)
        .single();

      return {
        ...checkin,
        requester,
        bold_action: boldAction,
        progress,
        worksheet,
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

  // Get team member details with their overall progress
  const teamMemberDetails = await Promise.all(
    teamMemberIds.map(async (memberId) => {
      const { data: memberUser } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .eq('id', memberId)
        .single();

      // Get their progress records
      const { data: progressRecords } = await supabase
        .from('user_progress')
        .select('content_id, progress_percentage')
        .eq('user_id', memberId);

      // Get their worksheet submissions
      const { data: worksheets } = await supabase
        .from('worksheet_submissions')
        .select('content_id')
        .eq('user_id', memberId);

      // Get their check-ins
      const { data: checkins } = await supabase
        .from('checkin_requests')
        .select('content_id, status')
        .eq('user_id', memberId);

      // Get their bold actions
      const { data: boldActions } = await supabase
        .from('bold_actions')
        .select('content_id, status')
        .eq('user_id', memberId);

      return {
        user: memberUser,
        stats: {
          videosCompleted: progressRecords?.filter(p => p.progress_percentage >= 90).length || 0,
          worksheetsCompleted: worksheets?.length || 0,
          checkinsCompleted: checkins?.filter(c => c.status === 'completed').length || 0,
          boldActionsCompleted: boldActions?.filter(b => b.status === 'completed' || b.status === 'signed_off').length || 0,
        },
      };
    })
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          View your team's progress and manage check-in requests
        </p>
      </div>

      <TeamDashboard 
        pendingCheckins={enrichedCheckins}
        teamMembers={teamMemberDetails}
        currentUserId={user.id}
      />
    </div>
  );
}

