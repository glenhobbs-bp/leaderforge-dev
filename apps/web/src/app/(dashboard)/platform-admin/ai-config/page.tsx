/**
 * File: src/app/(dashboard)/platform-admin/ai-config/page.tsx
 * Purpose: Platform Admin - AI Configuration management page
 * Owner: LeaderForge Team
 * 
 * Part of 7.9 AI Configuration - Platform-level prompt management
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AIConfigManagement } from '@/components/admin/ai-config-management';

export default async function AIConfigPage() {
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

  // Check if Anthropic API key is configured
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage platform-wide AI prompts, templates, and settings
        </p>
      </div>

      {/* API Key Status */}
      {!hasApiKey && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">AI Not Configured</p>
                <p className="text-sm text-amber-700">
                  The ANTHROPIC_API_KEY environment variable is not set. AI features will use 
                  fallback prompts until configured.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <AIConfigManagement />

      {/* Help Section */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <h3 className="font-medium mb-2">Configuration Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">System Prompts</p>
              <p>Core AI personality and behavior instructions. These define how the AI responds.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Prompt Templates</p>
              <p>Dynamic templates with placeholders like {'{user_name}'} that get filled at runtime.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Settings</p>
              <p>Model parameters, rate limits, and other technical configurations.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Terminology</p>
              <p>Brand-specific term mappings (e.g., &quot;Bold Action&quot; → &quot;Commitment&quot;).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
