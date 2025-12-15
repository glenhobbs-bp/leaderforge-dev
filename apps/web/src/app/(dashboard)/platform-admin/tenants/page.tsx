/**
 * File: src/app/(dashboard)/platform-admin/tenants/page.tsx
 * Purpose: Platform Admin - Tenant management page
 * Owner: LeaderForge Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Building2 } from 'lucide-react';
import { TenantManagement } from '@/components/admin/tenant-management';

export default async function PlatformTenantsPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Check if user is platform admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_platform_admin) {
    redirect('/dashboard');
  }

  // Fetch all tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('display_name');

  // Get stats for each tenant
  const tenantsWithStats = await Promise.all(
    (tenants || []).map(async (tenant) => {
      // Organization count
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

      // User count
      const { count: userCount } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      return {
        ...tenant,
        stats: {
          organizations: orgCount || 0,
          users: userCount || 0,
        },
      };
    })
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Tenant Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Create, configure, and manage platform tenants
        </p>
      </div>

      {/* Tenant Management Component */}
      <TenantManagement tenants={tenantsWithStats} />
    </div>
  );
}
