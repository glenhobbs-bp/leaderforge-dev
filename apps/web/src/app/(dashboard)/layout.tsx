/**
 * File: src/app/(dashboard)/layout.tsx
 * Purpose: Dashboard layout with sidebar navigation
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

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

  // Fetch user context for the shell
  const { data: userData } = await supabase
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

  const { data: membership } = await supabase
    .from('memberships')
    .select(`
      organization_id,
      team_id,
      role,
      organizations:organization_id (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Type assertions - Supabase returns single objects for foreign key joins
  const tenant = userData?.tenants as unknown as { tenant_key: string; display_name: string; theme: Record<string, string> } | null;
  const organization = membership?.organizations as unknown as { id: string; name: string } | null;

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
    <AppShell userContext={userContext}>
      {children}
    </AppShell>
  );
}

