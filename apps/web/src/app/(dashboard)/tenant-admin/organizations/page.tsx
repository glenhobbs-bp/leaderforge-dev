/**
 * File: src/app/(dashboard)/tenant-admin/organizations/page.tsx
 * Purpose: Tenant Admin - Organization management
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Building2, Plus, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  // Fetch organizations for this tenant
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .eq('tenant_id', userData.tenant_id)
    .order('name');

  // Get member counts per org
  const orgStats = await Promise.all(
    (organizations || []).map(async (org) => {
      const { count } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('is_active', true);
      
      return {
        ...org,
        memberCount: count || 0,
      };
    })
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-secondary" />
            Organizations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage organizations within your tenant
          </p>
        </div>
        <Button disabled className="gap-2">
          <Plus className="h-4 w-4" />
          Add Organization
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">Coming Soon</span>
        </Button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgStats.map((org) => (
          <Card key={org.id} className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <CardDescription>
                Created {new Date(org.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{org.memberCount} members</span>
                </div>
                <Button variant="ghost" size="sm" disabled>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {orgStats.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No organizations yet</p>
              <p className="text-sm">Create your first organization to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coming Soon Note */}
      <div className="text-center py-4 text-sm text-muted-foreground">
        Full organization management (create, edit, configure) coming in Phase 6.6
      </div>
    </div>
  );
}

