/**
 * File: apps/web/src/app/(dashboard)/platform-admin/page.tsx
 * Purpose: Platform Admin dashboard - placeholder for future features
 * Owner: LeaderForge Team
 * 
 * Platform Admin is for LeaderForge team to manage:
 * - Tenants
 * - AI Configuration
 * - System Health
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  Building2, 
  Brain, 
  Activity, 
  Settings2, 
  Lock,
  Sparkles,
  Users,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function PlatformAdminPage() {
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

  const upcomingFeatures = [
    {
      title: 'Tenant Management',
      description: 'Create, configure, and manage tenants. View usage and billing.',
      icon: Building2,
      status: 'Coming Soon',
      color: 'text-primary',
    },
    {
      title: 'AI Configuration',
      description: 'Tune AI prompts, conversation starters, and tone. Version control for configs.',
      icon: Brain,
      status: 'Coming Soon',
      color: 'text-secondary',
    },
    {
      title: 'System Health',
      description: 'Monitor API performance, error rates, and active users.',
      icon: Activity,
      status: 'Coming Soon',
      color: 'text-green-500',
    },
    {
      title: 'Feature Flags',
      description: 'Enable/disable features per tenant. A/B testing capabilities.',
      icon: Settings2,
      status: 'Coming Soon',
      color: 'text-amber-500',
    },
  ];

  const quickStats = [
    { label: 'Tenants', value: '2', icon: Building2 },
    { label: 'Organizations', value: '2', icon: Users },
    { label: 'Active Users', value: '3', icon: BarChart3 },
    { label: 'AI Calls Today', value: '12', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            Platform Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the LeaderForge platform
          </p>
        </div>
        <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
          Platform Admin Access
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Features */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-bl-lg">
                  {feature.status}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* AI Configuration Preview */}
      <Card className="border-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-secondary" />
            AI Configuration Preview
          </CardTitle>
          <CardDescription>
            Future: Configure AI behavior across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground mb-2">// Current AI Config (hardcoded)</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "cheat_sheet": {
    "model": "claude-sonnet-4-20250514",
    "tone": "coaching",
    "focus": ["progress", "stretch", "activation"],
    "conversation_starters": 3
  }
}`}
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Coming soon: Edit prompts, customize tone, A/B test variations
          </p>
        </CardContent>
      </Card>

      {/* See PRD Note */}
      <div className="text-center py-4 text-sm text-muted-foreground">
        See <code className="bg-muted px-1 rounded">PRD-010</code> for full Platform Admin & AI Configuration specification
      </div>
    </div>
  );
}

