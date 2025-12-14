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

  // Fetch user context for the shell (using core schema)
  const { data: userData, error: userError } = await supabase
    .schema('core')
    .from('users')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      tenant_id,
      tenants:tenant_id (
        tenant_key,
        display_name,
        theme
      )
    `)
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user:', userError);
  }

  // Fetch membership with organization branding (using core schema)
  const { data: membership, error: membershipError } = await supabase
    .schema('core')
    .from('memberships')
    .select(`
      organization_id,
      team_id,
      role,
      organizations:organization_id (
        id,
        name,
        branding
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError) {
    console.error('Error fetching membership:', membershipError);
  }

  // Type assertions - Supabase returns single objects for foreign key joins
  const tenant = userData?.tenants as unknown as { 
    tenant_key: string; 
    display_name: string; 
    theme: TenantTheme;
  } | null;
  
  const organization = membership?.organizations as unknown as { 
    id: string; 
    name: string;
    branding: OrgBranding;
  } | null;

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
