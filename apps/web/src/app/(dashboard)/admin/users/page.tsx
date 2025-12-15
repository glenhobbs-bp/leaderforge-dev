/**
 * File: src/app/(dashboard)/admin/users/page.tsx
 * Purpose: Organization Admin - User management
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserManagement } from '@/components/admin/user-management';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Manage users in your organization',
};

export default async function AdminUsersPage() {
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

  // Get all memberships in the organization with user details
  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, user_id, team_id, role, is_active, manager_id, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Get user details for all members
  const userIds = memberships?.map(m => m.user_id) || [];
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, is_active, last_sign_in_at')
    .in('id', userIds.length > 0 ? userIds : ['none']);

  // Get all teams in the organization
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  // Combine membership and user data
  const enrichedMembers = (memberships || []).map(membership => {
    const userInfo = users?.find(u => u.id === membership.user_id);
    const managerInfo = users?.find(u => u.id === membership.manager_id);
    const teamInfo = teams?.find(t => t.id === membership.team_id);
    
    return {
      membershipId: membership.id,
      userId: membership.user_id,
      email: userInfo?.email || 'Unknown',
      fullName: userInfo?.full_name || null,
      avatarUrl: userInfo?.avatar_url || null,
      role: membership.role,
      isActive: membership.is_active,
      teamId: membership.team_id,
      teamName: teamInfo?.name || null,
      managerId: membership.manager_id,
      managerName: managerInfo?.full_name || null,
      lastSignIn: userInfo?.last_sign_in_at || null,
      createdAt: membership.created_at,
    };
  });

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          {organization?.name || 'Organization'} - Manage users and roles
        </p>
      </div>

      <UserManagement 
        members={enrichedMembers}
        teams={teams || []}
        organizationId={organizationId}
        tenantId={tenantId}
        currentUserId={user.id}
      />
    </div>
  );
}

