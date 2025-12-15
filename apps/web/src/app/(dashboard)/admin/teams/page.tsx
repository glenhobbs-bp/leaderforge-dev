/**
 * File: src/app/(dashboard)/admin/teams/page.tsx
 * Purpose: Organization Admin - Team management
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeamManagement } from '@/components/admin/team-management';

export const metadata: Metadata = {
  title: 'Team Management',
  description: 'Manage teams in your organization',
};

export default async function AdminTeamsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Get user's membership and check admin role
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, tenant_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership || !['admin', 'owner'].includes(membership.role)) {
    redirect('/dashboard');
  }

  const organizationId = membership.organization_id;
  const tenantId = membership.tenant_id;

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single();

  // Get all teams in the organization
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, description, is_active, created_at')
    .eq('organization_id', organizationId)
    .order('name');

  // Get all memberships to calculate team sizes and find managers
  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, user_id, team_id, role, manager_id, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  // Get user details for all members
  const userIds = memberships?.map(m => m.user_id) || [];
  const managerIds = [...new Set(memberships?.filter(m => m.manager_id).map(m => m.manager_id) || [])];
  const allUserIds = [...new Set([...userIds, ...managerIds])];
  
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url')
    .in('id', allUserIds.length > 0 ? allUserIds : ['none']);

  // Enrich teams with member counts and manager info
  const enrichedTeams = (teams || []).map(team => {
    const teamMembers = memberships?.filter(m => m.team_id === team.id) || [];
    
    // Find team managers (members who have others reporting to them in this team)
    const teamManagerIds = [...new Set(
      teamMembers
        .filter(m => m.manager_id)
        .map(m => m.manager_id)
        .filter(managerId => teamMembers.some(tm => tm.user_id === managerId))
    )];
    
    const managers = teamManagerIds.map(managerId => {
      const managerUser = users?.find(u => u.id === managerId);
      return {
        id: managerId,
        name: managerUser?.full_name || managerUser?.email || 'Unknown',
        avatarUrl: managerUser?.avatar_url || null,
      };
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      isActive: team.is_active,
      createdAt: team.created_at,
      memberCount: teamMembers.length,
      managers,
    };
  });

  // Get all users for manager selection
  const allMembers = (memberships || []).map(m => {
    const userInfo = users?.find(u => u.id === m.user_id);
    return {
      userId: m.user_id,
      email: userInfo?.email || 'Unknown',
      fullName: userInfo?.full_name || null,
      avatarUrl: userInfo?.avatar_url || null,
      teamId: m.team_id,
    };
  });

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          {organization?.name || 'Organization'} - Manage teams and assignments
        </p>
      </div>

      <TeamManagement 
        teams={enrichedTeams}
        members={allMembers}
        organizationId={organizationId}
        tenantId={tenantId}
      />
    </div>
  );
}

