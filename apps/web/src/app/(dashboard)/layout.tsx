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

  // Fetch user from core schema
  const { data: userData, error: userError } = await supabase
    .schema('core')
    .from('users')
    .select('id, email, full_name, avatar_url, tenant_id')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user:', userError);
  }
  
  // Debug logging
  console.log('Auth user ID:', user.id);
  console.log('User data from core.users:', JSON.stringify(userData, null, 2));

  // Fetch tenant separately (foreign key joins don't work well with .schema())
  let tenant: { tenant_key: string; display_name: string; theme: TenantTheme } | null = null;
  if (userData?.tenant_id) {
    const { data: tenantData, error: tenantError } = await supabase
      .schema('core')
      .from('tenants')
      .select('tenant_key, display_name, theme')
      .eq('id', userData.tenant_id)
      .single();
    
    if (tenantError) {
      console.error('Error fetching tenant:', tenantError);
    } else {
      console.log('Tenant data:', JSON.stringify(tenantData, null, 2));
      tenant = tenantData as { tenant_key: string; display_name: string; theme: TenantTheme };
    }
  }

  // Fetch membership
  const { data: membership, error: membershipError } = await supabase
    .schema('core')
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
      .schema('core')
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

  const userContext = {
    id: userData?.id || user.id,
    email: userData?.email || user.email || '',
    fullName: userData?.full_name || null,
    avatarUrl: userData?.avatar_url || null,
    role: membership?.role || 'member',
    tenant: tenant ? {
      tenantKey: tenant.tenant_key,
      displayName: tenant.display_name,
    } : null,
    organization: organization ? {
      id: organization.id,
      name: organization.name,
    } : null,
  };
  
  console.log('Final userContext:', JSON.stringify(userContext, null, 2));

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
