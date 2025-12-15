/**
 * File: src/app/(dashboard)/tenant-admin/organizations/page.tsx
 * Purpose: Tenant Admin - Organization management
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Building2 } from 'lucide-react';
import { OrganizationManagement } from '@/components/admin/organization-management';

export default async function TenantOrganizationsPage() {
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

  // Fetch organizations with stats via API (server-side)
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name');

  // Get stats for each org
  const orgsWithStats = await Promise.all(
    (organizations || []).map(async (org) => {
      // Member count
      const { count: memberCount } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      // Active member count
      const { count: activeMemberCount } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true);

      // Team count
      const { count: teamCount } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      return {
        ...org,
        stats: {
          totalMembers: memberCount || 0,
          activeMembers: activeMemberCount || 0,
          teams: teamCount || 0,
        },
      };
    })
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-secondary" />
          Organizations
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage organizations within your tenant
        </p>
      </div>

      {/* Organization Management Component */}
      <OrganizationManagement 
        organizations={orgsWithStats}
        tenantId={userData.tenant_id}
      />
    </div>
  );
}
