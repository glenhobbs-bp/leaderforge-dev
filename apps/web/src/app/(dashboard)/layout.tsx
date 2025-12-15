/**
 * File: src/app/(dashboard)/layout.tsx
 * Purpose: Dashboard layout with sidebar navigation and tenant theming
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { TenantThemeProvider } from '@/components/providers/tenant-theme-provider';
import type { TenantTheme, OrgBranding } from '@/lib/theme';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user (using public views that reference core schema)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, tenant_id, is_platform_admin, is_tenant_admin')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user:', userError);
  }

  // Fetch tenant separately
  let tenant: { tenant_key: string; display_name: string; theme: TenantTheme } | null = null;
  if (userData?.tenant_id) {
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('tenant_key, display_name, theme')
      .eq('id', userData.tenant_id)
      .single();
    
    if (tenantError) {
      console.error('Error fetching tenant:', tenantError);
    } else {
      tenant = tenantData as { tenant_key: string; display_name: string; theme: TenantTheme };
    }
  }

  // Fetch membership
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('organization_id, team_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError) {
    console.error('Error fetching membership:', membershipError);
  }

  // Fetch organization separately
  let organization: { id: string; name: string; branding: OrgBranding } | null = null;
  if (membership?.organization_id) {
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, branding')
      .eq('id', membership.organization_id)
      .single();
    
    if (orgError) {
      console.error('Error fetching organization:', orgError);
    } else {
      organization = orgData as { id: string; name: string; branding: OrgBranding };
    }
  }

  // Check if user is a team leader (has team members assigned to them)
  const { data: teamMembersCount } = await supabase
    .from('memberships')
    .select('id', { count: 'exact', head: true })
    .eq('manager_id', user.id)
    .eq('is_active', true);

  const isTeamLeader = (teamMembersCount as unknown as number) > 0;

  const userContext = {
    id: userData?.id || user.id,
    email: userData?.email || user.email || '',
    fullName: userData?.full_name || null,
    avatarUrl: userData?.avatar_url || null,
    role: membership?.role || 'member',
    isTeamLeader,
    isPlatformAdmin: userData?.is_platform_admin || false,
    isTenantAdmin: userData?.is_tenant_admin || false,
    tenant: tenant ? {
      tenantKey: tenant.tenant_key,
      displayName: tenant.display_name,
    } : null,
    organization: organization ? {
      id: organization.id,
      name: organization.name,
    } : null,
  };

  return (
    <TenantThemeProvider
      tenantKey={tenant?.tenant_key || 'default'}
      tenantName={tenant?.display_name || 'LeaderForge'}
      theme={tenant?.theme || null}
      orgBranding={organization?.branding || null}
    >
      <AppShell userContext={userContext}>
        {children}
      </AppShell>
    </TenantThemeProvider>
  );
}
