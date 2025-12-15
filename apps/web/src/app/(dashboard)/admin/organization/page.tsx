/**
 * File: src/app/(dashboard)/admin/organization/page.tsx
 * Purpose: Organization Admin - Organization settings (branding, signoff mode)
 * Owner: Core Team
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrganizationSettings } from '@/components/admin/organization-settings';

export const metadata: Metadata = {
  title: 'Organization Settings',
  description: 'Configure your organization settings',
};

export default async function AdminOrganizationPage() {
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
    .select('id, name, branding, settings')
    .eq('id', organizationId)
    .single();

  if (!organization) {
    redirect('/dashboard');
  }

  // Get org stats
  const { count: memberCount } = await supabase
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const { count: teamCount } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure settings for {organization.name}
        </p>
      </div>

      <OrganizationSettings 
        organization={{
          id: organization.id,
          name: organization.name,
          branding: organization.branding as {
            logo_url?: string;
            primary_color?: string;
            display_name?: string;
            use_tenant_theme?: boolean;
          } | null,
          settings: organization.settings as {
            signoff_mode?: 'self_certify' | 'leader_approval';
          } | null,
        }}
        stats={{
          memberCount: memberCount || 0,
          teamCount: teamCount || 0,
        }}
      />
    </div>
  );
}

