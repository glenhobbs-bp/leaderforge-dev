/**
 * File: src/app/(dashboard)/tenant-admin/settings/page.tsx
 * Purpose: Tenant Admin - Tenant settings and theming
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Settings, Palette, Image, Type, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
  const { data: tenant } = await supabase
    .from('tenants')
    .select('tenant_key, display_name, theme')
    .eq('id', userData.tenant_id)
    .single();

  const settingsSections = [
    {
      title: 'Branding',
      description: 'Logo, colors, and visual identity',
      icon: Palette,
      status: 'Coming Soon',
      items: ['Primary Color', 'Secondary Color', 'Logo Upload', 'Favicon'],
    },
    {
      title: 'Typography',
      description: 'Fonts and text styling',
      icon: Type,
      status: 'Coming Soon',
      items: ['Heading Font', 'Body Font', 'Font Sizes'],
    },
    {
      title: 'Logo Assets',
      description: 'Light and dark mode logos',
      icon: Image,
      status: 'Coming Soon',
      items: ['Light Logo', 'Dark Logo', 'Mobile Logo'],
    },
    {
      title: 'Security',
      description: 'Authentication and access settings',
      icon: Lock,
      status: 'Future',
      items: ['SSO Configuration', 'Password Policy', 'Session Timeout'],
    },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-secondary" />
          Tenant Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure {tenant?.display_name || 'your tenant'}
        </p>
      </div>

      {/* Current Theme Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Theme</CardTitle>
          <CardDescription>Preview of your tenant&apos;s current branding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Primary</p>
              <div 
                className="h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs"
              >
                Primary
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Secondary</p>
              <div 
                className="h-10 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground text-xs"
              >
                Secondary
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Accent</p>
              <div 
                className="h-10 rounded-md bg-accent flex items-center justify-center text-accent-foreground text-xs"
              >
                Accent
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Muted</p>
              <div 
                className="h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs"
              >
                Muted
              </div>
            </div>
          </div>
          {tenant?.theme && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Raw Theme Config</p>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(tenant.theme, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="relative">
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                {section.status}
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon Note */}
      <div className="text-center py-4 text-sm text-muted-foreground">
        Full tenant settings configuration coming in Phase 6.7
      </div>
    </div>
  );
}

