/**
 * File: src/app/(dashboard)/tenant-admin/settings/page.tsx
 * Purpose: Tenant Admin - Tenant settings and theming
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Settings } from 'lucide-react';
import { TenantSettings } from '@/components/admin/tenant-settings';

export default async function TenantSettingsPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is tenant admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_tenant_admin, tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData?.is_tenant_admin) {
    redirect('/dashboard');
  }

  // Fetch tenant info
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', userData.tenant_id)
    .single();

  if (tenantError || !tenant) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-secondary" />
          Tenant Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure {tenant.display_name} branding and theme
        </p>
      </div>

      {/* Tenant Settings Component */}
      <TenantSettings tenant={tenant} />
    </div>
  );
}
