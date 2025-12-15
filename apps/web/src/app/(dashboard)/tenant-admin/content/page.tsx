/**
 * File: src/app/(dashboard)/tenant-admin/content/page.tsx
 * Purpose: Tenant Admin - Content licensing and availability view
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchContentCollection } from '@/lib/tribe-social';
import { 
  Library, Package, Building2, Clock, PlayCircle, 
  CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function TenantContentPage() {
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
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, tenant_key, display_name')
    .eq('id', userData.tenant_id)
    .single();

  // Fetch organizations in this tenant
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, is_active')
    .eq('tenant_id', userData.tenant_id)
    .eq('is_active', true)
    .order('name');

  // Fetch available content from Tribe Social
  const contentModules = await fetchContentCollection();

  // Calculate stats
  const totalModules = contentModules.length;
  const totalDuration = contentModules.reduce((sum, item) => sum + (item.duration || 0), 0);
  const totalOrgs = organizations?.length || 0;

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Library className="h-6 w-6 text-secondary" />
          Content Library
        </h1>
        <p className="text-muted-foreground mt-1">
          View licensed content available to {tenant?.display_name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlayCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalModules}</p>
                <p className="text-xs text-muted-foreground">Content Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
                <p className="text-xs text-muted-foreground">Total Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrgs}</p>
                <p className="text-xs text-muted-foreground">Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Content Package</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current License Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Active License
          </CardTitle>
          <CardDescription>
            Your tenant has access to the LeaderForge Leadership Foundations content package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Leadership Foundations</h3>
              <p className="text-sm text-green-700">
                {totalModules} modules • {formatDuration(totalDuration)} total content
              </p>
            </div>
            <Badge className="bg-green-600">Active</Badge>
          </div>
          
          {/* Organizations with access */}
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Available to all organizations:
            </p>
            <div className="flex flex-wrap gap-2">
              {organizations?.map((org) => (
                <Badge key={org.id} variant="secondary">
                  {org.name}
                </Badge>
              ))}
              {(!organizations || organizations.length === 0) && (
                <span className="text-sm text-muted-foreground">No organizations yet</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Modules List */}
      <Card>
        <CardHeader>
          <CardTitle>Content Modules</CardTitle>
          <CardDescription>
            All modules included in your license
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {contentModules.map((module, index) => (
              <div 
                key={module.id} 
                className="flex items-center gap-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                {module.thumbnailUrl ? (
                  <img 
                    src={module.thumbnailUrl} 
                    alt={module.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                    <PlayCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{module.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {module.description || 'Leadership training module'}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {module.duration ? formatDuration(module.duration) : '—'}
                </div>
              </div>
            ))}

            {contentModules.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No content modules available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Future: Entitlement Management Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Advanced Entitlement Management
          </CardTitle>
          <CardDescription>
            Coming soon: Granular control over content access per organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Future capabilities will include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Create custom content packages</li>
              <li>Assign specific packages to specific organizations</li>
              <li>Set access expiration dates</li>
              <li>Track content usage per organization</li>
              <li>License additional content from the marketplace</li>
            </ul>
          </div>
          <Button variant="outline" className="mt-4" disabled>
            <Package className="h-4 w-4 mr-2" />
            Manage Entitlements
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
